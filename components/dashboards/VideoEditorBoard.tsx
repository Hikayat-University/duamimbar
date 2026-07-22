"use client";

import { useEffect, useState } from "react";
import { Card, StatusBadge } from "@/components/ui/Card";

const STATUS_OPTIONS = ["Draf", "Edited", "Revisi", "Done"];

type Proyek = {
  id_proyek_editor: string;
  id_konten: string;
  nama_editor: string;
  status: string;
  brief: string;
  link_video_mentah: string;
  catatan: string;
  last_updated: string;
};
type Konten = { id_konten: string; judul_konten: string };

const EMPTY_DETAIL_FORM = { brief: "", link_video_mentah: "", catatan: "" };

export default function VideoEditorBoard({
  currentUserNama,
  canEditAll,
}: {
  currentUserNama: string;
  canEditAll: boolean;
}) {
  const [proyekAll, setProyekAll] = useState<Proyek[]>([]);
  const [kontenList, setKontenList] = useState<Konten[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [detailOpenId, setDetailOpenId] = useState<string | null>(null);
  const [detailForm, setDetailForm] = useState(EMPTY_DETAIL_FORM);
  const [savingDetail, setSavingDetail] = useState(false);

  function load() {
    setLoading(true);
    Promise.allSettled([
      fetch("/api/video-editor").then((res) => res.json()),
      fetch("/api/socmed/konten").then((res) => res.json()),
    ]).then(([proyekResult, kontenResult]) => {
      if (proyekResult.status === "fulfilled") setProyekAll(proyekResult.value);
      else console.error("Gagal ambil proyek editor:", proyekResult.reason);

      if (kontenResult.status === "fulfilled") setKontenList(kontenResult.value);
      else console.error("Gagal ambil konten:", kontenResult.reason);

      setLoading(false);
    });
  }

  useEffect(load, []);

  function judulKonten(id: string) {
    return kontenList.find((k) => k.id_konten === id)?.judul_konten ?? id;
  }

  // Editor biasa cuma lihat proyek miliknya sendiri. Kadiv lihat semua,
  // buat keperluan pantau tim.
  const proyek = canEditAll
    ? proyekAll
    : proyekAll.filter((p) => p.nama_editor === currentUserNama);

  async function updateStatus(id: string, status: string) {
    setSavingId(id);
    setError(null);

    const prev = proyekAll;
    setProyekAll((p) => p.map((row) => (row.id_proyek_editor === id ? { ...row, status } : row)));

    const res = await fetch("/api/video-editor", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_proyek_editor: id, status }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Gagal menyimpan perubahan.");
      setProyekAll(prev);
    }

    setSavingId(null);
  }

  function openDetail(p: Proyek) {
    setDetailOpenId(p.id_proyek_editor);
    setDetailForm({
      brief: p.brief ?? "",
      link_video_mentah: p.link_video_mentah ?? "",
      catatan: p.catatan ?? "",
    });
  }

  async function saveDetail(e: React.FormEvent) {
    e.preventDefault();
    if (!detailOpenId) return;
    setSavingDetail(true);
    setError(null);

    const res = await fetch("/api/video-editor", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_proyek_editor: detailOpenId, ...detailForm }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal menyimpan detail.");
      setSavingDetail(false);
      return;
    }

    setSavingDetail(false);
    setDetailOpenId(null);
    load();
  }

  if (loading) {
    return <p className="text-sm text-muted">Memuat proyek...</p>;
  }

  // Overview: total & breakdown per status, dari data yang relevan buat viewer ini.
  const total = proyek.length;
  const statusCounts = STATUS_OPTIONS.map((s) => ({
    status: s,
    count: proyek.filter((p) => p.status === s).length,
  }));

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
          <Card className="text-center py-3">
            <p className="font-display text-xl text-denim-700">{total}</p>
            <p className="text-xs text-muted mt-0.5">Total</p>
          </Card>
          {statusCounts.map((s) => (
            <Card key={s.status} className="text-center py-3">
              <p className="font-display text-xl text-denim-700">{s.count}</p>
              <p className="text-xs text-muted mt-0.5">{s.status}</p>
            </Card>
          ))}
        </div>
      )}

      {proyek.length === 0 ? (
        <p className="text-sm text-muted">Belum ada proyek yang di-assign.</p>
      ) : (
        <div className="space-y-3">
          {proyek.map((p) => {
            const bisaUbahStatus = canEditAll || p.nama_editor === currentUserNama;
            return (
              <Card key={p.id_proyek_editor}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <p className="font-medium text-denim-900 text-sm">{judulKonten(p.id_konten)}</p>
                    {canEditAll && (
                      <p className="text-xs text-muted font-mono mb-0.5">{p.nama_editor}</p>
                    )}
                  </div>
                  {!bisaUbahStatus && <StatusBadge status={p.status} />}
                </div>

                {p.brief && (
                  <p className="text-sm text-denim-900 mb-1.5">
                    <span className="text-xs text-muted">Brief: </span>
                    {p.brief}
                  </p>
                )}
                {p.link_video_mentah && (
                  <a
                    href={p.link_video_mentah}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-denim-500 underline block mb-1.5"
                  >
                    Buka link video mentah
                  </a>
                )}
                {p.catatan && <p className="text-sm text-muted mb-2">{p.catatan}</p>}

                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-denim-100 flex-wrap">
                  {bisaUbahStatus && (
                    <div className="flex items-center gap-2">
                      <select
                        value={p.status}
                        disabled={savingId === p.id_proyek_editor}
                        onChange={(e) => updateStatus(p.id_proyek_editor, e.target.value)}
                        className="text-xs font-mono rounded-full border border-denim-100 px-3 py-1.5 bg-white outline-none focus:border-denim-500 disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {savingId === p.id_proyek_editor && (
                        <span className="text-xs text-muted">Menyimpan...</span>
                      )}
                    </div>
                  )}
                  {canEditAll && (
                    <button
                      onClick={() => openDetail(p)}
                      className="text-xs text-denim-700 underline"
                    >
                      Edit Brief & Link
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {detailOpenId && (
        <div className="fixed inset-0 bg-denim-900/40 flex items-center justify-center p-5 z-20">
          <form
            onSubmit={saveDetail}
            className="bg-white rounded-signature p-5 w-full max-w-sm space-y-3"
          >
            <h2 className="font-display text-lg text-denim-700">Brief & Link Video</h2>

            <textarea
              placeholder="Detail brief untuk editor"
              value={detailForm.brief}
              onChange={(e) => setDetailForm({ ...detailForm, brief: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
              rows={3}
            />
            <input
              placeholder="Link video mentah yang harus diedit (opsional)"
              value={detailForm.link_video_mentah}
              onChange={(e) => setDetailForm({ ...detailForm, link_video_mentah: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />
            <textarea
              placeholder="Catatan tambahan (opsional)"
              value={detailForm.catatan}
              onChange={(e) => setDetailForm({ ...detailForm, catatan: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
              rows={2}
            />

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDetailOpenId(null)}
                className="flex-1 text-sm py-2 rounded-lg border border-denim-100 text-denim-900"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingDetail}
                className="flex-1 text-sm py-2 rounded-lg bg-denim-700 text-white disabled:opacity-50"
              >
                {savingDetail ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
