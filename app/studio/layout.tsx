import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStudioAccess } from "@/lib/supabase/server";
import StudioNav from "@/components/studio/StudioNav";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "Studio | Duamimbar Produksi",
  robots: { index: false },
};

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const { user, isAnggota } = await getStudioAccess();
  if (!user) redirect("/login");

  if (!isAnggota) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <h1 className="font-display text-xl text-denim-700">Akun belum terdaftar</h1>
          <p className="mt-2 text-sm text-muted">
            {user.email} belum ada di daftar anggota studio. Tambahkan lewat tabel{" "}
            <code className="font-mono">anggota_studio</code> di Supabase.
          </p>
          <div className="mt-6 flex justify-center">
            <LogoutButton variant="menu" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen">
      <StudioNav email={user.email ?? ""} />
      <main className="min-w-0 flex-1 px-5 py-8 pb-24 sm:px-8 sm:pb-10 print:p-0">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
