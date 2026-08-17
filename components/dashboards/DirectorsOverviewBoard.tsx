"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  ListChecks,
  Pencil,
  Link as LinkIcon,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/Card";
import { VerdictCard } from "@/components/ui/VerdictCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardGridSkeleton, DetailSkeleton } from "@/components/ui/Skeleton";
import { FilterPills } from "@/components/ui/FilterPills";
import { Textarea } from "@/components/ui/FormField";
import type { ChecklistSummary, PhaseStat } from "@/lib/checklistProgress";

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

type ProyekWithChecklist = Proyek & { checklist: ChecklistSummary | null };

type ChecklistRow = {
  Phase: string;
  Section: string;
  Item: string;
  Prioritas: string;
  Status: string;
  PIC: string;
  Catatan: string;
  Deadline?: string;
  Bukti?: string;
  rowIndex: number;
};

type ChecklistResponse = { rows: ChecklistRow[]; summary: ChecklistSummary };

const PAGE_SIZE = 15;
const DETAIL_TABS = [
  { key: "overview", label: "Overview" },
  { key: "timeline", label: "Timeline" },
  { key: "tasks", label: "Tasks" },
  { key: "team", label: "Team" },
] as const;
type DetailTab = (typeof DETAIL_TABS)[number]["key"];

function isAssignedTo(picField: string, nama: string): boolean {
  const target = nama.trim().toLowerCase();
  return picField
    .split("+")
    .map((s) => s.trim().toLowerCase())
    .includes(target);
}

/** Pecah kolom PIC ("Titian + Zidan") jadi daftar nama individual. */
function splitPic(picField: string): string[] {
  return picField
    .split("+")
    .map((s) => s.trim())
    .filter(Boolean);
}

function statusPhase(p: PhaseStat): "Completed" | "In Progress" | "Not Started" {
  if (p.persen === 100) return "Completed";
  if (p.persen > 0) return "In Progress";
  return "Not Started";
}

function parseDeadline(d?: string): Date | null {
  if (!d) return null;
  const trimmed = d.trim();

  // Format ISO (mis. "2026-08-18") -- Date bawaan JS udah bisa baca ini.
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const iso = new Date(trimmed);
    return isNaN(iso.getTime()) ? null : iso;
  }

  // Format Google Sheets: "DD/MM/YYYY" atau "DD/MM/YYYY HH:mm[:ss]".
  // Sengaja nggak pakai `new Date(string)` langsung -- itu nebak format
  // Amerika (MM/DD/YYYY), jadi "18/08/2026" dibaca bulan=18 (invalid) dan
  // diam-diam gagal tanpa error.
  const match = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (match) {
    const [, dd, mm, yyyy, hh = "0", min = "0", ss = "0"] = match;
    const date = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(min),
      Number(ss)
    );
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

export default function DirectorsOverviewBoard({
  currentUserNama,
  currentUserRole,
}: {
  currentUserNama: string;
  currentUserRole: string;
}) {
  const [list, setList] = useState<ProyekWithChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Proyek | null>(null);

  useEffect(() => {
    fetch("/api/proyek/overview")
      .then((res) => res.json())
      .then((data: ProyekWithChecklist[]) => {
        setList(data);
        setLoading(false);
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
        const c = p.checklist;
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

            {c && c.criticalBelum > 0 && (
              <p className="text-xs text-red-600 font-medium mt-2 flex items-center gap-1">
                <AlertTriangle size={12} /> {c.criticalBelum} item critical belum selesai
              </p>
            )}

            {c === null ? (
              <p className="text-xs text-muted mt-3">Checklist belum tersedia</p>
            ) : (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted">Progress (per-phase)</span>
                  <span className="text-xs text-denim-700 font-mono">
                    {c.persenTertimbang}% · {c.selesai}/{c.total} item
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-denim-50 overflow-hidden">
                  <div
                    className="h-full bg-denim-700 rounded-full transition-all"
                    style={{ width: `${c.persenTertimbang}%` }}
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
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [statusFilter, setStatusFilter] = useState<"all" | "Selesai" | "Belum">("all");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [editingCatatan, setEditingCatatan] = useState<number | null>(null);
  const [catatanDraft, setCatatanDraft] = useState("");
  const [editingBukti, setEditingBukti] = useState<number | null>(null);
  const [buktiDraft, setBuktiDraft] = useState("");


  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);
    setDetailTab("overview");
    setStatusFilter("all");
    setPhaseFilter("all");
    setPage(1);
    setEditingCatatan(null);
    setEditingBukti(null);
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

  // "Needs Attention" -- critical yang belum selesai, + (kalau kolom Deadline
  // udah ada di sheet) overdue & due-this-week. Kalau Deadline kosong semua,
  // 2 bagian terakhir otomatis nggak nongol -- nggak perlu ubah kode lagi
  // begitu kamu nambahin kolomnya.
  const attention = useMemo(() => {
    if (!data) return { critical: [], overdue: [], dueSoon: [] };
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const critical = data.rows.filter((r) => r.Status !== "Selesai" && r.Prioritas === "Critical");
    const withDeadline = data.rows
      .filter((r) => r.Status !== "Selesai")
      .map((r) => ({ row: r, deadline: parseDeadline(r.Deadline) }))
      .filter((x) => x.deadline !== null) as { row: ChecklistRow; deadline: Date }[];

    const overdue = withDeadline.filter((x) => x.deadline < now).map((x) => x.row);
    const dueSoon = withDeadline
      .filter((x) => x.deadline >= now && x.deadline <= weekFromNow)
      .map((x) => x.row);

    return { critical, overdue, dueSoon };
  }, [data]);

  const team = useMemo(() => {
    if (!data) return [];
    const byPerson: Record<string, { total: number; selesai: number }> = {};
    for (const r of data.rows) {
      for (const nama of splitPic(r.PIC ?? "")) {
        if (!byPerson[nama]) byPerson[nama] = { total: 0, selesai: 0 };
        byPerson[nama].total += 1;
        if (r.Status === "Selesai") byPerson[nama].selesai += 1;
      }
    }
    return Object.entries(byPerson)
      .map(([nama, s]) => ({
        nama,
        ...s,
        persen: s.total === 0 ? 0 : Math.round((s.selesai / s.total) * 100),
      }))
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [data]);

  function isAssigned(row: ChecklistRow) {
    return currentUserRole === "head_director" || isAssignedTo(row.PIC ?? "", currentUserNama);
  }

  async function patchRow(row: ChecklistRow, updates: Record<string, string>, localApply: (r: ChecklistRow) => ChecklistRow) {
    if (!data) return;
    setSavingIndex(row.rowIndex);
    setError(null);
    const prevData = data;

    setData({ ...data, rows: data.rows.map((r) => (r.rowIndex === row.rowIndex ? localApply(r) : r)) });

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
        return { ...cur, summary: { ...cur.summary, selesai, belum: total - selesai } };
      });
    }
    setSavingIndex(null);
  }

  // Ini yang beneran bisa kita jamin akurat: kapan status diubah & sama
  // siapa. Ditulis otomatis, di-APPEND ke Catatan (bukan nimpa), jadi
  // kebentuk audit trail sendiri tanpa gantung ke link eksternal yang
  // bisa aja nggak berubah walau isinya udah direvisi.
  function toggleStatus(row: ChecklistRow) {
    const nextStatus = row.Status === "Selesai" ? "Belum" : "Selesai";
    const waktu = new Date().toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    const logLine = `[${waktu} - ${currentUserNama}] Status diubah ke "${nextStatus}"`;
    const newCatatan = row.Catatan ? `${row.Catatan}\n${logLine}` : logLine;
    patchRow(row, { Status: nextStatus, Catatan: newCatatan }, (r) => ({
      ...r,
      Status: nextStatus,
      Catatan: newCatatan,
    }));
  }

  function startEditCatatan(row: ChecklistRow) {
    setEditingCatatan(row.rowIndex);
    setCatatanDraft(row.Catatan ?? "");
  }

  async function saveCatatan(row: ChecklistRow) {
    await patchRow(row, { Catatan: catatanDraft }, (r) => ({ ...r, Catatan: catatanDraft }));
    setEditingCatatan(null);
  }

  function startEditBukti(row: ChecklistRow) {
    setEditingBukti(row.rowIndex);
    setBuktiDraft(row.Bukti ?? "");
  }

  async function saveBukti(row: ChecklistRow) {
    await patchRow(row, { Bukti: buktiDraft }, (r) => ({ ...r, Bukti: buktiDraft }));
    setEditingBukti(null);
  }

  return (
    <div className="flex gap-4">
      <div className="hidden md:block w-48 shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted hover:text-denim-900 mb-3">
          <ArrowLeft size={14} /> Semua proyek
        </button>
        <p className="text-xs font-medium text-denim-500 uppercase tracking-wide mb-2 px-1">Proyek</p>
        <div className="space-y-1">
          {allProyek.map((p) => (
            <button
              key={p.id_proyek}
              onClick={() => onSelectProyek(p)}
              className={`w-full text-left text-sm px-2.5 py-2 rounded-signature transition-colors ${
                p.id_proyek === proyek.id_proyek ? "bg-denim-700 text-white" : "text-denim-900 hover:bg-denim-50"
              }`}
            >
              {p.nama_proyek}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <button onClick={onBack} className="md:hidden flex items-center gap-1.5 text-sm text-muted hover:text-denim-900 mb-3">
          <ArrowLeft size={14} /> Semua proyek
        </button>

        <h2 className="font-display text-lg text-denim-700 mb-0.5">{proyek.nama_proyek}</h2>
        <p className="text-sm text-muted mb-4">{proyek.deskripsi}</p>

        {loading && <DetailSkeleton />}
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

        {data && (
          <>
            <div className="mb-4">
              <FilterPills
                options={DETAIL_TABS.map((t) => ({ value: t.key, label: t.label }))}
                value={detailTab}
                onChange={setDetailTab}
              />
            </div>

            {detailTab === "overview" && (
              <OverviewTab data={data} attention={attention} onGoToTimeline={() => setDetailTab("timeline")} />
            )}

            {detailTab === "timeline" && <TimelineTab phaseStats={data.summary.phaseStats} />}

            {detailTab === "tasks" && (
              <TasksTab
                phases={phases}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                phaseFilter={phaseFilter}
                setPhaseFilter={setPhaseFilter}
                filteredRows={filteredRows}
                pageRows={pageRows}
                page={page}
                setPage={setPage}
                totalPages={totalPages}
                savingIndex={savingIndex}
                isAssigned={isAssigned}
                toggleStatus={toggleStatus}
                editingCatatan={editingCatatan}
                catatanDraft={catatanDraft}
                setCatatanDraft={setCatatanDraft}
                startEditCatatan={startEditCatatan}
                saveCatatan={saveCatatan}
                setEditingCatatan={setEditingCatatan}
                editingBukti={editingBukti}
                buktiDraft={buktiDraft}
                setBuktiDraft={setBuktiDraft}
                startEditBukti={startEditBukti}
                saveBukti={saveBukti}
                setEditingBukti={setEditingBukti}
              />
            )}

            {detailTab === "team" && <TeamTab team={team} />}
          </>
        )}
      </div>
    </div>
  );
}

// ================================ OVERVIEW ================================

function OverviewTab({
  data,
  attention,
  onGoToTimeline,
}: {
  data: ChecklistResponse;
  attention: { critical: ChecklistRow[]; overdue: ChecklistRow[]; dueSoon: ChecklistRow[] };
  onGoToTimeline: () => void;
}) {
  const s = data.summary;
  const needsAttentionCount = attention.critical.length + attention.overdue.length;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <VerdictCard icon={<ListChecks size={16} />} label="Total Item" value={s.total} tone="bg-denim-50 text-denim-700" />
        <VerdictCard icon={<CheckCircle2 size={16} />} label="Selesai" value={s.selesai} tone="bg-blue-50 text-blue-700" />
        <VerdictCard icon={<CircleDashed size={16} />} label="Belum Selesai" value={s.belum} tone="bg-orange-50 text-orange-700" />
        <VerdictCard icon={<TrendingUp size={16} />} label="Progress (per-phase)" value={`${s.persenTertimbang}%`} tone="bg-emerald-50 text-emerald-700" />
      </div>

      <div className="mb-5">
        <h3 className="text-sm font-medium text-denim-900 mb-2 flex items-center gap-1.5">
          <AlertTriangle size={14} className="text-red-500" /> Perlu Perhatian {needsAttentionCount > 0 && `(${needsAttentionCount})`}
        </h3>
        {attention.overdue.length === 0 && attention.critical.length === 0 ? (
          <p className="text-sm text-muted">Nggak ada item overdue atau critical yang tertunda. Aman.</p>
        ) : (
          <div className="space-y-1.5">
            {attention.overdue.map((r) => (
              <div key={`overdue-${r.rowIndex}`} className="flex items-center justify-between text-sm bg-red-50 rounded-lg px-3 py-2">
                <span className="text-denim-900">{r.Item}</span>
                <span className="text-xs text-red-600 font-mono shrink-0 ml-2">Overdue · {r.Deadline}</span>
              </div>
            ))}
            {attention.critical
              .filter((r) => !attention.overdue.includes(r))
              .map((r) => (
                <div key={`critical-${r.rowIndex}`} className="flex items-center justify-between text-sm bg-orange-50 rounded-lg px-3 py-2">
                  <span className="text-denim-900">{r.Item}</span>
                  <span className="text-xs text-orange-600 font-mono shrink-0 ml-2">Critical · {r.PIC || "belum di-assign"}</span>
                </div>
              ))}
          </div>
        )}
        {attention.dueSoon.length > 0 && (
          <p className="text-xs text-muted mt-2">{attention.dueSoon.length} item lagi due dalam 7 hari ke depan.</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-denim-900">Milestone / Phase</h3>
          <button onClick={onGoToTimeline} className="text-xs text-denim-500 underline">
            Lihat semua di Timeline →
          </button>
        </div>
        <div className="space-y-2">
          {data.summary.phaseStats.slice(0, 3).map((p) => (
            <div key={p.phase}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-denim-900">{p.phase}</span>
                <span className="text-muted font-mono">{p.persen}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-denim-50 overflow-hidden">
                <div className="h-full bg-denim-700 rounded-full" style={{ width: `${p.persen}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ================================ TIMELINE ================================

function TimelineTab({ phaseStats }: { phaseStats: PhaseStat[] }) {
  if (phaseStats.length === 0) return <p className="text-sm text-muted">Belum ada phase tercatat.</p>;

  return (
    <div className="space-y-3">
      {phaseStats.map((p, i) => {
        const status = statusPhase(p);
        return (
          <div key={p.phase} className="bg-white border border-denim-100 rounded-signature p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-denim-50 text-denim-700 text-xs font-mono flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <p className="font-medium text-denim-900 text-sm">{p.phase}</p>
              </div>
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded-full shrink-0 ${
                  status === "Completed"
                    ? "bg-emerald-50 text-emerald-700"
                    : status === "In Progress"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-denim-50 text-muted"
                }`}
              >
                {status}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-denim-50 overflow-hidden mb-1.5">
              <div className="h-full bg-denim-700 rounded-full" style={{ width: `${p.persen}%` }} />
            </div>
            <p className="text-xs text-muted">{p.selesai}/{p.total} item selesai · {p.persen}%</p>
          </div>
        );
      })}
    </div>
  );
}

// ================================== TASKS ==================================

function TasksTab({
  phases,
  statusFilter,
  setStatusFilter,
  phaseFilter,
  setPhaseFilter,
  filteredRows,
  pageRows,
  page,
  setPage,
  totalPages,
  savingIndex,
  isAssigned,
  toggleStatus,
  editingCatatan,
  catatanDraft,
  setCatatanDraft,
  startEditCatatan,
  saveCatatan,
  setEditingCatatan,
}: {
  phases: string[];
  statusFilter: "all" | "Selesai" | "Belum";
  setStatusFilter: (v: "all" | "Selesai" | "Belum") => void;
  phaseFilter: string;
  setPhaseFilter: (v: string) => void;
  filteredRows: ChecklistRow[];
  pageRows: ChecklistRow[];
  page: number;
  setPage: (fn: (p: number) => number) => void;
  totalPages: number;
  savingIndex: number | null;
  isAssigned: (r: ChecklistRow) => boolean;
  toggleStatus: (r: ChecklistRow) => void;
  editingCatatan: number | null;
  catatanDraft: string;
  setCatatanDraft: (v: string) => void;
  startEditCatatan: (r: ChecklistRow) => void;
  saveCatatan: (r: ChecklistRow) => void;
  setEditingCatatan: (v: number | null) => void;
  editingBukti: number | null;
  buktiDraft: string;
  setBuktiDraft: (v: string) => void;
  startEditBukti: (r: ChecklistRow) => void;
  saveBukti: (r: ChecklistRow) => void;
  setEditingBukti: (v: number | null) => void;
}) {
  return (
    <div>
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
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Prioritas</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Catatan</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Bukti</th>
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
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span
                          className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                            r.Prioritas === "Critical"
                              ? "bg-red-50 text-red-600"
                              : r.Prioritas === "High"
                              ? "bg-orange-50 text-orange-600"
                              : "bg-denim-50 text-muted"
                          }`}
                        >
                          {r.Prioritas || "Normal"}
                        </span>
                      </td>
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
                      <td className="px-4 py-3 hidden lg:table-cell max-w-[180px]">
                        {editingBukti === r.rowIndex ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              autoFocus
                              value={buktiDraft}
                              onChange={(e) => setBuktiDraft(e.target.value)}
                              placeholder="Link draf (Docs/Drive/Figma)"
                              className="w-full text-xs rounded-lg border border-denim-200 px-2 py-1 outline-none focus:border-denim-500"
                            />
                            <button onClick={() => saveBukti(r)} disabled={saving} className="text-xs bg-denim-700 text-white px-2 py-0.5 rounded shrink-0 disabled:opacity-50">✓</button>
                            <button onClick={() => setEditingBukti(null)} className="text-xs text-muted shrink-0">✕</button>
                          </div>
                        ) : r.Bukti ? (
                          <div className="flex items-center gap-1.5">
                            <a href={r.Bukti} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-denim-600 underline truncate">
                              <LinkIcon size={11} className="shrink-0" /> Lihat draf
                            </a>
                            {assigned && (
                              <button onClick={() => startEditBukti(r)} className="shrink-0 text-denim-300 hover:text-denim-700" title="Ganti link (link lama otomatis nggak ke-track lagi -- pastikan revisi ke-track lewat version history di Docs/Drive/Figma-nya sendiri)">
                                <Pencil size={11} />
                              </button>
                            )}
                          </div>
                        ) : assigned ? (
                          <button onClick={() => startEditBukti(r)} className="text-xs text-denim-400 hover:text-denim-700 underline">
                            + Tambah link
                          </button>
                        ) : (
                          <span className="text-xs text-muted">—</span>
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
    </div>
  );
}

// =================================== TEAM ===================================

function TeamTab({ team }: { team: { nama: string; total: number; selesai: number; persen: number }[] }) {
  if (team.length === 0) return <p className="text-sm text-muted">Belum ada PIC yang di-assign di proyek ini.</p>;

  return (
    <div className="space-y-3">
      {team.map((t) => (
        <div key={t.nama} className="bg-white border border-denim-100 rounded-signature p-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="font-medium text-denim-900 text-sm">{t.nama}</p>
            <span className="text-xs text-muted font-mono">{t.selesai}/{t.total} · {t.persen}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-denim-50 overflow-hidden">
            <div className="h-full bg-denim-700 rounded-full" style={{ width: `${t.persen}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
