/**
 * Generates a random 6-digit numeric tracking ID (100000–999999).
 * Simple enough to read over a phone call.
 * Non-sequential to prevent order enumeration.
 */
export function generateTrackingId(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Checks if a given tracking ID is unique in the orders table.
 * Returns true if it can be used (no collision), false if taken.
 */
export async function isTrackingIdUnique(
  supabase: ReturnType<typeof import("@supabase/supabase-js").createClient>,
  trackingId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .eq("tracking_id", trackingId)
    .maybeSingle();

  if (error) throw error;
  return data === null;
}

/**
 * Generates a unique 6-digit tracking ID with up to maxAttempts collision retries.
 * Throws if a unique ID cannot be found (extremely unlikely but safe).
 */
export async function generateUniqueTrackingId(
  supabase: ReturnType<typeof import("@supabase/supabase-js").createClient>,
  maxAttempts = 5
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const id = generateTrackingId();
    const unique = await isTrackingIdUnique(supabase, id);
    if (unique) return id;
  }
  throw new Error("Failed to generate unique tracking ID after multiple attempts.");
}
