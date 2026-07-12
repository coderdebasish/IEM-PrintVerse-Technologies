import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("settings").select("*");

  const deliveryRate = parseFloat(
    settings?.find((s) => s.key === "delivery_flat_rate")?.value ?? "80"
  );

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-black text-[#0B1F4D]">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Configure platform defaults.</p>
      </div>
      <SettingsClient deliveryRate={deliveryRate} />
    </div>
  );
}
