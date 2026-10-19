import { TIMEZONE } from "@/lib/constants";

/**
 * Configuración de la campaña pública del Día Mundial de la TO.
 * Cambiar fechas, tema, imagen o enlaces aquí; no hay panel de admin.
 */
export const DIA_MUNDIAL = {
  path: "/dia-mundial",
  navLabel: "Día Mundial TO",
  title: "Día Mundial de la Terapia Ocupacional",
  year: 2026,
  theme: "La participación importa",
  /** Ventana de acceso libre, inclusiva, en hora de Ciudad de México. */
  startsOn: "2026-10-27",
  endsOn: "2026-10-31",
  dateLabel: "Del 27 al 31 de octubre",
  heroImage: "/dia-mundial/hero.jpg",
  /** Enlace para unirse al Colegio. Vacío = el CTA no se muestra. */
  colegioUrl: "https://www.coteoc.mx/",
} as const;

export type EventWindowStatus = "upcoming" | "open" | "closed";

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
