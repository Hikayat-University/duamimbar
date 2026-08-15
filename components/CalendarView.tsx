"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

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
type WriterProyek = { id_konten: string; jadwal_posting: string };

type ViewMode = "daily" | "weekly" | "monthly";

const HARI_SINGKAT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const HARI_HURUF = ["S", "S", "R", "K", "J", "S", "M"];
const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const START_HOUR = 7;
const END_HOUR = 22;
const HOUR_HEIGHT = 56; // px
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

/** Warna blok solid per status — spektrum merah->biru, konsisten sama StatusBadge. */
const BLOK_STATUS: Record<string, string> = {
  Akan: "bg-orange-100 border-orange-300 text-orange-900",
  Sedang: "bg-amber-100 border-amber-300 text-amber-900",
  "Siap Post": "bg-emerald-100 border-emerald-300 text-emerald-900",
  Sudah: "bg-blue-100 border-blue-300 text-blue-900",
  Revisi: "bg-red-100 border-red-300 text-red-900",
};
const DOT_STATUS: Record<string, string> = {
  Akan: "bg-orange-400",
  Sedang: "bg-amber-400",
  "Siap Post": "bg-emerald-400",
  Sudah: "bg-blue-400",
  Revisi: "bg-red-400",
};

// Semua helper tanggal SENGAJA pakai komponen tanggal lokal (getFullYear/
// getMonth/getDate), BUKAN toISOString() -- toISOString() konversi ke UTC
// dan bisa geser mundur 1 hari buat waktu WIB (UTC+7) di dekat tengah malam.
function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function startOfWeek(d: Date) {
  const r = new Date(d);
  const hari = r.getDay();
  const geser = hari === 0 ? -6 : 1 - hari;
  r.setDate(r.getDate() + geser);
  r.setHours(0, 0, 0, 0);
  return r;
}
function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export default function CalendarView({ canCreate }: { canCreate: boolean }) {
  const [kontenList, setKontenList] = useState<Konten[]>([]);
  const [kanalList, setKanalList] = useState<Kanal[]>([]);
  const [writerProyekList, setWriterProyekList] = useState<WriterProyek[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [miniCalMonth, setMiniCalMonth] = useState(() => new Date());
  const [detail, setDetail] = useState<Konten | null>(null);

  useEffect(() => {
    Promise.allSettled([
      fetch("/api/socmed/konten").then((res) => res.json()),
      fetch("/api/socmed/kanal").then((res) => res.json()),
      fetch("/api/socmed/proyek-writer").then((res) => res.json()),
    ]).then(([kontenResult, kanalResult, writerResult]) => {
      if (kontenResult.status === "fulfilled") setKontenList(kontenResult.value);
      if (kanalResult.status === "fulfilled") setKanalList(kanalResult.value);
      if (writerResult.status === "fulfilled") setWriterProyekList(writerResult.value);
      setLoading(false);
    });
  }, []);

  function namaKanal(id: string) {
    return kanalList.find((k) => k.id_kanal === id)?.nama_kanal ?? "";
  }

  /**
   * Waktu efektif tiap konten buat ditaruh di grid jam: pakai jadwal_posting
   * dari Script Writer kalau udah diisi (paling akurat), fallback ke
   * tanggal_publish + jam 19:00 (kebiasaan posting rutin).
   */
  function waktuEfektif(k: Konten): Date | null {
    const writerRow = writerProyekList.find((w) => w.id_konten === k.id_konten);
    if (writerRow?.jadwal_posting) {
      const d = new Date(writerRow.jadwal_posting);
      if (!isNaN(d.getTime())) return d;
    }
    if (k.tanggal_publish) {
      const d = new Date(`${k.tanggal_publish}T19:00:00`);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  }

  const kontenBerwaktu = useMemo(
    () =>
      kontenList
        .map((k) => ({ konten: k, waktu: waktuEfektif(k) }))
        .filter((x): x is { konten: Konten; waktu: Date } => x.waktu !== null),
    [kontenList, writerProyekList]
  );

  function kontenPadaHari(d: Date) {
    return kontenBerwaktu.filter((x) => isSameDay(x.waktu, d));
  }

  const daysToShow = useMemo(() => {
    if (viewMode === "daily") return [selectedDate];
    if (viewMode === "weekly") {
      const start = startOfWeek(selectedDate);
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    return [];
  }, [viewMode, selectedDate]);

  const monthGridDays = useMemo(() => {
    const first = new Date(miniCalMonth.getFullYear(), miniCalMonth.getMonth(), 1);
    const gridStart = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [miniCalMonth]);

  function offsetPx(d: Date) {
    const jam = d.getHours() + d.getMinutes() / 60;
    const clamped = Math.max(START_HOUR, Math.min(END_HOUR, jam));
    return (clamped - START_HOUR) * HOUR_HEIGHT;
  }

  function gantiPeriode(arah: 1 | -1) {
    if (viewMode === "daily") setSelectedDate((d) => addDays(d, arah));
    else if (viewMode === "weekly") setSelectedDate((d) => addDays(d, arah * 7));
    else setMiniCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + arah, 1));
  }

  const labelPeriode =
    viewMode === "daily"
      ? selectedDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : viewMode === "weekly"
      ? `${daysToShow[0]?.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - ${daysToShow[6]?.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
      : `${BULAN[miniCalMonth.getMonth()]} ${miniCalMonth.getFullYear()}`;

  if (loading) return <p className="text-sm text-muted">Memuat kalender...</p>;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ===== Kolom kiri: mini kalender bulan ===== */}
      <div className="lg:w-64 shrink-0">
        <div className="rounded-2xl border border-denim-100 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-denim-900">
              {BULAN[miniCalMonth.getMonth()]} {miniCalMonth.getFullYear()}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setMiniCalMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                className="p-1 rounded text-denim-700 hover:bg-surface"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setMiniCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                className="p-1 rounded text-denim-700 hover:bg-surface"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center">
            {HARI_HURUF.map((h, i) => (
              <span key={i} className="text-[10px] text-muted font-medium">
                {h}
              </span>
            ))}
            {monthGridDays.map((d, i) => {
              const diBulanIni = d.getMonth() === miniCalMonth.getMonth();
              const isToday = isSameDay(d, new Date());
              const isSelected = isSameDay(d, selectedDate);
              const punyaKonten = kontenPadaHari(d).length > 0;
              return (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedDate(d);
                    if (viewMode === "monthly") setViewMode("daily");
                  }}
                  className={`relative text-xs h-7 w-7 mx-auto rounded-full flex items-center justify-center ${
                    isSelected
                      ? "bg-denim-700 text-white"
                      : isToday
                      ? "text-denim-700 font-semibold"
                      : diBulanIni
                      ? "text-denim-900 hover:bg-surface"
                      : "text-muted/40"
                  }`}
                >
                  {d.getDate()}
                  {punyaKonten && !isSelected && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-gold-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-denim-100 bg-white p-4 mt-3">
          <p className="text-xs font-medium text-denim-700 mb-2">Keterangan Status</p>
          <div className="space-y-1.5">
            {Object.entries(DOT_STATUS).map(([status, dot]) => (
              <div key={status} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="text-xs text-muted">{status}</span>
              </div>
            ))}
          </div>
        </div>

        {canCreate && (
          <Link
            href="/my-project?tab=socmed_hub"
            className="mt-3 flex items-center justify-center gap-1.5 w-full text-sm font-medium bg-denim-700 text-white py-2.5 rounded-lg hover:bg-denim-500 transition-colors"
          >
            <Plus size={15} /> Tambah Konten
          </Link>
        )}
      </div>

      {/* ===== Kolom kanan: view utama ===== */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => gantiPeriode(-1)}
              className="p-2 rounded-lg border border-denim-100 text-denim-700 hover:bg-surface"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => gantiPeriode(1)}
              className="p-2 rounded-lg border border-denim-100 text-denim-700 hover:bg-surface"
            >
              <ChevronRight size={16} />
            </button>
            <p className="text-sm font-medium text-denim-900 ml-1">{labelPeriode}</p>
          </div>

          <div className="flex rounded-lg border border-denim-100 overflow-hidden text-xs">
            {(["daily", "weekly", "monthly"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  viewMode === mode ? "bg-denim-700 text-white" : "text-denim-700 hover:bg-surface"
                }`}
              >
                {mode === "daily" ? "Harian" : mode === "weekly" ? "Mingguan" : "Bulanan"}
              </button>
            ))}
          </div>
        </div>

        {viewMode === "monthly" ? (
          <div className="rounded-2xl border border-denim-100 bg-white overflow-hidden">
            <div className="grid grid-cols-7 border-b border-denim-100">
              {HARI_SINGKAT.map((h) => (
                <div key={h} className="text-center text-xs font-medium text-denim-700 py-2">
                  {h}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthGridDays.map((d, i) => {
                const diBulanIni = d.getMonth() === miniCalMonth.getMonth();
                const isToday = isSameDay(d, new Date());
                const listHariIni = kontenPadaHari(d);
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedDate(d);
                      setViewMode("daily");
                    }}
                    className={`min-h-[72px] border-b border-r border-denim-100 p-1.5 text-left align-top hover:bg-surface transition-colors ${
                      diBulanIni ? "" : "bg-surface/40"
                    }`}
                  >
                    <span
                      className={`text-xs inline-flex items-center justify-center w-5 h-5 rounded-full ${
                        isToday ? "bg-denim-700 text-white" : diBulanIni ? "text-denim-900" : "text-muted/40"
                      }`}
                    >
                      {d.getDate()}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {listHariIni.slice(0, 2).map((x) => (
                        <p
                          key={x.konten.id_konten}
                          className={`text-[9px] px-1 py-0.5 rounded truncate ${BLOK_STATUS[x.konten.status] ?? "bg-surface"}`}
                        >
                          {x.konten.judul_konten}
                        </p>
                      ))}
                      {listHariIni.length > 2 && (
                        <p className="text-[9px] text-muted pl-1">+{listHariIni.length - 2} lagi</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-denim-100 bg-white overflow-hidden">
            <div className="flex overflow-x-auto">
              {/* Kolom label jam */}
              <div className="shrink-0 w-12 border-r border-denim-100 pt-[42px]">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    style={{ height: HOUR_HEIGHT }}
                    className="text-[10px] text-muted text-right pr-1.5 -mt-2"
                  >
                    {h}:00
                  </div>
                ))}
              </div>

              {/* Kolom tiap hari */}
              {daysToShow.map((d, i) => {
                const isToday = isSameDay(d, new Date());
                const listHariIni = kontenPadaHari(d);
                return (
                  <div
                    key={i}
                    className={`shrink-0 border-r border-denim-100 last:border-r-0 ${
                      viewMode === "daily" ? "flex-1 min-w-[280px]" : "w-[150px]"
                    }`}
                  >
                    <div
                      className={`text-center py-2 border-b border-denim-100 sticky top-0 ${
                        isToday ? "bg-denim-700 text-white" : "bg-surface text-denim-700"
                      }`}
                    >
                      <p className="text-[10px] font-medium">{HARI_SINGKAT[i % 7]}</p>
                      <p className="text-sm font-display leading-none mt-0.5">{d.getDate()}</p>
                    </div>
                    <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
                      {HOURS.map((h, hi) => (
                        <div
                          key={h}
                          className="absolute inset-x-0 border-t border-denim-100/70"
                          style={{ top: hi * HOUR_HEIGHT }}
                        />
                      ))}
                      {listHariIni.map((x) => (
                        <button
                          key={x.konten.id_konten}
                          onClick={() => setDetail(x.konten)}
                          style={{ top: offsetPx(x.waktu) + 2, height: 46 }}
                          className={`absolute left-1 right-1 rounded-lg border px-2 py-1 text-left overflow-hidden transition-transform active:scale-95 ${
                            BLOK_STATUS[x.konten.status] ?? "bg-surface border-denim-100"
                          }`}
                        >
                          <p className="text-[10px] font-medium leading-tight line-clamp-2">
                            {x.konten.judul_konten}
                          </p>
                          <p className="text-[9px] opacity-70">
                            {x.waktu.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {viewMode === "weekly" && (
          <p className="text-[10px] text-muted mt-2 lg:hidden">← geser buat lihat hari lain →</p>
        )}
      </div>

      {/* Detail konten yang di-tap */}
      {detail && (
        <div
          className="fixed inset-0 bg-denim-900/40 flex items-center justify-center p-5 z-30"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-white rounded-signature p-5 w-full max-w-sm space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-display text-lg text-denim-700">{detail.judul_konten}</h2>
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded-full shrink-0 ${
                  BLOK_STATUS[detail.status] ?? "bg-surface text-muted"
                }`}
              >
                {detail.status}
              </span>
            </div>
            <p className="text-xs text-muted font-mono">{namaKanal(detail.id_kanal)}</p>
            <p className="text-sm text-denim-900 pt-2">
              Target publish: <span className="font-medium">{detail.tanggal_publish}</span>
            </p>
            <p className="text-sm text-muted">
              Writer: {detail.assigned_script_writer || "-"}
              <br />
              Designer: {detail.assigned_graphic_designer || "-"}
              <br />
              Editor: {detail.assigned_editor || "-"}
            </p>
            <button
              onClick={() => setDetail(null)}
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
