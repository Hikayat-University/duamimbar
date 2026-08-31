import { getSheetRowsByTab, appendSheetRowsToTab } from "@/lib/sheets";
import { FINANCE_OS_SHEET_ID, FINANCE_TABS } from "@/lib/financeOS";

export type JournalLine = {
  accountCode: string;
  debit?: number;
  credit?: number;
};

/** Cari nomor urut JRN- berikutnya berdasarkan ID tertinggi yang sudah ada. */
async function nextJournalId() {
  const rows = await getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.journal);
  let max = 0;
  for (const row of rows) {
    const match = String(row["Journal ID"] ?? "").match(/^JRN-(\d+)$/);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return `JRN-${String(max + 1).padStart(6, "0")}`;
}

/**
 * Posting satu jurnal double-entry (2 baris atau lebih) ke tab "Journal
 * Entries". Total debit HARUS sama dengan total kredit -- kalau nggak,
 * dilempar error dan TIDAK ADA yang ditulis (dicek dulu sebelum nulis apa
 * pun, supaya nggak ada jurnal timpang yang lolos ke sheet).
 */
export async function postJournal(params: {
  date: string;
  source: "Transaction" | "AR Tracker" | "AP Tracker";
  sourceRef: string;
  description: string;
  lines: JournalLine[];
}) {
  const { date, source, sourceRef, description, lines } = params;

  const totalDebit = lines.reduce((sum, l) => sum + (l.debit ?? 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (l.credit ?? 0), 0);

  // Toleransi pembulatan kecil (floating point), bukan nol pas.
  if (Math.abs(totalDebit - totalCredit) > 0.5) {
    throw new Error(
      `Jurnal tidak balance: debit ${totalDebit} != kredit ${totalCredit} (sumber: ${source} ${sourceRef}).`
    );
  }
  if (lines.length < 2) {
    throw new Error("Jurnal minimal harus punya 2 baris (debit & kredit).");
  }

  const id = await nextJournalId();
  const rows = lines.map((l) => [
    id,
    date,
    source,
    sourceRef,
    l.accountCode,
    l.debit ?? "",
    l.credit ?? "",
    description,
  ]);

  await appendSheetRowsToTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.journal, rows);
  return id;
}

type CoaRow = { "Account Code": string; "Account Name": string; Class: string };

/** Cari Account Code di Chart of Accounts berdasarkan nama akun persis
 * (dipakai buat nemuin kode akun "Accounts Receivable"/"Accounts Payable"/
 * "Cash"/"Bank" secara dinamis, bukan di-hardcode). */
export function findCoaCodeByName(coa: CoaRow[], accountName: string): string {
  const row = coa.find((c) => c["Account Name"] === accountName);
  if (!row) throw new Error(`Akun "${accountName}" tidak ditemukan di Chart of Accounts.`);
  return row["Account Code"];
}

type BankRow = { "Account ID": string; Type: string };

/** Dari Account ID di "Bank & Cash Accounts" (mis. BNK-001), cari tau ini
 * tipe Bank atau Cash, lalu balikin Account Code CoA yang sesuai (1200
 * Bank / 1100 Cash secara dinamis lewat nama akun, bukan hardcode kode). */
export function resolveCashCoaCode(
  bankAccountId: string,
  bank: BankRow[],
  coa: CoaRow[]
): string {
  const bankRow = bank.find((b) => b["Account ID"] === bankAccountId);
  if (!bankRow) throw new Error(`Bank/Cash Account "${bankAccountId}" tidak ditemukan.`);
  const accountName = bankRow.Type === "Cash" ? "Cash" : "Bank";
  return findCoaCodeByName(coa, accountName);
}
