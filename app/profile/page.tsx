import { getUserProfile } from "@/lib/supabase/server";
import { getAccessibleDashboards } from "@/lib/permissions";
import Navbar from "@/components/Navbar";
import ProfileEditor from "./ProfileEditor";

export default async function ProfilePage() {
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
  const roleLabel = ROLE_LABELS[profile.role] ?? profile.role;

  return (
    <div className="min-h-screen">
      <Navbar nama={profile.nama} role={profile.role} />
      <main className="max-w-3xl mx-auto px-5 py-8">
        <ProfileEditor
          nama={profile.nama}
          email={profile.email}
          divisi={profile.divisi}
          roleLabel={roleLabel}
          avatarUrl={profile.avatar_url ?? ""}
          bio={profile.bio ?? ""}
          projectCount={dashboards.length}
          createdAt={profile.created_at}
        />
      </main>
    </div>
  );
}

const ROLE_LABELS: Record<string, string> = {
  head_director: "Head Director",
  kadiv_socmed: "Kepala Divisi Social Media",
  script_writer: "Script Writer",
  graphic_designer: "Graphic Designer",
  video_editor: "Video Editor",
  kadiv_finance: "Kepala Divisi Finance",
  kadiv_business: "Kepala Divisi Business",
};
