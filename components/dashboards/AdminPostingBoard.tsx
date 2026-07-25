"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Send, Check } from "lucide-react";

type Konten = {
  id_konten: string;
  id_kanal: string;
  judul_konten: string;
  status: string;
  tanggal_publish: string;
  cta: string;
  assigned_script_writer: string;
  assigned_graphic_designer: string;
};
type Kanal = { id_kanal: string; nama_kanal: string };

/**
 * Dashboard "Admin — Siap Post" — antrian posting buat Script Writer
 * (bisa diperluas ke Kadiv SocMed lewat akses_tambahan). Bukan tabel data
 * terpisah: cuma nge-filter sheet SocMed Konten yang sama, ambil yang
 * statusnya "Siap Post". Begitu Kadiv SocMed ubah status konten manapun ke
 * "Siap Post" di dashboard Konten Social Media, otomatis nongol di sini.
 */
export default function AdminPostingBoard({ canEdit }: { canEdit: boolean }) {
  const [list, setList] = useState<Konten[]>([]);
  const [kanalList, setKanalList] = useState<Kanal[]>([]);
  const [loading, setLoading] = useState(true);
  const [postingId, setPostingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    Promise.allSettled([
      fetch("/api/socmed/konten").then((res) => res.json()),
      fetch("/api/socmed/kanal").then((res) => res.json()),
    ]).then(([kontenResult, kanalResult]) => {
      if (kontenResult.status === "fulfilled") setList(kontenResult.value);
      if (kanalResult.status === "fulfilled") setKanalList(kanalResult.value);
      setLoading(false);
    });
  }

  useEffect(load, []);

  function namaKanal(id: string) {
    return kanalList.find((k) => k.id_kanal === id)?.nama_kanal ?? "(kanal tidak dikenal)";
  }

  async function tandaiSudahPosting(id: string) {
    setPostingId(id);
    await fetch("/api/socmed/konten", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_konten: id, status: "Sudah" }),
    });
    setPostingId(null);
    load();
  }

  const antrian = list.filter((k) => k.status === "Siap Post");

  if (loading) return <p className="text-sm text-muted">Memuat...</p>;

  return (
    <div>
      <p className="text-xs text-muted mb-4">
        Konten yang udah kelar digarap (naskah + desain disetujui) dan siap diposting muncul
        di sini otomatis. Kadiv SocMed yang ubah status konten jadi "Siap Post" dari dashboard
        Konten Social Media.
      </p>

      {antrian.length === 0 ? (
        <p className="text-sm text-muted">Antrian kosong — belum ada konten yang siap post.</p>
      ) : (
        <div className="space-y-3">
          {antrian.map((k) => (
            <Card key={k.id_konten}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <p className="font-medium text-denim-900 text-sm">{k.judul_konten}</p>
                  <p className="text-xs text-muted font-mono">{namaKanal(k.id_kanal)}</p>
                </div>
                <span className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full bg-gold-400/15 text-gold-500 shrink-0">
                  <Send size={11} strokeWidth={2} />
                  Siap Post
                </span>
              </div>

              {k.cta && (
                <p className="text-sm text-denim-900 mb-1">
                  <span className="text-xs text-muted">CTA: </span>
                  {k.cta}
                </p>
              )}
              <p className="text-xs text-muted mb-3">
                Writer: {k.assigned_script_writer || "-"} · Designer:{" "}
                {k.assigned_graphic_designer || "-"}
                {k.tanggal_publish && ` · Jadwal: ${k.tanggal_publish}`}
              </p>

              {canEdit && (
                <button
                  onClick={() => tandaiSudahPosting(k.id_konten)}
                  disabled={postingId === k.id_konten}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-denim-900 text-white disabled:opacity-50"
                >
                  <Check size={13} strokeWidth={2.5} />
                  {postingId === k.id_konten ? "Menyimpan..." : "Tandai Sudah Diposting"}
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
