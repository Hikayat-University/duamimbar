import { NextRequest, NextResponse } from "next/server";
import { getSheetRows, appendSheetRow, updateSheetRow, deleteSheetRow } from "@/lib/sheets";
import { getUserProfile } from "@/lib/supabase/server";

const SHEET_ID = process.env.SHEET_ID_FINANCE_BUDGET!;
const COLUMNS = ["id_budget", "id_proyek", "nama_item", "estimasi_biaya", "realisasi_biaya", "catatan"];

// Budget Planner sengaja bisa diedit dua role: kadiv_finance (pemilik dashboard)
// dan kadiv_business (akses lintas divisi, sesuai PRD Bagian 3).
async function requireBudgetAccess() {
  const profile = await getUserProfile();
  if (!profile) return { error: "Belum login." as const };

  const bolehEdit =
    profile.role === "kadiv_finance" ||
    (profile.role === "kadiv_business" &&
      (profile.akses_tambahan ?? []).includes("budget_planner_dashboard"));

  if (!bolehEdit) return { error: "Tidak punya akses." as const };
  return { error: null };
}

export async function GET() {
  const rows = await getSheetRows(SHEET_ID);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { error } = await requireBudgetAccess();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const body = await req.json();
  const values = COLUMNS.map((col) => (col.startsWith("id") ? crypto.randomUUID() : body[col] ?? ""));
  await appendSheetRow(SHEET_ID, values);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireBudgetAccess();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { id_budget, ...updates } = await req.json();
  if (!id_budget) {
    return NextResponse.json({ error: "id_budget wajib diisi." }, { status: 400 });
  }

  await updateSheetRow(SHEET_ID, "id_budget", id_budget, updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireBudgetAccess();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { id_budget } = await req.json();
  if (!id_budget) {
    return NextResponse.json({ error: "id_budget wajib diisi." }, { status: 400 });
  }

  await deleteSheetRow(SHEET_ID, "id_budget", id_budget);
  return NextResponse.json({ success: true });
}
