import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();
  // RLS (policy "script_writer_visible_to_socmed") membatasi: hanya
  // kadiv_socmed yang bisa lihat baris script_writer.
  const { data, error } = await supabase
    .from("users")
    .select("id, nama")
    .eq("role", "script_writer")
    .order("nama");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
