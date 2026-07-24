import { NextRequest, NextResponse } from "next/server";
import { createClient, getUserProfile } from "@/lib/supabase/server";

// Wajib: cegah Next.js nge-cache hasil GET.
export const dynamic = "force-dynamic";

/**
 * PATCH /api/profile — self-service update untuk avatar_url & bio milik
 * sendiri. Sengaja HANYA 2 kolom ini yang boleh diubah lewat route ini
 * (role/divisi/akses_tambahan tetap cuma lewat Head Director via
 * /api/users/manage). RLS policy "users_update_own_profile" +
 * column-level GRANT UPDATE (avatar_url, bio) di database jadi lapis
 * pertahanan kedua kalau route ini ke-bypass.
 */
export async function PATCH(req: NextRequest) {
  const profile = await getUserProfile();
  if (!profile) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const body = await req.json();
  const updates: { avatar_url?: string; bio?: string } = {};

  if (typeof body.avatar_url === "string") updates.avatar_url = body.avatar_url.trim();
  if (typeof body.bio === "string") updates.bio = body.bio.trim().slice(0, 160);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Tidak ada field yang diubah." }, { status: 400 });
  }

  const supabase = createClient();
  const { error } = await supabase.from("users").update(updates).eq("id", profile.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, ...updates });
}
