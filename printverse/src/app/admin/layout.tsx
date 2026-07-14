import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

/**
 * Admin layout — wraps all /admin/* routes EXCEPT /admin/login
 * (which lives in the (admin-auth) route group with its own plain layout).
 * The proxy.ts middleware already blocks unauthenticated requests, but we
 * double-check here for defence-in-depth.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex">
      {/* Mobile top padding spacer */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0B1F4D] z-40" />
      <AdminSidebar userEmail={user.email ?? ""} />
      <main className="flex-1 min-w-0 overflow-auto pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
