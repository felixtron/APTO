import { describe, expect, it } from "vitest";
import { buildPaymentReminderEmail, greetingName } from "@/lib/payment-reminder-email";

const content = {
  name: "ANA LUISA PÉREZ SOTO",
  memberNumber: "LTO0045",
  passwordSetupUrl: "https://apto.org.mx/auth/reset-password?token=abc",
  unsubscribeUrl: "https://apto.org.mx/baja?token=xyz",
};

describe("greetingName", () => {
  it("title-cases the first name whatever the roster casing", () => {
    expect(greetingName("ROSA ISELA CRUZ")).toBe("Rosa");
    expect(greetingName("  maría  del pilar")).toBe("María");
  });
});

describe("buildPaymentReminderEmail", () => {
  it("greets by first name and mentions the member number", () => {
    const email = buildPaymentReminderEmail(content);

    expect(email.subject).toBe("Ana, con tu apoyo APTO sigue creciendo");
    expect(email.text).toContain("Hola Ana,");
    expect(email.text).toContain("LTO0045");
  });

  it("links to the portal, the password setup and the unsubscribe page", () => {
    const email = buildPaymentReminderEmail(content);

    expect(email.html).toContain("https://apto.org.mx/miembros");
    expect(email.html).toContain(content.passwordSetupUrl);
    expect(email.html).toContain(content.unsubscribeUrl);
    expect(email.text).toContain(content.unsubscribeUrl);
  });

  it("escapes names before putting them in the HTML", () => {
    const email = buildPaymentReminderEmail({ ...content, name: "<script>x</script>" });

    expect(email.html).not.toContain("<script>");
  });

  it("leaves out the number line when the member has none", () => {
    const email = buildPaymentReminderEmail({ ...content, memberNumber: null });

    expect(email.text).not.toContain("número de socio");
  });

  it("stays an invitation: no deadlines or warnings", () => {
    const text = buildPaymentReminderEmail(content).text.toLowerCase();

    for (const word of ["último aviso", "suspend", "vence", "urgente", "deuda", "adeudo"]) {
      expect(text).not.toContain(word);
    }
  });

  it("sends members who already have a password to the self-service reset", () => {
    const email = buildPaymentReminderEmail({ ...content, passwordSetupUrl: null });

    expect(email.html).not.toContain("reset-password?token");
    expect(email.html).toContain("/auth/forgot-password");
    expect(email.text).toContain("¿No recuerdas tu contraseña?");
  });
});
