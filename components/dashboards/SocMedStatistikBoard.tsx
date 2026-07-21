"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

type Statistik = {
  id_statistik: string;
  id_konten: string;
  minggu_ke: string;
  tanggal_input: string;
  views: string;
  likes: string;
  reach: string;
  engagement_rate: string;
};
type Konten = { id_konten: string; judul_konten: string };

const EMPTY_FORM = {
  id_konten: "",
  minggu_ke: "",
  views: "",
  likes: "",
  reach: "",
  engagement_rate: "",
};

export default function SocMedStatistikBoard({ canEdit }: { canEdit: boolean }) {
  const [list, setList] = useState<Statistik[]>([]);
  const [kontenList, setKontenList] = useState<Konten[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/socmed/statistik").then((res) => res.json()),
      fetch("/api/socmed/konten").then((res) => res.json()),
    ])
      .then(([stat, konten]) => {
        setList(stat);
        setKontenList(konten);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function judulKonten(id: string) {
    return kontenList.find((k) => k.id_konten === id)?.judul_konten ?? "(konten tidak dikenal)";
  }

  function openNew() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, id_konten: kontenList[0]?.id_konten ?? "" });
    setFormOpen(true);
  }

  function openEdit(s: Statistik) {
    setEditingId(s.id_statistik);
    setForm({
      id_konten: s.id_konten,
      minggu_ke: s.minggu_ke,
      views: s.views,
      likes: s.likes,
      reach: s.reach,
      engagement_rate: s.engagement_rate,
    });
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/socmed/statistik", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id_statistik: editingId, ...form } : form),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal menyimpan.");
      setSaving(false);
      return;
    }

    setSaving(false);
    setFormOpen(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus data statistik ini?")) return;
    await fetch("/api/socmed/statistik", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_statistik: id }),
    });
    load();
  }

  if (loading) return <p className="text-sm text-muted">Memuat...</p>;

  return (
    <div>
      {canEdit && (
        <button
          onClick={openNew}
          disabled={kontenList.length === 0}
          className="mb-4 text-sm bg-denim-700 text-white px-3.5 py-2 rounded-lg hover:bg-denim-500 transition-colors disabled:opacity-50"
        >
          + Input Statistik Minggu Ini
        </button>
      )}
      {canEdit && kontenList.length === 0 && (
        <p className="text-xs text-muted mb-4">
          Belum ada konten tercatat — tambahkan dulu di tab Konten.
        </p>
      )}

      {list.length === 0 ? (
        <p className="text-sm text-muted">Belum ada data statistik mingguan.</p>
      ) : (
        <div className="overflow-x-auto rounded-signature border border-denim-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-denim-100 text-left">
                <th className="px-3 py-2.5 font-medium text-denim-700">Konten</th>
                <th className="px-3 py-2.5 font-medium text-denim-700">Minggu</th>
                <th className="px-3 py-2.5 font-medium text-denim-700">Views</th>
                <th className="px-3 py-2.5 font-medium text-denim-700">Likes</th>
                <th className="px-3 py-2.5 font-medium text-denim-700">Reach</th>
                <th className="px-3 py-2.5 font-medium text-denim-700">Engagement</th>
                {canEdit && <th className="px-3 py-2.5"></th>}
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id_statistik} className="border-b border-denim-100 last:border-0">
                  <td className="px-3 py-2.5 text-xs">{judulKonten(s.id_konten)}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{s.minggu_ke}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{s.views}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{s.likes}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{s.reach}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{s.engagement_rate}</td>
                  {canEdit && (
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <button
                        onClick={() => openEdit(s)}
                        className="text-xs text-denim-700 underline mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s.id_statistik)}
                        className="text-xs text-red-600 underline"
                      >
                        Hapus
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 bg-denim-900/40 flex items-center justify-center p-5 z-20">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-signature p-5 w-full max-w-sm space-y-3"
          >
            <h2 className="font-display text-lg text-denim-700">
              {editingId ? "Edit Statistik" : "Statistik Baru"}
            </h2>

            <select
              required
              value={form.id_konten}
              onChange={(e) => setForm({ ...form, id_konten: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
            >
              {kontenList.map((k) => (
                <option key={k.id_konten} value={k.id_konten}>
                  {k.judul_konten}
                </option>
              ))}
            </select>

            <input
              required
              placeholder="Minggu ke (mis. W29)"
              value={form.minggu_ke}
              onChange={(e) => setForm({ ...form, minggu_ke: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                required
                type="number"
                placeholder="Views"
                value={form.views}
                onChange={(e) => setForm({ ...form, views: e.target.value })}
                className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
              />
              <input
                required
                type="number"
                placeholder="Likes"
                value={form.likes}
                onChange={(e) => setForm({ ...form, likes: e.target.value })}
                className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
              />
              <input
                required
                type="number"
                placeholder="Reach"
                value={form.reach}
                onChange={(e) => setForm({ ...form, reach: e.target.value })}
                className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
              />
              <input
                required
                placeholder="Engagement (mis. 6.1%)"
                value={form.engagement_rate}
                onChange={(e) => setForm({ ...form, engagement_rate: e.target.value })}
                className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="flex-1 text-sm py-2 rounded-lg border border-denim-100 text-denim-900"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 text-sm py-2 rounded-lg bg-denim-700 text-white disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
