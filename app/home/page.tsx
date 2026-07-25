import { getUserProfile } from "@/lib/supabase/server";
import { canEditHome } from "@/lib/permissions";
import Navbar from "@/components/Navbar";
import HeroHome from "./HeroHome";
import ProyekPerusahaanBoard from "./ProyekPerusahaanBoard";
import OurTeamSection from "./OurTeamSection";

export default async function HomePage() {
  const profile = await getUserProfile();
  const bisaEdit = profile ? canEditHome(profile.role) : false;

  return (
    <div className="min-h-screen">
      <Navbar nama={profile?.nama ?? ""} role={profile?.role} />
      <HeroHome />

      <div className="mt-10 pl-5 sm:pl-8 lg:pl-[calc((100vw-48rem)/2+1.25rem)]">
        <ProyekPerusahaanBoard canEdit={bisaEdit} />
      </div>

      <main className="max-w-3xl mx-auto px-5 py-8">
        <OurTeamSection />
      </main>
    </div>
  );
}
