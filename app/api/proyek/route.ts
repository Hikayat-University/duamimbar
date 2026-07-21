import { NextRequest, NextResponse } from "next/server";
import { getSheetRows, appendSheetRow, updateSheetRow, deleteSheetRow } from "@/lib/sheets";
import { getUserProfile } from "@/lib/supabase/server";
import { canEditHome } from "@/lib/permissions";

// Wajib: cegah Next.js nge-cache hasil GET, karena data Sheets/Supabase
// berubah terus-menerus dan harus selalu fresh tiap request.
export const dynamic = "force-dynamic";

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

export async function PATCH(req: NextRequest) {
  const profile = await getUserProfile();
  if (!profile || !canEditHome(profile.role)) {
    return NextResponse.json(
      { error: "Hanya Head Director yang bisa mengubah proyek." },
      { status: 403 }
    );
  }

  const { id_proyek, ...updates } = await req.json();
  if (!id_proyek) {
    return NextResponse.json({ error: "id_proyek wajib diisi." }, { status: 400 });
  }

  await updateSheetRow(SHEET_ID, "id_proyek", id_proyek, updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const profile = await getUserProfile();
  if (!profile || !canEditHome(profile.role)) {
    return NextResponse.json(
      { error: "Hanya Head Director yang bisa menghapus proyek." },
      { status: 403 }
    );
  }

  const { id_proyek } = await req.json();
  if (!id_proyek) {
    return NextResponse.json({ error: "id_proyek wajib diisi." }, { status: 400 });
  }

  await deleteSheetRow(SHEET_ID, "id_proyek", id_proyek);
  return NextResponse.json({ success: true });
}
