import { getUserProfile } from "@/lib/supabase/server";
import { getSheetRows } from "@/lib/sheets";
import { canEditHome } from "@/lib/permissions";
import Navbar from "@/components/Navbar";
import { Card, StatusBadge } from "@/components/ui/Card";
import NewProjectForm from "./NewProjectForm";
import HeroHome from "./HeroHome";

export default async function HomePage() {
  const profile = await getUserProfile();
  const proyek = await getSheetRows(process.env.SHEET_ID_PROYEK_PERUSAHAAN!);
  const bisaEdit = profile ? canEditHome(profile.role) : false;
  const proyekAktif = proyek.filter(
    (p: any) => p.status !== "Selesai" && p.status !== "Done"
  ).length;

  return (
    <div className="min-h-screen">
      <Navbar nama={profile?.nama ?? ""} />
      <HeroHome totalProyek={proyek.length} proyekAktif={proyekAktif} />
      <main className="max-w-3xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl text-denim-700">Proyek Perusahaan</h1>
            <p className="text-muted text-sm mt-0.5">
              Semua proyek yang sedang berjalan di seluruh tim.
            </p>
          </div>
          {bisaEdit && <NewProjectForm />}
        </div>

        {proyek.length === 0 ? (
          <p className="text-muted text-sm">
            Belum ada proyek yang tercatat. {bisaEdit && "Tambahkan proyek pertama di atas."}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {proyek.map((p: any) => (
              <Card key={p.id_proyek}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-medium text-denim-900">{p.nama_proyek}</h3>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-sm text-muted line-clamp-2 mb-2">{p.deskripsi}</p>
                <p className="text-xs text-muted font-mono">{p.divisi_terlibat}</p>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
