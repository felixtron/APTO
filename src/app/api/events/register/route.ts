import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { createTrainingCertificate } from "@/lib/generate-certificate";
import { z } from "zod";
import { emailSchema, optionalText, parseJsonBody } from "@/lib/validation";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";

const tierLabels: Record<string, string> = {
  student: "Estudiante",
  teacher: "Maestro",
  professional: "Profesional",
};

function getEventPrice(
  event: { price: number; priceStudent: number; priceProfessional: number },
  registrationType: string
): number {
  switch (registrationType) {
    case "student":
      return event.priceStudent;
    case "teacher":
      return event.price; // legacy field = teacher price
    case "professional":
      return event.priceProfessional;
    default:
      return event.priceProfessional;
  }
}

const registrationSchema = z.object({
  eventId: z.string({ error: "Datos incompletos" }).min(1, "Datos incompletos").max(64),
  name: z.string({ error: "Datos incompletos" }).trim().min(1, "Datos incompletos").max(120),
  email: emailSchema,
  phone: optionalText(30),
  registrationType: z
    .enum(["student", "teacher", "professional"], { error: "Tipo de registro inválido" })
    .default("professional"),
  memberId: z.string().max(64).nullish(),
});

export async function POST(request: NextRequest) {
  try {
    const limit = checkRateLimit("eventRegister", [getClientIp(request.headers)]);
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    const parsed = await parseJsonBody(request, registrationSchema);
    if (!parsed.ok) return parsed.response;
    const { eventId, name, email, phone, registrationType, memberId: bodyMemberId } =
      parsed.data;

    // Fetch event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { registrations: { where: { status: "CONFIRMED" } } },
        },
      },
    });

    if (!event || !event.active) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    // Members-only enforcement
    let memberId: string | null = null;
    if (event.membersOnly) {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: "Debes iniciar sesión para registrarte en este evento" },
          { status: 401 }
        );
      }
      const member = await prisma.member.findUnique({
        where: { id: session.user.id },
        select: { id: true, status: true },
      });
      if (!member || member.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "Solo miembros activos pueden registrarse en este evento" },
          { status: 403 }
        );
      }
      memberId = member.id;
    } else if (bodyMemberId) {
      // Verify memberId belongs to the authenticated user
      const session = await auth();
      if (session?.user?.id === bodyMemberId) {
        memberId = bodyMemberId;
      }
    }

    // Check capacity
    if (event.maxCapacity) {
      const spotsLeft = event.maxCapacity - event._count.registrations;
      if (spotsLeft <= 0) {
        return NextResponse.json(
          { error: "No hay lugares disponibles" },
          { status: 400 }
        );
      }
    }

    // Check duplicate registration
    const existingReg = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        // Older rows may have mixed-case emails
        email: { equals: email, mode: "insensitive" },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
    if (existingReg) {
      return NextResponse.json(
        { error: "Ya estás registrado en este evento" },
        { status: 400 }
      );
    }

    // Resolve price based on registration type
    const resolvedPrice = getEventPrice(event, registrationType);

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        memberId,
        name,
        email,
        phone: phone || null,
        registrationType,
        status: resolvedPrice === 0 ? "CONFIRMED" : "PENDING",
      },
    });

    // Free event — confirm directly, no Stripe
    if (resolvedPrice === 0) {
      // Auto-generate training certificate for members-only events
      if (event.membersOnly && memberId) {
        try {
          await createTrainingCertificate(memberId, eventId);
        } catch (err) {
          console.error("Error creating training certificate:", err);
        }
      }
      return NextResponse.json({ success: true, free: true });
    }

    // Paid event — create Stripe checkout session
    const tierLabel = tierLabels[registrationType] || "Profesional";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://apto.org.mx";
    const stripe = await getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      metadata: {
        eventRegistrationId: registration.id,
        registrationType,
        ...(memberId ? { memberId } : {}),
      },
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: { name: `Registro (${tierLabel}): ${event.title}` },
            unit_amount: resolvedPrice,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/eventos/${event.slug}?registro=exitoso`,
      cancel_url: `${baseUrl}/eventos/${event.slug}?registro=cancelado`,
    });

    // Save stripe session ID on registration
    await prisma.eventRegistration.update({
      where: { id: registration.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Event registration error:", error);
    return NextResponse.json(
      { error: "Error al procesar registro" },
      { status: 500 }
    );
  }
}
