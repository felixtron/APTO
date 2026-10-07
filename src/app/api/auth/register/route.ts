import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/emails";
import { getStripe } from "@/lib/stripe";
import { createMembershipCertificate } from "@/lib/generate-certificate";
import { z } from "zod";
import { emailSchema, optionalText, parseJsonBody } from "@/lib/validation";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";

function generateMemberNumber(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials = (
    (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")
  ).toUpperCase();
  const digits = Math.floor(1000000 + Math.random() * 9000000).toString();
  return `${digits}${initials}`;
}

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
    });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este email" },
        { status: 400 }
      );
    }

    // Generate unique member number
    let memberNumber = generateMemberNumber(name);
    let attempts = 0;
    while (attempts < 5) {
      const dup = await prisma.member.findUnique({ where: { memberNumber } });
      if (!dup) break;
      memberNumber = generateMemberNumber(name);
      attempts++;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // If sessionId provided, verify the Stripe payment and activate immediately
    if (sessionId) {
      const stripe = await getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.status !== "complete" || session.payment_status !== "paid") {
        return NextResponse.json(
          { error: "El pago no se ha completado" },
          { status: 400 }
        );
      }

      // The paid session must belong to this email. Stripe always collects
      // an email on checkout, so a missing one is treated as a mismatch.
      const sessionEmail = (session.customer_details?.email || session.customer_email || "")
        .toLowerCase()
        .trim();
      if (sessionEmail !== normalizedEmail) {
        return NextResponse.json(
          { error: "El email no coincide con la sesión de pago" },
          { status: 400 }
        );
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
          return NextResponse.json(
            { error: "Esta sesión de pago ya fue utilizada" },
            { status: 400 }
          );
        }
      }

      const plan = session.metadata?.plan || "professional";
      const memberType = plan === "student" ? "STUDENT" : "PROFESSIONAL";

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

      const member = await prisma.member.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          phone: phone || null,
          memberNumber,
          type: memberType,
          institution: institution || null,
          status: "ACTIVE",
          stripeCustomerId: customerId,
          subscriptionId,
          subscriptionEnd,
        },
      });

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
    await prisma.member.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        phone: phone || null,
        memberNumber,
        type: "PROFESSIONAL",
        institution: institution || null,
        status: "PENDING",
      },
    });

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
