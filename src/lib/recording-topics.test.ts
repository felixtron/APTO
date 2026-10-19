import { describe, expect, it } from "vitest";
import {
  ALL_TOPICS_FILTER,
  RECORDING_TOPICS,
  countByTopic,
  filterRecordings,
  getSpeaker,
  normalizeForSearch,
  parseTopics,
} from "@/lib/recording-topics";

const INFANCIA = "Infancia y neurodesarrollo";
const COMUNIDAD = "Comunidad, derechos y justicia ocupacional";
const PROFESION = "Profesión, formación y ética";

const recordings = [
  {
    id: "a",
    title: "La importancia de vigilar el Neurodesarrollo",
    description: "Ponente: Brenda Blancas Granda",
    topics: [INFANCIA],
  },
  {
    id: "b",
    title: "TO con mirada neuroafirmativa: de la clínica a la comunidad",
    description: "Ponente: Gabriela Michaca Abrego",
    topics: [INFANCIA, COMUNIDAD],
  },
  {
    id: "c",
    title: "Terapia ocupacional desde y para las personas sordas",
    description: null,
    topics: [COMUNIDAD],
  },
  {
    id: "d",
    title: "Marketing en Terapia Ocupacional",
    description: "Ponente: Mario Alberto Nava",
    topics: [PROFESION],
  },
];

describe("parseTopics", () => {
  it("keeps valid topics from an array and drops unknown ones", () => {
    expect(parseTopics([INFANCIA, "Otra cosa", COMUNIDAD])).toEqual([
      INFANCIA,
      COMUNIDAD,
    ]);
  });

  it("splits a semicolon or newline separated string and trims whitespace", () => {
    expect(parseTopics(`  ${INFANCIA} ; ${PROFESION}`)).toEqual([
      INFANCIA,
      PROFESION,
    ]);
    expect(parseTopics(`${COMUNIDAD}\n${INFANCIA}`)).toEqual([COMUNIDAD, INFANCIA]);
  });

  it("removes duplicates and ignores non-string input", () => {
    expect(parseTopics([INFANCIA, INFANCIA, 42, null])).toEqual([INFANCIA]);
    expect(parseTopics(undefined)).toEqual([]);
    expect(parseTopics({ topics: INFANCIA })).toEqual([]);
  });
});

describe("getSpeaker", () => {
  it("strips the Ponente prefix", () => {
    expect(getSpeaker("Ponente: Cristina H. Bolaños")).toBe(
      "Cristina H. Bolaños"
    );
  });

  it("strips the plural Ponentes prefix regardless of case", () => {
    expect(getSpeaker("PONENTES: Ana, Luis")).toBe("Ana, Luis");
  });

  it("returns null for empty or missing descriptions", () => {
    expect(getSpeaker(null)).toBeNull();
    expect(getSpeaker("Ponente:   ")).toBeNull();
  });

  it("returns a description without prefix unchanged", () => {
    expect(getSpeaker("Mesa redonda con invitados")).toBe(
      "Mesa redonda con invitados"
    );
  });
});

describe("normalizeForSearch", () => {
  it("lowercases and removes diacritics", () => {
    expect(normalizeForSearch("  Neurodesarrollo Ética ")).toBe(
      "neurodesarrollo etica"
    );
  });
});

describe("filterRecordings", () => {
  it("returns everything when no filters are set", () => {
    expect(filterRecordings(recordings, {})).toHaveLength(4);
    expect(filterRecordings(recordings, { topic: ALL_TOPICS_FILTER })).toHaveLength(4);
  });

  it("filters by topic, including recordings with several topics", () => {
    const result = filterRecordings(recordings, { topic: COMUNIDAD });
    expect(result.map((r) => r.id)).toEqual(["b", "c"]);
  });

  it("searches title and description ignoring accents and case", () => {
    expect(filterRecordings(recordings, { query: "CLINICA" }).map((r) => r.id)).toEqual(["b"]);
    expect(filterRecordings(recordings, { query: "michaca" }).map((r) => r.id)).toEqual(["b"]);
  });

  it("combines topic and query", () => {
    const result = filterRecordings(recordings, {
      topic: INFANCIA,
      query: "terapia",
    });
    expect(result).toHaveLength(0);
    expect(
      filterRecordings(recordings, { topic: INFANCIA, query: "neuro" })
    ).toHaveLength(2);
  });

  it("does not match on a null description", () => {
    expect(filterRecordings(recordings, { query: "null" })).toHaveLength(0);
  });
});

describe("countByTopic", () => {
  it("counts every topic plus the total under Todos", () => {
    const counts = countByTopic(recordings);
    expect(counts[ALL_TOPICS_FILTER]).toBe(4);
    expect(counts[INFANCIA]).toBe(2);
    expect(counts[COMUNIDAD]).toBe(2);
    expect(counts[PROFESION]).toBe(1);
    for (const topic of RECORDING_TOPICS) {
      expect(counts[topic]).toBeTypeOf("number");
    }
  });

  it("ignores topics that are not in the list", () => {
    const counts = countByTopic([
      { title: "x", description: null, topics: ["Inventado"] },
    ]);
    expect(counts[ALL_TOPICS_FILTER]).toBe(1);
    expect(counts.Inventado).toBeUndefined();
  });
});
