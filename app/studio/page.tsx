import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  type Jadwal,
  type Laporan,
  type Proyek,
  PROYEK_AKTIF,
  STATUS_PROYEK,
  formatTanggal,
  hariIni,
  labelDari,
  tambahHari,
} from "@/lib/produksi";
import JadwalList from "@/components/studio/JadwalList";
import LaporanList from "@/components/studio/LaporanList";
import TombolTambah from "@/components/studio/TombolTambah";
import { Badge, PageHeader } from "@/components/studio/ui";

export default async function StudioHome() {
  const today = hariIni();
  const supabase = createClient();

  const [{ data: proyek }, { data: jadwal }, { data: laporan }, { count: laporanBulanIni }, { count: karyaTerbit }] =
    await Promise.all([
      supabase.from("proyek").select("*").order("tenggat", { ascending: true, nullsFirst: false }),
      supabase
        .from("jadwal")
        .select("*")
        .neq("status", "selesai")
        .gte("tanggal", today)
        .lte("tanggal", tambahHari(today, 7))
        .order("tanggal"),
      supabase.from("laporan").select("*").order("tanggal", { ascending: false }).order("created_at", { ascending: false }).limit(3),
      supabase.from("laporan").select("id", { count: "exact", head: true }).gte("tanggal", `${today.slice(0, 7)}-01`),
      supabase.from("karya").select("id", { count: "exact", head: true }).eq("terbit", true),
    ]);

  const semua = (proyek ?? []) as Proyek[];
  const aktif = semua.filter((p) => PROYEK_AKTIF.includes(p.status));
  const telat = aktif.filter((p) => p.tenggat && p.tenggat < today);
  const selesaiTahunIni = semua.filter((p) => p.status === "selesai" && p.tanggal_selesai?.startsWith(today.slice(0, 4)));
  const opsi = semua.map((p) => ({ id: p.id, nama: p.nama, status: p.status }));
  const sudahLaporHariIni = ((laporan ?? []) as Laporan[]).some((l) => l.tanggal === today);

  const angka = [
    { n: aktif.length, label: "proyek berjalan", href: "/studio/proyek" },
    { n: (jadwal ?? []).length, label: "jadwal 7 hari ke depan", href: "/studio/jadwal" },
    { n: laporanBulanIni ?? 0, label: "laporan bulan ini", href: "/studio/laporan" },
    { n: selesaiTahunIni.length, label: `proyek selesai ${today.slice(0, 4)}`, href: "/studio/proyek" },
    { n: karyaTerbit ?? 0, label: "karya di portofolio", href: "/studio/portofolio" },
  ];

  return (
    <>
      <PageHeader
        judul="Ringkasan"
        sub={formatTanggal(today, { weekday: "long", month: "long" })}
        aksi={
          <>
            <TombolTambah jenis="jadwal" label="Jadwal" variant="secondary" proyek={opsi} />
            <TombolTambah jenis="laporan" label="Laporan" proyek={opsi} />
          </>
        }
      />

      {!sudahLaporHariIni && (
        <p className="mb-6 rounded-2xl bg-gold-400/15 px-4 py-3 text-sm text-denim-900">
          Belum ada laporan untuk hari ini.
        </p>
      )}

      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {angka.map((a) => (
          <Link key={a.label} href={a.href} className="rounded-2xl border border-denim-100 bg-white p-4 hover:border-denim-300">
            <p className="font-mono text-2xl text-denim-900">{a.n}</p>
            <p className="text-xs text-muted">{a.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-lg text-denim-700">Minggu ini</h2>
            <Link href="/studio/jadwal" className="text-sm text-denim-500 hover:underline">
              Kalender
            </Link>
          </div>
          <JadwalList jadwal={(jadwal ?? []) as Jadwal[]} proyek={opsi} kosong="Tidak ada jadwal dalam 7 hari ke depan." />
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-lg text-denim-700">Proyek berjalan</h2>
            <Link href="/studio/proyek" className="text-sm text-denim-500 hover:underline">
              Semua
            </Link>
          </div>
          {telat.length > 0 && <p className="mb-2 text-sm text-red-600">{telat.length} proyek melewati tenggat.</p>}
          {aktif.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-denim-100 py-10 text-center text-sm text-muted">
              Tidak ada proyek yang sedang berjalan.
            </p>
          ) : (
            <ul className="divide-y divide-denim-100 overflow-hidden rounded-2xl border border-denim-100 bg-white">
              {aktif.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link href={`/studio/proyek/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-denim-900">{p.nama}</p>
                      <p className={`font-mono text-xs ${p.tenggat && p.tenggat < today ? "text-red-600" : "text-muted"}`}>
                        {p.tenggat ? `Tenggat ${formatTanggal(p.tenggat)}` : "Tanpa tenggat"}
                      </p>
                    </div>
                    <Badge nilai={p.status} label={labelDari(STATUS_PROYEK, p.status)} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-lg text-denim-700">Laporan terakhir</h2>
          <Link href="/studio/laporan" className="text-sm text-denim-500 hover:underline">
            Semua laporan
          </Link>
        </div>
        <LaporanList laporan={(laporan ?? []) as Laporan[]} proyek={opsi} />
      </section>
    </>
  );
}
