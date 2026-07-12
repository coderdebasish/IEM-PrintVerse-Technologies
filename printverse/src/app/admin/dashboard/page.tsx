import { createClient } from "@/lib/supabase/server";
import { OrdersTable } from "./OrdersTable";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  const stats = {
    total: orders?.length ?? 0,
    pending: orders?.filter((o) =>
      ["Requested", "Contacted", "Quoted", "Payment Pending"].includes(o.status)
    ).length ?? 0,
    active: orders?.filter((o) =>
      ["Payment Received", "Paid", "Confirmed", "Printing", "Invoice Sent"].includes(o.status)
    ).length ?? 0,
    shipped: orders?.filter((o) => ["Shipped", "Completed"].includes(o.status)).length ?? 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#0B1F4D]">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">All orders in one place.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: stats.total, color: "#0B1F4D" },
          { label: "Pending Action", value: stats.pending, color: "#d97706" },
          { label: "In Progress", value: stats.active, color: "#0369a1" },
          { label: "Shipped / Done", value: stats.shipped, color: "#15803d" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-[#e2e8f0] p-5"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {label}
            </p>
            <p className="text-3xl font-black" style={{ color }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Orders table */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          Failed to load orders: {error.message}
        </div>
      ) : (
        <OrdersTable orders={orders ?? []} />
      )}
    </div>
  );
}
