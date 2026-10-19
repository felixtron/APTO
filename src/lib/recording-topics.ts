/**
 * Temas de las grabaciones. Alimentan los filtros públicos de /dia-mundial
 * y el formulario de /admin/grabaciones. Se guardan como texto en
 * `Recording.topics`, por eso cualquier entrada se valida contra esta lista.
 */
export const RECORDING_TOPICS = [
  "Infancia y neurodesarrollo",
  "Salud mental y adicciones",
  "Rehabilitación física y neurológica",
  "Comunidad, derechos y justicia ocupacional",
  "Sexualidad y diversidad funcional",
  "Tecnología e innovación",
  "Profesión, formación y ética",
] as const;

export type RecordingTopic = (typeof RECORDING_TOPICS)[number];

export const ALL_TOPICS_FILTER = "Todos";

export interface FilterableRecording {
  title: string;
  description: string | null;
  topics: string[];
}

export interface RecordingFilters {
  topic?: string | null;
  query?: string;
}

const SPEAKER_PREFIX = /^\s*ponentes?\s*:\s*/i;

function isRecordingTopic(value: string): value is RecordingTopic {
  return (RECORDING_TOPICS as readonly string[]).includes(value);
}

/**
 * Acepta un arreglo o un texto separado por ";" o saltos de línea (varios temas
 * llevan coma en el nombre); descarta lo que no esté en la lista.
 */
export function parseTopics(input: unknown): RecordingTopic[] {
  const raw: string[] = Array.isArray(input)
    ? input.filter((item): item is string => typeof item === "string")
    : typeof input === "string"
      ? input.split(/[;\n]/)
      : [];

  const seen = new Set<RecordingTopic>();
  for (const item of raw) {
    const trimmed = item.trim();
    if (isRecordingTopic(trimmed)) seen.add(trimmed);
  }
  return Array.from(seen);
}

/** Normaliza para búsqueda: minúsculas y sin acentos. */
export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Quita el prefijo "Ponente:" / "Ponentes:" de la descripción. */
export function getSpeaker(description: string | null): string | null {
  if (!description) return null;
  const speaker = description.replace(SPEAKER_PREFIX, "").trim();
  return speaker.length > 0 ? speaker : null;
}

export function filterRecordings<T extends FilterableRecording>(
  recordings: readonly T[],
  { topic, query }: RecordingFilters
): T[] {
  const activeTopic = topic && topic !== ALL_TOPICS_FILTER ? topic : null;
  const needle = query ? normalizeForSearch(query) : "";

  return recordings.filter((recording) => {
    if (activeTopic && !recording.topics.includes(activeTopic)) return false;
    if (!needle) return true;
    const haystack = normalizeForSearch(
      `${recording.title} ${recording.description ?? ""}`
    );
    return haystack.includes(needle);
  });
}

export function countByTopic(
  recordings: readonly FilterableRecording[]
): Record<string, number> {
  const counts: Record<string, number> = { [ALL_TOPICS_FILTER]: recordings.length };
  for (const topic of RECORDING_TOPICS) counts[topic] = 0;
  for (const recording of recordings) {
    for (const topic of recording.topics) {
      if (isRecordingTopic(topic)) counts[topic] += 1;
    }
  }
  return counts;
}
