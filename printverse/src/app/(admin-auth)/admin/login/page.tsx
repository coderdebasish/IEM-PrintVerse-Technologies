import type { Metadata } from "next";
import { AdminLoginForm } from "./AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin Login — PrintVerse",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#0B1F4D] flex items-center justify-center px-4">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative w-full max-w-sm">
        {/* Logo area */}
        <div className="text-center mb-8">
          <p className="text-3xl font-black text-white">
            Print<span className="text-[#C41E2C]">Verse</span>
          </p>
          <p className="text-[#D4A017] text-sm font-semibold mt-1">
            Admin Panel
          </p>
        </div>
        <AdminLoginForm />
      </div>
    </div>
  );
}
