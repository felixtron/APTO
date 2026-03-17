import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { StripeModeToggle } from "@/components/admin/stripe-mode-toggle";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuth = await isAdminAuthenticated();

  if (!isAuth) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <AdminSidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        {/* Mobile nav */}
        <AdminMobileNav />

        {/* Desktop top bar with Stripe toggle */}
        <div className="hidden lg:flex items-center justify-end border-b bg-white px-6 py-2">
          <StripeModeToggle />
        </div>

        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
