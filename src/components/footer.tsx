import Link from "next/link";
import Image from "next/image";
import { Facebook, Youtube, Mail, Phone, MapPin } from "lucide-react";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_HOURS,
  CONTACT_ADDRESS,
  SOCIAL_FACEBOOK,
  SOCIAL_YOUTUBE,
} from "@/lib/constants";

const exploreLinks = [
  { href: "/nosotros", label: "Nosotros" },
  { href: "/eventos", label: "Eventos" },
  { href: "/noticias", label: "Noticias" },
  { href: "/bolsa-trabajo", label: "Bolsa de Trabajo" },
  { href: "/universidades", label: "Universidades" },
  { href: "/membresia", label: "Membresía" },
];

const resourceLinks = [
  { href: "/recursos", label: "Recursos" },
  { href: "https://www.wfot.org", label: "WFOT", external: true },
  {
    href: "https://www.clatoorg.com",
    label: "CLATO",
    external: true,
  },
  { href: "https://otion.wfot.org", label: "OTION Blog", external: true },
];

export function Footer() {
  return (
    <footer className="border-t text-white" style={{ backgroundColor: "#0E2A42" }}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Logo & Social */}
          <div className="space-y-4">
            <Image
              src="/logo/Logomain.png"
              alt="APTO"
              width={160}
              height={55}
              className="h-12 w-auto"
            />
            <p className="text-sm text-white/60">
              Impulsando la Terapia Ocupacional en México desde 1993.
            </p>
            <div className="flex gap-3">
              <a
                href={SOCIAL_FACEBOOK}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href={SOCIAL_YOUTUBE}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Explorar */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/80">
              Explorar
            </h3>
            <ul className="space-y-2">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/80">
              Recursos
            </h3>
            <ul className="space-y-2">
              {resourceLinks.map((link) => (
                <li key={link.href}>
                  {"external" in link ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/80">
              Contacto
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-white/60">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="hover:text-white"
                >
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/60">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{CONTACT_PHONE}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/60">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{CONTACT_ADDRESS}</span>
              </li>
              <li className="text-sm text-white/60">
                Horario: {CONTACT_HOURS}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          <p>
            &copy; {new Date().getFullYear()} Asociación de Profesionales en
            Terapia Ocupacional A.C. Todos los derechos reservados.
          </p>
          <Link
            href="/privacidad"
            className="mt-1 inline-block hover:text-white/60"
          >
            Aviso de Privacidad
          </Link>
        </div>
      </div>
    </footer>
  );
}
