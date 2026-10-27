import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { OPEN_ACCESS_COPY, openAccessSubtitle } from "@/lib/dia-mundial";
import { ParallaxHero } from "./_components/parallax-hero";
import { RegistrationSection } from "./_components/registration-section";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

function html(node: ReactElement) {
  return renderToStaticMarkup(node);
}

describe("open unregistered page copy", () => {
  it("tells an unregistered visitor that the library is already open", () => {
    const hero = html(
      createElement(ParallaxHero, { status: "open", registered: false, recordingCount: 65 })
    );
    const form = html(createElement(RegistrationSection, { status: "open", registered: false }));

    expect(hero).toContain(OPEN_ACCESS_COPY.heroBadge);
    expect(hero).toContain(openAccessSubtitle(65));
    expect(hero).toContain(OPEN_ACCESS_COPY.heroCta);
    expect(hero).toContain('href="#registro"');
    expect(hero).toContain("El acceso libre termina en");
    expect(hero).not.toContain("Registro gratuito");

    expect(form).toContain(OPEN_ACCESS_COPY.registrationTitle);
    expect(form).toContain(OPEN_ACCESS_COPY.registrationBody);
    expect(form).toContain(OPEN_ACCESS_COPY.registrationSubmit);
    expect(form).not.toContain("Registro gratuito");
    expect(form).not.toContain("del 27 al 31 de octubre");
    expect(form).not.toContain("Registrarme gratis");
  });

  it("keeps the pre-open registration copy", () => {
    const hero = html(
      createElement(ParallaxHero, { status: "upcoming", registered: false, recordingCount: 65 })
    );
    const form = html(
      createElement(RegistrationSection, { status: "upcoming", registered: false })
    );

    expect(hero).toContain("Registro gratuito");
    expect(hero).toContain("Las grabaciones se abren en");
    expect(hero).not.toContain(OPEN_ACCESS_COPY.heroBadge);
    expect(form).toContain("Registro gratuito");
    expect(form).toContain("Registrarme gratis");
    expect(form).toContain("del 27 al 31 de octubre");
    expect(form).not.toContain(OPEN_ACCESS_COPY.registrationTitle);
  });

  it("keeps the registered and closed hero copy", () => {
    const registered = html(
      createElement(ParallaxHero, { status: "open", registered: true, recordingCount: 65 })
    );
    const closed = html(
      createElement(ParallaxHero, { status: "closed", registered: false, recordingCount: 0 })
    );

    expect(registered).toContain("Ya estás registrado");
    expect(registered).not.toContain(OPEN_ACCESS_COPY.heroBadge);
    expect(closed).toContain("Gracias por participar");
    expect(closed).not.toContain("El acceso libre termina en");
    expect(closed).not.toContain(OPEN_ACCESS_COPY.heroBadge);
  });
});
