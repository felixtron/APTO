import { getResend } from "@/lib/resend";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_HOURS,
  CONTACT_ADDRESS,
} from "@/lib/constants";

const FROM_ADDRESS =
  process.env.RESEND_FROM || `APTO <${CONTACT_EMAIL}>`;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://apto.org.mx";

// ---------------------------------------------------------------------------
// Shared HTML helpers
// ---------------------------------------------------------------------------

function emailLayout(body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#2E6DA4;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:2px;">APTO</h1>
              <p style="margin:4px 0 0;color:#d1e3f3;font-size:12px;letter-spacing:0.5px;">Asociaci&oacute;n de Profesionales en Terapia Ocupacional</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.5;">
                <strong>APTO</strong> &mdash; Asociaci&oacute;n de Profesionales en Terapia Ocupacional
              </p>
              <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;line-height:1.5;">
                ${CONTACT_ADDRESS}
              </p>
              <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;line-height:1.5;">
                Tel: ${CONTACT_PHONE} &bull; Horario: ${CONTACT_HOURS}
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                <a href="mailto:${CONTACT_EMAIL}" style="color:#2E6DA4;text-decoration:none;">${CONTACT_EMAIL}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buttonHtml(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background-color:#2D7A3A;border-radius:6px;">
      <a href="${href}" target="_blank" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
        ${label}
      </a>
    </td>
  </tr>
</table>`;
}

// ---------------------------------------------------------------------------
// Welcome email — sent after a new member registers
// ---------------------------------------------------------------------------

export async function sendWelcomeEmail(params: {
  name: string;
  email: string;
  memberNumber: string;
}): Promise<void> {
  const { name, email, memberNumber } = params;

  const firstName = name.split(" ")[0];

  const html = emailLayout(`
    <h2 style="margin:0 0 16px;color:#1f2937;font-size:20px;font-weight:600;">
      &iexcl;Bienvenido/a a APTO, ${firstName}!
    </h2>
    <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6;">
      Gracias por registrarte en la Asociaci&oacute;n de Profesionales en Terapia Ocupacional.
      Tu cuenta ha sido creada exitosamente.
    </p>
    <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6;">
      Tu n&uacute;mero de miembro es:
    </p>
    <p style="margin:0 0 20px;text-align:center;">
      <span style="display:inline-block;background-color:#eef2ff;border:1px solid #c7d2fe;border-radius:6px;padding:10px 24px;font-size:18px;font-weight:700;color:#2E6DA4;letter-spacing:1px;">
        ${memberNumber}
      </span>
    </p>
    <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6;">
      <strong>Nota:</strong> Tu cuenta se encuentra en estado <em>pendiente</em> hasta que actives tu
      membres&iacute;a. Una vez activada, tendr&aacute;s acceso completo al portal de miembros,
      eventos exclusivos, constancias y m&aacute;s.
    </p>
    ${buttonHtml(`${APP_URL}/membresia`, "Ver planes de membres\u00eda")}
    <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">
      Tambi&eacute;n puedes iniciar sesi&oacute;n en cualquier momento desde:
    </p>
    <p style="margin:0 0 0;font-size:14px;">
      <a href="${APP_URL}/auth/login" style="color:#2E6DA4;text-decoration:underline;">${APP_URL}/auth/login</a>
    </p>
  `);

  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Bienvenido/a a APTO \u2014 Tu cuenta ha sido creada",
      html,
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }
}

// ---------------------------------------------------------------------------
// Event confirmation email — sent after payment is confirmed
// ---------------------------------------------------------------------------

const MODALITY_LABELS: Record<string, string> = {
  VIRTUAL: "Virtual",
  IN_PERSON: "Presencial",
  HYBRID: "H\u00edbrido",
};

export async function sendEventConfirmationEmail(params: {
  name: string;
  email: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string | null;
  eventModality: string;
  meetLink?: string | null;
}): Promise<void> {
  const {
    name,
    email,
    eventTitle,
    eventDate,
    eventLocation,
    eventModality,
    meetLink,
  } = params;

  const firstName = name.split(" ")[0];
  const modalityLabel = MODALITY_LABELS[eventModality] || eventModality;

  // Build detail rows
  let detailsHtml = `
    <tr>
      <td style="padding:8px 12px;font-size:14px;color:#6b7280;border-bottom:1px solid #f3f4f6;width:120px;">Evento</td>
      <td style="padding:8px 12px;font-size:14px;color:#1f2937;border-bottom:1px solid #f3f4f6;font-weight:600;">${eventTitle}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;font-size:14px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Fecha</td>
      <td style="padding:8px 12px;font-size:14px;color:#1f2937;border-bottom:1px solid #f3f4f6;">${eventDate}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;font-size:14px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Modalidad</td>
      <td style="padding:8px 12px;font-size:14px;color:#1f2937;border-bottom:1px solid #f3f4f6;">${modalityLabel}</td>
    </tr>`;

  if (
    eventLocation &&
    (eventModality === "IN_PERSON" || eventModality === "HYBRID")
  ) {
    detailsHtml += `
    <tr>
      <td style="padding:8px 12px;font-size:14px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Ubicaci&oacute;n</td>
      <td style="padding:8px 12px;font-size:14px;color:#1f2937;border-bottom:1px solid #f3f4f6;">${eventLocation}</td>
    </tr>`;
  }

  if (
    meetLink &&
    (eventModality === "VIRTUAL" || eventModality === "HYBRID")
  ) {
    detailsHtml += `
    <tr>
      <td style="padding:8px 12px;font-size:14px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Enlace</td>
      <td style="padding:8px 12px;font-size:14px;color:#1f2937;border-bottom:1px solid #f3f4f6;">
        <a href="${meetLink}" style="color:#2E6DA4;text-decoration:underline;">${meetLink}</a>
      </td>
    </tr>`;
  }

  const html = emailLayout(`
    <h2 style="margin:0 0 16px;color:#1f2937;font-size:20px;font-weight:600;">
      &iexcl;Registro confirmado, ${firstName}!
    </h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      Tu registro al siguiente evento ha sido confirmado exitosamente:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="margin:0 0 24px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
      ${detailsHtml}
    </table>
    <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6;">
      Despu&eacute;s del evento, podr&aacute;s acceder a las grabaciones y materiales desde
      tu portal de miembro:
    </p>
    ${buttonHtml(`${APP_URL}/dashboard`, "Ir al portal de miembro")}
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">
      Si tienes alguna pregunta sobre el evento, no dudes en contactarnos a
      <a href="mailto:${CONTACT_EMAIL}" style="color:#2E6DA4;text-decoration:none;">${CONTACT_EMAIL}</a>.
    </p>
  `);

  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: `Registro confirmado: ${eventTitle}`,
      html,
    });
  } catch (error) {
    console.error("Failed to send event confirmation email:", error);
  }
}
