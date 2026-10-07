import Stripe from "stripe";
import { cookies } from "next/headers";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export type StripeMode = "test" | "live";

const stripeInstances: Record<string, Stripe> = {};

export async function getStripeMode(): Promise<StripeMode> {
  const envMode: StripeMode = process.env.STRIPE_MODE === "live" ? "live" : "test";
  try {
    const cookieStore = await cookies();
    const modeCookie = cookieStore.get("stripe_mode")?.value;
    // The cookie is an admin-only testing aid. Honoring it for anonymous
    // visitors would let anyone pay with a test card and activate a live
    // membership, so it only applies to an authenticated admin session.
    if (
      (modeCookie === "live" || modeCookie === "test") &&
      modeCookie !== envMode &&
      (await isAdminAuthenticated())
    ) {
      return modeCookie;
    }
  } catch {
    // cookies() not available (e.g. middleware or edge)
  }
  return envMode;
}

function getStripeKeys(mode: StripeMode) {
  if (mode === "live") {
    return {
      secretKey: process.env.STRIPE_LIVE_SECRET_KEY!,
      webhookSecret: process.env.STRIPE_LIVE_WEBHOOK_SECRET!,
      publishableKey: process.env.STRIPE_LIVE_PUBLISHABLE_KEY!,
    };
  }
  return {
    secretKey: process.env.STRIPE_TEST_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_TEST_WEBHOOK_SECRET!,
    publishableKey: process.env.STRIPE_TEST_PUBLISHABLE_KEY!,
  };
}

export function getStripeForMode(mode: StripeMode): Stripe {
  if (!stripeInstances[mode]) {
    const { secretKey } = getStripeKeys(mode);
    stripeInstances[mode] = new Stripe(secretKey);
  }
  return stripeInstances[mode];
}

export async function getStripe(): Promise<Stripe> {
  const mode = await getStripeMode();
  return getStripeForMode(mode);
}

export async function getStripePublishableKey(): Promise<string> {
  const mode = await getStripeMode();
  return getStripeKeys(mode).publishableKey;
}

export async function getStripeWebhookSecret(): Promise<string> {
  const mode = await getStripeMode();
  return getStripeKeys(mode).webhookSecret;
}

export type MembershipPlan = "student" | "professional";

export async function getStripePriceId(plan: MembershipPlan): Promise<string> {
  const mode = await getStripeMode();
  if (mode === "live") {
    return plan === "student"
      ? process.env.STRIPE_LIVE_PRICE_STUDENT!
      : process.env.STRIPE_LIVE_PRICE_PROFESSIONAL!;
  }
  return plan === "student"
    ? process.env.STRIPE_TEST_PRICE_STUDENT!
    : process.env.STRIPE_TEST_PRICE_PROFESSIONAL!;
}

export { Stripe };
