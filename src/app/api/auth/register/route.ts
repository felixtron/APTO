import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/emails";
import { getStripe } from "@/lib/stripe";
import { createMembershipCertificate } from "@/lib/generate-certificate";
import { createWithMemberNumber } from "@/lib/assign-member-number";
import { sendAccountAccessEmail } from "@/lib/account-access-email";
import { z } from "zod";
import { emailSchema, optionalText, parseJsonBody } from "@/lib/validation";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";

const BCRYPT_ROUNDS = 12;
const RANDOM_PASSWORD_BYTES = 32;

const registerSchema = z.object({
  name: z
    .string({ error: "Nombre, email y contraseña son requeridos" })
    .trim()
    .min(1, "Nombre, email y contraseña son requeridos")
    .max(120, "El nombre es demasiado largo"),
  email: emailSchema,
  password: z
    .string({ error: "Nombre, email y contraseña son requeridos" })
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(200, "La contraseña es demasiado larga"),
  phone: optionalText(30),
  institution: optionalText(200),
  sessionId: z.string().startsWith("cs_").max(255).nullish(),
});

interface PaidMembership {
  type: "PROFESSIONAL" | "STUDENT";
  stripeCustomerId: string | null;
  subscriptionId: string | null;
  subscriptionEnd: Date | null;
}

type PaymentCheck =
  | { ok: true; paid: PaidMembership }
  | { ok: false; response: NextResponse };

function badRequest(error: string): NextResponse {
  return NextResponse.json({ error }, { status: 400 });
}

/** Verifies a completed, unused Stripe checkout paid with this email. */
async function verifyPaidSession(sessionId: string, email: string): Promise<PaymentCheck> {
  const stripe = await getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.status !== "complete" || session.payment_status !== "paid") {
    return { ok: false, response: badRequest("El pago no se ha completado") };
  }

  // The paid session must belong to this email. Stripe always collects
  // an email on checkout, so a missing one is treated as a mismatch.
  const sessionEmail = (session.customer_details?.email || session.customer_email || "")
    .toLowerCase()
    .trim();
  if (sessionEmail !== email) {
    return { ok: false, response: badRequest("El email no coincide con la sesión de pago") };
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  // A paid session can only ever activate one account.
  if (subscriptionId || customerId) {
    const alreadyUsed = await prisma.member.findFirst({
      where: {
        OR: [
          ...(subscriptionId ? [{ subscriptionId }] : []),
          ...(customerId ? [{ stripeCustomerId: customerId }] : []),
        ],
      },
      select: { id: true },
    });
    if (alreadyUsed) {
      return { ok: false, response: badRequest("Esta sesión de pago ya fue utilizada") };
    }
  }

  const plan = session.metadata?.plan || "professional";

  // Get subscription end date
  let subscriptionEnd: Date | null = null;
  if (subscriptionId) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    // Try top-level first, then items (newer Stripe API versions moved it to items)
    const periodEnd =
      (sub as unknown as Record<string, unknown>).current_period_end as number | undefined
      ?? (sub.items?.data?.[0] as unknown as Record<string, unknown>)?.current_period_end as number | undefined;
    if (periodEnd) {
      subscriptionEnd = new Date(periodEnd * 1000);
    }
  }

  return {
    ok: true,
    paid: {
      type: plan === "student" ? "STUDENT" : "PROFESSIONAL",
      stripeCustomerId: customerId,
      subscriptionId,
      subscriptionEnd,
    },
  };
}

/**
 * Roster members already have an account with a pending payment. A payment
 * made before signing in activates that account. The password typed here is
 * ignored and the stored one is replaced with a random one, so nobody who
 * registered this email earlier keeps access; the owner gets in through the
 * link sent to the account's own inbox.
 */
async function activateExistingAccount(
  member: { id: string; status: string },
  paid: PaidMembership
): Promise<NextResponse> {
  if (member.status === "ACTIVE") {
    return badRequest(
      "Esta cuenta ya tiene una membresía activa. Escríbenos para aclarar el pago."
    );
  }

  const passwordHash = await bcrypt.hash(
    crypto.randomBytes(RANDOM_PASSWORD_BYTES).toString("hex"),
    BCRYPT_ROUNDS
  );
  const activated = await prisma.member.update({
    where: { id: member.id },
    data: { ...paid, status: "ACTIVE", passwordHash, passwordSetAt: null },
    select: { email: true, name: true, passwordHash: true },
  });
  await createMembershipCertificate(member.id);

  // The reset token binds to the new hash, so it must be built from it.
  sendAccountAccessEmail(
    activated,
    "Recibimos el pago de tu membresía y ya está activa. Crea tu contraseña para entrar al portal de miembros."
  ).catch(console.error);

  return NextResponse.json({ success: true, existingAccount: true });
}

export async function POST(request: NextRequest) {
  try {
    const limit = checkRateLimit("register", [getClientIp(request.headers)]);
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    const parsed = await parseJsonBody(request, registerSchema);
    if (!parsed.ok) return parsed.response;
    const {
      name,
      email: normalizedEmail,
      password,
      phone,
      institution,
      sessionId,
    } = parsed.data;

    const existing = await prisma.member.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, status: true },
    });
    if (existing && !sessionId) {
      return badRequest(
        "Ya existe una cuenta con este email. Si eres socio de APTO, usa «¿Olvidaste tu contraseña?» para crear tu contraseña."
      );
    }

    // If sessionId provided, verify the Stripe payment and activate immediately
    if (sessionId) {
      const payment = await verifyPaidSession(sessionId, normalizedEmail);
      if (!payment.ok) return payment.response;
      if (existing) return activateExistingAccount(existing, payment.paid);

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const { record: member, memberNumber } = await createWithMemberNumber(
        normalizedEmail,
        (memberNumber) =>
          prisma.member.create({
            data: {
              ...payment.paid,
              name,
              email: normalizedEmail,
              passwordHash,
              passwordSetAt: new Date(),
              phone: phone || null,
              memberNumber,
              institution: institution || null,
              status: "ACTIVE",
            },
          })
      );

      // Auto-create certificate
      await createMembershipCertificate(member.id);

      sendWelcomeEmail({
        name,
        email: normalizedEmail,
        memberNumber,
      }).catch(console.error);

      return NextResponse.json({ success: true }, { status: 201 });
    }

    // No payment — create as PENDING (direct registration without payment)
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const { memberNumber } = await createWithMemberNumber(
      normalizedEmail,
      (memberNumber) =>
        prisma.member.create({
          data: {
            name,
            email: normalizedEmail,
            passwordHash,
            passwordSetAt: new Date(),
            phone: phone || null,
            memberNumber,
            type: "PROFESSIONAL",
            institution: institution || null,
            status: "PENDING",
          },
        })
    );

    sendWelcomeEmail({ name, email: normalizedEmail, memberNumber }).catch(
      console.error
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Error al crear la cuenta" },
      { status: 500 }
    );
  }
}
