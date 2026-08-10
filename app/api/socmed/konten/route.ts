import { NextRequest, NextResponse } from "next/server";
import { getSheetRows, appendSheetRow, updateSheetRow, deleteSheetRow } from "@/lib/sheets";
import { getUserProfile } from "@/lib/supabase/server";
import { notifyUserByName } from "@/lib/notifications";

// Wajib: cegah Next.js nge-cache hasil GET, karena data Sheets/Supabase
// berubah terus-menerus dan harus selalu fresh tiap request.
export const dynamic = "force-dynamic";

const SHEET_ID = process.env.SHEET_ID_SOCMED_KONTEN!;
const EDITOR_SHEET_ID = process.env.SHEET_ID_VIDEO_EDITOR_PROYEK!;
const WRITER_SHEET_ID = process.env.SHEET_ID_SOCMED_PROYEK_WRITER!;
const DESIGNER_SHEET_ID = process.env.SHEET_ID_SOCMED_PROYEK_DESIGNER!;

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
  "ditugaskan_oleh",
  "brief_editor",
  "brief_desain",
];

async function requireKadivSocmed() {
  const profile = await getUserProfile();
  if (!profile) return { profile: null, error: "Belum login." as const };
  if (profile.role !== "kadiv_socmed") {
    return { profile: null, error: "Tidak punya akses." as const };
  }
  return { profile, error: null };
}

/**
 * Khusus buat PATCH: selain Kadiv SocMed (full akses), Script Writer juga
 * boleh lewat — TAPI cuma kalau field yang diubah cuma "status" doang. Ini
 * dipakai tombol "Tandai Sudah Diposting" di dashboard Admin, bukan buat
 * edit konten secara umum (itu tetap khusus Kadiv SocMed).
 */
async function requireCanPatchKonten(updateKeys: string[]) {
  const profile = await getUserProfile();
  if (!profile) return { profile: null, error: "Belum login." as const };
  if (profile.role === "kadiv_socmed") return { profile, error: null };
  const isStatusOnlyUpdate = updateKeys.length === 1 && updateKeys[0] === "status";
  if (profile.role === "script_writer" && isStatusOnlyUpdate) {
    return { profile, error: null };
  }
  return { profile: null, error: "Tidak punya akses." as const };
}

/**
 * Sinkronkan assignment ke sheet Proyek Editor, supaya video editor langsung
 * lihat tugasnya tanpa Kadiv SocMed harus assign dua kali di tempat berbeda.
 * Urutan kolom: id_proyek_editor, id_konten, nama_editor, status, brief,
 * link_video_mentah, catatan, last_updated.
 */
async function syncEditorAssignment(
  idKonten: string,
  namaEditor: string,
  judulKonten?: string,
  briefEditor?: string
) {
  if (!namaEditor) return;
  try {
    await updateSheetRow(EDITOR_SHEET_ID, "id_konten", idKonten, {
      nama_editor: namaEditor,
      last_updated: new Date().toISOString(),
      // Cuma nimpa brief kalau Kadiv beneran ngetik sesuatu di form Konten
      // — kalau kosong, JANGAN sentuh, biar nggak ngerusak brief yang udah
      // diedit manual lewat "Edit Brief & Link" di dashboard Video Editor.
      ...(briefEditor ? { brief: briefEditor } : {}),
    });
  } catch {
    await appendSheetRow(EDITOR_SHEET_ID, [
      crypto.randomUUID(),
      idKonten,
      namaEditor,
      "Draf",
      briefEditor ?? "",
      "",
      "",
      new Date().toISOString(),
    ]);
  }

  notifyUserByName(namaEditor, {
    title: "Proyek video baru buat kamu",
    message: `Kamu di-assign edit video untuk konten "${judulKonten ?? "-"}".`,
    link: "/my-project?tab=video_editor",
  });
}

/**
 * Sinkronkan assignment ke sheet Proyek Graphic Designer LANGSUNG dari form
 * Konten -- ini beda dari mekanisme lama (auto-assign pas Script Writer
 * nandain status Review), yang tetap jalan sebagai pelengkap. Sekarang
 * Kadiv bisa langsung assign+brief Designer dari awal tanpa nunggu Script
 * Writer sama sekali, cocok buat konten yang emang nggak butuh naskah.
 */
async function syncDesignerAssignment(
  idKonten: string,
  namaDesigner: string,
  judulKonten?: string,
  briefDesain?: string
) {
  if (!namaDesigner) return;
  try {
    await updateSheetRow(DESIGNER_SHEET_ID, "id_konten", idKonten, {
      nama_designer: namaDesigner,
      last_updated: new Date().toISOString(),
      ...(briefDesain ? { brief_desain: briefDesain } : {}),
    });
  } catch {
    await appendSheetRow(DESIGNER_SHEET_ID, [
      crypto.randomUUID(),
      idKonten,
      namaDesigner,
      "Belum Dikerjakan",
      briefDesain ?? "",
      "",
      "",
      new Date().toISOString(),
    ]);
  }

  notifyUserByName(namaDesigner, {
    title: "Proyek desain baru buat kamu",
    message: `Kamu di-assign desain untuk konten "${judulKonten ?? "-"}".`,
    link: "/my-project?tab=proyek_graphic_designer",
  });
}

/**
 * Sinkronkan assignment ke sheet Proyek Script Writer.
 * Urutan kolom: id_proyek_writer, id_konten, nama_writer, status,
 * naskah_caption, jadwal_posting, catatan, last_updated.
 */
async function syncWriterAssignment(idKonten: string, namaWriter: string, judulKonten?: string) {
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

  notifyUserByName(namaWriter, {
    title: "Proyek naskah baru buat kamu",
    message: `Kamu di-assign nulis naskah & caption untuk konten "${judulKonten ?? "-"}".`,
    link: "/my-project?tab=proyek_script_writer",
  });
}

export async function GET() {
  const rows = await getSheetRows(SHEET_ID);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { profile, error } = await requireKadivSocmed();
  if (error || !profile) return NextResponse.json({ error }, { status: 403 });

  const body = await req.json();
  const idKonten = crypto.randomUUID();
  const values = COLUMNS.map((col) => {
    if (col === "id_konten") return idKonten;
    if (col === "ditugaskan_oleh") return profile.nama;
    return body[col] ?? "";
  });
  await appendSheetRow(SHEET_ID, values);

  if (body.assigned_editor) {
    await syncEditorAssignment(idKonten, body.assigned_editor, body.judul_konten, body.brief_editor);
  }
  if (body.assigned_script_writer) {
    await syncWriterAssignment(idKonten, body.assigned_script_writer, body.judul_konten);
  }
  if (body.assigned_graphic_designer) {
    await syncDesignerAssignment(idKonten, body.assigned_graphic_designer, body.judul_konten, body.brief_desain);
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const { id_konten, ...updates } = await req.json();
  if (!id_konten) return NextResponse.json({ error: "id_konten wajib diisi." }, { status: 400 });

  const { profile, error } = await requireCanPatchKonten(Object.keys(updates));
  if (error || !profile) return NextResponse.json({ error }, { status: 403 });

  await updateSheetRow(SHEET_ID, "id_konten", id_konten, {
    ...updates,
    // "ditugaskan_oleh" nyimpen siapa Kadiv yang assign — jangan ketimpa
    // pas ini cuma Script Writer nandain status "Sudah" diposting.
    ...(profile.role === "kadiv_socmed" ? { ditugaskan_oleh: profile.nama } : {}),
  });

  if (updates.assigned_editor) {
    await syncEditorAssignment(id_konten, updates.assigned_editor, updates.judul_konten, updates.brief_editor);
  }
  if (updates.assigned_script_writer) {
    await syncWriterAssignment(id_konten, updates.assigned_script_writer, updates.judul_konten);
  }
  if (updates.assigned_graphic_designer) {
    await syncDesignerAssignment(
      id_konten,
      updates.assigned_graphic_designer,
      updates.judul_konten,
      updates.brief_desain
    );
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
