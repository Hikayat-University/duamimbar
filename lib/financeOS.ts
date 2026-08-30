import { getUserProfile } from "@/lib/supabase/server";
import { getSheetRowsByTab } from "@/lib/sheets";

/**
 * Satu spreadsheet, banyak tab -- lihat sheet "README" di workbook Finance
 * OS. ID-nya harus diisi di .env sebagai SHEET_ID_FINANCE_OS.
 */
export const FINANCE_OS_SHEET_ID = process.env.SHEET_ID_FINANCE_OS!;

export const FINANCE_TABS = {
  program: "Program Master",
  revenueStream: "Revenue Stream Master",
  client: "Client Master",
  vendor: "Vendor Master",
  coa: "Chart of Accounts",
  bank: "Bank & Cash Accounts",
  transactions: "Transactions",
  ar: "AR Tracker",
  ap: "AP Tracker",
  budget: "Budget vs Actual",
  dashboard: "Dashboard",
} as const;

export const TRANSACTION_COLUMNS = [
  "Transaction ID",
  "Date",
  "Transaction Type",
  "Account Code",
  "Program ID",
  "Revenue Stream ID",
  "Client/Vendor ID",
  "Description",
  "Amount (Rp)",
  "Bank/Cash Account",
  "PIC",
  "Approval Status",
  "Payment Status",
  "Document/Proof Link",
  "Notes",
] as const;

export const AR_COLUMNS = [
  "Client",
  "Contract/Invoice ID",
  "Program",
  "Revenue Stream",
  "Invoice Date",
  "Due Date",
  "Amount (Rp)",
  "Amount Received (Rp)",
  "Status",
  "Follow-up Date",
] as const;
// Catatan: "Outstanding (Rp)" sengaja nggak ada di sini -- itu kolom formula
// (=G-H) di sheet aslinya, biar konsisten jangan pernah ditimpa dari app.

export const AP_COLUMNS = [
  "Vendor",
  "Bill/Reference",
  "Program",
  "Category",
  "Due Date",
  "Amount (Rp)",
  "Approval",
  "Payment Date",
  "Status",
] as const;

/** Cari nomor urut TRX- berikutnya berdasarkan ID tertinggi yang sudah ada. */
export async function nextTransactionId() {
  const rows = await getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.transactions);
  let max = 0;
  for (const row of rows) {
    const id = String(row["Transaction ID"] ?? "");
    const match = id.match(/^TRX-(\d+)$/);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return `TRX-${String(max + 1).padStart(3, "0")}`;
}

/** Hanya kadiv_finance yang boleh input/ubah data Finance OS (untuk sekarang). */
export async function requireKadivFinance() {
  const profile = await getUserProfile();
  if (!profile) return { profile: null, error: "Belum login." as const };
  if (profile.role !== "kadiv_finance") {
    return { profile: null, error: "Tidak punya akses." as const };
  }
  return { profile, error: null };
}

/**
 * Siapa yang boleh LIHAT data Finance OS: kadiv_finance (pemilik) dan
 * head_director (view-only di semua dashboard, sesuai PRD Bagian 10.1).
 */
export async function requireFinanceViewer() {
  const profile = await getUserProfile();
  if (!profile) return { profile: null, error: "Belum login." as const };
  if (profile.role !== "kadiv_finance" && profile.role !== "head_director") {
    return { profile: null, error: "Tidak punya akses." as const };
  }
  return { profile, error: null };
}
