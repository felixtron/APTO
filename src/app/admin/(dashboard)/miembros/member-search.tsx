"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const statusOptions = [
  { value: "", label: "Todos" },
  { value: "ACTIVE", label: "Activos" },
  { value: "PENDING", label: "Pendientes" },
  { value: "EXPIRED", label: "Expirados" },
  { value: "CANCELLED", label: "Cancelados" },
];

export function MemberSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("buscar") || "");
  const currentStatus = searchParams.get("estado") || "";

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set("buscar", search);
      } else {
        params.delete("buscar");
      }
      params.delete("pagina");
      router.push(`/admin/miembros?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, router, searchParams]);

  function handleStatusFilter(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set("estado", status);
    } else {
      params.delete("estado");
    }
    params.delete("pagina");
    router.push(`/admin/miembros?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-2">
        {statusOptions.map((opt) => (
          <Button
            key={opt.value}
            variant={currentStatus === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusFilter(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
      <Input
        placeholder="Buscar por nombre, email o numero..."
        className="w-full sm:w-72"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );
}
