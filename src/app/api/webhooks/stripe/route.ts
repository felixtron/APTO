import { NextRequest, NextResponse } from "next/server";
import { getStripeForMode, getStripeWebhookSecret } from "@/lib/stripe";
import type { StripeMode } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { createMembershipCertificate, createTrainingCertificate } from "@/lib/generate-certificate";
import { sendEventConfirmationEmail, sendPaymentFailedAlert } from "@/lib/emails";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  // In live mode only accept live webhooks — prevents test events from creating
  // real members or certificates. In test mode, try test first then live as fallback
  // (useful during migration). Never accept test webhooks when STRIPE_MODE=live.
  const envMode = (process.env.STRIPE_MODE as StripeMode) || "test";
  const modesToTry: StripeMode[] =
    envMode === "live" ? ["live"] : ["test", "live"];

  let event: Stripe.Event | undefined;
  for (const mode of modesToTry) {
    const secret =
      mode === "live"
        ? process.env.STRIPE_LIVE_WEBHOOK_SECRET
        : process.env.STRIPE_TEST_WEBHOOK_SECRET;
    if (!secret) continue;
    try {
      const stripe = getStripeForMode(mode);
      event = stripe.webhooks.constructEvent(body, signature, secret);
      break;
    } catch {
      // Try next mode
    }
  }

  if (!event) {
    console.error("Webhook signature verification failed for all modes");
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const memberId = session.metadata?.memberId;
      const eventRegistrationId = session.metadata?.eventRegistrationId;

      if (memberId) {
        await handleMembershipCheckout(session, memberId);
      } else if (eventRegistrationId) {
        await handleEventRegistration(session, eventRegistrationId);
      }
      break;
    }

    case "customer.subscription.updated": {
      await handleSubscriptionUpdate(event.data.object as never);
      break;
    }

    case "customer.subscription.deleted": {
      await handleSubscriptionDeleted(event.data.object as never);
      break;
    }

    case "invoice.payment_succeeded": {
      await handleInvoicePaid(event.data.object as never);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as never;
      console.error(`Payment failed for invoice ${(invoice as Record<string, unknown>).id}`);
      await handleInvoiceFailed(invoice);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function handleMembershipCheckout(
  session: Stripe.Checkout.Session,
  memberId: string
) {
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member || member.status === "ACTIVE") return;

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  await prisma.member.update({
    where: { id: memberId },
    data: {
      status: "ACTIVE",
      stripeCustomerId: customerId,
      subscriptionId: subscriptionId,
    },
  });

  // Auto-create membership certificate
  await createMembershipCertificate(memberId);
}

async function handleEventRegistration(
  session: Stripe.Checkout.Session,
  registrationId: string
) {
  const registration = await prisma.eventRegistration.findUnique({
    where: { id: registrationId },
  });
  if (!registration || registration.status === "CONFIRMED") return;

  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  await prisma.eventRegistration.update({
    where: { id: registrationId },
    data: {
      status: "CONFIRMED",
      stripePaymentId: paymentIntent,
      amountPaid: session.amount_total || 0,
    },
  });

  // Fire-and-forget: send event confirmation email
  const event = await prisma.event.findUnique({
    where: { id: registration.eventId },
  });
  if (event) {
    const eventDate = format(event.scheduledAt, "d 'de' MMMM 'de' yyyy, HH:mm", {
      locale: es,
    });
    sendEventConfirmationEmail({
      name: registration.name,
      email: registration.email,
      eventTitle: event.title,
      eventDate,
      eventLocation: event.location,
      eventModality: event.modality,
      meetLink: event.meetLink,
    }).catch(console.error);

    // Auto-generate training certificate for members-only paid events
    if (event.membersOnly && registration.memberId) {
      try {
        await createTrainingCertificate(registration.memberId, registration.eventId);
      } catch (err) {
        console.error("Error creating training certificate:", err);
      }
    }
  }
}

async function handleSubscriptionUpdate(
  subscription: Record<string, unknown>
) {
  const subId = subscription.id as string;
  const member = await prisma.member.findFirst({
    where: { subscriptionId: subId },
  });
  if (!member) return;

  const periodEnd = (subscription.current_period_end as number) || null;

  await prisma.member.update({
    where: { id: member.id },
    data: {
      status: subscription.status === "active" ? "ACTIVE" : "EXPIRED",
      ...(periodEnd
        ? { subscriptionEnd: new Date(periodEnd * 1000) }
        : {}),
    },
  });
}

async function handleSubscriptionDeleted(
  subscription: Record<string, unknown>
) {
  const subId = subscription.id as string;
  const member = await prisma.member.findFirst({
    where: { subscriptionId: subId },
  });
  if (!member) return;

  await prisma.member.update({
    where: { id: member.id },
    data: {
      status: "CANCELLED",
      subscriptionId: null,
    },
  });
}

async function handleInvoiceFailed(invoice: Record<string, unknown>) {
  const subscription = invoice.subscription;
  const subscriptionId =
    typeof subscription === "string"
      ? subscription
      : (subscription as Record<string, unknown> | null)?.id as string | undefined;

  let memberName: string | undefined;
  let memberEmail: string | undefined;

  if (subscriptionId) {
    const member = await prisma.member.findFirst({
      where: { subscriptionId },
      select: { name: true, email: true },
    });
    if (member) {
      memberName = member.name;
      memberEmail = member.email;
    }
  }

  sendPaymentFailedAlert({
    invoiceId: (invoice.id as string | undefined) ?? "unknown",
    memberName,
    memberEmail,
    amount: (invoice.amount_due as number | undefined),
  }).catch(console.error);
}

async function handleInvoicePaid(
  invoice: Record<string, unknown>
) {
  const subscription = invoice.subscription;
  const subscriptionId =
    typeof subscription === "string"
      ? subscription
      : (subscription as Record<string, unknown> | null)?.id as string | undefined;
  if (!subscriptionId) return;

  const member = await prisma.member.findFirst({
    where: { subscriptionId },
  });
  if (!member) return;

  const lines = invoice.lines as { data?: Array<{ period?: { end?: number } }> } | undefined;
  const periodEnd = lines?.data?.[0]?.period?.end;
  if (periodEnd) {
    await prisma.member.update({
      where: { id: member.id },
      data: {
        status: "ACTIVE",
        subscriptionEnd: new Date(periodEnd * 1000),
      },
    });

    // Auto-create/update certificate for the new period
    await createMembershipCertificate(member.id);
  }
}

