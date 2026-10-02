import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { type Jadwal, type Laporan, type Proyek, formatTanggal } from "@/lib/produksi";
import ProyekAksi from "@/components/studio/ProyekAksi";
import JadwalList from "@/components/studio/JadwalList";
import LaporanList from "@/components/studio/LaporanList";
import TombolTambah from "@/components/studio/TombolTambah";

export default async function ProyekDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase.from("proyek").select("*").eq("id", params.id).maybeSingle();
  if (!data) notFound();
  const proyek = data as Proyek;

  const [{ data: jadwal }, { data: laporan }] = await Promise.all([
    supabase.from("jadwal").select("*").eq("proyek_id", proyek.id).order("tanggal"),
    supabase.from("laporan").select("*").eq("proyek_id", proyek.id).order("tanggal", { ascending: false }).order("created_at", { ascending: false }),
  ]);
  const opsi = [{ id: proyek.id, nama: proyek.nama }];
  const bawaan = { proyek_id: proyek.id };

  const info = [
    ["Klien", proyek.klien],
    ["Jenis", proyek.jenis],
    ["PIC", proyek.pic],
    ["Mulai", proyek.tanggal_mulai && formatTanggal(proyek.tanggal_mulai)],
    ["Tenggat", proyek.tenggat && formatTanggal(proyek.tenggat)],
    ["Selesai", proyek.tanggal_selesai && formatTanggal(proyek.tanggal_selesai)],
  ].filter(([, v]) => v);

  return (
    <>
      <Link href="/studio/proyek" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-denim-700">
        <ArrowLeft size={15} /> Semua proyek
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-display text-2xl text-denim-700">{proyek.nama}</h1>
        <ProyekAksi proyek={proyek} />
      </div>

      {info.length > 0 && (
        <dl className="mt-5 grid grid-cols-2 gap-4 rounded-2xl border border-denim-100 bg-white p-4 sm:grid-cols-3">
          {info.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="text-sm text-denim-900">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {proyek.catatan && (
        <p className="mt-4 whitespace-pre-line rounded-2xl bg-denim-50 p-4 text-sm text-denim-900">{proyek.catatan}</p>
      )}

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg text-denim-700">Jadwal produksi</h2>
          <TombolTambah jenis="jadwal" label="Jadwal" variant="secondary" proyek={opsi} bawaan={bawaan} />
        </div>
        <JadwalList jadwal={(jadwal ?? []) as Jadwal[]} proyek={opsi} tampilkanProyek={false} kosong="Belum ada jadwal untuk proyek ini." />
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg text-denim-700">Laporan</h2>
          <TombolTambah jenis="laporan" label="Laporan" variant="secondary" proyek={opsi} bawaan={bawaan} />
        </div>
        <LaporanList laporan={(laporan ?? []) as Laporan[]} proyek={opsi} tampilkanProyek={false} kosong="Belum ada laporan untuk proyek ini." />
      </section>
    </>
  );
}
