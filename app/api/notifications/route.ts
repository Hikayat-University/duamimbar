import { NextRequest, NextResponse } from "next/server";
import { createClient, getUserProfile } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await getUserProfile();
  if (!profile) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const supabase = createClient();
  // RLS "notifications_select_own" otomatis batasin ke notifikasi
  // milik user yang lagi login — nggak perlu filter manual di sini.
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, message, link, is_read, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  const profile = await getUserProfile();
  if (!profile) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const { id, markAll } = await req.json();
  const supabase = createClient();

  if (markAll) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("is_read", false);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (!id) return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });

  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
