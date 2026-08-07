import { getUserProfile } from "@/lib/supabase/server";
import { canEditHome } from "@/lib/permissions";
import Sidebar from "@/components/Sidebar";
import HeroHome from "./HeroHome";
import ProyekPerusahaanBoard from "./ProyekPerusahaanBoard";
import OurTeamSection from "./OurTeamSection";

export default async function HomePage() {
  const profile = await getUserProfile();
  const bisaEdit = profile ? canEditHome(profile.role) : false;

  return (
    <div className="flex min-h-screen">
      <Sidebar nama={profile?.nama ?? ""} role={profile?.role} />
      <div className="flex-1 min-w-0">
        <HeroHome />

        {/* Gallery proyek full-width area yang tersisa — sengaja di luar
            max-w-3xl biar horizontal scroll-nya punya ruang. */}
        <div className="mt-10 pl-5 sm:pl-8">
          <ProyekPerusahaanBoard canEdit={bisaEdit} />
        </div>

        <main className="max-w-3xl mx-auto px-5 py-8">
          <OurTeamSection />
        </main>
      </div>
    </div>
  );
}
