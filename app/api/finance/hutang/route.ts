import { NextRequest, NextResponse } from "next/server";
import { getSheetRows, appendSheetRow, updateSheetRow, deleteSheetRow } from "@/lib/sheets";
import { getUserProfile } from "@/lib/supabase/server";

// Wajib: cegah Next.js nge-cache hasil GET, karena data Sheets/Supabase
// berubah terus-menerus dan harus selalu fresh tiap request.
export const dynamic = "force-dynamic";

const SHEET_ID = process.env.SHEET_ID_FINANCE_HUTANG!;
const COLUMNS = ["id_catatan", "tipe", "pihak_terkait", "nominal", "jatuh_tempo", "status", "catatan"];

async function requireKadivFinance() {
  const profile = await getUserProfile();
  if (!profile) return { error: "Belum login." as const };
  if (profile.role !== "kadiv_finance") return { error: "Tidak punya akses." as const };
  return { error: null };
}

export async function GET() {
  const rows = await getSheetRows(SHEET_ID);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { error } = await requireKadivFinance();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const body = await req.json();
  const values = COLUMNS.map((col) => {
    if (col.startsWith("id")) return crypto.randomUUID();
    if (col === "status") return body[col] ?? "Belum";
    return body[col] ?? "";
  });
  await appendSheetRow(SHEET_ID, values);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireKadivFinance();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { id_catatan, ...updates } = await req.json();
  if (!id_catatan) {
    return NextResponse.json({ error: "id_catatan wajib diisi." }, { status: 400 });
  }

  await updateSheetRow(SHEET_ID, "id_catatan", id_catatan, updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireKadivFinance();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { id_catatan } = await req.json();
  if (!id_catatan) {
    return NextResponse.json({ error: "id_catatan wajib diisi." }, { status: 400 });
  }

  await deleteSheetRow(SHEET_ID, "id_catatan", id_catatan);
  return NextResponse.json({ success: true });
}
