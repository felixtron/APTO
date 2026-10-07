import { NextResponse } from "next/server";
import { z } from "zod";

export const emailSchema = z
  .string({ error: "Email inválido" })
  .trim()
  .toLowerCase()
  .max(254, "Email inválido")
  .pipe(z.email({ error: "Email inválido" }));

/** Optional free-text field: trims, caps length, maps "" to null. */
export function optionalText(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength)
    .nullish()
    .transform((value) => value || null);
}

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

/** Parses and validates a JSON request body, returning a ready 400 on failure. */
export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<ParseResult<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Solicitud inválida" }, { status: 400 }),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Datos inválidos";
    return {
      ok: false,
      response: NextResponse.json({ error: message }, { status: 400 }),
    };
  }
  return { ok: true, data: result.data };
}
