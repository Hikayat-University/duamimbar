import type { DashboardKey } from "@/lib/permissions";

export const DASHBOARD_CONFIG: Record<
  DashboardKey,
  { title: string; sheetEnvVar: string; emptyLabel: string }
> = {
  socmed_hub: {
    title: "Social Media",
    sheetEnvVar: "SHEET_ID_SOCMED_KANAL",
    emptyLabel: "Belum ada kanal yang digarap.",
  },
  proyek_script_writer: {
    title: "Proyek Script Writer",
    sheetEnvVar: "SHEET_ID_SOCMED_PROYEK_WRITER",
    emptyLabel: "Belum ada proyek yang di-assign.",
  },
  proyek_graphic_designer: {
    title: "Proyek Graphic Designer",
    sheetEnvVar: "SHEET_ID_SOCMED_PROYEK_DESIGNER",
    emptyLabel: "Belum ada proyek yang di-assign.",
  },
  video_editor: {
    title: "Proyek Video Editor",
    sheetEnvVar: "SHEET_ID_VIDEO_EDITOR_PROYEK",
    emptyLabel: "Belum ada proyek yang di-assign.",
  },
  admin_posting: {
    title: "Admin — Siap Post",
    sheetEnvVar: "SHEET_ID_SOCMED_KONTEN",
    emptyLabel: "Belum ada konten yang siap diposting.",
  },
  finance_overview: {
    title: "Finance Overview",
    sheetEnvVar: "SHEET_ID_FINANCE_OS",
    emptyLabel: "Belum ada data finance tercatat.",
  },
  finance_transactions: {
    title: "Transactions",
    sheetEnvVar: "SHEET_ID_FINANCE_OS",
    emptyLabel: "Belum ada transaksi tercatat.",
  },
  finance_ar: {
    title: "AR Tracker",
    sheetEnvVar: "SHEET_ID_FINANCE_OS",
    emptyLabel: "Belum ada piutang tercatat.",
  },
  finance_ap: {
    title: "AP Tracker",
    sheetEnvVar: "SHEET_ID_FINANCE_OS",
    emptyLabel: "Belum ada utang tercatat.",
  },
  finance_statements: {
    title: "Financial Statements",
    sheetEnvVar: "SHEET_ID_FINANCE_OS",
    emptyLabel: "Belum ada data jurnal.",
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
