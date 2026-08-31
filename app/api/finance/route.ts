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

// Kelas akun yang saldo normalnya di Debit -- selain ini (Liabilities,
// Equity, Revenue) saldo normalnya di Kredit.
const DEBIT_NORMAL_CLASSES = ["Assets", "Direct Cost", "Operating Expense"];

export async function GET(req: NextRequest) {
  const { error } = await requireFinanceViewer();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const accountFilter = req.nextUrl.searchParams.get("account");

  try {
    const [journal, coa] = await Promise.all([
      getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.journal),
      getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.coa),
    ]);

    const coaMap = new Map(coa.map((c) => [c["Account Code"], c]));

    let rows = journal;
    if (accountFilter) rows = rows.filter((r) => r["Account Code"] === accountFilter);

    rows = [...rows].sort((a, b) => (String(a.Date) < String(b.Date) ? -1 : 1));

    const balances: Record<string, number> = {};
    const lines = rows.map((r) => {
      const code = String(r["Account Code"]);
      const isDebitNormal = DEBIT_NORMAL_CLASSES.includes(coaMap.get(code)?.Class ?? "");
      const debit = toNumber(r["Debit (Rp)"]);
      const credit = toNumber(r["Credit (Rp)"]);
      const delta = isDebitNormal ? debit - credit : credit - debit;
      balances[code] = (balances[code] ?? 0) + delta;

      return {
        journalId: r["Journal ID"],
        date: r.Date,
        source: r.Source,
        sourceRef: r["Source Ref"],
        accountCode: code,
        accountName: coaMap.get(code)?.["Account Name"] ?? code,
        debit,
        credit,
        description: r.Description,
        runningBalance: balances[code],
      };
    });

    return NextResponse.json({ lines });
  } catch (err) {
    console.error("GET /api/finance/gl gagal:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memuat general ledger." },
      { status: 500 }
    );
  }
}
