"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-bold">Algo salió mal</h2>
      <p className="text-muted-foreground">
        Hubo un error al cargar esta página.
      </p>
      <Button onClick={reset}>Intentar de nuevo</Button>
    </div>
  );
}
