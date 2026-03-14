export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { CheckCircle, XCircle, AlertTriangle, Shield } from "lucide-react";

const statusConfig = {
  ACTIVE: {
    icon: CheckCircle,
    label: "Certificado Válido",
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    description: "Este certificado es auténtico y se encuentra vigente.",
  },
  EXPIRED: {
    icon: AlertTriangle,
    label: "Certificado Expirado",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    description: "Este certificado fue válido pero su periodo ha expirado.",
  },
  REVOKED: {
    icon: XCircle,
    label: "Certificado Revocado",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    description: "Este certificado ha sido revocado por la organización.",
  },
};

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatDate(date: Date): string {
  return `${date.getDate()} de ${MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`;
}

export default async function VerificarPage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;

  const certificate = await prisma.certificate.findUnique({
    where: { certificateId },
    include: {
      member: {
        select: { name: true, memberNumber: true, subscriptionEnd: true },
      },
    },
  });

  if (!certificate) {
    notFound();
  }

  const config = statusConfig[certificate.status];
  const StatusIcon = config.icon;

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:py-20">
      {/* Header */}
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

      {/* Status Card */}
      <div
        className={`mt-8 rounded-2xl border-2 ${config.border} ${config.bg} p-8 text-center`}
      >
        <StatusIcon className={`mx-auto h-16 w-16 ${config.color}`} />
        <h1 className={`mt-4 text-2xl font-bold ${config.color}`}>
          {config.label}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {config.description}
        </p>
      </div>

      {/* Certificate Details */}
      <div className="mt-6 rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Detalles del Certificado
        </h2>

        <dl className="space-y-3">
          <DetailRow
            label="Titular"
            value={certificate.member.name}
          />
          <DetailRow
            label="Tipo"
            value={
              certificate.type === "membership"
                ? "Constancia de Membresía"
                : certificate.type
            }
          />
          <DetailRow label="Año" value={certificate.year.toString()} />
          <DetailRow
            label="Fecha de emisión"
            value={formatDate(certificate.issuedAt)}
          />
          {certificate.expiresAt && (
            <DetailRow
              label="Válido hasta"
              value={formatDate(certificate.expiresAt)}
            />
          )}
          {certificate.member.subscriptionEnd && certificate.status === "ACTIVE" && (
            <DetailRow
              label="Membresía vigente hasta"
              value={formatDate(certificate.member.subscriptionEnd)}
            />
          )}
          {certificate.revokedAt && (
            <DetailRow
              label="Revocado el"
              value={formatDate(certificate.revokedAt)}
            />
          )}
          <DetailRow label="Folio" value={certificate.certificateId} />
          {certificate.member.memberNumber && (
            <DetailRow
              label="Número de socio"
              value={certificate.member.memberNumber}
            />
          )}
        </dl>

        {/* SHA-256 Hash */}
        {certificate.sha256Hash && (
          <div className="mt-6 border-t pt-4">
            <p className="text-xs font-medium text-muted-foreground">
              Hash SHA-256 del documento
            </p>
            <p className="mt-1 break-all font-mono text-xs text-muted-foreground/70">
              {certificate.sha256Hash}
            </p>
          </div>
        )}
      </div>

      {/* Verification timestamp */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Verificación realizada el{" "}
        {formatDate(new Date())} a las{" "}
        {new Date().toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Mexico_City",
        })}
        {" "}hrs (hora de la Ciudad de México)
      </p>

      {/* Disclaimer */}
      <p className="mt-4 text-center text-xs text-muted-foreground/60">
        Este certificado no sustituye la cédula profesional emitida por la SEP.
        <br />
        Asociación de Profesionales en Terapia Ocupacional A.C.
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-right">{value}</dd>
    </div>
  );
}
