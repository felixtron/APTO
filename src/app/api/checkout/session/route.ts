import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json(
      { error: "session_id requerido" },
      { status: 400 }
    );
  }

  try {
    const stripe = await getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Pago no completado" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      email: session.customer_details?.email || session.customer_email || "",
      plan: session.metadata?.plan || "professional",
      customerId:
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id || null,
      subscriptionId:
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id || null,
    });
  } catch (error) {
    console.error("Session retrieval error:", error);
    return NextResponse.json(
      { error: "Sesión no encontrada" },
      { status: 404 }
    );
  }
}
