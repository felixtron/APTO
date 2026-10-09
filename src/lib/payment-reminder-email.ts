import { escapeHtml } from "@/lib/html";
import { APP_URL, buttonHtml, emailLayout } from "@/lib/emails";

export interface PaymentReminderContent {
  name: string;
  memberNumber: string | null;
  /** One-time setup link, only for members who never created a password. */
  passwordSetupUrl: string | null;
  unsubscribeUrl: string;
}

export interface EmailMessage {
  subject: string;
  html: string;
  text: string;
}

const PORTAL_URL = `${APP_URL}/miembros`;
const FORGOT_PASSWORD_URL = `${APP_URL}/auth/forgot-password`;

const PARAGRAPH = "margin:0 0 14px;color:#374151;font-size:15px;line-height:1.6;";
const SMALL = "margin:0 0 14px;color:#6b7280;font-size:13px;line-height:1.6;";
const LINK = "color:#2E6DA4;text-decoration:underline;";

/** "ROSA ISELA CRUZ" → "Rosa": the roster mixes upper and title case. */
export function greetingName(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? "";
  const lower = first.toLocaleLowerCase("es-MX");
  return lower.charAt(0).toLocaleUpperCase("es-MX") + lower.slice(1);
}

function passwordHelpHtml(setupUrl: string | null): string {
  return setupUrl
    ? `&iquest;Es tu primera vez en el portal?
      <a href="${setupUrl}" style="${LINK}">Crea tu contrase&ntilde;a aqu&iacute;</a>.
      El enlace es v&aacute;lido por 7 d&iacute;as.`
    : `&iquest;No recuerdas tu contrase&ntilde;a?
      <a href="${FORGOT_PASSWORD_URL}" style="${LINK}">Recup&eacute;rala aqu&iacute;</a>.`;
}

function passwordHelpText(setupUrl: string | null): string[] {
  return setupUrl
    ? ["¿Es tu primera vez en el portal? Crea tu contraseña aquí (válido por 7 días):", setupUrl]
    : ["¿No recuerdas tu contraseña? Recupérala aquí:", FORGOT_PASSWORD_URL];
}

/** Monthly invitation to members without an active membership. */
export function buildPaymentReminderEmail(content: PaymentReminderContent): EmailMessage {
  const first = greetingName(content.name);
  const greeting = first ? `Hola ${first},` : "Hola,";
  const numberText = content.memberNumber
    ? ` Tu número de socio es ${content.memberNumber}.`
    : "";

  const html = emailLayout(`
    <h2 style="margin:0 0 16px;color:#1f2937;font-size:20px;font-weight:600;">${escapeHtml(greeting)}</h2>
    <p style="${PARAGRAPH}">
      Gracias por ser parte de la Asociaci&oacute;n de Profesionales en Terapia Ocupacional.${escapeHtml(numberText)}
    </p>
    <p style="${PARAGRAPH}">
      Cada membres&iacute;a ayuda a que nuestra comunidad siga creciendo y a que podamos crear
      m&aacute;s recursos para todos: capacitaciones, grabaciones, constancias, el directorio
      profesional y la bolsa de trabajo.
    </p>
    <p style="${PARAGRAPH}">
      Si quieres sumarte, puedes activar tu membres&iacute;a desde el portal de miembros cuando gustes.
    </p>
    ${buttonHtml(PORTAL_URL, "Activar mi membres&iacute;a")}
    <p style="${SMALL}">${passwordHelpHtml(content.passwordSetupUrl)}</p>
    <p style="margin:20px 0 24px;color:#1f2937;font-size:15px;line-height:1.6;">
      Gracias por tu apoyo,<br/>
      <span style="color:#2E6DA4;font-weight:600;">Mesa Directiva APTO</span>
    </p>
    <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
      Recibes este correo porque formas parte del padr&oacute;n de socios de APTO.
      Si prefieres no recibir estos recordatorios,
      <a href="${content.unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">date de baja aqu&iacute;</a>.
    </p>
  `);

  const text = [
    greeting,
    "",
    `Gracias por ser parte de la Asociación de Profesionales en Terapia Ocupacional.${numberText}`,
    "",
    "Cada membresía ayuda a que nuestra comunidad siga creciendo y a que podamos crear más recursos para todos: capacitaciones, grabaciones, constancias, el directorio profesional y la bolsa de trabajo.",
    "",
    "Si quieres sumarte, puedes activar tu membresía desde el portal de miembros cuando gustes:",
    PORTAL_URL,
    "",
    ...passwordHelpText(content.passwordSetupUrl),
    "",
    "Gracias por tu apoyo,",
    "Mesa Directiva APTO",
    "",
    `Si prefieres no recibir estos recordatorios: ${content.unsubscribeUrl}`,
  ].join("\n");

  return {
    subject: first
      ? `${first}, con tu apoyo APTO sigue creciendo`
      : "Con tu apoyo APTO sigue creciendo",
    html,
    text,
  };
}
