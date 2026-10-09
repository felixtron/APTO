/**
 * Vista previa del recordatorio mensual de pago, con datos de ejemplo.
 *
 * Uso:
 *   npx tsx scripts/preview-payment-reminder.ts <salida.html>
 *   npx tsx scripts/preview-payment-reminder.ts <salida.html> --send correo@ejemplo.com
 *
 * --send manda UNA prueba (asunto "[PRUEBA] ...") con enlaces de ejemplo, usando
 * RESEND_API_KEY del .env. No toca la base de datos.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// tsx no carga .env por su cuenta
const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([^#\s][^=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2].trim().replace(/^"(.*)"$/, "$1");
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main(): Promise<void> {
  const [output, flag, recipient] = process.argv.slice(2);
  if (!output) {
    console.error("Uso: npx tsx scripts/preview-payment-reminder.ts <salida.html> [--send correo]");
    process.exit(1);
  }

  const { buildPaymentReminderEmail } = await import("../src/lib/payment-reminder-email");
  const { APP_URL, FROM_ADDRESS } = await import("../src/lib/emails");
  const email = buildPaymentReminderEmail({
    name: "María Fernanda Ejemplo",
    memberNumber: "LTO0000",
    passwordSetupUrl: `${APP_URL}/auth/reset-password?token=EJEMPLO`,
    unsubscribeUrl: `${APP_URL}/baja`,
  });

  writeFileSync(output, email.html);
  console.log(`Asunto: ${email.subject}\nHTML: ${output}`);

  if (flag !== "--send") return;
  if (!recipient) throw new Error("Falta el correo después de --send");

  const { getResend } = await import("../src/lib/resend");
  const { error } = await getResend().emails.send({
    from: FROM_ADDRESS,
    to: recipient,
    subject: `[PRUEBA] ${email.subject}`,
    html: email.html,
    text: email.text,
  });
  if (error) throw new Error(`${error.name}: ${error.message}`);
  console.log(`Prueba enviada a ${recipient}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
