"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, CircleDashed, ListChecks, Pencil, TrendingUp } from "lucide-react";
import { StatusBadge } from "@/components/ui/Card";
import { VerdictCard } from "@/components/ui/VerdictCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardGridSkeleton, DetailSkeleton } from "@/components/ui/Skeleton";
import { FilterPills } from "@/components/ui/FilterPills";
import { Textarea } from "@/components/ui/FormField";

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
  rowIndex: number;
};

type ChecklistSummary = { total: number; selesai: number; belum: number; persenSelesai: number };
type ChecklistResponse = { rows: ChecklistRow[]; summary: ChecklistSummary };

const PAGE_SIZE = 15;

function isAssignedTo(picField: string, nama: string): boolean {
  const target = nama.trim().toLowerCase();
  return picField
    .split("+")
    .map((s) => s.trim().toLowerCase())
    .includes(target);
}

async function fetchSummary(namaProyek: string): Promise<ChecklistSummary | null> {
  try {
    const res = await fetch(`/api/proyek/checklist?tab=${encodeURIComponent(namaProyek)}`);
    if (!res.ok) return null;
    const json: ChecklistResponse = await res.json();
    return json.summary;
  } catch {
    return null;
  }
}

export default function DirectorsOverviewBoard({
  currentUserNama,
  currentUserRole,
}: {
  currentUserNama: string;
  currentUserRole: string;
}) {
  const [list, setList] = useState<Proyek[]>([]);
  const [summaries, setSummaries] = useState<Record<string, ChecklistSummary | null>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Proyek | null>(null);

  useEffect(() => {
    fetch("/api/proyek")
      .then((res) => res.json())
      .then(async (proyekList: Proyek[]) => {
        setList(proyekList);
        setLoading(false);
        const results = await Promise.all(
          proyekList.map(async (p) => [p.nama_proyek, await fetchSummary(p.nama_proyek)] as const)
        );
        setSummaries(Object.fromEntries(results));
      });
  }, []);

  if (loading) return <CardGridSkeleton />;

  if (list.length === 0) {
    return <EmptyState message="Belum ada proyek yang tercatat." />;
  }

  if (selected) {
    return (
      <ChecklistDetail
        proyek={selected}
        allProyek={list}
        currentUserNama={currentUserNama}
        currentUserRole={currentUserRole}
        onSelectProyek={setSelected}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {list.map((p) => {
        const summary = summaries[p.nama_proyek];
        return (
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

            {summary === undefined ? null : summary === null ? (
              <p className="text-xs text-muted mt-3">Checklist belum tersedia</p>
            ) : (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted">Checklist</span>
                  <span className="text-xs text-denim-700 font-mono">
                    {summary.selesai}/{summary.total} ({summary.persenSelesai}%)
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-denim-50 overflow-hidden">
                  <div
                    className="h-full bg-denim-700 rounded-full transition-all"
                    style={{ width: `${summary.persenSelesai}%` }}
                  />
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ChecklistDetail({
  proyek,
  allProyek,
  currentUserNama,
  currentUserRole,
  onSelectProyek,
  onBack,
}: {
  proyek: Proyek;
  allProyek: Proyek[];
  currentUserNama: string;
  currentUserRole: string;
  onSelectProyek: (p: Proyek) => void;
  onBack: () => void;
}) {
  const [data, setData] = useState<ChecklistResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "Selesai" | "Belum">("all");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [editingCatatan, setEditingCatatan] = useState<number | null>(null);
  const [catatanDraft, setCatatanDraft] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);
    setStatusFilter("all");
    setPhaseFilter("all");
    setPage(1);
    setEditingCatatan(null);
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

  function isAssigned(row: ChecklistRow) {
    return currentUserRole === "head_director" || isAssignedTo(row.PIC ?? "", currentUserNama);
  }

  async function patchRow(row: ChecklistRow, updates: Record<string, string>, localApply: (r: ChecklistRow) => ChecklistRow) {
    if (!data) return;
    setSavingIndex(row.rowIndex);
    setError(null);
    const prevData = data;

    setData({
      ...data,
      rows: data.rows.map((r) => (r.rowIndex === row.rowIndex ? localApply(r) : r)),
    });

    const res = await fetch("/api/proyek/checklist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tab: proyek.nama_proyek, rowIndex: row.rowIndex, updates }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Gagal menyimpan perubahan.");
      setData(prevData);
    } else if (updates.Status !== undefined) {
      setData((cur) => {
        if (!cur) return cur;
        const selesai = cur.rows.filter((r) => r.Status === "Selesai").length;
        const total = cur.rows.length;
        return {
          ...cur,
          summary: {
            total,
            selesai,
            belum: total - selesai,
            persenSelesai: total === 0 ? 0 : Math.round((selesai / total) * 100),
          },
        };
      });
    }
    setSavingIndex(null);
  }

  function toggleStatus(row: ChecklistRow) {
    const nextStatus = row.Status === "Selesai" ? "Belum" : "Selesai";
    patchRow(row, { Status: nextStatus }, (r) => ({ ...r, Status: nextStatus }));
  }

  function startEditCatatan(row: ChecklistRow) {
    setEditingCatatan(row.rowIndex);
    setCatatanDraft(row.Catatan ?? "");
  }

  async function saveCatatan(row: ChecklistRow) {
    await patchRow(row, { Catatan: catatanDraft }, (r) => ({ ...r, Catatan: catatanDraft }));
    setEditingCatatan(null);
  }

  return (
    <div className="flex gap-4">
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

        {loading && <DetailSkeleton />}
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

        {data && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <VerdictCard icon={<ListChecks size={16} />} label="Total Item" value={data.summary.total} tone="bg-denim-50 text-denim-700" />
              <VerdictCard icon={<CheckCircle2 size={16} />} label="Selesai" value={data.summary.selesai} tone="bg-blue-50 text-blue-700" />
              <VerdictCard icon={<CircleDashed size={16} />} label="Belum Selesai" value={data.summary.belum} tone="bg-orange-50 text-orange-700" />
              <VerdictCard icon={<TrendingUp size={16} />} label="Progress" value={`${data.summary.persenSelesai}%`} tone="bg-emerald-50 text-emerald-700" />
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <FilterPills
                options={[
                  { value: "all" as const, label: "Semua Status" },
                  { value: "Selesai" as const, label: "Selesai" },
                  { value: "Belum" as const, label: "Belum" },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
              />
              <select
                value={phaseFilter}
                onChange={(e) => setPhaseFilter(e.target.value)}
                className="text-xs font-mono px-2.5 py-1 rounded-full border border-denim-100 bg-white text-denim-900 ml-auto"
              >
                <option value="all">Semua Phase</option>
                {phases.map((ph) => (
                  <option key={ph} value={ph}>{ph}</option>
                ))}
              </select>
            </div>

            {filteredRows.length === 0 ? (
              <p className="text-sm text-muted">Tidak ada item yang cocok dengan filter ini.</p>
            ) : (
              <div className="border border-denim-100 rounded-signature overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-denim-50/60 text-left text-xs text-denim-500 uppercase tracking-wide">
                        <th className="px-4 py-3 font-medium">Item</th>
                        <th className="px-4 py-3 font-medium hidden sm:table-cell">Phase</th>
                        <th className="px-4 py-3 font-medium hidden md:table-cell">Section</th>
                        <th className="px-4 py-3 font-medium">PIC</th>
                        <th className="px-4 py-3 font-medium hidden lg:table-cell">Catatan</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((r) => {
                        const assigned = isAssigned(r);
                        const saving = savingIndex === r.rowIndex;
                        return (
                          <tr key={r.rowIndex} className="border-t border-denim-50 hover:bg-denim-50/40">
                            <td className="px-4 py-3 text-denim-900">{r.Item}</td>
                            <td className="px-4 py-3 text-muted hidden sm:table-cell">{r.Phase}</td>
                            <td className="px-4 py-3 text-muted hidden md:table-cell">{r.Section}</td>
                            <td className="px-4 py-3 text-muted font-mono">{r.PIC}</td>
                            <td className="px-4 py-3 text-muted hidden lg:table-cell max-w-[220px]">
                              {editingCatatan === r.rowIndex ? (
                                <div className="flex items-start gap-1.5">
                                  <Textarea
                                    autoFocus
                                    value={catatanDraft}
                                    onChange={(e) => setCatatanDraft(e.target.value)}
                                    rows={2}
                                    className="text-xs px-2 py-1"
                                  />
                                  <div className="flex flex-col gap-1 shrink-0">
                                    <button onClick={() => saveCatatan(r)} disabled={saving} className="text-xs bg-denim-700 text-white px-2 py-0.5 rounded disabled:opacity-50">✓</button>
                                    <button onClick={() => setEditingCatatan(null)} className="text-xs text-muted px-2 py-0.5">✕</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start gap-1.5 group">
                                  <span className="line-clamp-2">{r.Catatan || "—"}</span>
                                  {assigned && (
                                    <button onClick={() => startEditCatatan(r)} className="shrink-0 text-denim-300 hover:text-denim-700">
                                      <Pencil size={12} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {assigned ? (
                                <button onClick={() => toggleStatus(r)} disabled={saving} className="disabled:opacity-50" title="Kamu di-assign di item ini -- klik buat ubah status">
                                  <StatusBadge status={r.Status} />
                                </button>
                              ) : (
                                <StatusBadge status={r.Status} />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t border-denim-50 text-xs text-muted">
                  <span>
                    Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredRows.length)} dari {filteredRows.length} item
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 rounded-signature border border-denim-100 disabled:opacity-40">‹</button>
                    <span className="px-2 font-mono">{page}/{totalPages}</span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 rounded-signature border border-denim-100 disabled:opacity-40">›</button>
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
