import { NextRequest, NextResponse } from "next/server";
import { getStripe, getStripePriceId } from "@/lib/stripe";
import type { MembershipPlan } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const limit = checkRateLimit("checkout", [getClientIp(request.headers)]);
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    const { plan, memberId } = await request.json();

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

    // Existing member renewal: the webhook activates metadata.memberId, so it
    // must be the signed-in member, never a client-supplied id.
    const authSession = await auth();
    if (!authSession?.user?.id || authSession.user.id !== memberId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const member = await prisma.member.findUnique({
      where: { id: authSession.user.id },
      select: { id: true, email: true },
    });
    if (!member) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: member.email,
      metadata: { memberId: member.id, plan: membershipPlan },
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
