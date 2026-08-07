import { getUserProfile } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import CalendarView from "@/components/CalendarView";

/**
 * Halaman kalender konten — sengaja BUKAN bagian dari sistem dashboard
 * per-role (lib/permissions.ts). Semua orang yang login bisa lihat,
 * karena ini cuma nampilin ulang jadwal publish yang udah ada, nggak ada
 * data sensitif per-divisi di sini.
 */
export default async function CalendarPage() {
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
      <main className="flex-1 min-w-0 px-5 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-display text-2xl text-denim-700 mb-1">Kalender Konten</h1>
          <p className="text-muted text-sm mb-6">
            Jadwal publish semua konten social media, lintas divisi.
          </p>
          <CalendarView canCreate={profile.role === "kadiv_socmed"} />
        </div>
      </main>
    </div>
  );
}
