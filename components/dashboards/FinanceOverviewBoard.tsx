"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

type Overview = {
  kpi: {
    totalRevenue: number;
    totalExpense: number;
    netProfit: number;
    cashBalance: number;
    totalArOutstanding: number;
    totalApOutstanding: number;
  };
  revenueByProgram: { program: string; revenue: number }[];
  revenueByStream: { stream: string; revenue: number }[];
  budget: {
    "Program ID": string;
    "Account Code": string;
    "Budget (Rp)": string;
    "Actual (Rp)": string;
    "Variance (Rp)": string;
    "Variance %": string;
    Notes: string;
  }[];
};

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

const KPI_LABELS: { key: keyof Overview["kpi"]; label: string; tone: string }[] = [
  { key: "totalRevenue", label: "Total Revenue", tone: "text-emerald-700" },
  { key: "totalExpense", label: "Total Expense", tone: "text-red-600" },
  { key: "netProfit", label: "Net Profit", tone: "text-denim-900" },
  { key: "cashBalance", label: "Cash Balance", tone: "text-denim-900" },
  { key: "totalArOutstanding", label: "AR Outstanding", tone: "text-amber-700" },
  { key: "totalApOutstanding", label: "AP Outstanding", tone: "text-amber-700" },
];

export default function FinanceOverviewBoard() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/finance/overview")
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Gagal memuat.");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted">Memuat...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {KPI_LABELS.map(({ key, label, tone }) => (
          <Card key={key}>
            <p className="text-xs text-muted mb-1">{label}</p>
            <p className={`text-sm font-mono font-medium ${tone}`}>{formatRp(data.kpi[key])}</p>
          </Card>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <p className="text-sm font-medium text-denim-900 mb-3">Revenue by Program</p>
          <div className="space-y-2">
            {data.revenueByProgram.map((r) => (
              <div key={r.program} className="flex items-center justify-between text-sm">
                <span className="text-muted">{r.program}</span>
                <span className="font-mono text-denim-900">{formatRp(r.revenue)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <p className="text-sm font-medium text-denim-900 mb-3">Revenue by Stream</p>
          <div className="space-y-2">
            {data.revenueByStream.map((r) => (
              <div key={r.stream} className="flex items-center justify-between text-sm">
                <span className="text-muted">{r.stream}</span>
                <span className="font-mono text-denim-900">{formatRp(r.revenue)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <p className="text-sm font-medium text-denim-900 mb-3">Budget vs Actual</p>
        {data.budget.length === 0 ? (
          <p className="text-sm text-muted">Belum ada budget yang diisi di sheet.</p>
        ) : (
          <div className="border border-denim-100 rounded-signature overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white border-b border-denim-100 text-left text-xs text-denim-500 uppercase tracking-wide">
                    <th className="px-4 py-3 font-medium">Program</th>
                    <th className="px-4 py-3 font-medium">Account</th>
                    <th className="px-4 py-3 font-medium">Budget</th>
                    <th className="px-4 py-3 font-medium">Actual</th>
                    <th className="px-4 py-3 font-medium">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.budget.map((b, i) => (
                    <tr key={i} className="border-t border-denim-50">
                      <td className="px-4 py-3 text-denim-900">{b["Program ID"]}</td>
                      <td className="px-4 py-3 text-muted">{b["Account Code"]}</td>
                      <td className="px-4 py-3 font-mono text-muted">{b["Budget (Rp)"]}</td>
                      <td className="px-4 py-3 font-mono text-muted">{b["Actual (Rp)"]}</td>
                      <td
                        className={`px-4 py-3 font-mono ${
                          Number(b["Variance (Rp)"]) > 0 ? "text-red-600" : "text-emerald-700"
                        }`}
                      >
                        {b["Variance (Rp)"]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <p className="text-xs text-muted mt-2">
          Kolom Budget diisi manual langsung di spreadsheet (belum ada form input dari app). Actual &
          Variance dihitung otomatis dari Transactions.
        </p>
      </div>
    </div>
  );
}
