import { NextRequest, NextResponse } from "next/server";
import { getSheetRows, appendSheetRow, updateSheetRow, deleteSheetRow } from "@/lib/sheets";
import { getUserProfile } from "@/lib/supabase/server";

const SHEET_ID = process.env.SHEET_ID_SOCMED_KANAL!;
const COLUMNS = ["id_kanal", "nama_kanal", "platform", "link", "dibuat_pada"];

async function requireKadivSocmed() {
  const profile = await getUserProfile();
  if (!profile) return { error: "Belum login." as const };
  if (profile.role !== "kadiv_socmed") return { error: "Tidak punya akses." as const };
  return { error: null };
}

export async function GET() {
  const rows = await getSheetRows(SHEET_ID);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { error } = await requireKadivSocmed();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const body = await req.json();
  const values = COLUMNS.map((col) => {
    if (col.startsWith("id")) return crypto.randomUUID();
    if (col === "dibuat_pada") return new Date().toISOString().slice(0, 10);
    return body[col] ?? "";
  });
  await appendSheetRow(SHEET_ID, values);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireKadivSocmed();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { id_kanal, ...updates } = await req.json();
  if (!id_kanal) return NextResponse.json({ error: "id_kanal wajib diisi." }, { status: 400 });

  await updateSheetRow(SHEET_ID, "id_kanal", id_kanal, updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireKadivSocmed();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { id_kanal } = await req.json();
  if (!id_kanal) return NextResponse.json({ error: "id_kanal wajib diisi." }, { status: 400 });

  await deleteSheetRow(SHEET_ID, "id_kanal", id_kanal);
  return NextResponse.json({ success: true });
}
