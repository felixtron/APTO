import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/validation";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";
import { registrationSchema } from "@/lib/campaign-registration";
import {
  CAMPAIGN_ACCESS_COOKIE,
  campaignAccessCookieOptions,
  createCampaignAccessToken,
  getCampaignAccessTtlMs,
} from "@/lib/campaign-access";
import { DIA_MUNDIAL } from "@/lib/dia-mundial";
import { sendCampaignAccessEmail } from "@/lib/emails";

export async function POST(request: NextRequest) {
  try {
    const limit = checkRateLimit("eventRegister", [getClientIp(request.headers)]);
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    const parsed = await parseJsonBody(request, registrationSchema);
    if (!parsed.ok) return parsed.response;
    const { name, email, acceptsEmails, website } = parsed.data;

    // Honeypot: respondemos igual para no dar pistas, pero no guardamos nada.
    if (website) return NextResponse.json({ ok: true, returning: false, name });

    const campaign = DIA_MUNDIAL.campaign;
    const now = new Date();
    const existing = await prisma.campaignRegistration.findUnique({
      where: { campaign_email: { campaign, email } },
      select: { id: true },
    });

    const registration = await prisma.campaignRegistration.upsert({
      where: { campaign_email: { campaign, email } },
      create: { campaign, name, email, acceptsEmails },
      update: { name, acceptsEmails, lastAccessAt: now },
      select: { id: true },
    });

    const ttlMs = getCampaignAccessTtlMs(now);
    const token = createCampaignAccessToken(
      { registrationId: registration.id, campaign },
      ttlMs
    );
    (await cookies()).set(
      CAMPAIGN_ACCESS_COOKIE,
      token,
      campaignAccessCookieOptions(ttlMs)
    );

    if (!existing) await sendCampaignAccessEmail({ name, email });

    return NextResponse.json({ ok: true, returning: existing !== null, name });
  } catch (error) {
    console.error("Error en registro Día Mundial:", error);
    return NextResponse.json(
      { error: "No pudimos completar tu registro. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
