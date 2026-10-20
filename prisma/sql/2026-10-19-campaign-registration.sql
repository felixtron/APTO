-- Registros gratuitos de campañas (Día Mundial TO 2026): solo nombre y correo.
-- Aplicar ANTES de desplegar el código que la usa. Idempotente.
CREATE TABLE IF NOT EXISTS "CampaignRegistration" (
  "id" TEXT NOT NULL,
  "campaign" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "acceptsEmails" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastAccessAt" TIMESTAMP(3),
  CONSTRAINT "CampaignRegistration_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CampaignRegistration_campaign_email_key"
  ON "CampaignRegistration"("campaign", "email");
CREATE INDEX IF NOT EXISTS "CampaignRegistration_campaign_createdAt_idx"
  ON "CampaignRegistration"("campaign", "createdAt");

-- Verificación: debe devolver 0.
SELECT count(*) AS registros FROM "CampaignRegistration";
