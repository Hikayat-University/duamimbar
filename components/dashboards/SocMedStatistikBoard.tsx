"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";

type Statistik = {
  id_statistik: string;
  id_konten: string;
  minggu_ke: string;
  tanggal_input: string;
  link_konten: string;
  views: string;
  likes: string;
  reach: string;
  engagement_rate: string;
  comments: string;
  reposts: string;
  shares: string;
  saves: string;
  follows: string;
  external_link_taps: string;
};
type Konten = { id_konten: string; judul_konten: string };

const EMPTY_FORM = {
  id_konten: "",
  minggu_ke: "",
  link_konten: "",
  views: "",
  likes: "",
  reach: "",
  comments: "",
  reposts: "",
  shares: "",
  saves: "",
  follows: "",
  external_link_taps: "",
};

/**
 * Engagement rate dihitung otomatis, bukan diketik manual:
 *   (Likes + Komentar + Repost + Share + Save) / Reach x 100
 * Follow & klik link eksternal SENGAJA nggak dimasukin ke rumus ini —
 * itu metrik konversi terpisah, bukan bagian standar "engagement" di
 * kebanyakan laporan social media. Kalau timnya mau rumus beda, tinggal
 * bilang, gampang disesuaikan di satu tempat ini aja.
 */
function hitungEngagementRate(f: typeof EMPTY_FORM): string {
  const reach = parseFloat(f.reach) || 0;
  if (reach <= 0) return "-";
  const interaksi =
    (parseFloat(f.likes) || 0) +
    (parseFloat(f.comments) || 0) +
    (parseFloat(f.reposts) || 0) +
    (parseFloat(f.shares) || 0) +
    (parseFloat(f.saves) || 0);
  return `${((interaksi / reach) * 100).toFixed(2)}%`;
}

export default function SocMedStatistikBoard({ canEdit }: { canEdit: boolean }) {
  const [list, setList] = useState<Statistik[]>([]);
  const [kontenList, setKontenList] = useState<Konten[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  function load() {
    setLoading(true);
    Promise.allSettled([
      fetch("/api/socmed/statistik").then((res) => res.json()),
      fetch("/api/socmed/konten").then((res) => res.json()),
    ]).then(([statResult, kontenResult]) => {
      if (statResult.status === "fulfilled") setList(statResult.value);
      else console.error("Gagal ambil statistik:", statResult.reason);

      if (kontenResult.status === "fulfilled") setKontenList(kontenResult.value);
      else console.error("Gagal ambil konten:", kontenResult.reason);

      setLoading(false);
    });
  }

  useEffect(load, []);

  function judulKonten(id: string) {
    return kontenList.find((k) => k.id_konten === id)?.judul_konten ?? "(konten tidak dikenal)";
  }

  const filteredList = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (s) => judulKonten(s.id_konten).toLowerCase().includes(q) || s.minggu_ke.toLowerCase().includes(q)
    );
  }, [list, search, kontenList]);

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
      link_konten: s.link_konten,
      views: s.views,
      likes: s.likes,
      reach: s.reach,
      comments: s.comments ?? "",
      reposts: s.reposts ?? "",
      shares: s.shares ?? "",
      saves: s.saves ?? "",
      follows: s.follows ?? "",
      external_link_taps: s.external_link_taps ?? "",
    });
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = { ...form, engagement_rate: hitungEngagementRate(form) };

    const res = await fetch("/api/socmed/statistik", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id_statistik: editingId, ...payload } : payload),
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

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white border border-denim-100 rounded-signature p-4">
            <div className="h-4 w-1/2 bg-denim-100 rounded mb-2" />
            <div className="h-3 w-1/3 bg-denim-50 rounded mb-3" />
            <div className="h-3 w-full bg-denim-50 rounded" />
          </div>
        ))}
      </div>
    );
  }

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

      {list.length > 0 && (
        <input
          placeholder="Cari judul konten atau minggu (mis. W29)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 rounded-lg border border-denim-100 px-3 py-1.5 text-sm outline-none focus:border-denim-500 mb-4"
        />
      )}

      {filteredList.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-denim-100 rounded-signature">
          <p className="text-sm text-muted">
            {list.length === 0 ? "Belum ada data statistik mingguan." : "Tidak ada data yang cocok."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((s) => (
            <Card key={s.id_statistik}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <p className="font-medium text-denim-900 text-sm">{judulKonten(s.id_konten)}</p>
                  <p className="text-xs text-muted font-mono">{s.minggu_ke}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg text-denim-700">{s.engagement_rate || "-"}</p>
                  <p className="text-[10px] text-muted -mt-0.5">Engagement</p>
                </div>
              </div>

              {s.link_konten && (
                <a
                  href={s.link_konten}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-denim-500 underline block mb-2"
                >
                  Buka konten
                </a>
              )}

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-3 gap-y-1.5 text-xs font-mono text-denim-900 mb-2">
                <p>Views: {s.views || 0}</p>
                <p>Likes: {s.likes || 0}</p>
                <p>Reach: {s.reach || 0}</p>
                <p>Komentar: {s.comments || 0}</p>
                <p>Repost: {s.reposts || 0}</p>
                <p>Share: {s.shares || 0}</p>
                <p>Save: {s.saves || 0}</p>
                <p>Follow: {s.follows || 0}</p>
                <p>Klik Link: {s.external_link_taps || 0}</p>
              </div>

              {canEdit && (
                <div className="flex gap-3 pt-2 border-t border-denim-100">
                  <button onClick={() => openEdit(s)} className="text-xs text-denim-700 underline">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s.id_statistik)}
                    className="text-xs text-red-600 underline"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 bg-denim-900/40 flex items-center justify-center p-5 z-20 overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-signature p-5 w-full max-w-sm space-y-3 my-8"
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

            <input
              placeholder="Link konten yang sudah post (opsional)"
              value={form.link_konten}
              onChange={(e) => setForm({ ...form, link_konten: e.target.value })}
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
                type="number"
                placeholder="Komentar"
                value={form.comments}
                onChange={(e) => setForm({ ...form, comments: e.target.value })}
                className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
              />
              <input
                type="number"
                placeholder="Repost"
                value={form.reposts}
                onChange={(e) => setForm({ ...form, reposts: e.target.value })}
                className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
              />
              <input
                type="number"
                placeholder="Share"
                value={form.shares}
                onChange={(e) => setForm({ ...form, shares: e.target.value })}
                className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
              />
              <input
                type="number"
                placeholder="Save"
                value={form.saves}
                onChange={(e) => setForm({ ...form, saves: e.target.value })}
                className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
              />
              <input
                type="number"
                placeholder="Follow"
                value={form.follows}
                onChange={(e) => setForm({ ...form, follows: e.target.value })}
                className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
              />
              <input
                type="number"
                placeholder="Klik link eksternal"
                value={form.external_link_taps}
                onChange={(e) => setForm({ ...form, external_link_taps: e.target.value })}
                className="col-span-2 w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
              />
            </div>

            <div className="rounded-lg bg-denim-50 px-3 py-2.5 flex items-center justify-between">
              <span className="text-xs text-denim-700">Engagement rate (otomatis)</span>
              <span className="font-display text-lg text-denim-700">{hitungEngagementRate(form)}</span>
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
