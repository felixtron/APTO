import { LogoCarousel } from "@/components/landing/logo-carousel";

const universityLogos = [
  { name: "UAEMEX", src: "/logos/universidades/uaemex.png" },
  { name: "Universidad Teletón", src: "/logos/universidades/teleton.png" },
  { name: "DIF Zapata Gaby Brimmer", src: "/logos/universidades/dif-zapata.png" },
  { name: "CREE DIF Puebla", src: "/logos/universidades/dif-puebla.png" },
  { name: "CREE DIF Toluca", src: "/logos/universidades/dif-toluca.png" },
  { name: "ITO", src: "/logos/universidades/ito.png" },
  { name: "CMUCH", src: "/logos/universidades/cmuch.png" },
  { name: "INR", src: "/logos/universidades/inr.png" },
  { name: "UABJO", src: "/logos/universidades/uabjo.png" },
];

export function Universities() {
  return (
    <LogoCarousel
      title="Universidades Avaladas"
      subtitle="Instituciones educativas reconocidas por APTO"
      logos={universityLogos}
    />
  );
}
