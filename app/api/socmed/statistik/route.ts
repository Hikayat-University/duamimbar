import { NextRequest, NextResponse } from "next/server";
import { getSheetRows, appendSheetRow, updateSheetRow, deleteSheetRow } from "@/lib/sheets";
import { getUserProfile } from "@/lib/supabase/server";

// Wajib: cegah Next.js nge-cache hasil GET, karena data Sheets/Supabase
// berubah terus-menerus dan harus selalu fresh tiap request.
export const dynamic = "force-dynamic";

const SHEET_ID = process.env.SHEET_ID_SOCMED_STATISTIK!;
const COLUMNS = [
  "id_statistik",
  "id_konten",
  "minggu_ke",
  "tanggal_input",
  "views",
  "likes",
  "reach",
  "engagement_rate",
];

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
    if (col === "tanggal_input") return body[col] || new Date().toISOString().slice(0, 10);
    return body[col] ?? "";
  });
  await appendSheetRow(SHEET_ID, values);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireKadivSocmed();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { id_statistik, ...updates } = await req.json();
  if (!id_statistik) {
    return NextResponse.json({ error: "id_statistik wajib diisi." }, { status: 400 });
  }

  await updateSheetRow(SHEET_ID, "id_statistik", id_statistik, updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireKadivSocmed();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { id_statistik } = await req.json();
  if (!id_statistik) {
    return NextResponse.json({ error: "id_statistik wajib diisi." }, { status: 400 });
  }

  await deleteSheetRow(SHEET_ID, "id_statistik", id_statistik);
  return NextResponse.json({ success: true });
}
