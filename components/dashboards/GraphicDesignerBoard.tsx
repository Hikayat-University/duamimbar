"use client";

import { useEffect, useState } from "react";
import { Card, StatusBadge } from "@/components/ui/Card";

const STATUS_OPTIONS = ["Belum Dikerjakan", "Proses", "Review", "Revisi", "Disetujui"];

type Proyek = {
  id_proyek_designer: string;
  id_konten: string;
  nama_designer: string;
  status: string;
  brief_desain: string;
  link_preview: string;
  catatan: string;
};
type Konten = { id_konten: string; judul_konten: string };
type Designer = { id: string; nama: string };

const EMPTY_ASSIGN_FORM = { id_konten: "", nama_designer: "", brief_desain: "" };

export default function GraphicDesignerBoard({
  currentUserNama,
  canEditAll,
}: {
  currentUserNama: string;
  canEditAll: boolean;
}) {
  const [proyekAll, setProyekAll] = useState<Proyek[]>([]);
  const [kontenList, setKontenList] = useState<Konten[]>([]);
  const [designerList, setDesignerList] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [linkDraft, setLinkDraft] = useState<Record<string, string>>({});

  const [assignFormOpen, setAssignFormOpen] = useState(false);
  const [assignForm, setAssignForm] = useState(EMPTY_ASSIGN_FORM);
  const [savingAssign, setSavingAssign] = useState(false);

  const [briefOpenId, setBriefOpenId] = useState<string | null>(null);
  const [briefForm, setBriefForm] = useState({ brief_desain: "", catatan: "" });
  const [savingBrief, setSavingBrief] = useState(false);

  function load() {
    setLoading(true);
    Promise.allSettled([
      fetch("/api/socmed/proyek-designer").then((res) => res.json()),
      fetch("/api/socmed/konten").then((res) => res.json()),
      fetch("/api/users/graphic-designers").then((res) => res.json()),
    ]).then(([proyekResult, kontenResult, designerResult]) => {
      if (proyekResult.status === "fulfilled") {
        setProyekAll(proyekResult.value);
        const initialLink: Record<string, string> = {};
        proyekResult.value.forEach((p: Proyek) => {
          initialLink[p.id_proyek_designer] = p.link_preview ?? "";
        });
        setLinkDraft(initialLink);
      } else console.error("Gagal ambil proyek designer:", proyekResult.reason);

      if (kontenResult.status === "fulfilled") setKontenList(kontenResult.value);
      else console.error("Gagal ambil konten:", kontenResult.reason);

      if (designerResult.status === "fulfilled") setDesignerList(designerResult.value);
      else console.error("Gagal ambil daftar designer:", designerResult.reason);

      setLoading(false);
    });
  }

  useEffect(load, []);

  function judulKonten(id: string) {
    return kontenList.find((k) => k.id_konten === id)?.judul_konten ?? id;
  }

  const proyek = canEditAll
    ? proyekAll
    : proyekAll.filter((p) => p.nama_designer === currentUserNama);

  async function patchProyek(id: string, updates: Record<string, string>) {
    return fetch("/api/socmed/proyek-designer", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_proyek_designer: id, ...updates }),
    });
  }

  async function updateStatus(id: string, status: string) {
    setSavingId(id);
    setError(null);
    const prev = proyekAll;
    setProyekAll((p) => p.map((row) => (row.id_proyek_designer === id ? { ...row, status } : row)));

    const res = await patchProyek(id, { status });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Gagal menyimpan perubahan.");
      setProyekAll(prev);
    }
    setSavingId(null);
  }

  async function saveLinkPreview(id: string) {
    setSavingId(id);
    setError(null);
    const res = await patchProyek(id, { link_preview: linkDraft[id] ?? "" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal menyimpan link preview.");
    } else {
      load();
    }
    setSavingId(null);
  }

  async function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavingAssign(true);
    setError(null);

    const res = await fetch("/api/socmed/proyek-designer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assignForm),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal assign proyek.");
      setSavingAssign(false);
      return;
    }

    setSavingAssign(false);
    setAssignFormOpen(false);
    setAssignForm(EMPTY_ASSIGN_FORM);
    load();
  }

  function openBrief(p: Proyek) {
    setBriefOpenId(p.id_proyek_designer);
    setBriefForm({ brief_desain: p.brief_desain ?? "", catatan: p.catatan ?? "" });
  }

  async function saveBrief(e: React.FormEvent) {
    e.preventDefault();
    if (!briefOpenId) return;
    setSavingBrief(true);
    const res = await patchProyek(briefOpenId, briefForm);
    setSavingBrief(false);
    if (res.ok) {
      setBriefOpenId(null);
      load();
    }
  }

  if (loading) return <p className="text-sm text-muted">Memuat proyek...</p>;

  const total = proyek.length;
  const statusCounts = STATUS_OPTIONS.map((s) => ({
    status: s,
    count: proyek.filter((p) => p.status === s).length,
  }));

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {canEditAll && (
        <button
          onClick={() => {
            setAssignForm({ ...EMPTY_ASSIGN_FORM, id_konten: kontenList[0]?.id_konten ?? "" });
            setAssignFormOpen(true);
          }}
          disabled={kontenList.length === 0 || designerList.length === 0}
          className="mb-4 text-sm bg-denim-700 text-white px-3.5 py-2 rounded-lg hover:bg-denim-500 transition-colors disabled:opacity-50"
        >
          + Assign Proyek Baru
        </button>
      )}
      {canEditAll && (kontenList.length === 0 || designerList.length === 0) && (
        <p className="text-xs text-muted mb-4">
          Butuh minimal 1 konten (tab Konten Social Media) dan 1 akun Graphic Designer terdaftar
          sebelum bisa assign.
        </p>
      )}

      {total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-5">
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
            const bisaEdit = canEditAll || p.nama_designer === currentUserNama;
            return (
              <Card key={p.id_proyek_designer}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <p className="font-medium text-denim-900 text-sm">{judulKonten(p.id_konten)}</p>
                    {canEditAll && (
                      <p className="text-xs text-muted font-mono mb-0.5">{p.nama_designer}</p>
                    )}
                  </div>
                  {!bisaEdit && <StatusBadge status={p.status} />}
                </div>

                {p.brief_desain && (
                  <p className="text-sm text-denim-900 mb-2 whitespace-pre-wrap">
                    <span className="text-xs text-muted block mb-0.5">Brief desain:</span>
                    {p.brief_desain}
                  </p>
                )}
                {p.catatan && (
                  <p className="text-sm text-gold-500 mb-2">
                    <span className="text-xs">Catatan Kadiv: </span>
                    {p.catatan}
                  </p>
                )}
                {p.link_preview && !bisaEdit && (
                  <a
                    href={p.link_preview}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-denim-500 underline block mb-2"
                  >
                    Lihat preview
                  </a>
                )}

                {bisaEdit && (
                  <>
                    {(canEditAll || p.nama_designer === currentUserNama) && (
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          placeholder="Link preview desain"
                          value={linkDraft[p.id_proyek_designer] ?? ""}
                          onChange={(e) =>
                            setLinkDraft({ ...linkDraft, [p.id_proyek_designer]: e.target.value })
                          }
                          className="flex-1 rounded-lg border border-denim-100 px-3 py-1.5 text-xs outline-none focus:border-denim-500"
                        />
                        <button
                          onClick={() => saveLinkPreview(p.id_proyek_designer)}
                          disabled={savingId === p.id_proyek_designer}
                          className="text-xs bg-denim-700 text-white px-3 py-1.5 rounded-full disabled:opacity-50 whitespace-nowrap"
                        >
                          Simpan
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-denim-100">
                      <select
                        value={p.status}
                        disabled={savingId === p.id_proyek_designer}
                        onChange={(e) => updateStatus(p.id_proyek_designer, e.target.value)}
                        className="text-xs font-mono rounded-full border border-denim-100 px-3 py-1.5 bg-white outline-none focus:border-denim-500 disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {canEditAll && (
                        <button
                          onClick={() => openBrief(p)}
                          className="text-xs text-denim-700 underline"
                        >
                          Edit Brief & Catatan
                        </button>
                      )}
                    </div>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {assignFormOpen && (
        <div className="fixed inset-0 bg-denim-900/40 flex items-center justify-center p-5 z-20">
          <form
            onSubmit={handleAssignSubmit}
            className="bg-white rounded-signature p-5 w-full max-w-sm space-y-3"
          >
            <h2 className="font-display text-lg text-denim-700">Assign Proyek Baru</h2>

            <select
              required
              value={assignForm.id_konten}
              onChange={(e) => setAssignForm({ ...assignForm, id_konten: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
            >
              {kontenList.map((k) => (
                <option key={k.id_konten} value={k.id_konten}>
                  {k.judul_konten}
                </option>
              ))}
            </select>

            <select
              required
              value={assignForm.nama_designer}
              onChange={(e) => setAssignForm({ ...assignForm, nama_designer: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
            >
              <option value="" disabled>
                Pilih Graphic Designer
              </option>
              {designerList.map((d) => (
                <option key={d.id} value={d.nama}>
                  {d.nama}
                </option>
              ))}
            </select>

            <textarea
              placeholder="Brief desain (bisa panjang — jelaskan detail visual yang diinginkan)"
              value={assignForm.brief_desain}
              onChange={(e) => setAssignForm({ ...assignForm, brief_desain: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
              rows={5}
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAssignFormOpen(false)}
                className="flex-1 text-sm py-2 rounded-lg border border-denim-100 text-denim-900"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingAssign}
                className="flex-1 text-sm py-2 rounded-lg bg-denim-700 text-white disabled:opacity-50"
              >
                {savingAssign ? "Menyimpan..." : "Assign"}
              </button>
            </div>
          </form>
        </div>
      )}

      {briefOpenId && (
        <div className="fixed inset-0 bg-denim-900/40 flex items-center justify-center p-5 z-20">
          <form
            onSubmit={saveBrief}
            className="bg-white rounded-signature p-5 w-full max-w-sm space-y-3"
          >
            <h2 className="font-display text-lg text-denim-700">Edit Brief & Catatan</h2>
            <textarea
              placeholder="Brief desain"
              value={briefForm.brief_desain}
              onChange={(e) => setBriefForm({ ...briefForm, brief_desain: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
              rows={5}
            />
            <textarea
              placeholder="Catatan / feedback revisi"
              value={briefForm.catatan}
              onChange={(e) => setBriefForm({ ...briefForm, catatan: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
              rows={2}
            />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setBriefOpenId(null)}
                className="flex-1 text-sm py-2 rounded-lg border border-denim-100 text-denim-900"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingBrief}
                className="flex-1 text-sm py-2 rounded-lg bg-denim-700 text-white disabled:opacity-50"
              >
                {savingBrief ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
