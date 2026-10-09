import type { Metadata } from "next";
import { UnsubscribeButton } from "./unsubscribe-button";

export const metadata: Metadata = {
  title: "Dejar de recibir recordatorios — APTO",
  robots: { index: false },
};

export default async function BajaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <section className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">
        Recordatorios de membresía
      </h1>
      {token ? (
        <>
          <p className="mb-8 text-gray-600">
            Si prefieres no recibir más recordatorios mensuales de membresía,
            confírmalo aquí. Seguirás recibiendo los correos de tu cuenta, como
            el de restablecer contraseña.
          </p>
          <UnsubscribeButton token={token} />
        </>
      ) : (
        <p className="text-gray-600">
          El enlace no es válido. Usa el enlace que viene en el correo.
        </p>
      )}
    </section>
  );
}
