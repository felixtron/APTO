import { describe, expect, it } from "vitest";
import { z } from "zod";
import { emailSchema, parseJsonBody } from "@/lib/validation";

describe("emailSchema", () => {
  it("trims and lowercases before validating", () => {
    expect(emailSchema.parse("  Ana@Example.COM ")).toBe("ana@example.com");
  });

  it("rejects malformed addresses", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });
});

describe("parseJsonBody", () => {
  const schema = z.object({ name: z.string().min(1, "Nombre requerido") });

  it("returns typed data for a valid body", async () => {
    const request = new Request("http://x", {
      method: "POST",
      body: JSON.stringify({ name: "Ana" }),
    });

    const result = await parseJsonBody(request, schema);

    expect(result).toEqual({ ok: true, data: { name: "Ana" } });
  });

  it("returns a 400 with the first issue message", async () => {
    const request = new Request("http://x", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
    });

    const result = await parseJsonBody(request, schema);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({ error: "Nombre requerido" });
  });

  it("returns a 400 for invalid JSON", async () => {
    const request = new Request("http://x", { method: "POST", body: "{not json" });

    const result = await parseJsonBody(request, schema);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(400);
  });
});
