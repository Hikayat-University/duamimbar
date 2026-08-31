import { NextRequest, NextResponse } from "next/server";
import { getSheetRowsByTab } from "@/lib/sheets";
import { FINANCE_OS_SHEET_ID, FINANCE_TABS, requireFinanceViewer } from "@/lib/financeOS";

export const dynamic = "force-dynamic";

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  const cleaned = String(v ?? "").replace(/[^0-9.-]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

const DEBIT_NORMAL_CLASSES = ["Assets", "Direct Cost", "Operating Expense"];
// Nama akun Assets yang dianggap "non-lancar" buat klasifikasi Investing di
// Cash Flow -- selain ini (Cash, Bank, Accounts Receivable) dianggap bagian
// modal kerja normal / Operating.
const FIXED_ASSET_NAMES = ["Equipment", "Other Assets"];

/**
 * Catatan penting: klasifikasi Investing/Financing di Cash Flow di bawah ini
 * SEDERHANA -- diturunkan dari Class akun lawan transaksi, bukan dari
 * penandaan eksplisit tiap transaksi. Untuk kasus penggunaan sekarang
 * (jurnal 2 baris hasil auto-posting) ini akurat, tapi kalau nanti ada
 * jurnal manual multi-baris yang lebih kompleks, klasifikasinya bisa meleset
 * dan sebaiknya dicek manual.
 */
export async function GET(req: NextRequest) {
  const { error } = await requireFinanceViewer();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const from = req.nextUrl.searchParams.get("from") ?? `${new Date().getFullYear()}-01-01`;
  const to = req.nextUrl.searchParams.get("to") ?? new Date().toISOString().slice(0, 10);

  try {
    const [journal, coa] = await Promise.all([
      getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.journal),
      getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.coa),
    ]);

    const coaMap = new Map(coa.map((c) => [c["Account Code"], c]));
    const inPeriod = journal.filter((r) => String(r.Date) >= from && String(r.Date) <= to);
    const upToDate = journal.filter((r) => String(r.Date) <= to);

    function sumByClass(rows: typeof journal, classes: string[]) {
      return rows
        .filter((r) => classes.includes(coaMap.get(String(r["Account Code"]))?.Class ?? ""))
        .reduce((sum, r) => {
          const cls = coaMap.get(String(r["Account Code"]))?.Class ?? "";
          const isDebitNormal = DEBIT_NORMAL_CLASSES.includes(cls);
          const debit = toNumber(r["Debit (Rp)"]);
          const credit = toNumber(r["Credit (Rp)"]);
          return sum + (isDebitNormal ? debit - credit : credit - debit);
        }, 0);
    }

    // ---------- Income Statement (periode from..to) ----------
    const revenue = sumByClass(inPeriod, ["Revenue"]);
    const directCost = sumByClass(inPeriod, ["Direct Cost"]);
    const operatingExpense = sumByClass(inPeriod, ["Operating Expense"]);
    const netIncomePeriod = revenue - directCost - operatingExpense;

    // ---------- Balance Sheet (posisi per tanggal `to`, sejak awal) ----------
    const assets = sumByClass(upToDate, ["Assets"]);
    const liabilities = sumByClass(upToDate, ["Liabilities"]);
    const equityPosted = sumByClass(upToDate, ["Equity"]);
    // Laba ditahan dihitung (belum ada jurnal penutup formal tiap tutup
    // buku), bukan saldo yang benar-benar diposting ke akun 3200.
    const netIncomeSinceInception =
      sumByClass(upToDate, ["Revenue"]) -
      sumByClass(upToDate, ["Direct Cost"]) -
      sumByClass(upToDate, ["Operating Expense"]);
    const totalEquity = equityPosted + netIncomeSinceInception;
    const isBalanced = Math.abs(assets - (liabilities + totalEquity)) < 1;

    // ---------- Cash Flow Statement (periode from..to) ----------
    const byJournalId = new Map<string, typeof journal>();
    for (const row of inPeriod) {
      const id = String(row["Journal ID"]);
      if (!byJournalId.has(id)) byJournalId.set(id, []);
      byJournalId.get(id)!.push(row);
    }

    let operatingCf = 0;
    let investingCf = 0;
    let financingCf = 0;

    for (const lines of byJournalId.values()) {
      const cashLines = lines.filter((l) => coaMap.get(String(l["Account Code"]))?.Class === "Assets" &&
        (coaMap.get(String(l["Account Code"]))?.["Account Name"] === "Cash" ||
          coaMap.get(String(l["Account Code"]))?.["Account Name"] === "Bank"));
      const counterLines = lines.filter((l) => !cashLines.includes(l));
      if (cashLines.length === 0 || counterLines.length === 0) continue;

      const cashDelta = cashLines.reduce(
        (sum, l) => sum + (toNumber(l["Debit (Rp)"]) - toNumber(l["Credit (Rp)"])),
        0
      );
      const counter = coaMap.get(String(counterLines[0]["Account Code"]));

      if (counter?.Class === "Equity") {
        financingCf += cashDelta;
      } else if (counter?.Class === "Assets" && FIXED_ASSET_NAMES.includes(counter["Account Name"])) {
        investingCf += cashDelta;
      } else {
        operatingCf += cashDelta;
      }
    }

    return NextResponse.json({
      period: { from, to },
      incomeStatement: { revenue, directCost, operatingExpense, netIncome: netIncomePeriod },
      balanceSheet: {
        asOf: to,
        assets,
        liabilities,
        equityPosted,
        retainedEarningsComputed: netIncomeSinceInception,
        totalEquity,
        isBalanced,
      },
      cashFlow: {
        operatingCf,
        investingCf,
        financingCf,
        netChange: operatingCf + investingCf + financingCf,
      },
    });
  } catch (err) {
    console.error("GET /api/finance/statements gagal:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memuat laporan keuangan." },
      { status: 500 }
    );
  }
}
