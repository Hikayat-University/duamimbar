import { NextRequest, NextResponse } from "next/server";
import { getSheetRows, appendSheetRow, updateSheetRow, deleteSheetRow } from "@/lib/sheets";
import { getUserProfile } from "@/lib/supabase/server";

// Wajib: cegah Next.js nge-cache hasil GET, karena data Sheets/Supabase
// berubah terus-menerus dan harus selalu fresh tiap request.
export const dynamic = "force-dynamic";

const SHEET_ID = process.env.SHEET_ID_SOCMED_KONTEN!;
const EDITOR_SHEET_ID = process.env.SHEET_ID_VIDEO_EDITOR_PROYEK!;
const COLUMNS = ["id_konten", "id_kanal", "judul_konten", "status", "assigned_editor", "tanggal_publish"];

async function requireKadivSocmed() {
  const profile = await getUserProfile();
  if (!profile) return { error: "Belum login." as const };
  if (profile.role !== "kadiv_socmed") return { error: "Tidak punya akses." as const };
  return { error: null };
}

/**
 * Sinkronkan assignment ke sheet Proyek Editor, supaya video editor langsung
 * lihat tugasnya tanpa Kadiv SocMed harus assign dua kali di tempat berbeda.
 */
async function syncAssignment(idKonten: string, namaEditor: string) {
  if (!namaEditor) return;
  try {
    await updateSheetRow(EDITOR_SHEET_ID, "id_konten", idKonten, {
      nama_editor: namaEditor,
      last_updated: new Date().toISOString(),
    });
  } catch {
    // Belum ada baris untuk konten ini di Proyek Editor -> buat baru
    await appendSheetRow(EDITOR_SHEET_ID, [
      crypto.randomUUID(),
      idKonten,
      namaEditor,
      "Draf",
      "",
      new Date().toISOString(),
    ]);
  }
}

export async function GET() {
  const rows = await getSheetRows(SHEET_ID);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { error } = await requireKadivSocmed();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const body = await req.json();
  const idKonten = crypto.randomUUID();
  const values = COLUMNS.map((col) => {
    if (col === "id_konten") return idKonten;
    return body[col] ?? "";
  });
  await appendSheetRow(SHEET_ID, values);

  if (body.assigned_editor) {
    await syncAssignment(idKonten, body.assigned_editor);
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireKadivSocmed();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { id_konten, ...updates } = await req.json();
  if (!id_konten) return NextResponse.json({ error: "id_konten wajib diisi." }, { status: 400 });

  await updateSheetRow(SHEET_ID, "id_konten", id_konten, updates);

  if (updates.assigned_editor) {
    await syncAssignment(id_konten, updates.assigned_editor);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireKadivSocmed();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { id_konten } = await req.json();
  if (!id_konten) return NextResponse.json({ error: "id_konten wajib diisi." }, { status: 400 });

  await deleteSheetRow(SHEET_ID, "id_konten", id_konten);
  return NextResponse.json({ success: true });
}
