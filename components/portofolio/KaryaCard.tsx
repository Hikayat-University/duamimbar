import Link from "next/link";
import { Play } from "lucide-react";
import { type Karya, thumbnailDari } from "@/lib/produksi";

export default function KaryaCard({ karya, besar = false }: { karya: Karya; besar?: boolean }) {
  const thumb = thumbnailDari(karya);
  return (
    <Link href={`/karya/${karya.slug}`} className="group block">
      <div
        className={`relative overflow-hidden rounded-2xl bg-denim-100 ${besar ? "aspect-[16/10]" : "aspect-video"}`}
      >
        {thumb ? (
          <img
            src={thumb}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-3xl text-denim-300">
            {karya.judul.slice(0, 1)}
          </div>
        )}
        {karya.video_url && (
          <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-denim-900">
            <Play size={15} fill="currentColor" />
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className={`font-display text-denim-900 group-hover:text-denim-500 ${besar ? "text-xl" : "text-base"}`}>
          {karya.judul}
        </h3>
        {karya.tahun && <span className="shrink-0 font-mono text-xs text-muted">{karya.tahun}</span>}
      </div>
      <p className="mt-0.5 text-sm text-muted">
        {karya.kategori}
        {karya.klien ? ` · ${karya.klien}` : ""}
      </p>
    </Link>
  );
}
