import { getUserProfile } from "@/lib/supabase/server";
import { getSheetRowsByTab } from "@/lib/sheets";
import type { Role } from "@/lib/permissions";

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
  journal: "Journal Entries",
  budgetRequests: "Budget Requests",
} as const;

/**
 * Nominal minimum yang butuh persetujuan tambahan dari Head Director
 * (setelah disetujui kadiv_finance). Di bawah ini, cukup kadiv_finance.
 * Angka ini asumsi awal -- gampang diubah kalau kurang/kelewat pas.
 */
export const HEAD_DIRECTOR_APPROVAL_THRESHOLD = 5_000_000;

/** Role yang boleh mengajukan Budget Request (pemilik anggaran divisi). */
export const BUDGET_REQUESTER_ROLES: Role[] = ["kadiv_socmed", "kadiv_business"];

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
  "Account Code",
  "Bank/Cash Account",
] as const;
// Catatan: "Outstanding (Rp)" sengaja nggak ada di sini -- itu kolom formula
// (=G-H) di sheet aslinya, biar konsisten jangan pernah ditimpa dari app.
// "Account Code" & "Bank/Cash Account" adalah 2 kolom TAMBAHAN yang harus
// ditambahkan manual di ujung sheet AR Tracker (kolom K & L) -- dipakai
// buat nentuin akun GL yang tepat waktu auto-posting jurnal.

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
  "Account Code",
  "Bank/Cash Account",
] as const;
// "Account Code" & "Bank/Cash Account" adalah 2 kolom TAMBAHAN di ujung
// sheet AP Tracker (kolom J & K) -- sama alasannya kayak AR di atas.

export const JOURNAL_COLUMNS = [
  "Journal ID",
  "Date",
  "Source",
  "Source Ref",
  "Account Code",
  "Debit (Rp)",
  "Credit (Rp)",
  "Description",
] as const;

export const BUDGET_REQUEST_COLUMNS = [
  "Request ID",
  "Date",
  "Requester ID",
  "Requested By",
  "Division",
  "Type",
  "Program",
  "Account Code",
  "Amount (Rp)",
  "Description",
  "Status",
  "Approval Note",
  "Approved By",
  "Approval Date",
] as const;
// Status: Pending -> (nominal < threshold) Approved/Rejected langsung oleh
// kadiv_finance, ATAU (nominal >= threshold) Menunggu Head Director/Rejected
// oleh kadiv_finance -> lalu Approved/Rejected final oleh Head Director.

/** Cari nomor urut BGT- berikutnya berdasarkan ID tertinggi yang sudah ada. */
export async function nextBudgetRequestId() {
  const rows = await getSheetRowsByTab(FINANCE_OS_SHEET_ID, FINANCE_TABS.budgetRequests);
  let max = 0;
  for (const row of rows) {
    const match = String(row["Request ID"] ?? "").match(/^BGT-(\d+)$/);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return `BGT-${String(max + 1).padStart(3, "0")}`;
}

/** Kadiv divisi (bukan Finance) yang boleh mengajukan Budget Request. */
export async function requireBudgetRequester() {
  const profile = await getUserProfile();
  if (!profile) return { profile: null, error: "Belum login." as const };
  if (!BUDGET_REQUESTER_ROLES.includes(profile.role as Role)) {
    return { profile: null, error: "Tidak punya akses." as const };
  }
  return { profile, error: null };
}

/**
 * Siapa yang boleh masuk ke halaman Budget Requests sama sekali: pengaju
 * (lihat punya sendiri), kadiv_finance (approve semua), head_director
 * (approve nominal besar + view semua).
 */
export async function requireBudgetRequestViewer() {
  const profile = await getUserProfile();
  if (!profile) return { profile: null, error: "Belum login." as const };
  const allowed =
    BUDGET_REQUESTER_ROLES.includes(profile.role as Role) ||
    profile.role === "kadiv_finance" ||
    profile.role === "head_director";
  if (!allowed) return { profile: null, error: "Tidak punya akses." as const };
  return { profile, error: null };
}
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
