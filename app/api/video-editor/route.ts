import { NextRequest, NextResponse } from "next/server";
import { getSheetRows, appendSheetRow, updateSheetRow, deleteSheetRow } from "@/lib/sheets";
import { getUserProfile } from "@/lib/supabase/server";

// Wajib: cegah Next.js nge-cache hasil GET, karena data Sheets/Supabase
// berubah terus-menerus dan harus selalu fresh tiap request.
export const dynamic = "force-dynamic";

const SHEET_ID = process.env.SHEET_ID_VIDEO_EDITOR_PROYEK!;
const COLUMNS = [
  "id_proyek_editor",
  "id_konten",
  "nama_editor",
  "status",
  "brief",
  "link_video_mentah",
  "catatan",
  "last_updated",
];

export async function GET() {
  const rows = await getSheetRows(SHEET_ID);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const values = COLUMNS.map((col) =>
    col.startsWith("id") ? crypto.randomUUID() : body[col] ?? ""
  );
  await appendSheetRow(SHEET_ID, values);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const profile = await getUserProfile();
  if (!profile) {
    return NextResponse.json({ error: "Belum login." }, { status: 401 });
  }

  const { id_proyek_editor, status, catatan, brief, link_video_mentah } = await req.json();
  if (!id_proyek_editor) {
    return NextResponse.json({ error: "id_proyek_editor wajib diisi." }, { status: 400 });
  }

  // Kadiv SocMed (via akses_tambahan) boleh ubah proyek siapa saja, termasuk
  // brief & link video. Video editor cuma boleh ubah status/catatan miliknya
  // sendiri — brief & link video-nya read-only buat editor.
  const bolehEditSemua =
    profile.role === "kadiv_socmed" &&
    (profile.akses_tambahan ?? []).includes("video_editor_dashboard");

  if (!bolehEditSemua && profile.role !== "video_editor") {
    return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });
  }

  if (!bolehEditSemua) {
    // Video editor: pastikan baris ini memang miliknya sebelum diizinkan update
    const rows = await getSheetRows(SHEET_ID);
    const row = rows.find((r: any) => r.id_proyek_editor === id_proyek_editor);
    if (!row || row.nama_editor !== profile.nama) {
      return NextResponse.json(
        { error: "Kamu tidak bisa mengubah proyek editor lain." },
        { status: 403 }
      );
    }
    if (brief !== undefined || link_video_mentah !== undefined) {
      return NextResponse.json(
        { error: "Brief & link video cuma bisa diubah oleh Kadiv SocMed." },
        { status: 403 }
      );
    }
  }

  const updates: Record<string, string> = {
    last_updated: new Date().toISOString(),
  };
  if (status !== undefined) updates.status = status;
  if (catatan !== undefined) updates.catatan = catatan;
  if (brief !== undefined) updates.brief = brief;
  if (link_video_mentah !== undefined) updates.link_video_mentah = link_video_mentah;

  await updateSheetRow(SHEET_ID, "id_proyek_editor", id_proyek_editor, updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const profile = await getUserProfile();
  if (!profile) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const { id_proyek_editor } = await req.json();
  if (!id_proyek_editor) {
    return NextResponse.json({ error: "id_proyek_editor wajib diisi." }, { status: 400 });
  }

  const bolehHapusSemua =
    profile.role === "kadiv_socmed" &&
    (profile.akses_tambahan ?? []).includes("video_editor_dashboard");

  if (!bolehHapusSemua) {
    if (profile.role !== "video_editor") {
      return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });
    }
    const rows = await getSheetRows(SHEET_ID);
    const row = rows.find((r: any) => r.id_proyek_editor === id_proyek_editor);
    if (!row || row.nama_editor !== profile.nama) {
      return NextResponse.json(
        { error: "Kamu cuma bisa menghapus proyekmu sendiri." },
        { status: 403 }
      );
    }
  }

  await deleteSheetRow(SHEET_ID, "id_proyek_editor", id_proyek_editor);
  return NextResponse.json({ success: true });
}
