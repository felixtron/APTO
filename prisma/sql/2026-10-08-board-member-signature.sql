-- Firma autógrafa de la Mesa Directiva para las constancias.
-- Aplicar ANTES de desplegar el código que la usa: Prisma lee todas las
-- columnas de BoardMember y fallaría si esta no existe. Idempotente.
ALTER TABLE "BoardMember" ADD COLUMN IF NOT EXISTS "signatureUrl" TEXT;
