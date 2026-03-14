import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const { eventId, name, email, phone } = await request.json();

    if (!eventId || !name || !email) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

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
        email,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
    if (existingReg) {
      return NextResponse.json(
        { error: "Ya estás registrado en este evento" },
        { status: 400 }
      );
    }

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        name,
        email,
        phone: phone || null,
        status: event.price === 0 ? "CONFIRMED" : "PENDING",
      },
    });

    // Free event — confirm directly, no Stripe
    if (event.price === 0) {
      return NextResponse.json({ success: true, free: true });
    }

    // Paid event — create Stripe checkout session
    const stripe = await getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      metadata: { eventRegistrationId: registration.id },
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: { name: `Registro: ${event.title}` },
            unit_amount: event.price,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/eventos/${event.slug}?registro=exitoso`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/eventos/${event.slug}?registro=cancelado`,
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
