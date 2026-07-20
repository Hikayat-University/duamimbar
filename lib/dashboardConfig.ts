import type { DashboardKey } from "@/lib/permissions";

export const DASHBOARD_CONFIG: Record<
  DashboardKey,
  { title: string; sheetEnvVar: string; emptyLabel: string }
> = {
  directors_overview: {
    title: "Directors Overview",
    sheetEnvVar: "SHEET_ID_PROYEK_PERUSAHAAN",
    emptyLabel: "Belum ada proyek perusahaan tercatat.",
  },
  socmed_overview: {
    title: "Konten Social Media",
    sheetEnvVar: "SHEET_ID_SOCMED_KONTEN",
    emptyLabel: "Belum ada konten yang digarap.",
  },
  socmed_statistik: {
    title: "Statistik Performa",
    sheetEnvVar: "SHEET_ID_SOCMED_STATISTIK",
    emptyLabel: "Belum ada data statistik mingguan.",
  },
  video_editor: {
    title: "Proyek Video Editor",
    sheetEnvVar: "SHEET_ID_VIDEO_EDITOR_PROYEK",
    emptyLabel: "Belum ada proyek yang di-assign.",
  },
  finance_cashflow: {
    title: "Cash Flow",
    sheetEnvVar: "SHEET_ID_FINANCE_CASHFLOW",
    emptyLabel: "Belum ada transaksi tercatat.",
  },
  finance_budget: {
    title: "Budget Planner",
    sheetEnvVar: "SHEET_ID_FINANCE_BUDGET",
    emptyLabel: "Belum ada rancangan anggaran.",
  },
  finance_hutang: {
    title: "Hutang Piutang",
    sheetEnvVar: "SHEET_ID_FINANCE_HUTANG",
    emptyLabel: "Belum ada catatan hutang/piutang.",
  },
  business_overview: {
    title: "Business Overview",
    sheetEnvVar: "SHEET_ID_BUSINESS_OVERVIEW",
    emptyLabel: "Belum ada lini bisnis tercatat.",
  },
  business_flow: {
    title: "Flow Business",
    sheetEnvVar: "SHEET_ID_BUSINESS_FLOW",
    emptyLabel: "Belum ada data revenue/cost.",
  },
};
