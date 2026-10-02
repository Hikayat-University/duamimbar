import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import type { Karya } from "@/lib/produksi";
import SiteHeader from "@/components/portofolio/SiteHeader";
import SiteFooter from "@/components/portofolio/SiteFooter";
import KaryaCard from "@/components/portofolio/KaryaCard";
import KaryaGallery from "@/components/portofolio/KaryaGallery";

export const revalidate = 60;

export default async function PortofolioPage() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("karya")
    .select("*")
    .eq("terbit", true)
    .order("urutan", { ascending: true })
    .order("tahun", { ascending: false, nullsFirst: false });
  if (error) console.error("Gagal memuat karya:", error.message);

  const karya = (data ?? []) as Karya[];
  const unggulan = karya.filter((k) => k.unggulan).slice(0, 2);
  const kategori = new Set(karya.map((k) => k.kategori)).size;

  return (
    <>
      <section className="relative h-[88vh] min-h-[520px] overflow-hidden bg-denim-900">
        <SiteHeader overlay />
        <img src="/hero-duamimbar.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-denim-900 via-denim-900/30 to-denim-900/50" />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-5 pb-16 sm:px-8 sm:pb-24">
          <p className="text-xs uppercase tracking-[0.25em] text-gold-400">Divisi Produksi</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-white sm:text-6xl">
            Karya media Duamimbar, dari naskah sampai tayang.
          </h1>
          {karya.length > 0 && (
            <p className="mt-6 font-mono text-sm text-white/70">
              {karya.length} karya · {kategori} kategori
            </p>
          )}
          <Link
            href="#karya"
            className="mt-8 w-fit rounded-full bg-white px-5 py-2.5 text-sm font-medium text-denim-900 hover:bg-gold-400"
          >
            Lihat karya
          </Link>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        {unggulan.length > 0 && (
          <section className="pt-20">
            <h2 className="mb-6 text-xs uppercase tracking-[0.2em] text-muted">Pilihan</h2>
            <div className="grid gap-8 md:grid-cols-2">
              {unggulan.map((k) => (
                <KaryaCard key={k.id} karya={k} besar />
              ))}
            </div>
          </section>
        )}

        <section id="karya" className="scroll-mt-8 pt-20">
          <h2 className="mb-6 font-display text-3xl text-denim-900">Semua karya</h2>
          {karya.length ? (
            <KaryaGallery karya={karya} />
          ) : (
            <p className="rounded-2xl border border-dashed border-denim-100 py-16 text-center text-sm text-muted">
              Portofolio sedang disiapkan.
            </p>
          )}
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
