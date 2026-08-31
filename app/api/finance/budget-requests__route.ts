import { NextRequest, NextResponse } from "next/server";
import { getSheetRowsByTab, appendSheetRowToTab, updateSheetRowByIndex } from "@/lib/sheets";
import {
  FINANCE_OS_SHEET_ID,
  FINANCE_TABS,
  BUDGET_REQUEST_COLUMNS,
  HEAD_DIRECTOR_APPROVAL_THRESHOLD,
  nextBudgetRequestId,
  requireBudgetRequester,
  requireBudgetRequestViewer,
} from "@/lib/financeOS";
import { getUserProfile } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  const cleaned = String(v ?? "").replace(/[^0-9.-]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

type BudgetRequestRow = Record<(typeof BUDGET_REQUEST_COLUMNS)[number], string>;

export async function GET() {
  const { profile, error } = await requireBudgetRequestViewer();
  if (error || !profile) return NextResponse.json({ error }, { status: 403 });

  const [rows, program, budget] = await Promise.all([
    getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.budgetRequests) as Promise<BudgetRequestRow[]>,
    getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.program) as Promise<
      { "Program ID": string; Name: string }[]
    >,
    getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.budget) as Promise<
      { "Program ID": string; "Account Code": string; "Budget (Rp)": string }[]
    >,
  ]);
  const rowsWithIndex = rows.map((r, i) => ({ ...r, rowIndex: i }));

  // kadiv_finance & head_director lihat semua (buat review); pengaju cuma
  // lihat pengajuan mereka sendiri.
  const canSeeAll = profile.role === "kadiv_finance" || profile.role === "head_director";
  const visible = canSeeAll
    ? rowsWithIndex
    : rowsWithIndex.filter((r) => r["Requester ID"] === profile.id);

  // Cek budget: buat tiap pengajuan yang masih Pending/Menunggu Head
  // Director, hitung (pengajuan lain yang udah Approved + pengajuan ini)
  // dibanding kolom Budget di Budget vs Actual, buat program+akun yang sama.
  // Ini cuma PERINGATAN (ditampilkan ke approver), bukan pemblokir.
  const programIdByName = new Map(program.map((p) => [p.Name, p["Program ID"]]));
  const budgetCeiling = new Map(
    budget.map((b) => [`${b["Program ID"]}::${b["Account Code"]}`, toNumber(b["Budget (Rp)"])])
  );
  const approvedTotals = new Map<string, number>();
  for (const r of rowsWithIndex) {
    if (r.Status !== "Approved") continue;
    const programId = programIdByName.get(String(r.Program)) ?? r.Program;
    const key = `${programId}::${r["Account Code"]}`;
    approvedTotals.set(key, (approvedTotals.get(key) ?? 0) + toNumber(r["Amount (Rp)"]));
  }

  const withBudgetCheck = visible.map((r) => {
    if (r.Status !== "Pending" && r.Status !== "Menunggu Head Director") {
      return { ...r, budgetWarning: null };
    }
    const programId = programIdByName.get(String(r.Program)) ?? r.Program;
    const key = `${programId}::${r["Account Code"]}`;
    const ceiling = budgetCeiling.get(key);
    if (ceiling === undefined) return { ...r, budgetWarning: null };

    const alreadyApproved = approvedTotals.get(key) ?? 0;
    const projected = alreadyApproved + toNumber(r["Amount (Rp)"]);
    const budgetWarning =
      projected > ceiling
        ? `Melebihi budget ${r.Program} / ${r["Account Code"]}: Rp ${projected.toLocaleString("id-ID")} dari plafon Rp ${ceiling.toLocaleString("id-ID")}.`
        : null;
    return { ...r, budgetWarning };
  });

  return NextResponse.json({ rows: withBudgetCheck, threshold: HEAD_DIRECTOR_APPROVAL_THRESHOLD });
}

export async function POST(req: NextRequest) {
  const { profile, error } = await requireBudgetRequester();
  if (error || !profile) return NextResponse.json({ error }, { status: 403 });

  const body = await req.json();
  const id = await nextBudgetRequestId();
  const values = BUDGET_REQUEST_COLUMNS.map((col) => {
    if (col === "Request ID") return id;
    if (col === "Date") return body.Date || new Date().toISOString().slice(0, 10);
    if (col === "Requester ID") return profile.id;
    if (col === "Requested By") return profile.nama;
    if (col === "Division") return profile.divisi || profile.role;
    if (col === "Status") return "Pending";
    return body[col] ?? "";
  });

  await appendSheetRowToTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.budgetRequests, values);
  return NextResponse.json({ success: true, id });
}

/**
 * Satu-satunya aksi lewat PATCH: mengubah status (approve/reject), lewat
 * jenjang yang sesuai. Field lain (nominal, deskripsi, dst) TIDAK bisa
 * diubah di sini -- kalau pengaju salah isi, mereka harus buat pengajuan
 * baru (biar histori approval tetap jujur & jelas siapa approve apa).
 */
export async function PATCH(req: NextRequest) {
  const profile = await getUserProfile();
  if (!profile) return NextResponse.json({ error: "Belum login." }, { status: 403 });

  const { rowIndex, action, note } = await req.json();
  if (rowIndex === undefined || rowIndex === null) {
    return NextResponse.json({ error: "rowIndex wajib diisi." }, { status: 400 });
  }
  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "action harus 'approve' atau 'reject'." }, { status: 400 });
  }

  const rows = await getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.budgetRequests);
  const row = rows[rowIndex];
  if (!row) return NextResponse.json({ error: "Pengajuan tidak ditemukan." }, { status: 404 });

  const amount = toNumber(row["Amount (Rp)"]);
  const needsHeadDirector = amount >= HEAD_DIRECTOR_APPROVAL_THRESHOLD;
  const status = String(row.Status);

  let newStatus: string;

  if (status === "Pending") {
    if (profile.role !== "kadiv_finance") {
      return NextResponse.json(
        { error: "Cuma kadiv_finance yang bisa memproses pengajuan tahap awal." },
        { status: 403 }
      );
    }
    if (action === "reject") {
      newStatus = "Rejected";
    } else {
      // Approve tahap kadiv_finance: kalau nominalnya kecil, langsung final.
      // Kalau besar, diteruskan ke Head Director buat persetujuan akhir.
      newStatus = needsHeadDirector ? "Menunggu Head Director" : "Approved";
    }
  } else if (status === "Menunggu Head Director") {
    if (profile.role !== "head_director") {
      return NextResponse.json(
        { error: "Pengajuan ini butuh persetujuan Head Director." },
        { status: 403 }
      );
    }
    newStatus = action === "approve" ? "Approved" : "Rejected";
  } else {
    return NextResponse.json(
      { error: `Pengajuan berstatus "${status}" tidak bisa diproses lagi.` },
      { status: 400 }
    );
  }

  await updateSheetRowByIndex(FINANCE_OS_SHEET_ID, FINANCE_TABS.budgetRequests, rowIndex, {
    Status: newStatus,
    "Approval Note": note ?? row["Approval Note"] ?? "",
    "Approved By": profile.nama,
    "Approval Date": new Date().toISOString().slice(0, 10),
  });

  return NextResponse.json({ success: true, status: newStatus });
}
