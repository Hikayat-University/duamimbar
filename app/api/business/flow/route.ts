import { NextRequest, NextResponse } from "next/server";
import { getSheetRows, appendSheetRow, updateSheetRow, deleteSheetRow } from "@/lib/sheets";
import { getUserProfile } from "@/lib/supabase/server";

// Wajib: cegah Next.js nge-cache hasil GET, karena data Sheets/Supabase
// berubah terus-menerus dan harus selalu fresh tiap request.
export const dynamic = "force-dynamic";

const SHEET_ID = process.env.SHEET_ID_BUSINESS_FLOW!;
const COLUMNS = [
  "id_flow",
  "id_bisnis",
  "tanggal",
  "tipe",
  "nominal",
  "keterangan",
  "status_setor_ke_finance",
  "catatan_finance",
];

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
  const values = COLUMNS.map((col) => {
    if (col.startsWith("id")) return crypto.randomUUID();
    if (col === "status_setor_ke_finance") return body[col] ?? "Belum";
    return body[col] ?? "";
  });
  await appendSheetRow(SHEET_ID, values);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireKadivBusiness();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { id_flow, ...updates } = await req.json();
  if (!id_flow) {
    return NextResponse.json({ error: "id_flow wajib diisi." }, { status: 400 });
  }

  await updateSheetRow(SHEET_ID, "id_flow", id_flow, updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireKadivBusiness();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { id_flow } = await req.json();
  if (!id_flow) {
    return NextResponse.json({ error: "id_flow wajib diisi." }, { status: 400 });
  }

  await deleteSheetRow(SHEET_ID, "id_flow", id_flow);
  return NextResponse.json({ success: true });
}
