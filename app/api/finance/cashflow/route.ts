import { NextRequest, NextResponse } from "next/server";
import { getSheetRows, appendSheetRow, updateSheetRow, deleteSheetRow } from "@/lib/sheets";
import { getUserProfile } from "@/lib/supabase/server";

const SHEET_ID = process.env.SHEET_ID_FINANCE_CASHFLOW!;
const COLUMNS = ["id_transaksi", "tanggal", "tipe", "kategori", "nominal", "keterangan", "input_oleh"];

async function requireKadivFinance() {
  const profile = await getUserProfile();
  if (!profile) return { profile: null, error: "Belum login." as const };
  if (profile.role !== "kadiv_finance") {
    return { profile: null, error: "Tidak punya akses." as const };
  }
  return { profile, error: null };
}

export async function GET() {
  const rows = await getSheetRows(SHEET_ID);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { profile, error } = await requireKadivFinance();
  if (error || !profile) return NextResponse.json({ error }, { status: 403 });

  const body = await req.json();
  const values = COLUMNS.map((col) => {
    if (col.startsWith("id")) return crypto.randomUUID();
    if (col === "input_oleh") return profile.nama;
    return body[col] ?? "";
  });
  await appendSheetRow(SHEET_ID, values);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireKadivFinance();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { id_transaksi, ...updates } = await req.json();
  if (!id_transaksi) {
    return NextResponse.json({ error: "id_transaksi wajib diisi." }, { status: 400 });
  }

  await updateSheetRow(SHEET_ID, "id_transaksi", id_transaksi, updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireKadivFinance();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { id_transaksi } = await req.json();
  if (!id_transaksi) {
    return NextResponse.json({ error: "id_transaksi wajib diisi." }, { status: 400 });
  }

  await deleteSheetRow(SHEET_ID, "id_transaksi", id_transaksi);
  return NextResponse.json({ success: true });
}
