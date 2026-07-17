import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** GET /api/admin/stl-url?path=<storage-path>
 *  Returns a signed URL for the STL file — admin only.
 */
export async function GET(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const path = request.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const service = createServiceClient();
  const { data, error } = await service.storage
    .from("stl-files")
    .createSignedUrl(path, 900); // 15 min

  if (error || !data?.signedUrl)
    return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 });

  return NextResponse.json({ url: data.signedUrl });
}
