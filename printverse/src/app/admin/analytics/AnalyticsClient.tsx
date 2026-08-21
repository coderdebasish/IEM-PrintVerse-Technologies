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
  FilePlus,
} from "lucide-react";
import type { Order, Quotation, OfflineInvoice } from "@/types";

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
  return (o.order_type === "quote" ? o.quoted_price : o.total_amount) ?? 0;
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
  offlineDocs,
}: {
  orders: Order[];
  quotations: Quotation[];
  offlineDocs: OfflineInvoice[];
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

  const customCutoffFrom = useMemo(() => (customFrom ? new Date(customFrom) : null), [customFrom]);
  const customCutoffTo = useMemo(() => (customTo ? new Date(customTo + "T23:59:59") : null), [customTo]);

  function inRange(isoDate: string): boolean {
    const d = new Date(isoDate);
    if (range === "custom") {
      if (customCutoffFrom && d < customCutoffFrom) return false;
      if (customCutoffTo && d > customCutoffTo) return false;
      return true;
    }
    return !cutoff || d >= cutoff;
  }

  const filteredOrders = useMemo(() => orders.filter((o) => inRange(o.created_at)), [orders, cutoff, range, customCutoffFrom, customCutoffTo]);
  const filteredOffline = useMemo(() => offlineDocs.filter((d) => inRange(d.created_at)), [offlineDocs, cutoff, range, customCutoffFrom, customCutoffTo]);

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

    // Offline invoices are confirmed revenue — all included
    const offlineRevenue = filteredOffline.reduce((s, d) => s + d.total, 0);
    const offlineInvoiceRevenue = filteredOffline.filter(d => d.doc_type === "invoice").reduce((s, d) => s + d.total, 0);

    const totalRevenue = filteredOrders.reduce((s, o) => s + getOrderRevenue(o), 0) + offlineRevenue;
    const totalConfirmedRevenue = paidRevenue + offlineInvoiceRevenue;
    const avgOrder = (paid.length + filteredOffline.filter(d => d.doc_type === "invoice").length) > 0
      ? totalConfirmedRevenue / (paid.length + filteredOffline.filter(d => d.doc_type === "invoice").length)
      : 0;

    // Invoiced counts (online quotations table + offline_invoices)
    const onlineInvoiceCount = quotations.filter((q) => q.doc_type === "invoice").length;
    const onlineQuotationCount = quotations.filter((q) => q.doc_type === "quotation").length;
    const offlineInvoiceCount = filteredOffline.filter((d) => d.doc_type === "invoice").length;
    const offlineQuotationCount = filteredOffline.filter((d) => d.doc_type === "quotation").length;

    return {
      totalRevenue,
      paidRevenue: totalConfirmedRevenue,
      pendingRevenue,
      offlineRevenue,
      avgOrder,
      totalOrders: filteredOrders.length + filteredOffline.length,
      paidOrders: paid.length,
      pendingOrders: pending.length,
      cancelledOrders: cancelled.length,
      quoteOrders: filteredOrders.filter((o) => o.order_type === "quote").length,
      purchaseOrders: filteredOrders.filter((o) => o.order_type === "purchase").length,
      offlineCount: filteredOffline.length,
      invoiceCount: onlineInvoiceCount + offlineInvoiceCount,
      quotationCount: onlineQuotationCount + offlineQuotationCount,
    };
  }, [filteredOrders, filteredOffline, quotations]);

  // ── Monthly revenue bar chart ──────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const map: Record<string, { revenue: number; orders: number }> = {};

    // Online orders
    filteredOrders.forEach((o) => {
      const key = isoToMonthKey(o.created_at);
      if (!map[key]) map[key] = { revenue: 0, orders: 0 };
      map[key].revenue += getOrderRevenue(o);
      map[key].orders += 1;
    });

    // Offline docs
    filteredOffline.forEach((d) => {
      const key = isoToMonthKey(d.created_at);
      if (!map[key]) map[key] = { revenue: 0, orders: 0 };
      map[key].revenue += d.total;
      map[key].orders += 1;
    });

    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12);
  }, [filteredOrders, filteredOffline]);

  const maxRevenue = useMemo(
    () => Math.max(...monthlyData.map(([, v]) => v.revenue), 1),
    [monthlyData]
  );

  // ── Status distribution (online orders only) ───────────────────────────────
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
        ? Math.round((filteredOrders.filter((o) => g.statuses.includes(o.status)).length / filteredOrders.length) * 100)
        : 0,
    }));
  }, [filteredOrders]);

  // ── Top customers (online + offline combined) ──────────────────────────────
  const topCustomers = useMemo(() => {
    const map: Record<string, { name: string; revenue: number; orders: number }> = {};

    filteredOrders.forEach((o) => {
      if (!map[o.email]) map[o.email] = { name: o.customer_name, revenue: 0, orders: 0 };
      map[o.email].revenue += getOrderRevenue(o);
      map[o.email].orders += 1;
    });

    filteredOffline.forEach((d) => {
      const key = d.customer_email || d.customer_name; // use name as fallback if no email
      if (!map[key]) map[key] = { name: d.customer_name, revenue: 0, orders: 0 };
      map[key].revenue += d.total;
      map[key].orders += 1;
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filteredOrders, filteredOffline]);

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
          <p className="text-slate-500 text-sm mt-0.5">Revenue, invoices &amp; order trends — online + offline</p>
        </div>

        {/* Date range controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-wrap">
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
            <div className="flex items-center gap-2">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-xs text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20" />
              <span className="text-slate-400 text-xs">to</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-xs text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20" />
            </div>
          )}
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: formatINR(kpis.totalRevenue), sub: `${kpis.totalOrders} total orders`, icon: IndianRupee, color: "#0B1F4D", bg: "#0B1F4D" },
          { label: "Confirmed Revenue", value: formatINR(kpis.paidRevenue), sub: `${kpis.paidOrders} online + ${kpis.offlineCount} offline`, icon: CheckCircle2, color: "#15803d", bg: "#15803d" },
          { label: "Pending Revenue", value: formatINR(kpis.pendingRevenue), sub: `${kpis.pendingOrders} awaiting payment`, icon: Clock, color: "#d97706", bg: "#d97706" },
          { label: "Avg Order Value", value: formatINR(kpis.avgOrder), sub: "per confirmed order", icon: TrendingUp, color: "#7C3AED", bg: "#7C3AED" },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#e2e8f0] p-5 flex flex-col gap-3" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
              <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: `${bg}15` }}>
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
            <p className="text-xs text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Secondary stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Invoices Raised", value: kpis.invoiceCount, icon: FileText, color: "#0369a1", sub: "online + offline" },
          { label: "Quotations Sent", value: kpis.quotationCount, icon: FileText, color: "#7C3AED", sub: "online + offline" },
          { label: "Offline Docs", value: kpis.offlineCount, icon: FilePlus, color: "#0B1F4D", sub: "walk-in customers" },
          { label: "Cancelled Orders", value: kpis.cancelledOrders, icon: XCircle, color: "#dc2626", sub: "online only" },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-[#e2e8f0] p-4 flex items-center gap-3" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <div>
              <p className="text-lg font-black" style={{ color }}>{value}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-tight">{label}</p>
              <p className="text-[9px] text-slate-300">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Revenue chart + Status breakdown ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Monthly Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#0B1F4D]" />
              <h2 className="text-sm font-black text-[#0B1F4D] uppercase tracking-wider">Monthly Revenue</h2>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#0B1F4D] inline-block" />Online</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#D4A017] inline-block" />Offline</span>
            </div>
          </div>
          {monthlyData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data in this period</div>
          ) : (
            <div className="flex items-end gap-2 h-48 overflow-x-auto pb-2">
              {monthlyData.map(([key, val]) => {
                const heightPct = (val.revenue / maxRevenue) * 100;
                return (
                  <div key={key} className="flex flex-col items-center gap-1 flex-1 min-w-[44px] group relative">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0B1F4D] text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap pointer-events-none z-10 text-center">
                      {formatINR(val.revenue)}<br />{val.orders} doc{val.orders !== 1 ? "s" : ""}
                    </div>
                    <div className="w-full relative flex items-end" style={{ height: "160px" }}>
                      <div
                        className="w-full rounded-t-xl bg-[#0B1F4D] group-hover:bg-[#D4A017] transition-colors"
                        style={{ height: `${Math.max(heightPct, 2)}%` }}
                      />
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 text-center whitespace-nowrap">{monthLabel(key)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="text-sm font-black text-[#0B1F4D] uppercase tracking-wider mb-1">Order Status</h2>
          <p className="text-[10px] text-slate-400 mb-5">Online orders only</p>
          <div className="space-y-4">
            {statusDist.map(({ label, count, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-600">{label}</span>
                  <span className="text-xs font-black" style={{ color }}>{count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            ))}
            {filteredOrders.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-4">No orders in this period</p>
            )}
          </div>

          {/* Offline doc summary */}
          {filteredOffline.length > 0 && (
            <div className="mt-6 pt-5 border-t border-[#e2e8f0]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Offline Docs</p>
              {[
                { label: "Invoices", value: filteredOffline.filter(d => d.doc_type === "invoice").length, color: "#15803d" },
                { label: "Quotations", value: filteredOffline.filter(d => d.doc_type === "quotation").length, color: "#7C3AED" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between text-xs py-1">
                  <span className="text-slate-500 font-semibold">{label}</span>
                  <span className="font-black" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Top Customers ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center gap-2">
          <Users className="h-4 w-4 text-[#0B1F4D]" />
          <h2 className="text-sm font-black text-[#0B1F4D] uppercase tracking-wider">Top Customers by Revenue</h2>
          <span className="ml-auto text-[10px] text-slate-400 font-semibold">Online + Offline</span>
        </div>
        {topCustomers.length === 0 ? (
          <div className="px-6 py-10 text-center text-slate-400 text-sm">No data in this period</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f8f9fb]">
                <tr>
                  {["#", "Customer", "Documents", "Total Revenue"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {topCustomers.map((c, i) => (
                  <tr key={c.name + i} className="hover:bg-[#f8f9fb] transition-colors">
                    <td className="px-5 py-3">
                      <span className={["h-6 w-6 rounded-full flex items-center justify-center text-xs font-black",
                        i === 0 ? "bg-[#D4A017] text-[#0B1F4D]" :
                        i === 1 ? "bg-slate-300 text-slate-700" :
                        i === 2 ? "bg-amber-700/20 text-amber-800" :
                        "bg-[#f1f5f9] text-slate-500",
                      ].join(" ")}>{i + 1}</span>
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
