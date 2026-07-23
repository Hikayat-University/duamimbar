import { NextRequest, NextResponse } from "next/server";
import { getSheetRows, appendSheetRow, updateSheetRow, deleteSheetRow } from "@/lib/sheets";
import { getUserProfile } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SHEET_ID = process.env.SHEET_ID_SOCMED_PROYEK_WRITER!;
const KONTEN_SHEET_ID = process.env.SHEET_ID_SOCMED_KONTEN!;
const DESIGNER_SHEET_ID = process.env.SHEET_ID_SOCMED_PROYEK_DESIGNER!;

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

/**
 * Begitu Script Writer menandai naskah siap (status Review/Disetujui),
 * otomatis munculkan proyeknya di dashboard Graphic Designer yang sudah
 * ditentukan Kadiv di form Konten — designer nggak perlu nunggu di-assign
 * manual lagi. Brief awal diambil dari referensi_desain & gaya_copywriting
 * yang sudah diisi Kadiv, bisa diedit lagi belakangan lewat "Edit Brief".
 */
async function syncDesignerFromWriter(idKonten: string) {
  if (!DESIGNER_SHEET_ID || !KONTEN_SHEET_ID) return;

  const kontenRows = await getSheetRows(KONTEN_SHEET_ID);
  const konten = kontenRows.find((k: any) => k.id_konten === idKonten);
  if (!konten || !konten.assigned_graphic_designer) return; // Kadiv belum pilih designer

  const briefAwal = [
    konten.referensi_desain ? `Referensi: ${konten.referensi_desain}` : "",
    konten.gaya_copywriting ? `Gaya: ${konten.gaya_copywriting}` : "",
    konten.cta ? `CTA: ${konten.cta}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await updateSheetRow(DESIGNER_SHEET_ID, "id_konten", idKonten, {
      nama_designer: konten.assigned_graphic_designer,
      last_updated: new Date().toISOString(),
    });
  } catch {
    await appendSheetRow(DESIGNER_SHEET_ID, [
      crypto.randomUUID(),
      idKonten,
      konten.assigned_graphic_designer,
      "Belum Dikerjakan",
      briefAwal,
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

  let idKonten: string | null = null;

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
    idKonten = row.id_konten;
  }

  await updateSheetRow(SHEET_ID, "id_proyek_writer", id_proyek_writer, {
    ...updates,
    last_updated: new Date().toISOString(),
  });

  if (updates.status === "Review" || updates.status === "Disetujui") {
    if (!idKonten) {
      const rows = await getSheetRows(SHEET_ID);
      idKonten = rows.find((r: any) => r.id_proyek_writer === id_proyek_writer)?.id_konten ?? null;
    }
    if (idKonten) await syncDesignerFromWriter(idKonten);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const profile = await getUserProfile();
  if (!profile) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const { id_proyek_writer } = await req.json();
  if (!id_proyek_writer) {
    return NextResponse.json({ error: "id_proyek_writer wajib diisi." }, { status: 400 });
  }

  const bolehHapusSemua =
    profile.role === "kadiv_socmed" &&
    (profile.akses_tambahan ?? []).includes("script_writer_dashboard");

  if (!bolehHapusSemua) {
    if (profile.role !== "script_writer") {
      return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });
    }
    const rows = await getSheetRows(SHEET_ID);
    const row = rows.find((r: any) => r.id_proyek_writer === id_proyek_writer);
    if (!row || row.nama_writer !== profile.nama) {
      return NextResponse.json(
        { error: "Kamu cuma bisa menghapus proyekmu sendiri." },
        { status: 403 }
      );
    }
  }

  await deleteSheetRow(SHEET_ID, "id_proyek_writer", id_proyek_writer);
  return NextResponse.json({ success: true });
}
