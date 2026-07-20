/**
 * HeroHome — bagian hero untuk /home (Duamimbar).
 *
 * Cara pakai: taruh <HeroHome totalProyek={proyek.length} proyekAktif={n} />
 * di app/home/page.tsx, tepat di bawah <Navbar /> dan sebelum section
 * "Proyek Perusahaan" yang sudah ada. Datanya diambil dari sheet yang
 * sama yang sudah di-fetch di page.tsx, jadi tidak perlu diisi manual.
 */

const DIVISIONS = [
  "Direksi",
  "Social Media",
  "Video Editor",
  "Finance",
  "Business",
]; // sesuaikan kalau ada perubahan struktur divisi

export default function HeroHome({
  totalProyek,
  proyekAktif,
}: {
  totalProyek: number;
  proyekAktif: number;
}) {
  const STATS = [
    { value: String(proyekAktif), label: "Proyek berjalan" },
    { value: String(totalProyek), label: "Total proyek" },
  ];

  return (
    <section className="relative overflow-hidden bg-denim-900">
      {/* Glow ganda di belakang headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/4 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(74,108,148,0.55) 0%, rgba(154,182,210,0.25) 45%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-24 h-[320px] w-[320px] -translate-x-1/2 rounded-full border border-denim-500/30"
      />

      <div className="relative mx-auto max-w-3xl px-5 pb-16 pt-20 text-center">
        <p className="mb-4 text-xs uppercase tracking-[0.2em] text-denim-300">
          Duamimbar · Portal Tim
        </p>

        <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl">
          Satu ruang untuk{" "}
          <span className="text-denim-300">seluruh tim</span> dan{" "}
          <span className="text-denim-300">proyek</span> berjalan
        </h1>

        <p className="mx-auto mt-4 max-w-md font-sans text-sm text-white/60">
          Pantau progres, akses dashboard divisi, dan lihat apa yang sedang
          dikerjakan tim — semuanya dari satu halaman.
        </p>

        <div className="mt-10 flex items-center justify-center gap-10">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="font-display text-2xl text-white">{s.value}</p>
              <p className="mt-1 text-xs text-white/50">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strip divisi — daftar divisi nyata, bukan dekorasi */}
      <div className="relative border-t border-white/10 bg-denim-900/80 py-4">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2 px-5">
          {DIVISIONS.map((d) => (
            <span
              key={d}
              className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70"
            >
              {d}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
