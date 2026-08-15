import { NextRequest, NextResponse } from "next/server";
import { getSheetRowsByTab } from "@/lib/sheets";

// Wajib: data checklist berubah terus, jangan di-cache Next.js.
export const dynamic = "force-dynamic";

const SHEET_ID_CHECKLIST = process.env.SHEET_ID_CHECKLIST!;

export type ChecklistRow = {
  Phase: string;
  Section: string;
  Item: string;
  Prioritas: string;
  Status: string;
  PIC: string;
  Catatan: string;
};

export async function GET(req: NextRequest) {
  const tab = req.nextUrl.searchParams.get("tab");
  if (!tab) {
    return NextResponse.json({ error: "Parameter 'tab' (nama proyek) wajib diisi." }, { status: 400 });
  }

  if (!SHEET_ID_CHECKLIST) {
    return NextResponse.json(
      { error: "Sheet ID belum diisi di .env (SHEET_ID_CHECKLIST)." },
      { status: 500 }
    );
  }

  let rows: Record<string, string>[];
  try {
    rows = await getSheetRowsByTab(SHEET_ID_CHECKLIST, tab);
  } catch (err: any) {
    const detail: string = err?.response?.data?.error?.message ?? err?.message ?? String(err);
    const isTabMissing = /unable to parse range|not found/i.test(detail);

    return NextResponse.json(
      {
        error: isTabMissing
          ? `Tab checklist untuk "${tab}" tidak ditemukan. Pastikan nama tab di spreadsheet checklist sama persis dengan nama proyek.`
          : `Gagal mengambil checklist dari Google Sheets: ${detail}`,
      },
      { status: isTabMissing ? 404 : 500 }
    );
  }

  const total = rows.length;
  const selesai = rows.filter((r) => r.Status === "Selesai").length;
  const belum = total - selesai;
  const persenSelesai = total === 0 ? 0 : Math.round((selesai / total) * 100);

  return NextResponse.json({
    rows,
    summary: { total, selesai, belum, persenSelesai },
  });
}
