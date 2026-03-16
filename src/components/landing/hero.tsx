"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(-45deg, #EBF5FB, #F0F7EE, #C6E2F3, #D4EACD, #EBF5FB)",
          backgroundSize: "400% 400%",
          animation: "aptoGradient 20s ease infinite",
        }}
      />

      {/* Floating geometric shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="geo geo-hex geo-lg" style={{ top: "8%", left: "3%" }} />
        <div className="geo geo-tri" style={{ top: "25%", left: "10%" }} />
        <div
          className="geo geo-circle geo-lg"
          style={{ top: "45%", left: "2%" }}
        />
        <div
          className="geo geo-diamond"
          style={{ top: "60%", left: "12%" }}
        />
        <div
          className="geo geo-square geo-lg"
          style={{ top: "78%", left: "6%" }}
        />
        <div className="geo geo-hex" style={{ top: "35%", left: "18%" }} />
        <div
          className="geo geo-tri geo-lg"
          style={{ top: "85%", left: "20%" }}
        />
        <div
          className="geo geo-circle"
          style={{ top: "15%", left: "22%" }}
        />
        <div
          className="geo geo-diamond"
          style={{ top: "5%", left: "35%" }}
        />
        <div className="geo geo-hex" style={{ top: "90%", left: "45%" }} />
        <div
          className="geo geo-circle"
          style={{ top: "88%", left: "55%" }}
        />
        <div
          className="geo geo-square"
          style={{ top: "3%", left: "60%" }}
        />
        <div
          className="geo geo-hex geo-lg"
          style={{ top: "10%", right: "5%" }}
        />
        <div
          className="geo geo-square"
          style={{ top: "28%", right: "12%" }}
        />
        <div
          className="geo geo-tri geo-lg"
          style={{ top: "50%", right: "3%" }}
        />
        <div
          className="geo geo-diamond geo-lg"
          style={{ top: "68%", right: "10%" }}
        />
        <div
          className="geo geo-circle"
          style={{ top: "80%", right: "18%" }}
        />
        <div className="geo geo-hex" style={{ top: "40%", right: "20%" }} />
        <div
          className="geo geo-square geo-lg"
          style={{ top: "18%", right: "25%" }}
        />
        <div className="geo geo-tri" style={{ top: "72%", right: "6%" }} />
      </div>

      <style>{`
        @keyframes aptoGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes geoFloat1 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(180deg); }
        }
        @keyframes geoFloat2 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(14px) rotate(-120deg); }
        }
        @keyframes geoFloat3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(10px, -12px) rotate(90deg); }
          66% { transform: translate(-8px, 8px) rotate(200deg); }
        }
        .geo {
          position: absolute;
          opacity: 0.15;
          border: 1.5px solid #2E6DA4;
        }
        .geo-lg { transform-origin: center; }
        .geo-hex {
          width: 48px; height: 48px;
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          animation: geoFloat1 14s ease-in-out infinite;
        }
        .geo-hex.geo-lg { width: 72px; height: 72px; opacity: 0.18; }
        .geo-tri {
          width: 38px; height: 38px;
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
          animation: geoFloat2 18s ease-in-out infinite;
        }
        .geo-tri.geo-lg { width: 58px; height: 58px; opacity: 0.16; }
        .geo-square {
          width: 34px; height: 34px;
          border-radius: 4px;
          animation: geoFloat3 16s ease-in-out infinite;
        }
        .geo-square.geo-lg { width: 52px; height: 52px; opacity: 0.16; }
        .geo-circle {
          width: 40px; height: 40px;
          border-radius: 50%;
          animation: geoFloat1 22s ease-in-out infinite reverse;
        }
        .geo-circle.geo-lg { width: 64px; height: 64px; opacity: 0.18; }
        .geo-diamond {
          width: 30px; height: 30px;
          clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
          animation: geoFloat2 20s ease-in-out infinite reverse;
        }
        .geo-diamond.geo-lg { width: 50px; height: 50px; opacity: 0.16; }
        .geo:nth-child(odd) { border-color: #2D7A3A; }
        .geo:nth-child(3n) { animation-delay: -4s; }
        .geo:nth-child(4n) { animation-delay: -8s; }
        .geo:nth-child(5n) { animation-delay: -12s; }
        .geo:nth-child(6n) { animation-delay: -2s; }
        .geo:nth-child(7n) { animation-delay: -6s; }
      `}</style>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Impulsamos la{" "}
            <span className="text-brand-500">Terapia Ocupacional</span> en
            M&eacute;xico
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Desde 1993 representamos a los profesionales de Terapia Ocupacional
            ante la WFOT. &Uacute;nete a la comunidad que fortalece tu
            profesi&oacute;n.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" render={<Link href="/membresia" />}>
              Hazte Miembro
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              render={<Link href="/nosotros" />}
            >
              Conoce m&aacute;s
            </Button>
          </div>
        </div>

        {/* WFOT Full Member Badge */}
        <div className="mt-16 flex items-center justify-center">
          <a
            href="https://wfot.org/member-organisations/mexico-asociacion-de-profesionales-en-terapia-ocupacional-ac"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:opacity-80"
          >
            <Image
              src="/logos/afiliaciones/wfot-full-member.png"
              alt="WFOT Full Member - Asociacion de Profesionales en Terapia Ocupacional AC"
              width={480}
              height={160}
              className="h-auto w-72 object-contain sm:w-96"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
