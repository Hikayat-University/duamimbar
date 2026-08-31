import { getUserProfile } from "@/lib/supabase/server";
import { getAccessibleDashboards } from "@/lib/permissions";
import { DASHBOARD_CONFIG } from "@/lib/dashboardConfig";
import Sidebar from "@/components/Sidebar";
import BottomTabBar from "@/components/BottomTabBar";
import DataTable from "@/components/dashboards/DataTable";
import VideoEditorBoard from "@/components/dashboards/VideoEditorBoard";
import BusinessOverviewBoard from "@/components/dashboards/BusinessOverviewBoard";
import BusinessFlowBoard from "@/components/dashboards/BusinessFlowBoard";
import FinanceOverviewBoard from "@/components/dashboards/FinanceOverviewBoard";
import FinanceTransactionsBoard from "@/components/dashboards/FinanceTransactionsBoard";
import ARTrackerBoard from "@/components/dashboards/ARTrackerBoard";
import APTrackerBoard from "@/components/dashboards/APTrackerBoard";
import FinancialStatementsBoard from "@/components/dashboards/FinancialStatementsBoard";
import SocMedHubBoard from "@/components/dashboards/SocMedHubBoard";
import ScriptWriterBoard from "@/components/dashboards/ScriptWriterBoard";
import GraphicDesignerBoard from "@/components/dashboards/GraphicDesignerBoard";
import AdminPostingBoard from "@/components/dashboards/AdminPostingBoard";

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
    <div className="flex min-h-screen">
      <Sidebar nama={profile.nama} role={profile.role} />
      <main className="flex-1 min-w-0 px-5 py-8 pb-24 sm:pb-8">
        <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-2xl text-denim-700 mb-1">My Project</h1>
        <p className="text-muted text-sm mb-6">{profile.divisi}</p>

        {dashboards.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-6 -mx-1 px-1">
            {dashboards.map((d) => {
              const c = DASHBOARD_CONFIG[d.key];
              const isActive = d.key === active?.key;
              return (
                <a
                  key={d.key}
                  href={`/my-project?tab=${d.key}`}
                  className={`shrink-0 text-sm px-3.5 py-2 rounded-full whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-denim-900 text-white"
                      : "bg-denim-50 text-denim-700 hover:bg-denim-100"
                  }`}
                >
                  {c.title}
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
                canEditAll={
                  profile.role === "kadiv_socmed" &&
                  (profile.akses_tambahan ?? []).includes("video_editor_dashboard")
                }
                filterToOwn={profile.role === "video_editor"}
              />
            ) : active?.key === "admin_posting" ? (
              <AdminPostingBoard canEdit={active.canEdit} />
            ) : active?.key === "proyek_script_writer" ? (
              <ScriptWriterBoard
                currentUserNama={profile.nama}
                canEditAll={
                  profile.role === "kadiv_socmed" &&
                  (profile.akses_tambahan ?? []).includes("script_writer_dashboard")
                }
                filterToOwn={profile.role === "script_writer"}
              />
            ) : active?.key === "proyek_graphic_designer" ? (
              <GraphicDesignerBoard
                currentUserNama={profile.nama}
                canEditAll={
                  profile.role === "kadiv_socmed" &&
                  (profile.akses_tambahan ?? []).includes("graphic_designer_dashboard")
                }
                filterToOwn={profile.role === "graphic_designer"}
              />
            ) : active?.key === "business_overview" ? (
              <BusinessOverviewBoard canEdit={active.canEdit} />
            ) : active?.key === "business_flow" ? (
              <BusinessFlowBoard canEdit={active.canEdit} />
            ) : active?.key === "finance_overview" ? (
              <FinanceOverviewBoard />
            ) : active?.key === "finance_transactions" ? (
              <FinanceTransactionsBoard canEdit={active.canEdit} />
            ) : active?.key === "finance_ar" ? (
              <ARTrackerBoard canEdit={active.canEdit} />
            ) : active?.key === "finance_ap" ? (
              <APTrackerBoard canEdit={active.canEdit} />
            ) : active?.key === "finance_statements" ? (
              <FinancialStatementsBoard />
            ) : active?.key === "socmed_hub" ? (
              <SocMedHubBoard canEdit={active.canEdit} />
            ) : (
              <DataTable sheetEnvVar={config.sheetEnvVar} emptyLabel={config.emptyLabel} />
            )}
          </section>
        )}
        </div>
      </main>
      <BottomTabBar />
    </div>
  );
}
