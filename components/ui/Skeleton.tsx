/** Skeleton buat grid kartu (mis. grid proyek/kanal sebelum data masuk). */
export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-denim-100 rounded-signature p-4">
          <div className="h-4 w-2/3 bg-denim-100 rounded mb-2" />
          <div className="h-3 w-full bg-denim-50 rounded mb-1.5" />
          <div className="h-3 w-4/5 bg-denim-50 rounded" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton buat baris kartu (mis. list konten/statistik). */
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-denim-100 rounded-signature p-4">
          <div className="h-4 w-1/2 bg-denim-100 rounded mb-2" />
          <div className="h-3 w-1/3 bg-denim-50 rounded mb-3" />
          <div className="h-3 w-full bg-denim-50 rounded" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton buat halaman detail (verdict cards + tabel/list panjang). */
export function DetailSkeleton({ verdictCount = 4 }: { verdictCount?: number }) {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {Array.from({ length: verdictCount }).map((_, i) => (
          <div key={i} className="bg-white border border-denim-100 rounded-signature p-3.5">
            <div className="w-7 h-7 rounded-signature bg-denim-50 mb-2" />
            <div className="h-5 w-10 bg-denim-100 rounded mb-1.5" />
            <div className="h-3 w-16 bg-denim-50 rounded" />
          </div>
        ))}
      </div>
      <div className="border border-denim-100 rounded-signature p-4 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 bg-denim-50 rounded" style={{ width: `${70 + (i % 3) * 8}%` }} />
        ))}
      </div>
    </div>
  );
}
