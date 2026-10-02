// Isi lewat env var NEXT_PUBLIC_KONTAK_EMAIL & NEXT_PUBLIC_KONTAK_WA (nomor
// format 62xxx). Kalau kosong, barisnya tidak ditampilkan.
const EMAIL = process.env.NEXT_PUBLIC_KONTAK_EMAIL;
const WA = process.env.NEXT_PUBLIC_KONTAK_WA;

export default function SiteFooter() {
  return (
    <footer id="kontak" className="mt-24 bg-denim-900 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:grid-cols-2 sm:px-8">
        <div>
          <p className="font-display text-2xl">Punya cerita yang perlu diproduksi?</p>
          <p className="mt-3 max-w-md text-sm text-white/70">
            Divisi Produksi Duamimbar mengerjakan video, dokumenter, iklan, podcast, dan konten
            media sosial dari tahap ide sampai tayang.
          </p>
        </div>
        {(EMAIL || WA) && (
          <div className="text-sm text-white/80 sm:text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Hubungi kami</p>
            {EMAIL && (
              <a href={`mailto:${EMAIL}`} className="mt-2 block text-lg text-white hover:text-gold-400">
                {EMAIL}
              </a>
            )}
            {WA && (
              <a href={`https://wa.me/${WA}`} className="mt-1 block text-white hover:text-gold-400">
                WhatsApp +{WA}
              </a>
            )}
          </div>
        )}
      </div>
      <p className="border-t border-white/10 py-5 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Duamimbar
      </p>
    </footer>
  );
}
