"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

type BudgetItem = {
  id_budget: string;
  id_proyek: string;
  nama_item: string;
  estimasi_biaya: string;
  realisasi_biaya: string;
  catatan: string;
};

type Proyek = { id_proyek: string; nama_proyek: string };

const EMPTY_FORM = {
  id_proyek: "",
  nama_item: "",
  estimasi_biaya: "",
  realisasi_biaya: "",
  catatan: "",
};

export default function BudgetPlannerBoard({ canEdit }: { canEdit: boolean }) {
  const [list, setList] = useState<BudgetItem[]>([]);
  const [proyekList, setProyekList] = useState<Proyek[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    Promise.allSettled([
      fetch("/api/finance/budget").then((res) => res.json()),
      fetch("/api/proyek").then((res) => res.json()),
    ]).then(([budgetResult, proyekResult]) => {
      if (budgetResult.status === "fulfilled") setList(budgetResult.value);
      else console.error("Gagal ambil budget:", budgetResult.reason);

      if (proyekResult.status === "fulfilled") setProyekList(proyekResult.value);
      else console.error("Gagal ambil daftar proyek:", proyekResult.reason);

      setLoading(false);
    });
  }

  useEffect(load, []);

  function namaProyek(id: string) {
    return proyekList.find((p) => p.id_proyek === id)?.nama_proyek ?? "(proyek tidak dikenal)";
  }

  function openNew() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, id_proyek: proyekList[0]?.id_proyek ?? "" });
    setFormOpen(true);
  }

  function openEdit(b: BudgetItem) {
    setEditingId(b.id_budget);
    setForm({
      id_proyek: b.id_proyek,
      nama_item: b.nama_item,
      estimasi_biaya: b.estimasi_biaya,
      realisasi_biaya: b.realisasi_biaya,
      catatan: b.catatan,
    });
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/finance/budget", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id_budget: editingId, ...form } : form),
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
    if (!confirm("Hapus item anggaran ini?")) return;
    await fetch("/api/finance/budget", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_budget: id }),
    });
    load();
  }

  if (loading) return <p className="text-sm text-muted">Memuat...</p>;

  // Kelompokkan per proyek biar gampang dibaca
  const grouped = list.reduce<Record<string, BudgetItem[]>>((acc, item) => {
    (acc[item.id_proyek] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div>
      {canEdit && (
        <button
          onClick={openNew}
          disabled={proyekList.length === 0}
          className="mb-4 text-sm bg-denim-700 text-white px-3.5 py-2 rounded-lg hover:bg-denim-500 transition-colors disabled:opacity-50"
        >
          + Tambah Item Anggaran
        </button>
      )}
      {canEdit && proyekList.length === 0 && (
        <p className="text-xs text-muted mb-4">
          Belum ada proyek perusahaan tercatat di Home — tambahkan dulu sebelum bisa bikin anggaran.
        </p>
      )}

      {list.length === 0 ? (
        <p className="text-sm text-muted">Belum ada rancangan anggaran.</p>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([idProyek, items]) => {
            const totalEstimasi = items.reduce(
              (s, i) => s + (parseFloat(i.estimasi_biaya.replace(/[^0-9.-]/g, "")) || 0),
              0
            );
            const totalRealisasi = items.reduce(
              (s, i) => s + (parseFloat(i.realisasi_biaya.replace(/[^0-9.-]/g, "")) || 0),
              0
            );
            return (
              <div key={idProyek}>
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="font-medium text-sm text-denim-900">{namaProyek(idProyek)}</h3>
                  <p className="text-xs text-muted font-mono">
                    Rp {totalRealisasi.toLocaleString("id-ID")} / Rp{" "}
                    {totalEstimasi.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="space-y-2">
                  {items.map((b) => (
                    <Card key={b.id_budget}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-denim-900 text-sm">{b.nama_item}</p>
                      </div>
                      <p className="text-xs text-muted font-mono mb-1">
                        Estimasi: {b.estimasi_biaya} · Realisasi: {b.realisasi_biaya || "-"}
                      </p>
                      {b.catatan && <p className="text-sm text-muted mb-2">{b.catatan}</p>}
                      {canEdit && (
                        <div className="flex gap-3 mt-2 pt-2 border-t border-denim-100">
                          <button
                            onClick={() => openEdit(b)}
                            className="text-xs text-denim-700 underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(b.id_budget)}
                            className="text-xs text-red-600 underline"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 bg-denim-900/40 flex items-center justify-center p-5 z-20">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-signature p-5 w-full max-w-sm space-y-3"
          >
            <h2 className="font-display text-lg text-denim-700">
              {editingId ? "Edit Item Anggaran" : "Item Anggaran Baru"}
            </h2>

            <select
              required
              value={form.id_proyek}
              onChange={(e) => setForm({ ...form, id_proyek: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
            >
              {proyekList.map((p) => (
                <option key={p.id_proyek} value={p.id_proyek}>
                  {p.nama_proyek}
                </option>
              ))}
            </select>

            <input
              required
              placeholder="Nama item (mis. Sewa studio)"
              value={form.nama_item}
              onChange={(e) => setForm({ ...form, nama_item: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />

            <input
              required
              placeholder="Estimasi biaya (mis. Rp 3.000.000)"
              value={form.estimasi_biaya}
              onChange={(e) => setForm({ ...form, estimasi_biaya: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />

            <input
              placeholder="Realisasi biaya (opsional, isi setelah ada pengeluaran)"
              value={form.realisasi_biaya}
              onChange={(e) => setForm({ ...form, realisasi_biaya: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />

            <textarea
              placeholder="Catatan (opsional)"
              value={form.catatan}
              onChange={(e) => setForm({ ...form, catatan: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
              rows={2}
            />

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
