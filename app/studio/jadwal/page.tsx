import { createClient } from "@/lib/supabase/server";
import { type Jadwal, hariIni, tambahHari } from "@/lib/produksi";
import KalenderBulan from "@/components/studio/KalenderBulan";
import JadwalList from "@/components/studio/JadwalList";
import TombolTambah from "@/components/studio/TombolTambah";
import { PageHeader } from "@/components/studio/ui";

export default async function JadwalPage({ searchParams }: { searchParams: { bulan?: string } }) {
  const today = hariIni();
  const bulan = /^\d{4}-(0[1-9]|1[0-2])$/.test(searchParams.bulan ?? "") ? searchParams.bulan! : today.slice(0, 7);
  const awal = `${bulan}-01`;
  const [y, m] = bulan.split("-").map(Number);
  const akhir = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);

  const supabase = createClient();
  const [{ data: diBulan }, { data: mendatang }, { data: proyek }] = await Promise.all([
    // Ambil seminggu ekstra di kedua sisi supaya sel bulan sebelah/berikut di grid ikut terisi.
    supabase
      .from("jadwal")
      .select("*")
      .lte("tanggal", tambahHari(akhir, 7))
      .or(`tanggal.gte.${tambahHari(awal, -7)},tanggal_akhir.gte.${tambahHari(awal, -7)}`)
      .order("tanggal"),
    supabase
      .from("jadwal")
      .select("*")
      .neq("status", "selesai")
      .gte("tanggal", today)
      .lte("tanggal", tambahHari(today, 30))
      .order("tanggal"),
    supabase.from("proyek").select("id, nama, status").order("nama"),
  ]);
  const opsi = proyek ?? [];

  return (
    <>
      <PageHeader
        judul="Jadwal produksi"
        sub="Klik tanggal untuk menambah jadwal, klik jadwal untuk mengubah."
        aksi={<TombolTambah jenis="jadwal" label="Jadwal baru" proyek={opsi} />}
      />
      <KalenderBulan bulan={bulan} jadwal={(diBulan ?? []) as Jadwal[]} proyek={opsi} />

      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg text-denim-700">30 hari ke depan</h2>
        <JadwalList jadwal={(mendatang ?? []) as Jadwal[]} proyek={opsi} kosong="Tidak ada jadwal dalam 30 hari ke depan." />
      </section>
    </>
  );
}
