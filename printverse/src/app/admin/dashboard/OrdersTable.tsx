"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge, OrderTypeBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils/helpers";
import { SecurityPinModal } from "@/components/admin/SecurityPinModal";
import { deleteOrder } from "@/app/admin/orders/[id]/actions";
import type { Order, OrderStatus } from "@/types";

const ALL_STATUSES: OrderStatus[] = [
  "Requested","Contacted","Quoted","Payment Pending","Payment Received",
  "Paid","Confirmed","Printing","Invoice Sent","Shipped","Completed","Cancelled",
];

export function OrdersTable({ orders: initialOrders }: { orders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<"" | "quote" | "purchase">("");

  // Delete modal state
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter((o) => {
      const matchSearch =
        !q ||
        o.tracking_id.includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        o.phone.includes(q);
      const matchStatus = !statusFilter || o.status === statusFilter;
      const matchType = !typeFilter || o.order_type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [orders, search, statusFilter, typeFilter]);

  const handleDeleteConfirm = async (pin: string) => {
    if (!orderToDelete) return { success: false, error: "No order selected." };

    const res = await deleteOrder(orderToDelete.id, pin);
    if (res.success) {
      setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
      toast.success(`Order #${orderToDelete.tracking_id} permanently deleted.`);
      return { success: true };
    }
    return res;
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden"
        style={{ boxShadow: "var(--shadow-card)" }}>
        {/* Filters bar */}
        <div className="p-4 border-b border-[#e2e8f0] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search by name, email, tracking ID, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="orders-search"
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#e2e8f0] text-sm text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-[#C41E2C]/30 focus:border-[#C41E2C] transition-colors"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "")}
              id="status-filter"
              className="px-3 py-2 rounded-xl border border-[#e2e8f0] text-sm text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-[#C41E2C]/30 bg-white"
            >
              <option value="">All Statuses</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "" | "quote" | "purchase")}
              id="type-filter"
              className="px-3 py-2 rounded-xl border border-[#e2e8f0] text-sm text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-[#C41E2C]/30 bg-white"
            >
              <option value="">All Types</option>
              <option value="quote">Quote</option>
              <option value="purchase">Purchase</option>
            </select>
          </div>
        </div>

        {/* Count */}
        <div className="px-4 py-2 bg-[#f8f9fb] border-b border-[#e2e8f0]">
          <p className="text-xs text-slate-500 font-medium">
            {filtered.length} order{filtered.length !== 1 ? "s" : ""}
            {(search || statusFilter || typeFilter) ? " (filtered)" : ""}
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f8f9fb]">
              <tr>
                {["Tracking ID","Type","Customer","Status","Date","Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-[#f8f9fb] transition-colors group">
                    <td className="px-4 py-3 font-black text-[#0B1F4D] text-base tracking-wider whitespace-nowrap">
                      {order.tracking_id}
                    </td>
                    <td className="px-4 py-3">
                      <OrderTypeBadge type={order.order_type} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#0B1F4D] truncate max-w-[160px]">
                        {order.customer_name}
                      </p>
                      <p className="text-xs text-slate-400 truncate max-w-[160px]">
                        {order.email}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          id={`order-link-${order.tracking_id}`}
                          className="flex items-center gap-1 text-[#C41E2C] text-xs font-semibold hover:underline whitespace-nowrap group-hover:gap-2 transition-all"
                        >
                          Manage <ChevronRight className="h-3 w-3" />
                        </Link>
                        <button
                          onClick={() => setOrderToDelete(order)}
                          id={`delete-order-${order.tracking_id}`}
                          title="Delete Order"
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete PIN modal */}
      <SecurityPinModal
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Order"
        itemIdentifier={`Order #${orderToDelete?.tracking_id} (${orderToDelete?.customer_name})`}
        description="This will permanently delete this order and all associated quotations/feedback from the database."
      />
    </>
  );
}
