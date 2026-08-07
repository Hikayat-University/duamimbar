import { getUserProfile } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import UserManagementBoard from "./UserManagementBoard";

export default async function UsersAdminPage() {
  const profile = await getUserProfile();

  if (!profile || profile.role !== "head_director") {
    return (
      <div className="flex min-h-screen">
        <Sidebar nama={profile?.nama ?? ""} role={profile?.role} />
        <main className="flex-1 min-w-0 px-5 py-8">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-muted">Halaman ini khusus Head Director.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar nama={profile.nama} role={profile.role} />
      <main className="flex-1 min-w-0 px-5 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-2xl text-denim-700 mb-1">Kelola User</h1>
          <p className="text-muted text-sm mb-6">
            Semua akun yang terdaftar, termasuk yang daftar sendiri lewat halaman sign-up.
          </p>
          <UserManagementBoard />
        </div>
      </main>
    </div>
  );
}
