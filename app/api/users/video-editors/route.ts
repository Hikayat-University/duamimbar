import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Wajib: cegah Next.js nge-cache hasil GET, karena data Sheets/Supabase
// berubah terus-menerus dan harus selalu fresh tiap request.
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();
  // RLS (policy "video_editor_visible_to_socmed") yang membatasi:
  // hanya user dengan role kadiv_socmed yang bisa lihat baris video_editor.
  // Untuk role lain, query ini otomatis balik kosong, bukan error.
  const { data, error } = await supabase
    .from("users")
    .select("id, nama")
    .eq("role", "video_editor")
    .order("nama");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
