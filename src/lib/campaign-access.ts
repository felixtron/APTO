import { cookies } from "next/headers";
import { createSignedToken, verifySignedToken } from "@/lib/signed-token";
import { DIA_MUNDIAL } from "@/lib/dia-mundial";

export const CAMPAIGN_ACCESS_COOKIE = "dia_mundial_access";

const DAY_MS = 24 * 60 * 60 * 1000;
const GRACE_DAYS_AFTER_EVENT = 7;
/** Mexico City no usa horario de verano desde 2022: siempre UTC-6. */
const MEXICO_CITY_OFFSET = "-06:00";

export interface AccessConfig {
  endsOn: string;
}

/** Vigencia de la cookie: hasta el fin del evento más una semana; mínimo un día. */
export function getCampaignAccessTtlMs(
  now: Date,
  config: AccessConfig = DIA_MUNDIAL
): number {
  const eventEnd = new Date(`${config.endsOn}T23:59:59${MEXICO_CITY_OFFSET}`).getTime();
  const expiresAt = eventEnd + GRACE_DAYS_AFTER_EVENT * DAY_MS;
  return Math.max(expiresAt - now.getTime(), DAY_MS);
}

export function createCampaignAccessToken(
  claims: { registrationId: string; campaign: string },
  ttlMs: number
): string {
  return createSignedToken("campaign-access", claims, ttlMs);
}

/** Devuelve el id del registro si el token es válido y es de esta campaña. */
export function verifyCampaignAccessToken(
  token: string,
  campaign: string
): string | null {
  const result = verifySignedToken("campaign-access", token);
  if (!result.ok) return null;
  const { registrationId, campaign: tokenCampaign } = result.claims;
  if (tokenCampaign !== campaign) return null;
  return typeof registrationId === "string" && registrationId.length > 0
    ? registrationId
    : null;
}

export function campaignAccessCookieOptions(ttlMs: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(ttlMs / 1000),
  };
}

export interface CampaignAccess {
  registered: boolean;
  registrationId: string | null;
}

/** Lee la cookie de acceso en el servidor. Falla cerrado ante cualquier error. */
export async function getCampaignAccess(
  campaign: string = DIA_MUNDIAL.campaign
): Promise<CampaignAccess> {
  try {
    const token = (await cookies()).get(CAMPAIGN_ACCESS_COOKIE)?.value;
    const registrationId = token
      ? verifyCampaignAccessToken(token, campaign)
      : null;
    return { registered: registrationId !== null, registrationId };
  } catch {
    return { registered: false, registrationId: null };
  }
}
