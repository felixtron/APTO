import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { MEMBERSHIP_PRICE, MEMBERSHIP_CURRENCY } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const { memberId, memberEmail } = await request.json();

    const stripe = await getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: memberEmail,
      metadata: { memberId },
      line_items: [
        {
          price_data: {
            currency: MEMBERSHIP_CURRENCY,
            product_data: { name: "Membresía APTO" },
            unit_amount: MEMBERSHIP_PRICE,
            recurring: { interval: "year" },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/miembros?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/membresia?checkout=cancelled`,
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
