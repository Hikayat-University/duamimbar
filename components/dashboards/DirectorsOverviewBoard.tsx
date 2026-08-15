"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, CircleDashed, ListChecks, TrendingUp } from "lucide-react";
import { StatusBadge } from "@/components/ui/Card";

type Proyek = {
  id_proyek: string;
  nama_proyek: string;
  deskripsi: string;
  divisi_terlibat: string;
  status: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  dibuat_oleh: string;
};

type ChecklistRow = {
  Phase: string;
  Section: string;
  Item: string;
  Prioritas: string;
  Status: string;
  PIC: string;
  Catatan: string;
};

type ChecklistResponse = {
  rows: ChecklistRow[];
  summary: { total: number; selesai: number; belum: number; persenSelesai: number };
};

const PAGE_SIZE = 15;

export default function DirectorsOverviewBoard() {
  const [list, setList] = useState<Proyek[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Proyek | null>(null);

  useEffect(() => {
    fetch("/api/proyek")
      .then((res) => res.json())
      .then(setList)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted">Memuat...</p>;

  if (list.length === 0) {
    return <p className="text-sm text-muted">Belum ada proyek yang tercatat.</p>;
  }

  if (selected) {
    return (
      <ChecklistDetail
        proyek={selected}
        allProyek={list}
        onSelectProyek={setSelected}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {list.map((p) => (
        <button
          key={p.id_proyek}
          onClick={() => setSelected(p)}
          className="text-left bg-white border border-denim-100 rounded-signature p-4 hover:border-denim-300 transition-colors"
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-medium text-denim-900">{p.nama_proyek}</h3>
            <StatusBadge status={p.status} />
          </div>
          <p className="text-sm text-muted line-clamp-2">{p.deskripsi}</p>
          {p.divisi_terlibat && (
            <p className="text-xs text-muted font-mono mt-2">{p.divisi_terlibat}</p>
          )}
        </button>
      ))}
    </div>
  );
}

function ChecklistDetail({
  proyek,
  allProyek,
  onSelectProyek,
  onBack,
}: {
  proyek: Proyek;
  allProyek: Proyek[];
  onSelectProyek: (p: Proyek) => void;
  onBack: () => void;
}) {
  const [data, setData] = useState<ChecklistResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "Selesai" | "Belum">("all");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);
    setStatusFilter("all");
    setPhaseFilter("all");
    setPage(1);
    fetch(`/api/proyek/checklist?tab=${encodeURIComponent(proyek.nama_proyek)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Gagal memuat checklist.");
        setData(json);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [proyek.nama_proyek]);

  const phases = useMemo(() => {
    if (!data) return [];
    const seen: string[] = [];
    for (const r of data.rows) if (!seen.includes(r.Phase)) seen.push(r.Phase);
    return seen;
  }, [data]);

  const filteredRows = useMemo(() => {
    if (!data) return [];
    return data.rows.filter((r) => {
      if (statusFilter !== "all" && r.Status !== statusFilter) return false;
      if (phaseFilter !== "all" && r.Phase !== phaseFilter) return false;
      return true;
    });
  }, [data, statusFilter, phaseFilter]);

  useEffect(() => setPage(1), [statusFilter, phaseFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pageRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex gap-4">
      {/* Side menu: lompat langsung ke checklist proyek lain */}
      <div className="hidden md:block w-48 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-denim-900 mb-3"
        >
          <ArrowLeft size={14} /> Semua proyek
        </button>
        <p className="text-xs font-medium text-denim-500 uppercase tracking-wide mb-2 px-1">
          Proyek
        </p>
        <div className="space-y-1">
          {allProyek.map((p) => (
            <button
              key={p.id_proyek}
              onClick={() => onSelectProyek(p)}
              className={`w-full text-left text-sm px-2.5 py-2 rounded-signature transition-colors ${
                p.id_proyek === proyek.id_proyek
                  ? "bg-denim-700 text-white"
                  : "text-denim-900 hover:bg-denim-50"
              }`}
            >
              {p.nama_proyek}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <button
          onClick={onBack}
          className="md:hidden flex items-center gap-1.5 text-sm text-muted hover:text-denim-900 mb-3"
        >
          <ArrowLeft size={14} /> Semua proyek
        </button>

        <h2 className="font-display text-lg text-denim-700 mb-0.5">{proyek.nama_proyek}</h2>
        <p className="text-sm text-muted mb-4">{proyek.deskripsi}</p>

        {loading && <p className="text-sm text-muted">Memuat checklist...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {data && (
          <>
            {/* Stat cards otomatis */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <StatCard
                icon={<ListChecks size={16} />}
                label="Total Item"
                value={data.summary.total}
                tone="bg-denim-50 text-denim-700"
              />
              <StatCard
                icon={<CheckCircle2 size={16} />}
                label="Selesai"
                value={data.summary.selesai}
                tone="bg-blue-50 text-blue-700"
              />
              <StatCard
                icon={<CircleDashed size={16} />}
                label="Belum Selesai"
                value={data.summary.belum}
                tone="bg-orange-50 text-orange-700"
              />
              <StatCard
                icon={<TrendingUp size={16} />}
                label="Progress"
                value={`${data.summary.persenSelesai}%`}
                tone="bg-emerald-50 text-emerald-700"
              />
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {(
                [
                  { key: "all", label: "Semua Status" },
                  { key: "Selesai", label: "Selesai" },
                  { key: "Belum", label: "Belum" },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`text-xs font-mono px-2.5 py-1 rounded-full border transition-colors ${
                    statusFilter === f.key
                      ? "bg-denim-700 text-white border-denim-700"
                      : "bg-white text-muted border-denim-100 hover:border-denim-300"
                  }`}
                >
                  {f.label}
                </button>
              ))}

              <select
                value={phaseFilter}
                onChange={(e) => setPhaseFilter(e.target.value)}
                className="text-xs font-mono px-2.5 py-1 rounded-full border border-denim-100 bg-white text-denim-900 ml-auto"
              >
                <option value="all">Semua Phase</option>
                {phases.map((ph) => (
                  <option key={ph} value={ph}>
                    {ph}
                  </option>
                ))}
              </select>
            </div>

            {/* Tabel */}
            {filteredRows.length === 0 ? (
              <p className="text-sm text-muted">Tidak ada item yang cocok dengan filter ini.</p>
            ) : (
              <div className="border border-denim-100 rounded-signature overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-denim-50/60 text-left text-xs text-denim-500 uppercase tracking-wide">
                        <th className="px-3 py-2 font-medium">Item</th>
                        <th className="px-3 py-2 font-medium hidden sm:table-cell">Phase</th>
                        <th className="px-3 py-2 font-medium hidden md:table-cell">Section</th>
                        <th className="px-3 py-2 font-medium">PIC</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((r, i) => (
                        <tr key={i} className="border-t border-denim-50 hover:bg-denim-50/40">
                          <td className="px-3 py-2 text-denim-900">{r.Item}</td>
                          <td className="px-3 py-2 text-muted hidden sm:table-cell">{r.Phase}</td>
                          <td className="px-3 py-2 text-muted hidden md:table-cell">{r.Section}</td>
                          <td className="px-3 py-2 text-muted font-mono">{r.PIC}</td>
                          <td className="px-3 py-2">
                            <StatusBadge status={r.Status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-3 py-2.5 border-t border-denim-50 text-xs text-muted">
                  <span>
                    Menampilkan {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, filteredRows.length)} dari {filteredRows.length}{" "}
                    item
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-2 py-1 rounded-signature border border-denim-100 disabled:opacity-40"
                    >
                      ‹
                    </button>
                    <span className="px-2 font-mono">
                      {page}/{totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-2 py-1 rounded-signature border border-denim-100 disabled:opacity-40"
                    >
                      ›
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="bg-white border border-denim-100 rounded-signature p-3.5">
      <div className={`w-7 h-7 rounded-signature flex items-center justify-center mb-2 ${tone}`}>
        {icon}
      </div>
      <p className="text-lg font-display text-denim-900">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
