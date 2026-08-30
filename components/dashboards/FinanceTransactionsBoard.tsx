"use client";

import { useEffect, useState } from "react";
import { Card, StatusBadge } from "@/components/ui/Card";

const TRANSACTION_TYPES = [
  "Income",
  "Expense",
  "Transfer",
  "Payment",
  "Reimbursement",
  "Accounts Receivable",
  "Accounts Payable",
];

type Transaction = {
  "Transaction ID": string;
  Date: string;
  "Transaction Type": string;
  "Account Code": string;
  "Program ID": string;
  "Revenue Stream ID": string;
  "Client/Vendor ID": string;
  Description: string;
  "Amount (Rp)": string;
  "Bank/Cash Account": string;
  PIC: string;
  "Approval Status": string;
  "Payment Status": string;
  "Document/Proof Link": string;
  Notes: string;
};

type Master = {
  program: { "Program ID": string; Name: string }[];
  revenueStream: { "Revenue Stream ID": string; "Revenue Stream": string }[];
  client: { "Client ID": string; "Client Name": string }[];
  vendor: { "Vendor ID": string; "Vendor Name": string }[];
  coa: { "Account Code": string; "Account Name": string }[];
  bank: { "Account ID": string; "Account Name": string }[];
};

const EMPTY_FORM = {
  Date: "",
  "Transaction Type": "Income",
  "Account Code": "",
  "Program ID": "",
  "Revenue Stream ID": "",
  "Client/Vendor ID": "",
  Description: "",
  "Amount (Rp)": "",
  "Bank/Cash Account": "",
  "Document/Proof Link": "",
  Notes: "",
};

export default function FinanceTransactionsBoard({ canEdit }: { canEdit: boolean }) {
  const [list, setList] = useState<Transaction[]>([]);
  const [master, setMaster] = useState<Master | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    Promise.allSettled([
      fetch("/api/finance/transactions").then((r) => r.json()),
      fetch("/api/finance/master").then((r) => r.json()),
    ]).then(([txResult, masterResult]) => {
      if (txResult.status === "fulfilled") setList(txResult.value);
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

    const res = await fetch("/api/finance/transactions", {
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

  async function handleDelete(id: string) {
    if (!confirm("Hapus transaksi ini?")) return;
    await fetch("/api/finance/transactions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ "Transaction ID": id }),
    });
    load();
  }

  if (loading) return <p className="text-sm text-muted">Memuat...</p>;

  const sorted = [...list].sort((a, b) => (a.Date < b.Date ? 1 : -1));

  return (
    <div>
      {canEdit && (
        <button
          onClick={openNew}
          className="mb-4 text-sm bg-denim-700 text-white px-3.5 py-2 rounded-lg hover:bg-denim-500 transition-colors"
        >
          + Catat Transaksi
        </button>
      )}

      {sorted.length === 0 ? (
        <p className="text-sm text-muted">Belum ada transaksi tercatat.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((t) => (
            <Card key={t["Transaction ID"]}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <p className="font-medium text-denim-900 text-sm">{t.Description || t["Transaction Type"]}</p>
                  <p className="text-xs text-muted font-mono">
                    {t["Transaction ID"]} · {t.Date}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <StatusBadge status={t["Approval Status"]} />
                  <StatusBadge status={t["Payment Status"]} />
                </div>
              </div>
              <p
                className={`text-sm font-mono mb-1 ${
                  t["Transaction Type"] === "Income" ? "text-emerald-700" : "text-denim-900"
                }`}
              >
                Rp {Number(t["Amount (Rp)"] || 0).toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-muted">
                {t["Transaction Type"]} · {t["Account Code"]}
                {t["Program ID"] && ` · ${t["Program ID"]}`}
                {t.PIC && ` · PIC: ${t.PIC}`}
              </p>
              {t["Document/Proof Link"] && (
                <a
                  href={t["Document/Proof Link"]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-denim-600 underline mt-1 inline-block"
                >
                  Lihat bukti
                </a>
              )}
              {canEdit && (
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-denim-100">
                  <button
                    onClick={() => handleDelete(t["Transaction ID"])}
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

      {formOpen && master && (
        <div className="fixed inset-0 bg-denim-900/40 flex items-center justify-center p-5 z-20 overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-signature p-5 w-full max-w-sm space-y-3 my-8"
          >
            <h2 className="font-display text-lg text-denim-700">Transaksi Baru</h2>

            <input
              required
              type="date"
              value={form.Date}
              onChange={(e) => setForm({ ...form, Date: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />

            <select
              value={form["Transaction Type"]}
              onChange={(e) => setForm({ ...form, "Transaction Type": e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
            >
              {TRANSACTION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              required
              value={form["Account Code"]}
              onChange={(e) => setForm({ ...form, "Account Code": e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
            >
              <option value="">Pilih Account (Chart of Accounts)</option>
              {master.coa.map((c) => (
                <option key={c["Account Code"]} value={c["Account Code"]}>
                  {c["Account Code"]} — {c["Account Name"]}
                </option>
              ))}
            </select>

            <select
              value={form["Program ID"]}
              onChange={(e) => setForm({ ...form, "Program ID": e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
            >
              <option value="">Pilih Program (opsional)</option>
              {master.program.map((p) => (
                <option key={p["Program ID"]} value={p["Program ID"]}>{p.Name}</option>
              ))}
            </select>

            <select
              value={form["Revenue Stream ID"]}
              onChange={(e) => setForm({ ...form, "Revenue Stream ID": e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
            >
              <option value="">Pilih Revenue Stream (opsional)</option>
              {master.revenueStream.map((r) => (
                <option key={r["Revenue Stream ID"]} value={r["Revenue Stream ID"]}>
                  {r["Revenue Stream"]}
                </option>
              ))}
            </select>

            <select
              value={form["Client/Vendor ID"]}
              onChange={(e) => setForm({ ...form, "Client/Vendor ID": e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
            >
              <option value="">Pilih Client/Vendor (opsional)</option>
              {master.client.map((c) => (
                <option key={c["Client ID"]} value={c["Client ID"]}>Client: {c["Client Name"]}</option>
              ))}
              {master.vendor.map((v) => (
                <option key={v["Vendor ID"]} value={v["Vendor ID"]}>Vendor: {v["Vendor Name"]}</option>
              ))}
            </select>

            <input
              required
              placeholder="Deskripsi"
              value={form.Description}
              onChange={(e) => setForm({ ...form, Description: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />

            <input
              required
              type="number"
              placeholder="Nominal (Rp)"
              value={form["Amount (Rp)"]}
              onChange={(e) => setForm({ ...form, "Amount (Rp)": e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />

            <select
              required
              value={form["Bank/Cash Account"]}
              onChange={(e) => setForm({ ...form, "Bank/Cash Account": e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
            >
              <option value="">Pilih Bank/Cash Account</option>
              {master.bank.map((b) => (
                <option key={b["Account ID"]} value={b["Account ID"]}>{b["Account Name"]}</option>
              ))}
            </select>

            <input
              placeholder="Link bukti (opsional)"
              value={form["Document/Proof Link"]}
              onChange={(e) => setForm({ ...form, "Document/Proof Link": e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
            />

            <textarea
              placeholder="Catatan (opsional)"
              value={form.Notes}
              onChange={(e) => setForm({ ...form, Notes: e.target.value })}
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
