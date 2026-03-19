import { cookies } from "next/headers";
import crypto from "crypto";

function getSecret(): string {
  return process.env.NEXTAUTH_SECRET || process.env.ADMIN_PASSWORD || "fallback";
}

export function generateAdminToken(): string {
  const payload = JSON.stringify({
    role: "admin",
    iat: Date.now(),
    exp: Date.now() + 86400000, // 24h
  });
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");
  return Buffer.from(payload).toString("base64url") + "." + signature;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) return false;

  try {
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return false;

    const payload = Buffer.from(payloadB64, "base64url").toString();
    const expectedSig = crypto
      .createHmac("sha256", getSecret())
      .update(payload)
      .digest("hex");

    if (
      sig.length !== expectedSig.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
    ) {
      return false;
    }

    const { exp } = JSON.parse(payload);
    return Date.now() < exp;
  } catch {
    return false;
  }
}
