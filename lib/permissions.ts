export type Role =
  | "head_director"
  | "kadiv_socmed"
  | "video_editor"
  | "kadiv_finance"
  | "kadiv_business";

export type DashboardKey =
  | "directors_overview"
  | "socmed_kanal"
  | "socmed_overview"
  | "socmed_statistik"
  | "video_editor"
  | "finance_cashflow"
  | "finance_budget"
  | "finance_hutang"
  | "business_overview"
  | "business_flow";

/** Dashboard bawaan tiap role di halaman My Page (lihat PRD Bagian 3). */
const DEFAULT_DASHBOARDS: Record<Role, DashboardKey[]> = {
  head_director: ["directors_overview"],
  kadiv_socmed: ["socmed_kanal", "socmed_overview", "socmed_statistik"],
  video_editor: ["video_editor"],
  kadiv_finance: ["finance_cashflow", "finance_budget", "finance_hutang"],
  kadiv_business: ["business_overview", "business_flow"],
};

/**
 * Akses lintas divisi. Head Director selalu view-only di semua dashboard
 * (PRD Bagian 10.1). Kadiv lain sesuai kolom akses_tambahan di tabel users.
 */
export function getAccessibleDashboards(
  role: Role,
  aksesTambahan: string[] = []
): { key: DashboardKey; canEdit: boolean }[] {
  const own = DEFAULT_DASHBOARDS[role].map((key) => ({ key, canEdit: true }));

  if (role === "head_director") {
    const semuaDashboard: DashboardKey[] = [
      "socmed_kanal",
      "socmed_overview",
      "socmed_statistik",
      "video_editor",
      "finance_cashflow",
      "finance_budget",
      "finance_hutang",
      "business_overview",
      "business_flow",
    ];
    return [
      ...own,
      ...semuaDashboard.map((key) => ({ key, canEdit: false })),
    ];
  }

  const tambahan: { key: DashboardKey; canEdit: boolean }[] = [];
  if (aksesTambahan.includes("video_editor_dashboard")) {
    tambahan.push({ key: "video_editor", canEdit: true });
  }
  if (aksesTambahan.includes("business_overview_dashboard")) {
    tambahan.push({ key: "business_overview", canEdit: true });
  }
  if (aksesTambahan.includes("flow_business_dashboard")) {
    // Finance hanya view + komentar di Flow Business (final say di Business Manager)
    tambahan.push({ key: "business_flow", canEdit: false });
  }
  if (aksesTambahan.includes("budget_planner_dashboard")) {
    tambahan.push({ key: "finance_budget", canEdit: true });
  }

  return [...own, ...tambahan];
}

export function canEditHome(role: Role) {
  return role === "head_director";
}
