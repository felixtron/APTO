"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Users } from "lucide-react";

type DirectoryMember = {
  id: string;
  name: string;
  institution: string | null;
  specialty: string | null;
  phone: string | null;
};

export function DirectorySearch({ members }: { members: DirectoryMember[] }) {
  const [search, setSearch] = useState("");

  const filtered = members.filter((member) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      (member.institution?.toLowerCase().includes(query) ?? false) ||
      (member.specialty?.toLowerCase().includes(query) ?? false)
    );
  });

  return (
    <>
      <div className="mb-6">
        <Input
          placeholder="Buscar por nombre, institución o especialidad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-16">
          <Users className="h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-sm text-muted-foreground">
            {search
              ? "No se encontraron miembros con ese criterio"
              : "No hay miembros activos en el directorio"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member) => (
            <div key={member.id} className="rounded-xl border bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50">
                  <Users className="h-5 w-5 text-brand-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{member.name}</h3>
                </div>
              </div>
              {member.institution && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {member.institution}
                </p>
              )}
              {member.specialty && (
                <p className="mt-1 text-xs text-brand-500">
                  {member.specialty}
                </p>
              )}
              {member.phone && (
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {member.phone}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
