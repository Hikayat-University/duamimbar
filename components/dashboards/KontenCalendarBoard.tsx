"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Card, StatusBadge } from "@/components/ui/Card";

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

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Senin di minggu yang sama dengan tanggal `d`. */
function awalMinggu(d: Date) {
  const hasil = new Date(d);
  const hari = hasil.getDay(); // 0 = Minggu
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

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      fetch("/api/socmed/konten").then((res) => res.json()),
      fetch("/api/socmed/kanal").then((res) => res.json()),
    ]).then(([kontenResult, kanalResult]) => {
      if (kontenResult.status === "fulfilled") setKontenList(kontenResult.value);
      else console.error("Gagal ambil konten:", kontenResult.reason);

      if (kanalResult.status === "fulfilled") setKanalList(kanalResult.value);
      else console.error("Gagal ambil kanal:", kanalResult.reason);

      setLoading(false);
    });
  }, []);

  function namaKanal(id: string) {
    return kanalList.find((k) => k.id_kanal === id)?.nama_kanal ?? "";
  }

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const todayISO = toISODate(new Date());
  const labelMinggu = `${days[0].toLocaleDateString("id-ID", { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`;

  function gantiMinggu(arah: 1 | -1) {
    const baru = new Date(weekStart);
    baru.setDate(baru.getDate() + arah * 7);
    setWeekStart(baru);
  }

  function keMingguIni() {
    setWeekStart(awalMinggu(new Date()));
  }

  if (loading) return <p className="text-sm text-muted">Memuat kalender...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => gantiMinggu(-1)}
          className="p-2 rounded-lg border border-denim-100 text-denim-700 hover:bg-surface"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="text-sm font-medium text-denim-900">{labelMinggu}</p>
          <button onClick={keMingguIni} className="text-xs text-denim-500 underline mt-0.5">
            Minggu ini
          </button>
        </div>
        <button
          onClick={() => gantiMinggu(1)}
          className="p-2 rounded-lg border border-denim-100 text-denim-700 hover:bg-surface"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="space-y-5">
        {days.map((d, i) => {
          const iso = toISODate(d);
          const isToday = iso === todayISO;
          const kontenHariIni = kontenList.filter((k) => k.tanggal_publish === iso);

          return (
            <div key={iso}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    isToday ? "bg-denim-700 text-white" : "text-denim-700"
                  }`}
                >
                  {HARI[i]}, {d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                </span>
                {isToday && <span className="text-[10px] text-gold-500 font-medium">HARI INI</span>}
              </div>

              {kontenHariIni.length === 0 ? (
                <p className="text-xs text-muted pl-1">Nggak ada jadwal publish.</p>
              ) : (
                <div className="space-y-2">
                  {kontenHariIni.map((k) => (
                    <Card key={k.id_konten} className="py-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-denim-900 text-sm">{k.judul_konten}</p>
                        <StatusBadge status={k.status} />
                      </div>
                      {namaKanal(k.id_kanal) && (
                        <p className="text-xs text-muted font-mono mb-1">{namaKanal(k.id_kanal)}</p>
                      )}
                      <p className="text-xs text-muted">
                        Writer: {k.assigned_script_writer || "-"} · Designer:{" "}
                        {k.assigned_graphic_designer || "-"} · Editor: {k.assigned_editor || "-"}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {kontenList.filter((k) => !k.tanggal_publish).length > 0 && (
        <div className="mt-6 pt-4 border-t border-denim-100">
          <p className="text-xs text-muted flex items-center gap-1.5 mb-2">
            <CalendarDays size={13} />
            Belum ada tanggal publish ({kontenList.filter((k) => !k.tanggal_publish).length} konten)
          </p>
        </div>
      )}
    </div>
  );
}
