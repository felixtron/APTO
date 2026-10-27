"use client";

import { useEffect, useState } from "react";
import { getCountdownParts, getEventOpensAt, type CountdownParts } from "@/lib/dia-mundial";

const TICK_MS = 1000;
const LABEL = "Las grabaciones se abren en";

const UNITS: ReadonlyArray<{ key: keyof Omit<CountdownParts, "done">; label: string }> = [
  { key: "days", label: "días" },
  { key: "hours", label: "horas" },
  { key: "minutes", label: "min" },
  { key: "seconds", label: "seg" },
];

/** Cuenta regresiva a la apertura. Durante el acceso libre el hero no la muestra. */
export function Countdown() {
  // null hasta montar: evita diferencias de hidratación entre servidor y cliente
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    const target = getEventOpensAt();
    const tick = () => setParts(getCountdownParts(new Date(), target));
    tick();
    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">{LABEL}</p>
      <div
        role="timer"
        aria-live="off"
        aria-label={parts ? `${parts.days} días, ${parts.hours} horas, ${parts.minutes} minutos` : LABEL}
        className="flex items-start justify-center gap-2 sm:gap-3"
      >
        {UNITS.map(({ key, label: unit }) => (
          <div
            key={key}
            className="flex w-16 flex-col items-center rounded-2xl bg-white/10 px-2 py-3 ring-1 ring-white/20 backdrop-blur-sm sm:w-20 sm:py-4"
          >
            <span className="text-3xl font-bold tabular-nums leading-none sm:text-4xl">
              {parts ? String(parts[key]).padStart(2, "0") : "--"}
            </span>
            <span className="mt-1.5 text-[11px] uppercase tracking-wide text-blue-100 sm:text-xs">
              {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
