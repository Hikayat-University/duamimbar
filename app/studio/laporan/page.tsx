import { createClient } from "@/lib/supabase/server";
import { type Laporan, hariIni } from "@/lib/produksi";
import FilterLaporan from "@/components/studio/FilterLaporan";
import LaporanList from "@/components/studio/LaporanList";
import TombolTambah from "@/components/studio/TombolTambah";
import { PageHeader } from "@/components/studio/ui";

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: { bulan?: string; proyek?: string };
}) {
  const bulan = /^\d{4}-(0[1-9]|1[0-2])$/.test(searchParams.bulan ?? "") ? searchParams.bulan! : hariIni().slice(0, 7);
  const [y, m] = bulan.split("-").map(Number);
  const akhir = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  const proyekId = searchParams.proyek ?? "";

  const supabase = createClient();
  let query = supabase
    .from("laporan")
    .select("*")
    .gte("tanggal", `${bulan}-01`)
    .lte("tanggal", akhir)
    .order("tanggal", { ascending: false })
    .order("created_at", { ascending: false });
  if (proyekId) query = query.eq("proyek_id", proyekId);

  const [{ data }, { data: proyek }] = await Promise.all([
    query,
    supabase.from("proyek").select("id, nama, status").order("nama"),
  ]);
  const laporan = (data ?? []) as Laporan[];
  const opsi = proyek ?? [];

  const hariTercatat = new Set(laporan.map((l) => l.tanggal)).size;
  const proyekTersentuh = new Set(laporan.map((l) => l.proyek_id).filter(Boolean)).size;
  const adaKendala = laporan.filter((l) => l.kendala).length;
  const namaBulan = new Date(`${bulan}-01T00:00:00Z`).toLocaleDateString("id-ID", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });
  const namaProyek = opsi.find((p) => p.id === proyekId)?.nama;

  return (
    <>
      <PageHeader
        judul={`Laporan ${namaBulan}`}
        sub={namaProyek ? `Proyek: ${namaProyek}` : "Catatan kerja harian divisi produksi."}
        aksi={<TombolTambah jenis="laporan" label="Catat laporan" proyek={opsi} bawaan={proyekId ? { proyek_id: proyekId } : undefined} />}
      />
      <FilterLaporan bulan={bulan} proyekId={proyekId} proyek={opsi} />

      <div className="mb-8 grid grid-cols-3 gap-3">
        {[
          [laporan.length, "laporan"],
          [hariTercatat, "hari tercatat"],
          [proyekTersentuh, "proyek dikerjakan"],
        ].map(([n, label]) => (
          <div key={label} className="rounded-2xl border border-denim-100 bg-white p-4">
            <p className="font-mono text-2xl text-denim-900">{n}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>
      {adaKendala > 0 && (
        <p className="-mt-4 mb-8 text-sm text-amber-700">{adaKendala} laporan mencatat kendala bulan ini.</p>
      )}

      <LaporanList laporan={laporan} proyek={opsi} kosong="Belum ada laporan di bulan ini." />
    </>
  );
}
