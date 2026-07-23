import { getUserProfile } from "@/lib/supabase/server";
import { getAccessibleDashboards } from "@/lib/permissions";
import { DASHBOARD_CONFIG } from "@/lib/dashboardConfig";
import { DASHBOARD_ICONS } from "@/lib/dashboardIcons";
import { Eye, Check } from "lucide-react";
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
import ScriptWriterBoard from "@/components/dashboards/ScriptWriterBoard";
import GraphicDesignerBoard from "@/components/dashboards/GraphicDesignerBoard";

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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-7">
            {dashboards.map((d) => {
              const c = DASHBOARD_CONFIG[d.key];
              const Icon = DASHBOARD_ICONS[d.key];
              const isActive = d.key === active?.key;
              return (
                <a
                  key={d.key}
                  href={`/my-page?tab=${d.key}`}
                  className={`relative flex flex-col justify-between h-28 sm:h-32 rounded-2xl p-4 shadow-md transition-colors ${
                    isActive
                      ? "bg-denim-900"
                      : "bg-denim-700 hover:bg-denim-500"
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-3 right-3 flex items-center justify-center w-5 h-5 rounded-full bg-gold-400">
                      <Check size={12} strokeWidth={3} className="text-denim-900" />
                    </span>
                  )}
                  {!d.canEdit && !isActive && (
                    <Eye size={14} strokeWidth={1.75} className="absolute top-3.5 right-3.5 text-white/50" />
                  )}

                  <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15">
                    <Icon size={18} strokeWidth={1.75} className="text-white" />
                  </span>

                  <span className="text-white text-sm font-medium leading-tight pr-4">
                    {c.title}
                  </span>
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
