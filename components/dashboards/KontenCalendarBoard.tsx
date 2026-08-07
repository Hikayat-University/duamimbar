"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Konten = {
  id_konten: string;
  id_kanal: string;
  judul_konten: string;
  status: string;
  tanggal_publish: string;
  assigned_script_writer: string;
  assigned_graphic_designer: string;
  assigned_editor: string;
};
type Kanal = { id_kanal: string; nama_kanal: string; platform: string };

const HARI_SINGKAT = ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"];

/**
 * Warna BLOK solid per status (beda dari StatusBadge yang cuma badge tipis) —
 * biar kartunya kerasa kayak "balok" kalender sungguhan, bukan list card
 * biasa. Tetap ikut spektrum merah->biru yang sama.
 */
const BLOK_STATUS: Record<string, string> = {
  Akan: "bg-orange-100 border-orange-200 text-orange-900",
  Sedang: "bg-amber-100 border-amber-200 text-amber-900",
  "Siap Post": "bg-emerald-100 border-emerald-200 text-emerald-900",
  Sudah: "bg-blue-100 border-blue-200 text-blue-900",
  Revisi: "bg-red-100 border-red-200 text-red-900",
};

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function awalMinggu(d: Date) {
  const hasil = new Date(d);
  const hari = hasil.getDay();
  const geser = hari === 0 ? -6 : 1 - hari;
  hasil.setDate(hasil.getDate() + geser);
  hasil.setHours(0, 0, 0, 0);
  return hasil;
}

export default function KontenCalendarBoard() {
  const [kontenList, setKontenList] = useState<Konten[]>([]);
  const [kanalList, setKanalList] = useState<Kanal[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => awalMinggu(new Date()));
  const [selected, setSelected] = useState<Konten | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      fetch("/api/socmed/konten").then((res) => res.json()),
      fetch("/api/socmed/kanal").then((res) => res.json()),
    ]).then(([kontenResult, kanalResult]) => {
      if (kontenResult.status === "fulfilled") setKontenList(kontenResult.value);
      if (kanalResult.status === "fulfilled") setKanalList(kanalResult.value);
      setLoading(false);
    });
  }, []);

  function namaKanal(id: string) {
    return kanalList.find((k) => k.id_kanal === id)?.nama_kanal ?? "";
  }

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekStart]
  );

  const todayISO = toISODate(new Date());
  const labelMinggu = `${days[0].toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - ${days[6].toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`;

  function gantiMinggu(arah: 1 | -1) {
    const baru = new Date(weekStart);
    baru.setDate(baru.getDate() + arah * 7);
    setWeekStart(baru);
    setSelected(null);
  }

  if (loading) return <p className="text-sm text-muted">Memuat kalender...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => gantiMinggu(-1)}
          className="p-2 rounded-lg border border-denim-100 text-denim-700 hover:bg-surface shrink-0"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="text-sm font-medium text-denim-900">{labelMinggu}</p>
          <button
            onClick={() => {
              setWeekStart(awalMinggu(new Date()));
              setSelected(null);
            }}
            className="text-xs text-denim-500 underline mt-0.5"
          >
            Minggu ini
          </button>
        </div>
        <button
          onClick={() => gantiMinggu(1)}
          className="p-2 rounded-lg border border-denim-100 text-denim-700 hover:bg-surface shrink-0"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Grid kalender -- geser ke samping di HP, snap per kolom hari */}
      <div className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {days.map((d, i) => {
          const iso = toISODate(d);
          const isToday = iso === todayISO;
          const kontenHariIni = kontenList.filter((k) => k.tanggal_publish === iso);

          return (
            <div
              key={iso}
              className="shrink-0 w-[150px] snap-start rounded-2xl border border-denim-100 bg-white overflow-hidden"
            >
              <div
                className={`px-2.5 py-2 text-center border-b border-denim-100 ${
                  isToday ? "bg-denim-700 text-white" : "bg-surface text-denim-700"
                }`}
              >
                <p className="text-[10px] font-medium tracking-wide">{HARI_SINGKAT[i]}</p>
                <p className="text-sm font-display leading-none mt-0.5">{d.getDate()}</p>
              </div>

              <div className="p-1.5 space-y-1.5 min-h-[80px]">
                {kontenHariIni.length === 0 ? (
                  <p className="text-[10px] text-muted text-center py-3">-</p>
                ) : (
                  kontenHariIni.map((k) => (
                    <button
                      key={k.id_konten}
                      onClick={() => setSelected(k)}
                      className={`w-full text-left rounded-lg border px-2 py-1.5 transition-transform active:scale-95 ${
                        BLOK_STATUS[k.status] ?? "bg-surface border-denim-100 text-denim-900"
                      }`}
                    >
                      <p className="text-[11px] font-medium leading-snug line-clamp-2">
                        {k.judul_konten}
                      </p>
                      {namaKanal(k.id_kanal) && (
                        <p className="text-[9px] opacity-70 font-mono mt-0.5 truncate">
                          {namaKanal(k.id_kanal)}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted mt-2 sm:hidden">← geser buat lihat hari lain →</p>

      {kontenList.filter((k) => !k.tanggal_publish).length > 0 && (
        <p className="text-xs text-muted mt-4 pt-3 border-t border-denim-100">
          {kontenList.filter((k) => !k.tanggal_publish).length} konten belum ada tanggal publish
          (nggak muncul di kalender).
        </p>
      )}

      {/* Detail konten yang di-tap */}
      {selected && (
        <div
          className="fixed inset-0 bg-denim-900/40 flex items-center justify-center p-5 z-20"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-signature p-5 w-full max-w-sm space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-display text-lg text-denim-700">{selected.judul_konten}</h2>
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded-full shrink-0 ${
                  BLOK_STATUS[selected.status] ?? "bg-surface text-muted"
                }`}
              >
                {selected.status}
              </span>
            </div>
            <p className="text-xs text-muted font-mono">{namaKanal(selected.id_kanal)}</p>
            <p className="text-sm text-denim-900 pt-2">
              Target publish: <span className="font-medium">{selected.tanggal_publish}</span>
            </p>
            <p className="text-sm text-muted">
              Writer: {selected.assigned_script_writer || "-"}
              <br />
              Designer: {selected.assigned_graphic_designer || "-"}
              <br />
              Editor: {selected.assigned_editor || "-"}
            </p>
            <button
              onClick={() => setSelected(null)}
              className="w-full mt-2 text-sm py-2 rounded-lg border border-denim-100 text-denim-900"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
