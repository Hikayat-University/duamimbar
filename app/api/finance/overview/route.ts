import { NextResponse } from "next/server";
import { getSheetRowsByTab } from "@/lib/sheets";
import { FINANCE_OS_SHEET_ID, FINANCE_TABS, requireFinanceViewer } from "@/lib/financeOS";

export const dynamic = "force-dynamic";

// Angka di sheet kadang berupa string berformat ("Rp 1.500.000" / "1500000").
// Dibersihkan dulu sebelum dijumlahkan.
function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  const cleaned = String(v ?? "").replace(/[^0-9.-]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

// Catatan: KPI di bawah ini SENGAJA dihitung ulang di sini, bukan dibaca
// langsung dari tab "Dashboard" -- formula Net Profit & Cash Balance di
// tab Dashboard salah rujuk baris (nunjuk ke baris header "KPI" yang
// kosong, bukan ke Total Revenue/Total Expense). Tolong dibetulkan juga
// langsung di spreadsheet-nya kalau tab Dashboard itu masih mau dipakai
// buat keperluan lain di luar app ini.
export async function GET() {
  const { error } = await requireFinanceViewer();
  if (error) return NextResponse.json({ error }, { status: 403 });

  try {
    const [transactions, ar, ap, bank, programs, revenueStreams, budget] = await Promise.all([
      getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.transactions),
      getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.ar),
      getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.ap),
      getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.bank),
      getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.program),
      getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.revenueStream),
      getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.budget),
    ]);

    const income = transactions.filter((t) => t["Transaction Type"] === "Income");
    const expense = transactions.filter((t) => t["Transaction Type"] === "Expense");

    const totalRevenue = income.reduce((sum, t) => sum + toNumber(t["Amount (Rp)"]), 0);
    const totalExpense = expense.reduce((sum, t) => sum + toNumber(t["Amount (Rp)"]), 0);
    const netProfit = totalRevenue - totalExpense;

    const openingBalance = bank.reduce((sum, b) => sum + toNumber(b["Opening Balance (Rp)"]), 0);
    const cashBalance = openingBalance + netProfit;

    const totalArOutstanding = ar.reduce(
      (sum, r) => sum + (toNumber(r["Amount (Rp)"]) - toNumber(r["Amount Received (Rp)"])),
      0
    );
    const totalApOutstanding = ap
      .filter((r) => r.Status === "Open" || r.Status === "Overdue")
      .reduce((sum, r) => sum + toNumber(r["Amount (Rp)"]), 0);

    const revenueByProgram = programs
      .filter((p) => p["Program ID"])
      .map((p) => ({
        program: p.Name,
        revenue: income
          .filter((t) => t["Program ID"] === p["Program ID"])
          .reduce((sum, t) => sum + toNumber(t["Amount (Rp)"]), 0),
      }));

    const revenueByStream = revenueStreams
      .filter((r) => r["Revenue Stream ID"])
      .map((r) => ({
        stream: r["Revenue Stream"],
        revenue: income
          .filter((t) => t["Revenue Stream ID"] === r["Revenue Stream ID"])
          .reduce((sum, t) => sum + toNumber(t["Amount (Rp)"]), 0),
      }));

    return NextResponse.json({
      kpi: {
        totalRevenue,
        totalExpense,
        netProfit,
        cashBalance,
        totalArOutstanding,
        totalApOutstanding,
      },
      revenueByProgram,
      revenueByStream,
      budget: budget.filter((b) => b["Program ID"]),
    });
  } catch (err) {
    // Sengaja dikirim ke klien (bukan cuma di-log) supaya kelihatan tab/kolom
    // mana yang bermasalah -- ini dashboard internal, bukan endpoint publik.
    console.error("GET /api/finance/overview gagal:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memuat data finance." },
      { status: 500 }
    );
  }
}
