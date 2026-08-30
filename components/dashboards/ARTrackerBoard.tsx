"use client";

import { useEffect, useState } from "react";
import { Card, StatusBadge } from "@/components/ui/Card";

const STATUS_OPTIONS = ["Open", "Partial", "Paid", "Overdue"];

type ArRow = {
  rowIndex: number;
  Client: string;
  "Contract/Invoice ID": string;
  Program: string;
  "Revenue Stream": string;
  "Invoice Date": string;
  "Due Date": string;
  "Amount (Rp)": string;
  "Amount Received (Rp)": string;
  "Outstanding (Rp)": string;
  Status: string;
  "Follow-up Date": string;
};

type Master = {
  program: { "Program ID": string; Name: string }[];
  revenueStream: { "Revenue Stream ID": string; "Revenue Stream": string }[];
  client: { "Client ID": string; "Client Name": string }[];
};

const EMPTY_FORM = {
  Client: "",
  "Contract/Invoice ID": "",
  Program: "",
  "Revenue Stream": "",
  "Invoice Date": "",
  "Due Date": "",
  "Amount (Rp)": "",
  "Amount Received (Rp)": "0",
  Status: "Open",
  "Follow-up Date": "",
};

export default function ARTrackerBoard({ canEdit }: { canEdit: boolean }) {
  const [list, setList] = useState<ArRow[]>([]);
  const [master, setMaster] = useState<Master | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [updatingIndex, setUpdatingIndex] = useState<number | null>(null);

  function load() {
    setLoading(true);
    Promise.allSettled([
      fetch("/api/finance/ar").then((r) => r.json()),
      fetch("/api/finance/master").then((r) => r.json()),
    ]).then(([arResult, masterResult]) => {
      if (arResult.status === "fulfilled") setList(arResult.value);
      if (masterResult.status === "fulfilled") setMaster(masterResult.value);
      setLoading(false);
    });
  }

  useEffect(load, []);

  function openNew() {
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/finance/ar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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

  async function updateStatus(row: ArRow, status: string) {
    setUpdatingIndex(row.rowIndex);
    setList((prev) => prev.map((r) => (r.rowIndex === row.rowIndex ? { ...r, Status: status } : r)));
    await fetch("/api/finance/ar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowIndex: row.rowIndex, Status: status }),
    });
    setUpdatingIndex(null);
  }

  async function handleDelete(rowIndex: number) {
    if (!confirm("Hapus catatan piutang ini?")) return;
    await fetch("/api/finance/ar", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowIndex }),
    });
    load();
  }

  if (loading) return <p className="text-sm text-muted">Memuat...</p>;

  return (
    <div>
      {canEdit && (
        <button
          onClick={openNew}
          className="mb-4 text-sm bg-denim-700 text-white px-3.5 py-2 rounded-lg hover:bg-denim-500 transition-colors"
        >
          + Tambah Piutang
        </button>
      )}

      {list.length === 0 ? (
        <p className="text-sm text-muted">Belum ada piutang tercatat.</p>
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <Card key={r.rowIndex}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <p className="font-medium text-denim-900 text-sm">{r.Client}</p>
                  <p className="text-xs text-muted font-mono">
                    {r["Contract/Invoice ID"]} · Jatuh tempo {r["Due Date"]}
                  </p>
                </div>
                <StatusBadge status={r.Status} />
              </div>
              <p className="text-sm text-denim-900 font-mono mb-1">
                Outstanding: Rp {Number(r["Outstanding (Rp)"] || 0).toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-muted">
                Tagihan Rp {Number(r["Amount (Rp)"] || 0).toLocaleString("id-ID")} · Diterima Rp{" "}
                {Number(r["Amount Received (Rp)"] || 0).toLocaleString("id-ID")}
              </p>
              {canEdit && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-denim-100">
                  <select
                    value={r.Status}
                    onChange={(e) => updateStatus(r, e.target.value)}
                    disabled={updatingIndex === r.rowIndex}
                    className="text-xs rounded-lg border border-denim-100 px-2 py-1 outline-none focus:border-denim-500 bg-white disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleDelete(r.rowIndex)}
                    className="text-xs text-red-600 underline ml-auto"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {formOpen && master && (
        <div className="fixed inset-0 bg-denim-900/40 flex items-center justify-center p-5 z-20 overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-signature p-5 w-full max-w-sm space-y-3 my-8"
          >
            <h2 className="font-display text-lg text-denim-700">Piutang Baru</h2>

            <select
              required
              value={form.Client}
              onChange={(e) => setForm({ ...form, Client: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
            >
              <option value="">Pilih Client</option>
              {master.client.map((c) => (
                <option key={c["Client ID"]} value={c["Client Name"]}>{c["Client Name"]}</option>
              ))}
            </select>

            <input
              required
              placeholder="Contract/Invoice ID"
              value={form["Contract/Invoice ID"]}
              onChange={(e) => setForm({ ...form, "Contract/Invoice ID": e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />

            <select
              value={form.Program}
              onChange={(e) => setForm({ ...form, Program: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
            >
              <option value="">Pilih Program (opsional)</option>
              {master.program.map((p) => (
                <option key={p["Program ID"]} value={p.Name}>{p.Name}</option>
              ))}
            </select>

            <select
              value={form["Revenue Stream"]}
              onChange={(e) => setForm({ ...form, "Revenue Stream": e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
            >
              <option value="">Pilih Revenue Stream (opsional)</option>
              {master.revenueStream.map((r) => (
                <option key={r["Revenue Stream ID"]} value={r["Revenue Stream"]}>
                  {r["Revenue Stream"]}
                </option>
              ))}
            </select>

            <label className="text-xs text-muted block -mb-2">Tanggal invoice</label>
            <input
              required
              type="date"
              value={form["Invoice Date"]}
              onChange={(e) => setForm({ ...form, "Invoice Date": e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />

            <label className="text-xs text-muted block -mb-2">Jatuh tempo</label>
            <input
              required
              type="date"
              value={form["Due Date"]}
              onChange={(e) => setForm({ ...form, "Due Date": e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />

            <input
              required
              type="number"
              placeholder="Nominal tagihan (Rp)"
              value={form["Amount (Rp)"]}
              onChange={(e) => setForm({ ...form, "Amount (Rp)": e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
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
