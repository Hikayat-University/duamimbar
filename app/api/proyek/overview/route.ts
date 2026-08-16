import { NextResponse } from "next/server";
import { getSheetRows, getSheetRowsByTab } from "@/lib/sheets";
import { computeChecklistSummary, type ChecklistSummary } from "@/lib/checklistProgress";

// Wajib: data proyek/checklist berubah terus, jangan di-cache Next.js.
export const dynamic = "force-dynamic";

const SHEET_ID_PROYEK = process.env.SHEET_ID_PROYEK_PERUSAHAAN!;
const SHEET_ID_CHECKLIST = process.env.SHEET_ID_CHECKLIST!;

export type ProyekOverview = {
  id_proyek: string;
  nama_proyek: string;
  deskripsi: string;
  divisi_terlibat: string;
  status: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  dibuat_oleh: string;
  checklist: ChecklistSummary | null;
};

/**
 * Satu endpoint yang gabungin daftar proyek + summary checklist tiap
 * proyek dalam SATU response -- gantiin pola lama (1 request daftar
 * proyek + N request checklist per-proyek dari client). Ini nggak
 * ngilangin N panggilan ke Google Sheets API (checklist tiap proyek
 * tetep di tab terpisah), tapi ngilangin N round-trip dari BROWSER ke
 * server kita, yang jauh lebih mahal karena lewat jaringan publik.
 */
export async function GET() {
  const proyekRows = await getSheetRows(SHEET_ID_PROYEK);

  const withChecklist = await Promise.all(
    proyekRows.map(async (p): Promise<ProyekOverview> => {
      let checklist: ProyekOverview["checklist"] = null;
      if (SHEET_ID_CHECKLIST) {
        try {
          const rows = await getSheetRowsByTab(SHEET_ID_CHECKLIST, p.nama_proyek);
          checklist = computeChecklistSummary(rows);
        } catch {
          // Tab checklist buat proyek ini belum ada / nama nggak cocok --
          // checklist tetap null, bukan bikin seluruh request gagal.
        }
      }
      return { ...p, checklist } as ProyekOverview;
    })
  );

  return NextResponse.json(withChecklist);
}
