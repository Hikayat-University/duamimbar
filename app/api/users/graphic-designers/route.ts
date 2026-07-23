import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();
  // RLS (policy "graphic_designer_visible_to_socmed") membatasi: hanya
  // kadiv_socmed yang bisa lihat baris graphic_designer.
  const { data, error } = await supabase
    .from("users")
    .select("id, nama")
    .eq("role", "graphic_designer")
    .order("nama");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
