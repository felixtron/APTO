import { cookies } from "next/headers";
import { createSignedToken, verifySignedToken } from "@/lib/signed-token";

const ADMIN_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export function generateAdminToken(): string {
  return createSignedToken("admin-session", { role: "admin" }, ADMIN_SESSION_TTL_MS);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) return false;

  try {
    const result = verifySignedToken("admin-session", token);
    return result.ok && result.claims.role === "admin";
  } catch (error) {
    // Missing signing secret: fail closed.
    console.error("Admin token verification failed:", error);
    return false;
  }
}
