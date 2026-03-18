"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton({ variant = "sidebar" }: { variant?: "sidebar" | "mobile" }) {
  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  if (variant === "mobile") {
    return (
      <button
        onClick={handleLogout}
        className="text-sm text-muted-foreground"
      >
        Salir
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <LogOut className="h-4 w-4" />
      Cerrar sesión
    </button>
  );
}
