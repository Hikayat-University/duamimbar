import { NextResponse } from "next/server";
import { getSheetRowsByTab } from "@/lib/sheets";
import { FINANCE_OS_SHEET_ID, FINANCE_TABS, requireFinanceViewer } from "@/lib/financeOS";

export const dynamic = "force-dynamic";

// Read-only, tapi tetap wajib role finance viewer -- dipakai buat isi
// dropdown di form Transactions/AR/AP.
export async function GET() {
  const { error } = await requireFinanceViewer();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const [program, revenueStream, client, vendor, coa, bank] = await Promise.all([
    getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.program),
    getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.revenueStream),
    getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.client),
    getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.vendor),
    getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.coa),
    getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.bank),
  ]);

  return NextResponse.json({ program, revenueStream, client, vendor, coa, bank });
}
