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

const LOGO_URL = `${APP_URL}/logo/logoAPTO.png`;

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
            <td style="background-color:#ffffff;padding:28px 32px 20px;text-align:center;border-bottom:3px solid #2E6DA4;">
              <img src="${LOGO_URL}" alt="APTO — Asociaci&oacute;n de Profesionales en Terapia Ocupacional" width="180" style="display:block;margin:0 auto;max-width:180px;height:auto;border:0;outline:none;text-decoration:none;" />
              <p style="margin:12px 0 0;color:#2E6DA4;font-size:12px;letter-spacing:1px;text-transform:uppercase;font-weight:600;">Asociaci&oacute;n de Profesionales en Terapia Ocupacional</p>
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

// ---------------------------------------------------------------------------
// Anniversary email — 27 de abril, aniversario de la fundación (1993)
// ---------------------------------------------------------------------------

const FOUNDED_YEAR_EMAIL = 1993;

export function buildAnniversaryEmailHtml(params?: {
  name?: string;
  year?: number;
}): string {
  const year = params?.year ?? new Date().getFullYear();
  const anniversaryNumber = year - FOUNDED_YEAR_EMAIL;
  const greeting = params?.name
    ? `Estimado/a ${params.name.split(" ")[0]}`
    : "Estimado/a colega";

  return emailLayout(`
    <!-- Hero aniversario -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="margin:0 0 24px;background:linear-gradient(135deg,#2E6DA4 0%,#2D7A3A 100%);border-radius:8px;">
      <tr>
        <td style="padding:32px 24px;text-align:center;">
          <p style="margin:0 0 8px;color:#d1e3f3;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">
            27 de abril &bull; ${year}
          </p>
          <h1 style="margin:0 0 8px;color:#ffffff;font-size:38px;font-weight:800;line-height:1.1;">
            ${anniversaryNumber} a&ntilde;os
          </h1>
          <p style="margin:0;color:#ffffff;font-size:16px;font-weight:500;line-height:1.4;">
            impulsando la Terapia Ocupacional en M&eacute;xico
          </p>
        </td>
      </tr>
    </table>

    <h2 style="margin:0 0 16px;color:#1f2937;font-size:22px;font-weight:700;line-height:1.3;">
      &iexcl;Celebramos juntos nuestro ${anniversaryNumber}&ordm; aniversario!
    </h2>

    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.65;">
      ${greeting}:
    </p>

    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.65;">
      El pr&oacute;ximo <strong>27 de abril</strong> conmemoramos un nuevo aniversario de la fundaci&oacute;n
      de la <strong>Asociaci&oacute;n de Profesionales en Terapia Ocupacional (APTO)</strong>. Desde ${FOUNDED_YEAR_EMAIL}
      hemos trabajado para fortalecer nuestra profesi&oacute;n, y hoy queremos dar un paso m&aacute;s contigo.
    </p>

    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.65;">
      Nos complace invitarte &mdash;ya seas <strong>asociado/a, estudiante o exasociado/a</strong>&mdash;
      a registrarte en nuestra <strong>nueva plataforma digital</strong>, dise&ntilde;ada para
      acompa&ntilde;arte en cada etapa de tu desarrollo profesional.
    </p>

    <!-- Tarjeta de beneficios -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="margin:0 0 28px;background-color:#f9fafb;border:1px solid #e5e7eb;border-left:4px solid #2D7A3A;border-radius:6px;">
      <tr>
        <td style="padding:22px 24px;">
          <p style="margin:0 0 14px;color:#2E6DA4;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
            En el nuevo portal podr&aacute;s
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;vertical-align:top;width:32px;">
                <span style="display:inline-block;width:24px;height:24px;background-color:#2E6DA4;color:#ffffff;border-radius:50%;text-align:center;font-size:13px;font-weight:700;line-height:24px;">1</span>
              </td>
              <td style="padding:6px 0 6px 10px;color:#1f2937;font-size:15px;line-height:1.5;">
                Consultar las <strong>noticias m&aacute;s importantes</strong> de la profesi&oacute;n y del gremio.
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;vertical-align:top;">
                <span style="display:inline-block;width:24px;height:24px;background-color:#2E6DA4;color:#ffffff;border-radius:50%;text-align:center;font-size:13px;font-weight:700;line-height:24px;">2</span>
              </td>
              <td style="padding:6px 0 6px 10px;color:#1f2937;font-size:15px;line-height:1.5;">
                Estar al tanto de los <strong>pr&oacute;ximos eventos</strong>, congresos, talleres y cursos.
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;vertical-align:top;">
                <span style="display:inline-block;width:24px;height:24px;background-color:#2E6DA4;color:#ffffff;border-radius:50%;text-align:center;font-size:13px;font-weight:700;line-height:24px;">3</span>
              </td>
              <td style="padding:6px 0 6px 10px;color:#1f2937;font-size:15px;line-height:1.5;">
                Acceder a tu <strong>&aacute;rea personal</strong> para descargar tus <strong>constancias y certificados</strong> cuando los necesites.
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;vertical-align:top;">
                <span style="display:inline-block;width:24px;height:24px;background-color:#2D7A3A;color:#ffffff;border-radius:50%;text-align:center;font-size:13px;font-weight:700;line-height:24px;">4</span>
              </td>
              <td style="padding:6px 0 6px 10px;color:#1f2937;font-size:15px;line-height:1.5;">
                Disfrutar de <strong>todas las ventajas</strong> que esta herramienta tiene reservadas para la comunidad APTO.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <h3 style="margin:0 0 12px;color:#1f2937;font-size:17px;font-weight:700;">
      Tres pasos para formar parte
    </h3>
    <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.65;">
      <strong style="color:#2E6DA4;">1.</strong> Crea tu cuenta en la plataforma.<br/>
      <strong style="color:#2E6DA4;">2.</strong> Realiza el pago de tu <strong>suscripci&oacute;n anual</strong>
      (profesional $800 MXN &bull; estudiante $300 MXN).<br/>
      <strong style="color:#2E6DA4;">3.</strong> Comienza a disfrutar todos los beneficios de inmediato.
    </p>

    ${buttonHtml(`${APP_URL}/auth/registro`, "Registrarme ahora →")}

    <p style="margin:0 0 8px;color:#374151;font-size:14px;line-height:1.6;text-align:center;">
      &iquest;Ya tienes cuenta?
      <a href="${APP_URL}/auth/login" style="color:#2E6DA4;text-decoration:underline;font-weight:600;">Inicia sesi&oacute;n</a>
      o revisa los
      <a href="${APP_URL}/membresia" style="color:#2E6DA4;text-decoration:underline;font-weight:600;">planes de membres&iacute;a</a>.
    </p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />

    <p style="margin:0 0 8px;color:#6b7280;font-size:14px;line-height:1.6;font-style:italic;text-align:center;">
      Gracias por caminar con nosotros estos ${anniversaryNumber} a&ntilde;os.<br/>
      El futuro de la Terapia Ocupacional en M&eacute;xico lo seguimos construyendo juntos.
    </p>

    <p style="margin:16px 0 0;color:#1f2937;font-size:14px;line-height:1.6;text-align:center;font-weight:600;">
      Con aprecio,<br/>
      <span style="color:#2E6DA4;">Mesa Directiva APTO</span>
    </p>
  `);
}

export async function sendAnniversaryEmail(params: {
  name?: string;
  email: string;
  year?: number;
}): Promise<void> {
  const { name, email, year } = params;
  const y = year ?? new Date().getFullYear();
  const anniversaryNumber = y - FOUNDED_YEAR_EMAIL;

  const html = buildAnniversaryEmailHtml({ name, year: y });

  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: `🎉 ${anniversaryNumber} años de APTO — Te invitamos a la nueva plataforma`,
      html,
    });
  } catch (error) {
    console.error("Failed to send anniversary email:", error);
  }
}

// ---------------------------------------------------------------------------
// Admin payment failure alert
// ---------------------------------------------------------------------------

export async function sendPaymentFailedAlert(params: {
  invoiceId: string;
  memberName?: string;
  memberEmail?: string;
  amount?: number;
}): Promise<void> {
  const { invoiceId, memberName, memberEmail, amount } = params;
  const adminEmail = CONTACT_EMAIL;
  const stripeMode = process.env.STRIPE_MODE || "test";
  const amountFormatted = amount
    ? `$${(amount / 100).toLocaleString("es-MX")} MXN`
    : "desconocido";

  const html = emailLayout(`
    <h2 style="margin:0 0 16px;color:#dc2626;font-size:20px;font-weight:600;">
      Pago fallido en Stripe
    </h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      Un pago de membres&iacute;a ha fallado. Revisa el dashboard de Stripe para m&aacute;s detalles.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="margin:0 0 24px;border:1px solid #fecaca;border-radius:6px;overflow:hidden;background:#fff7f7;">
      <tr>
        <td style="padding:8px 12px;font-size:14px;color:#6b7280;border-bottom:1px solid #fee2e2;width:140px;">Invoice ID</td>
        <td style="padding:8px 12px;font-size:14px;color:#1f2937;border-bottom:1px solid #fee2e2;font-family:monospace;">${invoiceId}</td>
      </tr>
      ${memberName ? `<tr><td style="padding:8px 12px;font-size:14px;color:#6b7280;border-bottom:1px solid #fee2e2;">Miembro</td><td style="padding:8px 12px;font-size:14px;color:#1f2937;border-bottom:1px solid #fee2e2;">${memberName}</td></tr>` : ""}
      ${memberEmail ? `<tr><td style="padding:8px 12px;font-size:14px;color:#6b7280;border-bottom:1px solid #fee2e2;">Email</td><td style="padding:8px 12px;font-size:14px;color:#1f2937;border-bottom:1px solid #fee2e2;">${memberEmail}</td></tr>` : ""}
      <tr>
        <td style="padding:8px 12px;font-size:14px;color:#6b7280;border-bottom:1px solid #fee2e2;">Monto</td>
        <td style="padding:8px 12px;font-size:14px;color:#1f2937;border-bottom:1px solid #fee2e2;">${amountFormatted}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-size:14px;color:#6b7280;">Modo Stripe</td>
        <td style="padding:8px 12px;font-size:14px;color:#1f2937;">${stripeMode === "live" ? "PRODUCCIÓN" : "PRUEBAS"}</td>
      </tr>
    </table>
    ${buttonHtml("https://dashboard.stripe.com/invoices", "Ver en Stripe Dashboard")}
  `);

  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: adminEmail,
      subject: `[APTO] Pago fallido — ${memberEmail || invoiceId}`,
      html,
    });
  } catch (error) {
    console.error("Failed to send payment failed alert:", error);
  }
}
