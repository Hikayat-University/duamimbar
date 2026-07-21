import { getUserProfile } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import UserManagementBoard from "./UserManagementBoard";

export default async function UsersAdminPage() {
  const profile = await getUserProfile();

  if (!profile || profile.role !== "head_director") {
    return (
      <div className="min-h-screen">
        <Navbar nama={profile?.nama ?? ""} role={profile?.role} />
        <main className="max-w-3xl mx-auto px-5 py-8">
          <p className="text-sm text-muted">
            Halaman ini khusus Head Director.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar nama={profile.nama} role={profile.role} />
      <main className="max-w-3xl mx-auto px-5 py-8">
        <h1 className="font-display text-2xl text-denim-700 mb-1">Kelola User</h1>
        <p className="text-muted text-sm mb-6">
          Semua akun yang terdaftar, termasuk yang daftar sendiri lewat halaman sign-up.
        </p>
        <UserManagementBoard />
      </main>
    </div>
  );
}
