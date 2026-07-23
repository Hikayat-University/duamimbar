import { NextRequest, NextResponse } from "next/server";
import { getSheetRows, appendSheetRow, updateSheetRow, deleteSheetRow } from "@/lib/sheets";
import { getUserProfile } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SHEET_ID = process.env.SHEET_ID_SOCMED_PROYEK_WRITER!;
const COLUMNS = [
  "id_proyek_writer",
  "id_konten",
  "nama_writer",
  "status",
  "naskah_caption",
  "jadwal_posting",
  "catatan",
  "last_updated",
];

export async function GET() {
  const rows = await getSheetRows(SHEET_ID);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const profile = await getUserProfile();
  if (!profile) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const bolehEditSemua =
    profile.role === "kadiv_socmed" &&
    (profile.akses_tambahan ?? []).includes("script_writer_dashboard");
  if (!bolehEditSemua) {
    return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });
  }

  const body = await req.json();
  const values = COLUMNS.map((col) => {
    if (col.startsWith("id")) return crypto.randomUUID();
    if (col === "status") return body[col] || "Menulis";
    if (col === "last_updated") return new Date().toISOString();
    return body[col] ?? "";
  });
  await appendSheetRow(SHEET_ID, values);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const profile = await getUserProfile();
  if (!profile) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const { id_proyek_writer, ...updates } = await req.json();
  if (!id_proyek_writer) {
    return NextResponse.json({ error: "id_proyek_writer wajib diisi." }, { status: 400 });
  }

  const bolehEditSemua =
    profile.role === "kadiv_socmed" &&
    (profile.akses_tambahan ?? []).includes("script_writer_dashboard");

  if (!bolehEditSemua) {
    if (profile.role !== "script_writer") {
      return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });
    }
    const rows = await getSheetRows(SHEET_ID);
    const row = rows.find((r: any) => r.id_proyek_writer === id_proyek_writer);
    if (!row || row.nama_writer !== profile.nama) {
      return NextResponse.json(
        { error: "Kamu tidak bisa mengubah proyek writer lain." },
        { status: 403 }
      );
    }
  }

  await updateSheetRow(SHEET_ID, "id_proyek_writer", id_proyek_writer, {
    ...updates,
    last_updated: new Date().toISOString(),
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const profile = await getUserProfile();
  if (!profile) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const bolehEditSemua =
    profile.role === "kadiv_socmed" &&
    (profile.akses_tambahan ?? []).includes("script_writer_dashboard");
  if (!bolehEditSemua) {
    return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });
  }

  const { id_proyek_writer } = await req.json();
  if (!id_proyek_writer) {
    return NextResponse.json({ error: "id_proyek_writer wajib diisi." }, { status: 400 });
  }

  await deleteSheetRow(SHEET_ID, "id_proyek_writer", id_proyek_writer);
  return NextResponse.json({ success: true });
}
