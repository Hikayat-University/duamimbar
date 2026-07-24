import { NextRequest, NextResponse } from "next/server";
import { createClient, getUserProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Wajib: cegah Next.js nge-cache hasil GET, karena data Sheets/Supabase
// berubah terus-menerus dan harus selalu fresh tiap request.
export const dynamic = "force-dynamic";

async function requireHeadDirector() {
  const profile = await getUserProfile();
  if (!profile) return { error: "Belum login." as const };
  if (profile.role !== "head_director") return { error: "Tidak punya akses." as const };
  return { error: null };
}

export async function GET() {
  const { error } = await requireHeadDirector();
  if (error) return NextResponse.json({ error }, { status: 403 });

  // RLS policy "users_select_head_director" yang mengizinkan Head Director
  // melihat semua baris — pakai client biasa (session-aware), bukan admin.
  const supabase = createClient();
  const { data, error: dbError } = await supabase
    .from("users")
    .select("id, nama, email, role, divisi, akses_tambahan, avatar_url, created_at")
    .order("created_at", { ascending: false });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireHeadDirector();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });

  const supabase = createClient();
  const { error: dbError } = await supabase.from("users").update(updates).eq("id", id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireHeadDirector();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });

  // Hapus auth user sepenuhnya (bukan cuma baris profil) — butuh admin client
  // karena penghapusan akun login cuma bisa lewat service role. Baris di
  // public.users ikut terhapus otomatis (on delete cascade).
  const admin = createAdminClient();
  const { error: authError } = await admin.auth.admin.deleteUser(id);

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
