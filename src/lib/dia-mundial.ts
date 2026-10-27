import { TIMEZONE } from "@/lib/constants";

/**
 * Configuración de la campaña pública del Día Mundial de la TO.
 * Cambiar fechas, tema, imagen o enlaces aquí; no hay panel de admin.
 */
export const DIA_MUNDIAL = {
  path: "/dia-mundial",
  /** Identifica los registros gratuitos de esta campaña en la BD. */
  campaign: "dia-mundial-2026",
  navLabel: "Día Mundial TO",
  title: "Día Mundial de la Terapia Ocupacional",
  year: 2026,
  theme: "La participación importa",
  /** Ventana de acceso libre, inclusiva, en hora de Ciudad de México. */
  startsOn: "2026-10-27",
  endsOn: "2026-10-31",
  dateLabel: "Del 27 al 31 de octubre",
  /** Banner oficial de la campaña (16:9, ya incluye título, tema y fecha). */
  heroImage: "/dia-mundial/banner.jpg",
  /** Logotipo oficial de la campaña, fondo transparente. */
  campaignLogo: "/dia-mundial/logo-oficial.png",
  aptoLogo: "/logo/logoAPTO.png",
  coteocLogo: "/dia-mundial/coteoc.png",
  coteocName: "COTEOC, Colegio de Terapeutas Ocupacionales de México",
  /** Enlace para unirse al Colegio. Vacío = el CTA no se muestra. */
  colegioUrl: "https://www.coteoc.mx/",
} as const;

export type EventWindowStatus = "upcoming" | "open" | "closed";

const SPANISH_MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

/** Copy shown only while the library is open and the visitor has no access cookie. */
export const OPEN_ACCESS_COPY = {
  heroBadge: "¡Ya está abierta!",
  heroCta: "Ver grabaciones gratis",
  registrationTitle: "Accede ahora a la biblioteca",
  registrationBody:
    "Solo tu nombre y correo, sin costo y sin membresía. Si ya te registraste, vuelve a escribir el mismo correo para entrar.",
  registrationSubmit: "Ver grabaciones",
} as const;

/** "31 de octubre" from a campaign ISO date. */
function formatDayAndMonth(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  const month = match ? SPANISH_MONTHS[Number(match[2]) - 1] : undefined;
  const day = match ? Number(match[3]) : NaN;
  if (!month || day < 1 || day > 31) {
    throw new Error("DIA_MUNDIAL: la fecha de cierre debe tener formato YYYY-MM-DD");
  }
  return `${day} de ${month}`;
}

/** Subtitle under the open-state hero. The count is the number of active recordings. */
export function openAccessSubtitle(
  recordingCount: number,
  endsOn: string = DIA_MUNDIAL.endsOn
): string {
  const until = formatDayAndMonth(endsOn);
  if (recordingCount === 1) {
    return `Regístrate gratis y mira la grabación hasta el ${until}`;
  }
  return `Regístrate gratis y mira las ${recordingCount} grabaciones hasta el ${until}`;
}

export interface EventWindowConfig {
  startsOn: string;
  endsOn: string;
}

const STATUSES: readonly EventWindowStatus[] = ["upcoming", "open", "closed"];

/** Env opcional para previsualizar un estado: DIA_MUNDIAL_FORCE_STATUS=open */
export const FORCE_STATUS_ENV = "DIA_MUNDIAL_FORCE_STATUS";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Fecha calendario `YYYY-MM-DD` de `now` en la zona horaria de la asociación. */
export function toLocalIsoDate(now: Date, timeZone: string = TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function parseForcedStatus(value: string | undefined): EventWindowStatus | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return STATUSES.find((status) => status === normalized) ?? null;
}

export function getEventWindowStatus(
  now: Date,
  config: EventWindowConfig = DIA_MUNDIAL,
  forcedStatus: string | undefined = process.env[FORCE_STATUS_ENV]
): EventWindowStatus {
  const forced = parseForcedStatus(forcedStatus);
  if (forced) return forced;

  if (!ISO_DATE.test(config.startsOn) || !ISO_DATE.test(config.endsOn)) {
    throw new Error("DIA_MUNDIAL: startsOn y endsOn deben tener formato YYYY-MM-DD");
  }

  const today = toLocalIsoDate(now);
  if (today < config.startsOn) return "upcoming";
  if (today > config.endsOn) return "closed";
  return "open";
}

const MEXICO_CITY_OFFSET = "-06:00";
const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Instante en que se abre el acceso libre (00:00 del primer día, hora CDMX). */
export function getEventOpensAt(config: EventWindowConfig = DIA_MUNDIAL): Date {
  return new Date(`${config.startsOn}T00:00:00${MEXICO_CITY_OFFSET}`);
}

/** Instante en que termina el acceso libre (23:59:59 del último día, hora CDMX). */
export function getEventClosesAt(config: EventWindowConfig = DIA_MUNDIAL): Date {
  return new Date(`${config.endsOn}T23:59:59${MEXICO_CITY_OFFSET}`);
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** true cuando el objetivo ya pasó. */
  done: boolean;
}

export function getCountdownParts(now: Date, target: Date): CountdownParts {
  const remaining = Math.max(target.getTime() - now.getTime(), 0);
  return {
    days: Math.floor(remaining / DAY_MS),
    hours: Math.floor((remaining % DAY_MS) / HOUR_MS),
    minutes: Math.floor((remaining % HOUR_MS) / MINUTE_MS),
    seconds: Math.floor((remaining % MINUTE_MS) / SECOND_MS),
    done: remaining === 0,
  };
}
