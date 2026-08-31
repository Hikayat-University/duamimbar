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
import { postJournal, findCoaCodeByName, resolveCashCoaCode } from "@/lib/journal";

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

  // Bill/tagihan baru masuk -> Dr Expense/Direct Cost / Cr Accounts Payable.
  const amount = Number(body["Amount (Rp)"] || 0);
  if (amount > 0 && body["Account Code"]) {
    try {
      const coa = await getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.coa);
      const apCode = findCoaCodeByName(coa as any, "Accounts Payable");
      await postJournal({
        date: body["Due Date"],
        source: "AP Tracker",
        sourceRef: body["Bill/Reference"],
        description: `Bill ${body["Bill/Reference"]} - ${body.Vendor}`,
        lines: [
          { accountCode: body["Account Code"], debit: amount },
          { accountCode: apCode, credit: amount },
        ],
      });
    } catch (journalError) {
      console.error("Auto-journal gagal untuk AP", body["Bill/Reference"], journalError);
      return NextResponse.json({
        success: true,
        journalWarning:
          journalError instanceof Error
            ? journalError.message
            : "Utang tersimpan, tapi jurnal otomatis gagal dibuat.",
      });
    }
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireKadivFinance();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { rowIndex, ...updates } = await req.json();
  if (rowIndex === undefined || rowIndex === null) {
    return NextResponse.json({ error: "rowIndex wajib diisi." }, { status: 400 });
  }

  const existingRows = await getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.ap);
  const oldRow = existingRows[rowIndex];

  await updateSheetRowByIndex(FINANCE_OS_SHEET_ID, FINANCE_TABS.ap, rowIndex, updates);

  const newStatus = updates.Status ?? oldRow?.Status;
  const justPaid = newStatus === "Paid" && oldRow?.Status !== "Paid";
  const bankAccount = updates["Bank/Cash Account"] ?? oldRow?.["Bank/Cash Account"];

  // Status baru berubah jadi "Paid" -> Dr Accounts Payable / Cr Bank/Cash,
  // sebesar total tagihan (AP Tracker nggak nge-track pembayaran cicilan,
  // beda sama AR -- di sini asumsinya dibayar lunas sekaligus).
  if (justPaid && bankAccount && oldRow) {
    const amount = Number(oldRow["Amount (Rp)"] || 0);
    try {
      const [bank, coa] = await Promise.all([
        getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.bank),
        getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.coa),
      ]);
      const cashCode = resolveCashCoaCode(bankAccount, bank as any, coa as any);
      const apCode = findCoaCodeByName(coa as any, "Accounts Payable");
      await postJournal({
        date: new Date().toISOString().slice(0, 10),
        source: "AP Tracker",
        sourceRef: String(oldRow["Bill/Reference"]),
        description: `Pembayaran bill ${oldRow["Bill/Reference"]} - ${oldRow.Vendor}`,
        lines: [
          { accountCode: apCode, debit: amount },
          { accountCode: cashCode, credit: amount },
        ],
      });
    } catch (journalError) {
      console.error("Auto-journal gagal untuk pembayaran AP", rowIndex, journalError);
      return NextResponse.json({
        success: true,
        journalWarning:
          journalError instanceof Error
            ? journalError.message
            : "Status tersimpan, tapi jurnal otomatis gagal dibuat.",
      });
    }
  }

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
