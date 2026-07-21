import { getUserProfile } from "@/lib/supabase/server";
import { getAccessibleDashboards } from "@/lib/permissions";
import { DASHBOARD_CONFIG } from "@/lib/dashboardConfig";
import Navbar from "@/components/Navbar";
import DataTable from "@/components/dashboards/DataTable";
import VideoEditorBoard from "@/components/dashboards/VideoEditorBoard";
import BusinessOverviewBoard from "@/components/dashboards/BusinessOverviewBoard";
import BusinessFlowBoard from "@/components/dashboards/BusinessFlowBoard";
import CashFlowBoard from "@/components/dashboards/CashFlowBoard";
import BudgetPlannerBoard from "@/components/dashboards/BudgetPlannerBoard";
import HutangPiutangBoard from "@/components/dashboards/HutangPiutangBoard";
import SocMedKanalBoard from "@/components/dashboards/SocMedKanalBoard";
import SocMedKontenBoard from "@/components/dashboards/SocMedKontenBoard";
import SocMedStatistikBoard from "@/components/dashboards/SocMedStatistikBoard";

export default async function MyPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const profile = await getUserProfile();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted text-sm">
          Profil tidak ditemukan. Hubungi Head Director untuk memastikan akunmu terdaftar
          di tabel <code className="font-mono">users</code>.
        </p>
      </div>
    );
  }

  const dashboards = getAccessibleDashboards(profile.role, profile.akses_tambahan ?? []);
  const activeKey = searchParams.tab ?? dashboards[0]?.key;
  const active = dashboards.find((d) => d.key === activeKey) ?? dashboards[0];
  const config = active ? DASHBOARD_CONFIG[active.key] : null;

  return (
    <div className="min-h-screen">
      <Navbar nama={profile.nama} role={profile.role} />
      <main className="max-w-3xl mx-auto px-5 py-8">
        <h1 className="font-display text-2xl text-denim-700 mb-1">My Page</h1>
        <p className="text-muted text-sm mb-6">
          {profile.divisi} · {profile.nama}
        </p>

        {dashboards.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {dashboards.map((d) => {
              const c = DASHBOARD_CONFIG[d.key];
              const isActive = d.key === active?.key;
              return (
                <a
                  key={d.key}
                  href={`/my-page?tab=${d.key}`}
                  className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                    isActive
                      ? "bg-denim-700 text-white"
                      : "bg-white border border-denim-100 text-denim-900 hover:border-denim-300"
                  }`}
                >
                  {c.title}
                  {!d.canEdit && <span className="ml-1 opacity-60">· lihat saja</span>}
                </a>
              );
            })}
          </div>
        )}

        {config && (
          <section>
            <h2 className="font-display text-lg text-denim-700 mb-3">{config.title}</h2>
            {active?.key === "video_editor" ? (
              <VideoEditorBoard
                currentUserNama={profile.nama}
                canEditAll={profile.role !== "video_editor" && active.canEdit}
              />
            ) : active?.key === "business_overview" ? (
              <BusinessOverviewBoard canEdit={active.canEdit} />
            ) : active?.key === "business_flow" ? (
              <BusinessFlowBoard canEdit={active.canEdit} />
            ) : active?.key === "finance_cashflow" ? (
              <CashFlowBoard canEdit={active.canEdit} />
            ) : active?.key === "finance_budget" ? (
              <BudgetPlannerBoard canEdit={active.canEdit} />
            ) : active?.key === "finance_hutang" ? (
              <HutangPiutangBoard canEdit={active.canEdit} />
            ) : active?.key === "socmed_kanal" ? (
              <SocMedKanalBoard canEdit={active.canEdit} />
            ) : active?.key === "socmed_overview" ? (
              <SocMedKontenBoard canEdit={active.canEdit} />
            ) : active?.key === "socmed_statistik" ? (
              <SocMedStatistikBoard canEdit={active.canEdit} />
            ) : (
              <DataTable sheetEnvVar={config.sheetEnvVar} emptyLabel={config.emptyLabel} />
            )}
          </section>
        )}
      </main>
    </div>
  );
}
