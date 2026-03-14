import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "APTO | Asociación de Profesionales en Terapia Ocupacional",
  description:
    "Asociación que representa a los Terapeutas Ocupacionales de México ante la WFOT y CLATO. Membresías, eventos, recursos y bolsa de trabajo para profesionales de TO.",
  keywords: [
    "terapia ocupacional",
    "APTO",
    "terapeutas ocupacionales México",
    "WFOT",
    "CLATO",
    "asociación profesional",
    "rehabilitación",
  ],
  openGraph: {
    title: "APTO | Asociación de Profesionales en Terapia Ocupacional",
    description:
      "Impulsamos la Terapia Ocupacional en México desde 1993. Membresías, eventos, recursos profesionales.",
    type: "website",
    url: "https://apto.org.mx",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
