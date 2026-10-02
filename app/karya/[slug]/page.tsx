import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public";
import { type Karya, embedUrl, thumbnailDari } from "@/lib/produksi";
import SiteHeader from "@/components/portofolio/SiteHeader";
import SiteFooter from "@/components/portofolio/SiteFooter";
import KaryaCard from "@/components/portofolio/KaryaCard";

export const revalidate = 60;

async function ambilKarya(slug: string) {
  const supabase = createPublicClient();
  const { data } = await supabase.from("karya").select("*").eq("slug", slug).eq("terbit", true).maybeSingle();
  return data as Karya | null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const karya = await ambilKarya(params.slug);
  if (!karya) return {};
  const gambar = thumbnailDari(karya);
  return {
    title: `${karya.judul} | Duamimbar Produksi`,
    description: karya.ringkasan ?? undefined,
    openGraph: gambar ? { images: [gambar] } : undefined,
  };
}

export default async function KaryaDetailPage({ params }: { params: { slug: string } }) {
  const karya = await ambilKarya(params.slug);
  if (!karya) notFound();

  const supabase = createPublicClient();
  const { data: lain } = await supabase
    .from("karya")
    .select("*")
    .eq("terbit", true)
    .neq("id", karya.id)
    .order("urutan")
    .limit(3);

  const embed = embedUrl(karya.video_url);
  const gambar = thumbnailDari(karya);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <Link href="/#karya" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-denim-700">
          <ArrowLeft size={15} /> Semua karya
        </Link>

        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-gold-500">{karya.kategori}</p>
        <h1 className="mt-2 font-display text-3xl text-denim-900 sm:text-5xl">{karya.judul}</h1>
        {karya.ringkasan && <p className="mt-4 max-w-2xl text-lg text-muted">{karya.ringkasan}</p>}

        <div className="mt-8 overflow-hidden rounded-2xl bg-denim-900">
          {embed ? (
            <div className="aspect-video">
              <iframe
                src={embed}
                title={karya.judul}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : gambar ? (
            <img src={gambar} alt={karya.judul} className="w-full" />
          ) : null}
        </div>

        <div className="mt-10 grid gap-10 md:grid-cols-[1fr_220px]">
          <div className="whitespace-pre-line leading-relaxed text-denim-900">{karya.deskripsi}</div>
          <dl className="space-y-4 text-sm">
            {karya.klien && (
              <div>
                <dt className="text-muted">Klien</dt>
                <dd className="text-denim-900">{karya.klien}</dd>
              </div>
            )}
            {karya.tahun && (
              <div>
                <dt className="text-muted">Tahun</dt>
                <dd className="font-mono text-denim-900">{karya.tahun}</dd>
              </div>
            )}
            {karya.link_url && (
              <a
                href={karya.link_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-denim-500 underline"
              >
                Tonton / lihat di sumber <ExternalLink size={13} />
              </a>
            )}
          </dl>
        </div>

        {lain && lain.length > 0 && (
          <section className="mt-20 border-t border-denim-100 pt-10">
            <h2 className="mb-6 font-display text-xl text-denim-900">Karya lain</h2>
            <div className="grid gap-8 sm:grid-cols-3">
              {(lain as Karya[]).map((k) => (
                <KaryaCard key={k.id} karya={k} />
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
