import { NextRequest, NextResponse } from "next/server";
import { getStripe, getStripePriceId } from "@/lib/stripe";
import type { MembershipPlan } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const { plan, memberId, memberEmail } = await request.json();

    const membershipPlan: MembershipPlan =
      plan === "student" ? "student" : "professional";

    const stripe = await getStripe();
    const priceId = await getStripePriceId(membershipPlan);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://apto.org.mx";

    // Pre-registration checkout (no account yet)
    if (!memberId) {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: { plan: membershipPlan },
        success_url: `${baseUrl}/auth/registro?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/membresia?checkout=cancelled`,
      });
      return NextResponse.json({ url: session.url });
    }

    // Existing member renewal
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: memberEmail,
      metadata: { memberId, plan: membershipPlan },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/miembros?checkout=success`,
      cancel_url: `${baseUrl}/membresia?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Error creating checkout session" },
      { status: 500 }
    );
  }
}
