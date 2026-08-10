"use client";

import { useEffect, useState } from "react";
import { Card, StatusBadge } from "@/components/ui/Card";
import StatusStepper from "@/components/ui/StatusStepper";

const STATUS_OPTIONS = ["Menulis", "Review", "Revisi", "Disetujui"];
const HAPPY_PATH = ["Menulis", "Review", "Disetujui"];

type Proyek = {
  id_proyek_writer: string;
  id_konten: string;
  nama_writer: string;
  status: string;
  naskah_caption: string;
  jadwal_posting: string;
  catatan: string;
};
type Konten = {
  id_konten: string;
  judul_konten: string;
  cta: string;
  referensi_desain: string;
  gaya_copywriting: string;
  ditugaskan_oleh: string;
  tanggal_publish: string;
};

export default function ScriptWriterBoard({
  currentUserNama,
  canEditAll,
  filterToOwn,
}: {
  currentUserNama: string;
  canEditAll: boolean;
  filterToOwn: boolean;
}) {
  const [proyekAll, setProyekAll] = useState<Proyek[]>([]);
  const [kontenList, setKontenList] = useState<Konten[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSelesai, setShowSelesai] = useState(false);

  // draft naskah/jadwal lokal per kartu, biar nggak nyimpen tiap ketikan
  const [draft, setDraft] = useState<Record<string, { naskah_caption: string; jadwal_posting: string }>>({});

  const [feedbackOpenId, setFeedbackOpenId] = useState<string | null>(null);
  const [feedbackForm, setFeedbackForm] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);

  function load() {
    setLoading(true);
    Promise.allSettled([
      fetch("/api/socmed/proyek-writer").then((res) => res.json()),
      fetch("/api/socmed/konten").then((res) => res.json()),
    ]).then(([proyekResult, kontenResult]) => {
      if (proyekResult.status === "fulfilled") {
        setProyekAll(proyekResult.value);
        const kontenData: Konten[] =
          kontenResult.status === "fulfilled" ? kontenResult.value : [];
        const initialDraft: Record<string, any> = {};
        proyekResult.value.forEach((p: Proyek) => {
          const kontenTerkait = kontenData.find((k) => k.id_konten === p.id_konten);
          // Kalau writer belum pernah isi jadwal posting, otomatis usulin
          // tanggal deadline yang udah Kadiv tulis di brief (jam 19:00
          // sesuai kebiasaan posting rutin) — writer tinggal cek/sesuaikan,
          // nggak perlu ngetik tanggal dari nol lagi.
          const jadwalDefault =
            p.jadwal_posting || (kontenTerkait?.tanggal_publish ? `${kontenTerkait.tanggal_publish}T19:00` : "");
          initialDraft[p.id_proyek_writer] = {
            naskah_caption: p.naskah_caption ?? "",
            jadwal_posting: jadwalDefault,
          };
        });
        setDraft(initialDraft);
      } else console.error("Gagal ambil proyek writer:", proyekResult.reason);

      if (kontenResult.status === "fulfilled") setKontenList(kontenResult.value);
      else console.error("Gagal ambil konten:", kontenResult.reason);

      setLoading(false);
    });
  }

  useEffect(load, []);

  function kontenDetail(id: string) {
    return kontenList.find((k) => k.id_konten === id);
  }

  const proyek = filterToOwn
    ? proyekAll.filter((p) => p.nama_writer === currentUserNama)
    : proyekAll;

  // Terbaru di atas (baris paling akhir ditambahkan ke sheet = paling baru),
  // dan yang "Disetujui" dipisah ke bagian collapsible di bawah.
  const proyekTerurut = [...proyek].reverse();
  const proyekAktif = proyekTerurut.filter((p) => p.status !== "Disetujui");
  const proyekSelesai = proyekTerurut.filter((p) => p.status === "Disetujui");

  async function patchProyek(id: string, updates: Record<string, string>) {
    return fetch("/api/socmed/proyek-writer", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_proyek_writer: id, ...updates }),
    });
  }

  async function updateStatus(id: string, status: string) {
    setSavingId(id);
    setError(null);
    const prev = proyekAll;
    setProyekAll((p) => p.map((row) => (row.id_proyek_writer === id ? { ...row, status } : row)));

    const res = await patchProyek(id, { status });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Gagal menyimpan perubahan.");
      setProyekAll(prev);
    }
    setSavingId(null);
  }

  async function saveNaskah(id: string) {
    setSavingId(id);
    setError(null);
    const d = draft[id];
    const res = await patchProyek(id, {
      naskah_caption: d.naskah_caption,
      jadwal_posting: d.jadwal_posting,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal menyimpan naskah.");
    } else {
      load();
    }
    setSavingId(null);
  }

  function openFeedback(p: Proyek) {
    setFeedbackOpenId(p.id_proyek_writer);
    setFeedbackForm(p.catatan ?? "");
  }

  async function saveFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!feedbackOpenId) return;
    setSavingFeedback(true);
    const res = await patchProyek(feedbackOpenId, { catatan: feedbackForm });
    setSavingFeedback(false);
    if (res.ok) {
      setFeedbackOpenId(null);
      load();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin mau dihapus?")) return;
    const res = await fetch("/api/socmed/proyek-writer", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_proyek_writer: id }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal menghapus.");
      return;
    }
    load();
  }

  if (loading) return <p className="text-sm text-muted">Memuat proyek...</p>;

  const total = proyek.length;
  const statusCounts = STATUS_OPTIONS.map((s) => ({
    status: s,
    count: proyek.filter((p) => p.status === s).length,
  }));

  function renderKartu(p: Proyek) {
    const konten = kontenDetail(p.id_konten);
    const bisaEdit = canEditAll || p.nama_writer === currentUserNama;
    const isRevisi = p.status === "Revisi";
    const d = draft[p.id_proyek_writer] ?? { naskah_caption: "", jadwal_posting: "" };

    return (
      <Card key={p.id_proyek_writer}>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div>
            <p className="font-medium text-denim-900 text-sm">
              {konten?.judul_konten ?? (
                <span className="text-muted italic">(konten tidak ditemukan)</span>
              )}
            </p>
            {canEditAll && (
              <p className="text-xs text-muted font-mono mb-0.5">{p.nama_writer}</p>
            )}
            {konten?.ditugaskan_oleh && (
              <p className="text-xs text-muted">Ditugaskan oleh: {konten.ditugaskan_oleh}</p>
            )}
          </div>
        </div>

        {konten?.tanggal_publish && (
          <p className="text-sm text-red-600 mb-1 font-medium">
            Target publish: {konten.tanggal_publish}
          </p>
        )}
        {konten?.cta && (
          <p className="text-sm text-denim-900 mb-1">
            <span className="text-xs text-muted">CTA: </span>
            {konten.cta}
          </p>
        )}
        {konten?.gaya_copywriting && (
          <p className="text-sm text-muted mb-1">
            <span className="text-xs">Gaya: </span>
            {konten.gaya_copywriting}
          </p>
        )}
        {konten?.referensi_desain && (
          <a
            href={konten.referensi_desain}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-denim-500 underline block mb-1.5"
          >
            Lihat referensi desain
          </a>
        )}

        {/* Tracker kayak "Pesanan Saya" Shopee -- posisi sekarang di mana. */}
        {!isRevisi && (
          <div className="my-2">
            <StatusStepper stages={HAPPY_PATH} current={p.status} />
          </div>
        )}
        {isRevisi && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 my-2">
            <p className="text-xs font-medium text-red-700">⚠ Revisi diminta Kadiv</p>
            {p.catatan && <p className="text-xs text-red-600 mt-0.5">{p.catatan}</p>}
          </div>
        )}
        {!isRevisi && p.catatan && (
          <p className="text-sm text-gold-500 mb-2">
            <span className="text-xs">Catatan Kadiv: </span>
            {p.catatan}
          </p>
        )}

        {bisaEdit ? (
          <>
            <textarea
              placeholder="Tulis naskah & caption di sini..."
              value={d.naskah_caption}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  [p.id_proyek_writer]: { ...d, naskah_caption: e.target.value },
                })
              }
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 mb-2"
              rows={4}
            />
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-muted whitespace-nowrap">Jadwal posting:</label>
              <input
                type="datetime-local"
                value={d.jadwal_posting}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    [p.id_proyek_writer]: { ...d, jadwal_posting: e.target.value },
                  })
                }
                className="rounded-lg border border-denim-100 px-2 py-1 text-xs outline-none focus:border-denim-500"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-denim-100">
              <button
                onClick={() => saveNaskah(p.id_proyek_writer)}
                disabled={savingId === p.id_proyek_writer}
                className="text-xs bg-denim-700 text-white px-3 py-1.5 rounded-full disabled:opacity-50"
              >
                {savingId === p.id_proyek_writer ? "Menyimpan..." : "Simpan Naskah"}
              </button>

              {/* Kadiv: tombol verdict jelas, bukan dropdown bebas */}
              {canEditAll && (
                <>
                  <button
                    onClick={() => updateStatus(p.id_proyek_writer, "Disetujui")}
                    disabled={savingId === p.id_proyek_writer || p.status === "Disetujui"}
                    className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full disabled:opacity-40"
                  >
                    ✓ Setujui
                  </button>
                  <button
                    onClick={() => updateStatus(p.id_proyek_writer, "Revisi")}
                    disabled={savingId === p.id_proyek_writer || isRevisi}
                    className="text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-full disabled:opacity-40"
                  >
                    Minta Revisi
                  </button>
                  <button onClick={() => openFeedback(p)} className="text-xs text-denim-700 underline">
                    Beri Catatan
                  </button>
                </>
              )}

              {/* Writer sendiri: maju sampai "Review" (submit), atau kirim
                  ulang abis direvisi -- bukan nge-approve diri sendiri. */}
              {!canEditAll && (
                <>
                  {p.status === "Menulis" && (
                    <button
                      onClick={() => updateStatus(p.id_proyek_writer, "Review")}
                      disabled={savingId === p.id_proyek_writer}
                      className="text-xs bg-denim-700 text-white px-3 py-1.5 rounded-full disabled:opacity-50"
                    >
                      Submit buat Review
                    </button>
                  )}
                  {isRevisi && (
                    <button
                      onClick={() => updateStatus(p.id_proyek_writer, "Review")}
                      disabled={savingId === p.id_proyek_writer}
                      className="text-xs bg-denim-700 text-white px-3 py-1.5 rounded-full disabled:opacity-50"
                    >
                      Sudah Direvisi, Kirim Ulang
                    </button>
                  )}
                  {p.status === "Review" && (
                    <span className="text-xs text-muted">Menunggu review Kadiv...</span>
                  )}
                  {p.status === "Disetujui" && <StatusBadge status={p.status} />}
                </>
              )}

              <button
                onClick={() => handleDelete(p.id_proyek_writer)}
                className="text-xs text-red-600 underline ml-auto"
              >
                Hapus
              </button>
            </div>
          </>
        ) : null}
      </Card>
    );
  }

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

      {proyekAktif.length === 0 && proyekSelesai.length === 0 ? (
        <p className="text-sm text-muted">Belum ada proyek yang di-assign.</p>
      ) : (
        <>
          {proyekAktif.length === 0 ? (
            <p className="text-sm text-muted mb-4">Nggak ada proyek aktif — semua udah disetujui.</p>
          ) : (
            <div className="space-y-3">{proyekAktif.map((p) => renderKartu(p))}</div>
          )}

          {proyekSelesai.length > 0 && (
            <div className="mt-5">
              <button
                onClick={() => setShowSelesai((s) => !s)}
                className="text-xs font-medium text-denim-700 flex items-center gap-1"
              >
                {showSelesai ? "▾" : "▸"} Disetujui ({proyekSelesai.length})
              </button>
              {showSelesai && (
                <div className="space-y-3 mt-3">{proyekSelesai.map((p) => renderKartu(p))}</div>
              )}
            </div>
          )}
        </>
      )}

      {feedbackOpenId && (
        <div className="fixed inset-0 bg-denim-900/40 flex items-center justify-center p-5 z-20">
          <form
            onSubmit={saveFeedback}
            className="bg-white rounded-signature p-5 w-full max-w-sm space-y-3"
          >
            <h2 className="font-display text-lg text-denim-700">Catatan untuk Writer</h2>
            <textarea
              placeholder="Feedback atau alasan revisi"
              value={feedbackForm}
              onChange={(e) => setFeedbackForm(e.target.value)}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
              rows={3}
            />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFeedbackOpenId(null)}
                className="flex-1 text-sm py-2 rounded-lg border border-denim-100 text-denim-900"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingFeedback}
                className="flex-1 text-sm py-2 rounded-lg bg-denim-700 text-white disabled:opacity-50"
              >
                {savingFeedback ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
