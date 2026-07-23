import { NextRequest, NextResponse } from "next/server";
import { getSheetRows, appendSheetRow, updateSheetRow, deleteSheetRow } from "@/lib/sheets";
import { getUserProfile } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SHEET_ID = process.env.SHEET_ID_SOCMED_PROYEK_DESIGNER!;
const COLUMNS = [
  "id_proyek_designer",
  "id_konten",
  "nama_designer",
  "status",
  "brief_desain",
  "link_preview",
  "catatan",
  "last_updated",
];

function isKadivWithAkses(profile: any) {
  return (
    profile.role === "kadiv_socmed" &&
    (profile.akses_tambahan ?? []).includes("graphic_designer_dashboard")
  );
}

export async function GET() {
  const rows = await getSheetRows(SHEET_ID);
  return NextResponse.json(rows);
}

// Assign proyek baru ke Graphic Designer — cuma Kadiv SocMed, ini aksi
// terpisah dari pembuatan Konten (designer baru ditugaskan belakangan,
// setelah naskah disetujui).
export async function POST(req: NextRequest) {
  const profile = await getUserProfile();
  if (!profile) return NextResponse.json({ error: "Belum login." }, { status: 401 });
  if (!isKadivWithAkses(profile)) {
    return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });
  }

  const body = await req.json();
  const values = COLUMNS.map((col) => {
    if (col.startsWith("id")) return crypto.randomUUID();
    if (col === "status") return body[col] || "Belum Dikerjakan";
    if (col === "last_updated") return new Date().toISOString();
    return body[col] ?? "";
  });
  await appendSheetRow(SHEET_ID, values);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const profile = await getUserProfile();
  if (!profile) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const { id_proyek_designer, brief_desain, ...rest } = await req.json();
  if (!id_proyek_designer) {
    return NextResponse.json({ error: "id_proyek_designer wajib diisi." }, { status: 400 });
  }

  const bolehEditSemua = isKadivWithAkses(profile);
  const updates: Record<string, string> = { ...rest, last_updated: new Date().toISOString() };

  if (!bolehEditSemua) {
    if (profile.role !== "graphic_designer") {
      return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });
    }
    const rows = await getSheetRows(SHEET_ID);
    const row = rows.find((r: any) => r.id_proyek_designer === id_proyek_designer);
    if (!row || row.nama_designer !== profile.nama) {
      return NextResponse.json(
        { error: "Kamu tidak bisa mengubah proyek designer lain." },
        { status: 403 }
      );
    }
    // Brief cuma boleh diubah Kadiv — designer nggak boleh nulis briefnya sendiri.
    if (brief_desain !== undefined) {
      return NextResponse.json(
        { error: "Brief desain cuma bisa diubah oleh Kadiv SocMed." },
        { status: 403 }
      );
    }
  } else if (brief_desain !== undefined) {
    updates.brief_desain = brief_desain;
  }

  await updateSheetRow(SHEET_ID, "id_proyek_designer", id_proyek_designer, updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const profile = await getUserProfile();
  if (!profile) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const { id_proyek_designer } = await req.json();
  if (!id_proyek_designer) {
    return NextResponse.json({ error: "id_proyek_designer wajib diisi." }, { status: 400 });
  }

  if (!isKadivWithAkses(profile)) {
    if (profile.role !== "graphic_designer") {
      return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });
    }
    const rows = await getSheetRows(SHEET_ID);
    const row = rows.find((r: any) => r.id_proyek_designer === id_proyek_designer);
    if (!row || row.nama_designer !== profile.nama) {
      return NextResponse.json(
        { error: "Kamu cuma bisa menghapus proyekmu sendiri." },
        { status: 403 }
      );
    }
  }

  await deleteSheetRow(SHEET_ID, "id_proyek_designer", id_proyek_designer);
  return NextResponse.json({ success: true });
}
