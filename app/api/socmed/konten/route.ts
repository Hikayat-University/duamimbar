import { NextRequest, NextResponse } from "next/server";
import { getSheetRows, appendSheetRow, updateSheetRow, deleteSheetRow } from "@/lib/sheets";
import { getUserProfile } from "@/lib/supabase/server";

// Wajib: cegah Next.js nge-cache hasil GET, karena data Sheets/Supabase
// berubah terus-menerus dan harus selalu fresh tiap request.
export const dynamic = "force-dynamic";

const SHEET_ID = process.env.SHEET_ID_SOCMED_KONTEN!;
const EDITOR_SHEET_ID = process.env.SHEET_ID_VIDEO_EDITOR_PROYEK!;
const WRITER_SHEET_ID = process.env.SHEET_ID_SOCMED_PROYEK_WRITER!;

const COLUMNS = [
  "id_konten",
  "id_kanal",
  "judul_konten",
  "status",
  "assigned_editor",
  "tanggal_publish",
  "cta",
  "referensi_desain",
  "gaya_copywriting",
  "assigned_script_writer",
  "assigned_graphic_designer",
];

async function requireKadivSocmed() {
  const profile = await getUserProfile();
  if (!profile) return { error: "Belum login." as const };
  if (profile.role !== "kadiv_socmed") return { error: "Tidak punya akses." as const };
  return { error: null };
}

/**
 * Sinkronkan assignment ke sheet Proyek Editor, supaya video editor langsung
 * lihat tugasnya tanpa Kadiv SocMed harus assign dua kali di tempat berbeda.
 * Urutan kolom: id_proyek_editor, id_konten, nama_editor, status, brief,
 * link_video_mentah, catatan, last_updated.
 */
async function syncEditorAssignment(idKonten: string, namaEditor: string) {
  if (!namaEditor) return;
  try {
    await updateSheetRow(EDITOR_SHEET_ID, "id_konten", idKonten, {
      nama_editor: namaEditor,
      last_updated: new Date().toISOString(),
    });
  } catch {
    await appendSheetRow(EDITOR_SHEET_ID, [
      crypto.randomUUID(),
      idKonten,
      namaEditor,
      "Draf",
      "",
      "",
      "",
      new Date().toISOString(),
    ]);
  }
}

/**
 * Sinkronkan assignment ke sheet Proyek Script Writer.
 * Urutan kolom: id_proyek_writer, id_konten, nama_writer, status,
 * naskah_caption, jadwal_posting, catatan, last_updated.
 */
async function syncWriterAssignment(idKonten: string, namaWriter: string) {
  if (!namaWriter) return;
  try {
    await updateSheetRow(WRITER_SHEET_ID, "id_konten", idKonten, {
      nama_writer: namaWriter,
      last_updated: new Date().toISOString(),
    });
  } catch {
    await appendSheetRow(WRITER_SHEET_ID, [
      crypto.randomUUID(),
      idKonten,
      namaWriter,
      "Menulis",
      "",
      "",
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

  if (body.assigned_editor) await syncEditorAssignment(idKonten, body.assigned_editor);
  if (body.assigned_script_writer) await syncWriterAssignment(idKonten, body.assigned_script_writer);

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireKadivSocmed();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { id_konten, ...updates } = await req.json();
  if (!id_konten) return NextResponse.json({ error: "id_konten wajib diisi." }, { status: 400 });

  await updateSheetRow(SHEET_ID, "id_konten", id_konten, updates);

  if (updates.assigned_editor) await syncEditorAssignment(id_konten, updates.assigned_editor);
  if (updates.assigned_script_writer) {
    await syncWriterAssignment(id_konten, updates.assigned_script_writer);
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
