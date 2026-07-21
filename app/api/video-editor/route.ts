import { NextRequest, NextResponse } from "next/server";
import { getSheetRows, appendSheetRow, updateSheetRow } from "@/lib/sheets";
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

  const { id_proyek_editor, status, catatan } = await req.json();
  if (!id_proyek_editor) {
    return NextResponse.json({ error: "id_proyek_editor wajib diisi." }, { status: 400 });
  }

  // Kadiv SocMed (via akses_tambahan) boleh ubah proyek siapa saja.
  // Video editor cuma boleh ubah proyek yang di-assign ke dirinya sendiri.
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
  }

  const updates: Record<string, string> = {
    last_updated: new Date().toISOString(),
  };
  if (status !== undefined) updates.status = status;
  if (catatan !== undefined) updates.catatan = catatan;

  await updateSheetRow(SHEET_ID, "id_proyek_editor", id_proyek_editor, updates);
  return NextResponse.json({ success: true });
}
