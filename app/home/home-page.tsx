import { getUserProfile } from "@/lib/supabase/server";
import { getSheetRows } from "@/lib/sheets";
import { canEditHome } from "@/lib/permissions";
import Navbar from "@/components/Navbar";
import HeroHome from "./HeroHome";
import ProyekPerusahaanBoard from "./ProyekPerusahaanBoard";
import OurTeamSection from "./OurTeamSection";

export default async function HomePage() {
  const profile = await getUserProfile();
  const proyek = await getSheetRows(process.env.SHEET_ID_PROYEK_PERUSAHAAN!);
  const bisaEdit = profile ? canEditHome(profile.role) : false;
  const proyekAktif = proyek.filter(
    (p: any) => p.status !== "Selesai" && p.status !== "Done"
  ).length;

  return (
    <div className="min-h-screen">
      <Navbar nama={profile?.nama ?? ""} role={profile?.role} />
      <HeroHome totalProyek={proyek.length} proyekAktif={proyekAktif} />
      <main className="max-w-3xl mx-auto px-5 py-8">
        <ProyekPerusahaanBoard canEdit={bisaEdit} />
        <OurTeamSection />
      </main>
    </div>
  );
}
