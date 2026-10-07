/**
 * Liveness probe for the Quadlet healthcheck
 * (`HealthCmd=wget -q -O /dev/null http://127.0.0.1:3000/api/health`).
 * Deliberately skips the database: probing `/` re-rendered the landing page
 * and ran its queries every 30 s.
 */
export function GET(): Response {
  return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
