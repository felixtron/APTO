import Image from "next/image";
import Link from "next/link";
import { Shield, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CertificadoNoEncontrado() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:py-20">
      <div className="text-center">
        <Image
          src="/logo/logoAPTO.png"
          alt="APTO"
          width={160}
          height={64}
          className="mx-auto h-14 w-auto"
        />
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          Sistema de Verificación de Certificados
        </div>
      </div>

      <div className="mt-8 rounded-2xl border-2 border-red-200 bg-red-50 p-8 text-center">
        <XCircle className="mx-auto h-16 w-16 text-red-600" />
        <h1 className="mt-4 text-2xl font-bold text-red-600">
          Certificado No Encontrado
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          El folio ingresado no corresponde a ningún certificado registrado
          en nuestro sistema. Verifique que el código QR sea correcto.
        </p>
      </div>

      <div className="mt-6 text-center">
        <Button variant="outline" render={<Link href="/contacto" />}>
          Contactar a APTO
        </Button>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground/60">
        Asociación de Profesionales en Terapia Ocupacional A.C.
      </p>
    </div>
  );
}
