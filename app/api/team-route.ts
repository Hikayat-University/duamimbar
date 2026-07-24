import { NextResponse } from "next/server";
import { createClient, getUserProfile } from "@/lib/supabase/server";

// Wajib: cegah Next.js nge-cache hasil GET.
export const dynamic = "force-dynamic";

/**
 * GET /api/team — daftar seluruh anggota tim buat section "Our Team" di
 * Home. Beda dari /api/users/manage (khusus Head Director, full data
 * termasuk field sensitif) — ini boleh diakses siapa saja yang login,
 * lewat view public.team_directory yang cuma expose kolom non-sensitif.
 */
export async function GET() {
  const profile = await getUserProfile();
  if (!profile) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("team_directory")
    .select("id, nama, email, role, divisi, avatar_url, bio, akses_tambahan, created_at")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
