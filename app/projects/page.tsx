import { getUserProfile } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import BottomTabBar from "@/components/BottomTabBar";
import DirectorsOverviewBoard from "@/components/dashboards/DirectorsOverviewBoard";

/**
 * LEVEL COMPANY -> PROJECT (bukan bagian dari sistem tab "My Project"/
 * Workspace divisi). Semua role bisa masuk sini -- item checklist yang
 * bisa diubah tetap dibatasi per-PIC di dalam DirectorsOverviewBoard &
 * di server (app/api/proyek/checklist/route.ts).
 */
export default async function ProjectsPage() {
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

  return (
    <div className="flex min-h-screen">
      <Sidebar nama={profile.nama} role={profile.role} />
      <main className="flex-1 min-w-0 px-5 py-8 pb-24 sm:pb-8">
        <div className="w-full">
          <h1 className="font-display text-2xl text-denim-700 mb-1">Projects</h1>
          <p className="text-muted text-sm mb-6">
            Portofolio proyek lintas divisi -- checklist, progress, dan siapa yang di-assign.
          </p>
          <DirectorsOverviewBoard currentUserNama={profile.nama} currentUserRole={profile.role} />
        </div>
      </main>
      <BottomTabBar />
    </div>
  );
}
