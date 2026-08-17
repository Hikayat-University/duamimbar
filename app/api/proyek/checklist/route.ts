import { NextRequest, NextResponse } from "next/server";
import { getSheetRowsByTab, updateSheetRowByIndex } from "@/lib/sheets";
import { getUserProfile } from "@/lib/supabase/server";
import { computeChecklistSummary } from "@/lib/checklistProgress";

// Wajib: data checklist berubah terus, jangan di-cache Next.js.
export const dynamic = "force-dynamic";

const SHEET_ID_CHECKLIST = process.env.SHEET_ID_CHECKLIST!;
const STATUS_OPTIONS = ["Belum", "Selesai"];

export type ChecklistRow = {
  Phase: string;
  Section: string;
  Item: string;
  Prioritas: string;
  Status: string;
  PIC: string;
  Catatan: string;
  /** Opsional -- baru terisi kalau kolom "Deadline" udah ditambah di sheet. */
  Deadline?: string;
  /** Opsional -- link bukti kerja (Docs/Drive/Figma/dst), kolom "Bukti". */
  Bukti?: string;
};

/**
 * Kolom PIC bisa berisi lebih dari satu nama, dipisah "+" (mis. "Titian +
 * Zidan"). Cocok kalau salah satu nama di situ sama persis (nggak peduli
 * besar-kecil huruf / spasi) dengan nama user yang login.
 */
function isAssignedTo(picField: string, nama: string): boolean {
  const target = nama.trim().toLowerCase();
  return picField
    .split("+")
    .map((s) => s.trim().toLowerCase())
    .includes(target);
}

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

  const summary = computeChecklistSummary(rows as ChecklistRow[]);

  // rowIndex disertakan supaya klien bisa PATCH baris yang tepat -- checklist
  // nggak punya kolom ID unik, jadi update dilakukan berdasarkan posisi baris.
  const rowsWithIndex = rows.map((r, i) => ({ ...r, rowIndex: i }));

  return NextResponse.json({ rows: rowsWithIndex, summary });
}

const ALLOWED_UPDATE_KEYS = ["Status", "Catatan", "Bukti"] as const;

export async function PATCH(req: NextRequest) {
  const profile = await getUserProfile();
  if (!profile) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const { tab, rowIndex, updates } = await req.json();
  if (!tab || rowIndex === undefined || rowIndex === null || !updates) {
    return NextResponse.json({ error: "tab, rowIndex, dan updates wajib diisi." }, { status: 400 });
  }

  const cleanUpdates: Record<string, string> = {};
  for (const key of ALLOWED_UPDATE_KEYS) {
    if (updates[key] !== undefined) cleanUpdates[key] = String(updates[key]);
  }
  if (Object.keys(cleanUpdates).length === 0) {
    return NextResponse.json({ error: "Tidak ada field yang boleh diubah." }, { status: 400 });
  }
  if (cleanUpdates.Status !== undefined && !STATUS_OPTIONS.includes(cleanUpdates.Status)) {
    return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
  }

  if (!SHEET_ID_CHECKLIST) {
    return NextResponse.json(
      { error: "Sheet ID belum diisi di .env (SHEET_ID_CHECKLIST)." },
      { status: 500 }
    );
  }

  // Cek ulang di server: cuma PIC yang di-assign di baris itu (atau Head
  // Director sebagai override) yang boleh ubah isinya.
  const rows = await getSheetRowsByTab(SHEET_ID_CHECKLIST, tab);
  const row = rows[rowIndex];
  if (!row) {
    return NextResponse.json({ error: "Item checklist tidak ditemukan." }, { status: 404 });
  }
  const bolehUbah = profile.role === "head_director" || isAssignedTo(row.PIC ?? "", profile.nama);
  if (!bolehUbah) {
    return NextResponse.json(
      { error: "Kamu bukan PIC untuk item checklist ini." },
      { status: 403 }
    );
  }

  await updateSheetRowByIndex(SHEET_ID_CHECKLIST, tab, rowIndex, cleanUpdates);
  return NextResponse.json({ success: true });
}
