import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/emails";
import { getStripe } from "@/lib/stripe";
import { createMembershipCertificate } from "@/lib/generate-certificate";

function generateMemberNumber(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials = (
    (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")
  ).toUpperCase();
  const digits = Math.floor(1000000 + Math.random() * 9000000).toString();
  return `${digits}${initials}`;
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone, institution, sessionId } =
      await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

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

      if (session.payment_status !== "paid") {
        return NextResponse.json(
          { error: "El pago no se ha completado" },
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

      const plan = session.metadata?.plan || "professional";
      const memberType = plan === "student" ? "STUDENT" : "PROFESSIONAL";

      // Get subscription end date
      let subscriptionEnd: Date | null = null;
      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId) as unknown as { current_period_end: number };
        subscriptionEnd = new Date(sub.current_period_end * 1000);
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
