import { NextRequest, NextResponse } from "next/server";
import { getSheetRows, appendSheetRow } from "@/lib/sheets";
import { getUserProfile } from "@/lib/supabase/server";
import { canEditHome } from "@/lib/permissions";

const SHEET_ID = process.env.SHEET_ID_PROYEK_PERUSAHAAN!;

export async function GET() {
  const rows = await getSheetRows(SHEET_ID);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const profile = await getUserProfile();
  if (!profile || !canEditHome(profile.role)) {
    return NextResponse.json(
      { error: "Hanya Head Director yang bisa menambah proyek." },
      { status: 403 }
    );
  }

  const body = await req.json();
  await appendSheetRow(SHEET_ID, [
    crypto.randomUUID(),
    body.nama_proyek,
    body.deskripsi,
    body.divisi_terlibat,
    body.status ?? "Berjalan",
    body.tanggal_mulai,
    body.tanggal_selesai,
    profile.nama,
  ]);

  return NextResponse.json({ success: true });
}
