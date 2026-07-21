import { NextRequest, NextResponse } from "next/server";
import { getSheetRows, appendSheetRow, updateSheetRow, deleteSheetRow } from "@/lib/sheets";
import { getUserProfile } from "@/lib/supabase/server";

const SHEET_ID = process.env.SHEET_ID_BUSINESS_OVERVIEW!;
const COLUMNS = ["id_bisnis", "nama_bisnis", "deskripsi_singkat", "bmc_link", "status"];

async function requireKadivBusiness() {
  const profile = await getUserProfile();
  if (!profile) return { profile: null, error: "Belum login." as const };
  if (profile.role !== "kadiv_business") {
    return { profile: null, error: "Tidak punya akses." as const };
  }
  return { profile, error: null };
}

export async function GET() {
  const rows = await getSheetRows(SHEET_ID);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { error } = await requireKadivBusiness();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const body = await req.json();
  const values = COLUMNS.map((col) => (col.startsWith("id") ? crypto.randomUUID() : body[col] ?? ""));
  await appendSheetRow(SHEET_ID, values);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireKadivBusiness();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { id_bisnis, ...updates } = await req.json();
  if (!id_bisnis) {
    return NextResponse.json({ error: "id_bisnis wajib diisi." }, { status: 400 });
  }

  await updateSheetRow(SHEET_ID, "id_bisnis", id_bisnis, updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireKadivBusiness();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { id_bisnis } = await req.json();
  if (!id_bisnis) {
    return NextResponse.json({ error: "id_bisnis wajib diisi." }, { status: 400 });
  }

  await deleteSheetRow(SHEET_ID, "id_bisnis", id_bisnis);
  return NextResponse.json({ success: true });
}
