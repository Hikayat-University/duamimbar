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
  AR_COLUMNS,
  requireKadivFinance,
  requireFinanceViewer,
} from "@/lib/financeOS";
import { postJournal, findCoaCodeByName, resolveCashCoaCode } from "@/lib/journal";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireFinanceViewer();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const rows = await getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.ar);
  // rowIndex disertakan supaya klien bisa PATCH/DELETE baris yang tepat --
  // AR Tracker nggak punya kolom ID unik, jadi berdasarkan posisi baris.
  const rowsWithIndex = rows.map((r, i) => ({ ...r, rowIndex: i }));
  return NextResponse.json(rowsWithIndex);
}

export async function POST(req: NextRequest) {
  const { error } = await requireKadivFinance();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const body = await req.json();
  const values = AR_COLUMNS.map((col) => body[col] ?? "");
  await appendSheetRowToTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.ar, values);

  // Invoice baru dibuat -> Dr Accounts Receivable / Cr Revenue Account.
  const amount = Number(body["Amount (Rp)"] || 0);
  if (amount > 0 && body["Account Code"]) {
    try {
      const coa = await getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.coa);
      const arCode = findCoaCodeByName(coa as any, "Accounts Receivable");
      await postJournal({
        date: body["Invoice Date"],
        source: "AR Tracker",
        sourceRef: body["Contract/Invoice ID"],
        description: `Invoice ${body["Contract/Invoice ID"]} - ${body.Client}`,
        lines: [
          { accountCode: arCode, debit: amount },
          { accountCode: body["Account Code"], credit: amount },
        ],
      });
    } catch (journalError) {
      console.error("Auto-journal gagal untuk AR", body["Contract/Invoice ID"], journalError);
      return NextResponse.json({
        success: true,
        journalWarning:
          journalError instanceof Error
            ? journalError.message
            : "Piutang tersimpan, tapi jurnal otomatis gagal dibuat.",
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

  // Ambil data lama dulu SEBELUM di-update -- perlu buat hitung selisih
  // Amount Received (cuma selisihnya yang dijurnal, bukan total barunya).
  const existingRows = await getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.ar);
  const oldRow = existingRows[rowIndex];

  await updateSheetRowByIndex(FINANCE_OS_SHEET_ID, FINANCE_TABS.ar, rowIndex, updates);

  const newReceived = Number(updates["Amount Received (Rp)"] ?? oldRow?.["Amount Received (Rp)"] ?? 0);
  const oldReceived = Number(oldRow?.["Amount Received (Rp)"] || 0);
  const delta = newReceived - oldReceived;
  const bankAccount = updates["Bank/Cash Account"] ?? oldRow?.["Bank/Cash Account"];

  // Ada pembayaran baru masuk -> Dr Bank/Cash / Cr Accounts Receivable,
  // sebesar SELISIHNYA aja (support pembayaran cicilan/parsial).
  if (delta > 0 && bankAccount && oldRow) {
    try {
      const [bank, coa] = await Promise.all([
        getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.bank),
        getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.coa),
      ]);
      const cashCode = resolveCashCoaCode(bankAccount, bank as any, coa as any);
      const arCode = findCoaCodeByName(coa as any, "Accounts Receivable");
      await postJournal({
        date: new Date().toISOString().slice(0, 10),
        source: "AR Tracker",
        sourceRef: String(oldRow["Contract/Invoice ID"]),
        description: `Pembayaran invoice ${oldRow["Contract/Invoice ID"]} - ${oldRow.Client}`,
        lines: [
          { accountCode: cashCode, debit: delta },
          { accountCode: arCode, credit: delta },
        ],
      });
    } catch (journalError) {
      console.error("Auto-journal gagal untuk pembayaran AR", rowIndex, journalError);
      return NextResponse.json({
        success: true,
        journalWarning:
          journalError instanceof Error
            ? journalError.message
            : "Pembayaran tersimpan, tapi jurnal otomatis gagal dibuat.",
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

  await deleteSheetRowByIndexInTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.ar, rowIndex);
  return NextResponse.json({ success: true });
}
