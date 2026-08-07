import Link from "next/link";
import { Users } from "lucide-react";
import { getUserProfile } from "@/lib/supabase/server";
import { getAccessibleDashboards } from "@/lib/permissions";
import Sidebar from "@/components/Sidebar";
import BottomTabBar from "@/components/BottomTabBar";
import LogoutButton from "@/components/LogoutButton";
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
    <div className="flex min-h-screen">
      <Sidebar nama={profile.nama} role={profile.role} />
      <main className="flex-1 min-w-0 px-5 py-8 pb-24 sm:pb-8">
        <div className="max-w-3xl mx-auto">
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

          <div className="mt-6 space-y-2">
            {profile.role === "head_director" && (
              <Link
                href="/admin/users"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-denim-100 bg-white text-denim-900 hover:bg-surface transition-colors"
              >
                <Users size={18} strokeWidth={1.75} className="text-denim-700" />
                <span className="text-sm font-medium">Kelola User</span>
              </Link>
            )}
            <LogoutButton variant="menu" />
          </div>
        </div>
      </main>
      <BottomTabBar />
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
