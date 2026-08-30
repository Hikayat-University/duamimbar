import { NextRequest, NextResponse } from "next/server";
import {
  getSheetRowsByTab,
  appendSheetRowToTab,
  updateSheetRowInTab,
  deleteSheetRowInTab,
} from "@/lib/sheets";
import {
  FINANCE_OS_SHEET_ID,
  FINANCE_TABS,
  TRANSACTION_COLUMNS,
  nextTransactionId,
  requireKadivFinance,
  requireFinanceViewer,
} from "@/lib/financeOS";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireFinanceViewer();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const rows = await getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.transactions);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { profile, error } = await requireKadivFinance();
  if (error || !profile) return NextResponse.json({ error }, { status: 403 });

  const body = await req.json();
  const id = await nextTransactionId();
  const values = TRANSACTION_COLUMNS.map((col) => {
    if (col === "Transaction ID") return id;
    if (col === "PIC") return body[col] || profile.nama;
    if (col === "Approval Status") return body[col] || "Pending";
    if (col === "Payment Status") return body[col] || "Unpaid";
    return body[col] ?? "";
  });

  await appendSheetRowToTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.transactions, values);
  return NextResponse.json({ success: true, id });
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireKadivFinance();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { "Transaction ID": id, ...updates } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Transaction ID wajib diisi." }, { status: 400 });
  }

  await updateSheetRowInTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.transactions, "Transaction ID", id, updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireKadivFinance();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { "Transaction ID": id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Transaction ID wajib diisi." }, { status: 400 });
  }

  await deleteSheetRowInTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.transactions, "Transaction ID", id);
  return NextResponse.json({ success: true });
}
