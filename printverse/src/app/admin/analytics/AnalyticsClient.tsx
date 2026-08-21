"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp,
  IndianRupee,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  Users,
  BarChart3,
} from "lucide-react";
import type { Order, Quotation } from "@/types";

// ── helpers ───────────────────────────────────────────────────────────────────

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function getOrderRevenue(o: Order): number {
  if (o.status === "Cancelled") return 0;
  return (
    (o.order_type === "quote" ? o.quoted_price : o.total_amount) ?? 0
  );
}

function isoToMonthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(parseInt(y), parseInt(m) - 1).toLocaleString("en-IN", {
    month: "short",
    year: "2-digit",
  });
}

type DateRange = "7d" | "30d" | "90d" | "1y" | "all" | "custom";

// ── component ─────────────────────────────────────────────────────────────────

export function AnalyticsClient({
  orders,
  quotations,
}: {
  orders: Order[];
  quotations: Quotation[];
}) {
  const [range, setRange] = useState<DateRange>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // ── filter cutoff ──────────────────────────────────────────────────────────
  const cutoff = useMemo<Date | null>(() => {
    const now = new Date();
    if (range === "7d") return new Date(now.setDate(now.getDate() - 7));
    if (range === "30d") return new Date(now.setDate(now.getDate() - 30));
    if (range === "90d") return new Date(now.setDate(now.getDate() - 90));
    if (range === "1y") return new Date(now.setFullYear(now.getFullYear() - 1));
    return null;
  }, [range]);

  const customCutoffFrom = useMemo(
    () => (customFrom ? new Date(customFrom) : null),
    [customFrom]
  );
  const customCutoffTo = useMemo(
    () => (customTo ? new Date(customTo + "T23:59:59") : null),
    [customTo]
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const d = new Date(o.created_at);
      if (range === "custom") {
        if (customCutoffFrom && d < customCutoffFrom) return false;
        if (customCutoffTo && d > customCutoffTo) return false;
        return true;
      }
      return !cutoff || d >= cutoff;
    });
  }, [orders, cutoff, range, customCutoffFrom, customCutoffTo]);

  // ── KPI calculations ───────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const paid = filteredOrders.filter((o) =>
      ["Payment Received", "Paid", "Confirmed", "Printing", "Invoice Sent", "Shipped", "Completed"].includes(o.status)
    );
    const pending = filteredOrders.filter((o) =>
      ["Requested", "Contacted", "Quoted", "Payment Pending"].includes(o.status)
    );
    const cancelled = filteredOrders.filter((o) => o.status === "Cancelled");

    const paidRevenue = paid.reduce((s, o) => s + getOrderRevenue(o), 0);
    const pendingRevenue = pending.reduce((s, o) => s + getOrderRevenue(o), 0);
    const totalRevenue = filteredOrders.reduce((s, o) => s + getOrderRevenue(o), 0);
    const avgOrder = paid.length > 0 ? paidRevenue / paid.length : 0;

    // Invoiced (from quotations table — doc_type === "invoice")
    const invoicedTotal = quotations
      .filter((q) => q.doc_type === "invoice")
      .reduce((s, q) => s + q.total, 0);

    return {
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      avgOrder,
      invoicedTotal,
      totalOrders: filteredOrders.length,
      paidOrders: paid.length,
      pendingOrders: pending.length,
      cancelledOrders: cancelled.length,
      quoteOrders: filteredOrders.filter((o) => o.order_type === "quote").length,
      purchaseOrders: filteredOrders.filter((o) => o.order_type === "purchase").length,
    };
  }, [filteredOrders, quotations]);

  // ── Monthly revenue bar chart data (last 6 months window) ─────────────────
  const monthlyData = useMemo(() => {
    const map: Record<string, { revenue: number; orders: number }> = {};
    filteredOrders.forEach((o) => {
      const key = isoToMonthKey(o.created_at);
      if (!map[key]) map[key] = { revenue: 0, orders: 0 };
      map[key].revenue += getOrderRevenue(o);
      map[key].orders += 1;
    });
    const sorted = Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12); // max last 12 months
    return sorted;
  }, [filteredOrders]);

  const maxRevenue = useMemo(
    () => Math.max(...monthlyData.map(([, v]) => v.revenue), 1),
    [monthlyData]
  );

  // ── Status distribution ────────────────────────────────────────────────────
  const statusDist = useMemo(() => {
    const STATUS_GROUPS = [
      { label: "Pending Action", statuses: ["Requested", "Contacted", "Quoted", "Payment Pending"], color: "#d97706" },
      { label: "In Progress", statuses: ["Payment Received", "Paid", "Confirmed", "Printing", "Invoice Sent"], color: "#0369a1" },
      { label: "Shipped / Done", statuses: ["Shipped", "Completed"], color: "#15803d" },
      { label: "Cancelled", statuses: ["Cancelled"], color: "#dc2626" },
    ];
    return STATUS_GROUPS.map((g) => ({
      ...g,
      count: filteredOrders.filter((o) => g.statuses.includes(o.status)).length,
      pct: filteredOrders.length
        ? Math.round(
            (filteredOrders.filter((o) => g.statuses.includes(o.status)).length /
              filteredOrders.length) *
              100
          )
        : 0,
    }));
  }, [filteredOrders]);

  // ── Top customers ──────────────────────────────────────────────────────────
  const topCustomers = useMemo(() => {
    const map: Record<string, { name: string; revenue: number; orders: number }> = {};
    filteredOrders.forEach((o) => {
      if (!map[o.email]) map[o.email] = { name: o.customer_name, revenue: 0, orders: 0 };
      map[o.email].revenue += getOrderRevenue(o);
      map[o.email].orders += 1;
    });
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const rangeOptions: { value: DateRange; label: string }[] = [
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
    { value: "90d", label: "Last 90 Days" },
    { value: "1y", label: "Last 12 Months" },
    { value: "all", label: "All Time" },
    { value: "custom", label: "Custom Range" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1F4D]">Business Analytics</h1>
          <p className="text-slate-500 text-sm mt-0.5">Revenue, invoices &amp; order trends</p>
        </div>

        {/* Date range controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 flex-wrap">
            {rangeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={[
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  range === opt.value
                    ? "bg-[#0B1F4D] text-white shadow-sm"
                    : "bg-white border border-[#e2e8f0] text-slate-500 hover:border-[#0B1F4D]/30 hover:text-[#0B1F4D]",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {range === "custom" && (
            <div className="flex items-center gap-2 mt-1 sm:mt-0">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-xs text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-xs text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: formatINR(kpis.totalRevenue),
            sub: `${kpis.totalOrders} orders`,
            icon: IndianRupee,
            color: "#0B1F4D",
            bg: "#0B1F4D",
          },
          {
            label: "Confirmed Revenue",
            value: formatINR(kpis.paidRevenue),
            sub: `${kpis.paidOrders} paid orders`,
            icon: CheckCircle2,
            color: "#15803d",
            bg: "#15803d",
          },
          {
            label: "Pending Revenue",
            value: formatINR(kpis.pendingRevenue),
            sub: `${kpis.pendingOrders} awaiting payment`,
            icon: Clock,
            color: "#d97706",
            bg: "#d97706",
          },
          {
            label: "Avg Order Value",
            value: formatINR(kpis.avgOrder),
            sub: "per confirmed order",
            icon: TrendingUp,
            color: "#7C3AED",
            bg: "#7C3AED",
          },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-[#e2e8f0] p-5 flex flex-col gap-3"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center"
                style={{ background: `${bg}15` }}
              >
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
            <p className="text-xs text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Secondary stats row ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Invoices Raised", value: quotations.filter(q => q.doc_type === "invoice").length, icon: FileText, color: "#0369a1" },
          { label: "Quotations Sent", value: quotations.filter(q => q.doc_type === "quotation").length, icon: FileText, color: "#7C3AED" },
          { label: "Quote Orders", value: kpis.quoteOrders, icon: Package, color: "#0B1F4D" },
          { label: "Cancelled", value: kpis.cancelledOrders, icon: XCircle, color: "#dc2626" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-[#e2e8f0] p-4 flex items-center gap-3"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <div>
              <p className="text-lg font-black" style={{ color }}>{value}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Revenue chart + Status dist ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Monthly Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-4 w-4 text-[#0B1F4D]" />
            <h2 className="text-sm font-black text-[#0B1F4D] uppercase tracking-wider">Monthly Revenue</h2>
          </div>
          {monthlyData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              No data in this period
            </div>
          ) : (
            <div className="flex items-end gap-2 h-48 overflow-x-auto pb-2">
              {monthlyData.map(([key, val]) => {
                const heightPct = (val.revenue / maxRevenue) * 100;
                return (
                  <div key={key} className="flex flex-col items-center gap-1 flex-1 min-w-[44px] group">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -translate-y-8 bg-[#0B1F4D] text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap pointer-events-none z-10">
                      {formatINR(val.revenue)}
                      <br />{val.orders} order{val.orders !== 1 ? "s" : ""}
                    </div>
                    {/* Bar */}
                    <div className="w-full relative flex items-end" style={{ height: "160px" }}>
                      <div
                        className="w-full rounded-t-xl bg-[#0B1F4D] group-hover:bg-[#D4A017] transition-colors"
                        style={{ height: `${Math.max(heightPct, 2)}%` }}
                      />
                    </div>
                    {/* Label */}
                    <p className="text-[9px] font-bold text-slate-400 text-center whitespace-nowrap">
                      {monthLabel(key)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="text-sm font-black text-[#0B1F4D] uppercase tracking-wider mb-6">Order Status</h2>
          <div className="space-y-4">
            {statusDist.map(({ label, count, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-600">{label}</span>
                  <span className="text-xs font-black" style={{ color }}>{count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            ))}
            {filteredOrders.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-4">No orders in this period</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Top Customers ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center gap-2">
          <Users className="h-4 w-4 text-[#0B1F4D]" />
          <h2 className="text-sm font-black text-[#0B1F4D] uppercase tracking-wider">Top Customers by Revenue</h2>
        </div>
        {topCustomers.length === 0 ? (
          <div className="px-6 py-10 text-center text-slate-400 text-sm">No data in this period</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f8f9fb]">
                <tr>
                  {["#", "Customer", "Orders", "Total Revenue"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {topCustomers.map((c, i) => (
                  <tr key={c.name} className="hover:bg-[#f8f9fb] transition-colors">
                    <td className="px-5 py-3">
                      <span className={[
                        "h-6 w-6 rounded-full flex items-center justify-center text-xs font-black",
                        i === 0 ? "bg-[#D4A017] text-[#0B1F4D]" :
                        i === 1 ? "bg-slate-300 text-slate-700" :
                        i === 2 ? "bg-amber-700/20 text-amber-800" :
                        "bg-[#f1f5f9] text-slate-500",
                      ].join(" ")}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-[#0B1F4D]">{c.name}</td>
                    <td className="px-5 py-3 text-slate-500">{c.orders}</td>
                    <td className="px-5 py-3 font-black text-[#0B1F4D]">{formatINR(c.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
