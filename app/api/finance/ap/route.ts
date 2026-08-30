import { NextRequest, NextResponse } from "next/server";
import {
  getSheetRowsByTab,
  appendSheetRowToTab,
  updateSheetRowByIndex,
  deleteSheetRowByIndexInTab,
} from "@/lib/sheets";
import {
  FINANCE_OS_SHEET_ID,
  FINANCE_TABS,
  AP_COLUMNS,
  requireKadivFinance,
  requireFinanceViewer,
} from "@/lib/financeOS";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireFinanceViewer();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const rows = await getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.ap);
  // rowIndex disertakan supaya klien bisa PATCH/DELETE baris yang tepat --
  // AP Tracker nggak punya kolom ID unik, jadi berdasarkan posisi baris.
  const rowsWithIndex = rows.map((r, i) => ({ ...r, rowIndex: i }));
  return NextResponse.json(rowsWithIndex);
}

export async function POST(req: NextRequest) {
  const { error } = await requireKadivFinance();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const body = await req.json();
  const values = AP_COLUMNS.map((col) => body[col] ?? "");
  await appendSheetRowToTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.ap, values);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireKadivFinance();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { rowIndex, ...updates } = await req.json();
  if (rowIndex === undefined || rowIndex === null) {
    return NextResponse.json({ error: "rowIndex wajib diisi." }, { status: 400 });
  }

  await updateSheetRowByIndex(FINANCE_OS_SHEET_ID, FINANCE_TABS.ap, rowIndex, updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireKadivFinance();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { rowIndex } = await req.json();
  if (rowIndex === undefined || rowIndex === null) {
    return NextResponse.json({ error: "rowIndex wajib diisi." }, { status: 400 });
  }

  await deleteSheetRowByIndexInTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.ap, rowIndex);
  return NextResponse.json({ success: true });
}
