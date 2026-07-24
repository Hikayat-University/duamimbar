export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-denim-100 rounded-signature p-4 hover:border-denim-300 transition-colors ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Warna badge status — spektrum merah → biru berdasarkan psikologi warna:
 *   Merah   = butuh perhatian / perlu diperbaiki (revisi, terlambat)
 *   Oranye  = belum mulai (draf, belum dikerjakan, direncanakan)
 *   Kuning  = sedang dikerjakan (proses, aktif berjalan)
 *   Hijau   = progres positif / menunggu keputusan (review, uang masuk)
 *   Biru    = selesai & final (disetujui, lunas, done) — tenang & terpercaya
 * Satu tempat ini nentuin warna di semua tabel & kartu di seluruh app.
 */
const STATUS_TONE: Record<string, string> = {
  // Merah — perlu perhatian
  Revisi: "bg-red-50 text-red-700",
  Keluar: "bg-red-50 text-red-700",
  Cost: "bg-red-50 text-red-700",
  Hutang: "bg-red-50 text-red-700",
  Belum: "bg-orange-50 text-orange-700",

  // Oranye — belum mulai
  Draf: "bg-orange-50 text-orange-700",
  "Belum Dikerjakan": "bg-orange-50 text-orange-700",
  Akan: "bg-orange-50 text-orange-700",
  Menulis: "bg-orange-50 text-orange-700",
  Perencanaan: "bg-orange-50 text-orange-700",

  // Kuning — sedang dikerjakan
  Proses: "bg-amber-50 text-amber-700",
  Sedang: "bg-amber-50 text-amber-700",
  Edited: "bg-amber-50 text-amber-700",
  Berjalan: "bg-amber-50 text-amber-700",

  // Hijau — progres baik / menunggu keputusan / arus positif
  Review: "bg-emerald-50 text-emerald-700",
  Masuk: "bg-emerald-50 text-emerald-700",
  Revenue: "bg-emerald-50 text-emerald-700",
  Piutang: "bg-emerald-50 text-emerald-700",

  // Biru — selesai & final
  Disetujui: "bg-blue-50 text-blue-700",
  Selesai: "bg-blue-50 text-blue-700",
  Done: "bg-blue-50 text-blue-700",
  Sudah: "bg-blue-50 text-blue-700",
  Lunas: "bg-blue-50 text-blue-700",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "bg-surface text-muted";
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${tone}`}>{status}</span>
  );
}
