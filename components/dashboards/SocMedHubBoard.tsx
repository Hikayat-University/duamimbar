"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/Card";
import { VerdictCard } from "@/components/ui/VerdictCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { FilterPills } from "@/components/ui/FilterPills";
import { Input, Select, Textarea } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

type Kanal = { id_kanal: string; nama_kanal: string; platform: string; link: string };
type Konten = {
  id_konten: string;
  id_kanal: string;
  judul_konten: string;
  status: string;
  assigned_editor: string;
  tanggal_publish: string;
  cta: string;
  referensi_desain: string;
  gaya_copywriting: string;
  assigned_script_writer: string;
  assigned_graphic_designer: string;
  brief_editor: string;
  brief_desain: string;
};
type Statistik = {
  id_statistik: string;
  id_konten: string;
  minggu_ke: string;
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
type Person = { id: string; nama: string };

const STATUS_OPTIONS = ["Akan", "Sedang", "Siap Post", "Sudah"];
const KANAL_FORM_EMPTY = { nama_kanal: "", platform: "", link: "" };
const KONTEN_FORM_EMPTY = {
  id_kanal: "",
  judul_konten: "",
  status: "Akan",
  tanggal_publish: "",
  cta: "",
  referensi_desain: "",
  gaya_copywriting: "",
  assigned_script_writer: "",
  assigned_editor: "",
  brief_editor: "",
  assigned_graphic_designer: "",
  brief_desain: "",
};
const STAT_FORM_EMPTY = {
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

function hitungEngagementRate(f: typeof STAT_FORM_EMPTY): string {
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

function avgEngagement(stats: Statistik[]): string {
  const nums = stats
    .map((s) => parseFloat((s.engagement_rate || "").replace("%", "")))
    .filter((n) => !isNaN(n));
  if (nums.length === 0) return "-";
  return `${(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)}%`;
}

export default function SocMedHubBoard({ canEdit }: { canEdit: boolean }) {
  const [kanalList, setKanalList] = useState<Kanal[]>([]);
  const [kontenList, setKontenList] = useState<Konten[]>([]);
  const [statList, setStatList] = useState<Statistik[]>([]);
  const [editorList, setEditorList] = useState<Person[]>([]);
  const [writerList, setWriterList] = useState<Person[]>([]);
  const [designerList, setDesignerList] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKanalId, setSelectedKanalId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    Promise.allSettled([
      fetch("/api/socmed/kanal").then((r) => r.json()),
      fetch("/api/socmed/konten").then((r) => r.json()),
      fetch("/api/socmed/statistik").then((r) => r.json()),
      fetch("/api/users/video-editors").then((r) => r.json()),
      fetch("/api/users/script-writers").then((r) => r.json()),
      fetch("/api/users/graphic-designers").then((r) => r.json()),
    ]).then(([kanal, konten, stat, editor, writer, designer]) => {
      if (kanal.status === "fulfilled") setKanalList(kanal.value);
      if (konten.status === "fulfilled") setKontenList(konten.value);
      if (stat.status === "fulfilled") setStatList(stat.value);
      if (editor.status === "fulfilled") setEditorList(editor.value);
      if (writer.status === "fulfilled") setWriterList(writer.value);
      if (designer.status === "fulfilled") setDesignerList(designer.value);
      setLoading(false);
    });
  }

  useEffect(load, []);

  if (loading) return <CardGridSkeleton />;

  const selectedKanal = kanalList.find((k) => k.id_kanal === selectedKanalId) ?? null;

  if (selectedKanal) {
    return (
      <KanalWorkspace
        kanal={selectedKanal}
        allKanal={kanalList}
        kontenList={kontenList.filter((k) => k.id_kanal === selectedKanal.id_kanal)}
        statList={statList}
        editorList={editorList}
        writerList={writerList}
        designerList={designerList}
        canEdit={canEdit}
        onSelectKanal={setSelectedKanalId}
        onBack={() => setSelectedKanalId(null)}
        reload={load}
      />
    );
  }

  return (
    <KanalGrid
      kanalList={kanalList}
      kontenList={kontenList}
      statList={statList}
      canEdit={canEdit}
      onSelectKanal={setSelectedKanalId}
      reload={load}
    />
  );
}

// ============================== GRID KANAL ==============================

function KanalGrid({
  kanalList,
  kontenList,
  statList,
  canEdit,
  onSelectKanal,
  reload,
}: {
  kanalList: Kanal[];
  kontenList: Konten[];
  statList: Statistik[];
  canEdit: boolean;
  onSelectKanal: (id: string) => void;
  reload: () => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(KANAL_FORM_EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalKonten = kontenList.length;
  const overallEngagement = avgEngagement(statList);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/socmed/kanal", {
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
    setForm(KANAL_FORM_EMPTY);
    reload();
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <VerdictCard label="Kanal Aktif" value={kanalList.length} />
        <VerdictCard label="Total Konten" value={totalKonten} />
        <VerdictCard label="Rata-rata Engagement" value={overallEngagement} />
      </div>

      {canEdit && (
        <Button onClick={() => setFormOpen(true)} className="mb-4 flex items-center gap-1.5">
          <Plus size={14} /> Tambah Kanal
        </Button>
      )}

      {kanalList.length === 0 ? (
        <EmptyState message="Belum ada kanal yang digarap." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {kanalList.map((k) => {
            const konten = kontenList.filter((c) => c.id_kanal === k.id_kanal);
            const stats = statList.filter((s) => konten.some((c) => c.id_konten === s.id_konten));
            return (
              <button
                key={k.id_kanal}
                onClick={() => onSelectKanal(k.id_kanal)}
                className="text-left bg-white border border-denim-100 rounded-signature p-4 hover:border-denim-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-medium text-denim-900">{k.nama_kanal}</h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-denim-50 text-denim-700">
                    {k.platform}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span>{konten.length} konten</span>
                  <span>·</span>
                  <span>Engagement {avgEngagement(stats)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {formOpen && (
        <KanalFormModal
          form={form}
          setForm={setForm}
          saving={saving}
          error={error}
          onCancel={() => setFormOpen(false)}
          onSubmit={handleSubmit}
          title="Kanal Baru"
        />
      )}
    </div>
  );
}

function KanalFormModal({
  form,
  setForm,
  saving,
  error,
  onCancel,
  onSubmit,
  title,
}: {
  form: typeof KANAL_FORM_EMPTY;
  setForm: (f: typeof KANAL_FORM_EMPTY) => void;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 bg-denim-900/40 flex items-center justify-center p-5 z-20">
      <form onSubmit={onSubmit} className="bg-white rounded-signature p-5 w-full max-w-sm space-y-3">
        <h2 className="font-display text-lg text-denim-700">{title}</h2>
        <Input
          required
          placeholder="Nama kanal (mis. Instagram Duamimbar)"
          value={form.nama_kanal}
          onChange={(e) => setForm({ ...form, nama_kanal: e.target.value })}
        />
        <Input
          required
          placeholder="Platform (mis. Instagram, TikTok, YouTube)"
          value={form.platform}
          onChange={(e) => setForm({ ...form, platform: e.target.value })}
        />
        <Input
          placeholder="Link (opsional)"
          value={form.link}
          onChange={(e) => setForm({ ...form, link: e.target.value })}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1 text-center">
            Batal
          </Button>
          <Button type="submit" disabled={saving} className="flex-1 text-center">
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ============================ WORKSPACE KANAL ============================

function KanalWorkspace({
  kanal,
  allKanal,
  kontenList,
  statList,
  editorList,
  writerList,
  designerList,
  canEdit,
  onSelectKanal,
  onBack,
  reload,
}: {
  kanal: Kanal;
  allKanal: Kanal[];
  kontenList: Konten[];
  statList: Statistik[];
  editorList: Person[];
  writerList: Person[];
  designerList: Person[];
  canEdit: boolean;
  onSelectKanal: (id: string) => void;
  onBack: () => void;
  reload: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [kanalFormOpen, setKanalFormOpen] = useState(false);
  const [kanalForm, setKanalForm] = useState(KANAL_FORM_EMPTY);
  const [kontenFormOpen, setKontenFormOpen] = useState<Konten | "new" | null>(null);
  const [statFormFor, setStatFormFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stats = statList.filter((s) => kontenList.some((c) => c.id_konten === s.id_konten));

  const filteredKonten = useMemo(() => {
    return kontenList.filter((k) => {
      if (statusFilter !== "all" && k.status !== statusFilter) return false;
      if (search.trim() && !k.judul_konten.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [kontenList, statusFilter, search]);

  async function handleDeleteKanal() {
    if (!confirm(`Hapus kanal "${kanal.nama_kanal}"? Konten yang terhubung tidak ikut terhapus otomatis.`)) return;
    await fetch("/api/socmed/kanal", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_kanal: kanal.id_kanal }),
    });
    onBack();
    reload();
  }

  async function handleEditKanal(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/socmed/kanal", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_kanal: kanal.id_kanal, ...kanalForm }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal menyimpan.");
      setSaving(false);
      return;
    }
    setSaving(false);
    setKanalFormOpen(false);
    reload();
  }

  async function handleDeleteKonten(id: string) {
    if (!confirm("Hapus konten ini?")) return;
    await fetch("/api/socmed/konten", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_konten: id }),
    });
    reload();
  }

  return (
    <div className="flex gap-4">
      <div className="hidden md:block w-48 shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted hover:text-denim-900 mb-3">
          <ArrowLeft size={14} /> Semua kanal
        </button>
        <p className="text-xs font-medium text-denim-500 uppercase tracking-wide mb-2 px-1">Kanal</p>
        <div className="space-y-1">
          {allKanal.map((k) => (
            <button
              key={k.id_kanal}
              onClick={() => onSelectKanal(k.id_kanal)}
              className={`w-full text-left text-sm px-2.5 py-2 rounded-signature transition-colors ${
                k.id_kanal === kanal.id_kanal ? "bg-denim-700 text-white" : "text-denim-900 hover:bg-denim-50"
              }`}
            >
              {k.nama_kanal}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <button onClick={onBack} className="md:hidden flex items-center gap-1.5 text-sm text-muted hover:text-denim-900 mb-3">
          <ArrowLeft size={14} /> Semua kanal
        </button>

        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="font-display text-lg text-denim-700">{kanal.nama_kanal}</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-denim-50 text-denim-700">{kanal.platform}</span>
            </div>
            {kanal.link && (
              <a href={kanal.link} target="_blank" rel="noopener noreferrer" className="text-xs text-denim-500 underline">
                Buka kanal
              </a>
            )}
          </div>
          {canEdit && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => {
                  setKanalForm({ nama_kanal: kanal.nama_kanal, platform: kanal.platform, link: kanal.link });
                  setKanalFormOpen(true);
                }}
                className="text-muted hover:text-denim-700"
                title="Edit kanal"
              >
                <Pencil size={15} />
              </button>
              <button onClick={handleDeleteKanal} className="text-muted hover:text-red-600" title="Hapus kanal">
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <VerdictCard label="Total Konten" value={kontenList.length} />
          <VerdictCard label="Siap Post" value={kontenList.filter((k) => k.status === "Siap Post").length} />
          <VerdictCard label="Rata-rata Engagement" value={avgEngagement(stats)} />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <FilterPills
            options={[{ value: "all", label: "Semua Status" }, ...STATUS_OPTIONS.map((s) => ({ value: s, label: s }))]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <input
            placeholder="Cari judul..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm rounded-full border border-denim-100 px-3 py-1 outline-none focus:border-denim-500 ml-auto w-40"
          />
        </div>

        {canEdit && (
          <Button onClick={() => setKontenFormOpen("new")} className="mb-3 flex items-center gap-1.5">
            <Plus size={14} /> Tambah Konten
          </Button>
        )}

        {filteredKonten.length === 0 ? (
          <EmptyState
            message={kontenList.length === 0 ? "Belum ada konten di kanal ini." : "Tidak ada konten yang cocok dengan filter."}
          />
        ) : (
          <div className="space-y-3">
            {filteredKonten.map((k) => (
              <KontenCard
                key={k.id_konten}
                konten={k}
                stats={statList.filter((s) => s.id_konten === k.id_konten)}
                canEdit={canEdit}
                onEdit={() => setKontenFormOpen(k)}
                onDelete={() => handleDeleteKonten(k.id_konten)}
                onAddStat={() => setStatFormFor(k.id_konten)}
              />
            ))}
          </div>
        )}
      </div>

      {kanalFormOpen && (
        <KanalFormModal
          form={kanalForm}
          setForm={setKanalForm}
          saving={saving}
          error={error}
          onCancel={() => setKanalFormOpen(false)}
          onSubmit={handleEditKanal}
          title="Edit Kanal"
        />
      )}

      {kontenFormOpen && (
        <KontenFormModal
          kanal={kanal}
          initial={kontenFormOpen === "new" ? null : kontenFormOpen}
          editorList={editorList}
          writerList={writerList}
          designerList={designerList}
          onCancel={() => setKontenFormOpen(null)}
          onSaved={() => {
            setKontenFormOpen(null);
            reload();
          }}
        />
      )}

      {statFormFor && (
        <StatFormModal
          idKonten={statFormFor}
          judul={kontenList.find((k) => k.id_konten === statFormFor)?.judul_konten ?? ""}
          onCancel={() => setStatFormFor(null)}
          onSaved={() => {
            setStatFormFor(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

// ============================== KARTU KONTEN ==============================

function KontenCard({
  konten,
  stats,
  canEdit,
  onEdit,
  onDelete,
  onAddStat,
}: {
  konten: Konten;
  stats: Statistik[];
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAddStat: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const latest = stats[stats.length - 1];

  return (
    <div className="bg-white border border-denim-100 rounded-signature p-4">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="font-medium text-denim-900 text-sm">{konten.judul_konten}</p>
        <StatusBadge status={konten.status} />
      </div>
      {konten.cta && (
        <p className="text-sm text-denim-900 mb-1">
          <span className="text-xs text-muted">CTA: </span>
          {konten.cta}
        </p>
      )}
      <p className="text-xs text-muted mb-2">
        Writer: {konten.assigned_script_writer || "belum di-assign"} · Designer:{" "}
        {konten.assigned_graphic_designer || "belum di-assign"} · Editor: {konten.assigned_editor || "belum di-assign"}
        {konten.tanggal_publish && ` · Publish: ${konten.tanggal_publish}`}
      </p>

      {latest && (
        <div className="flex items-center gap-3 text-xs bg-denim-50 rounded-lg px-2.5 py-1.5 mb-2 w-fit">
          <span className="text-denim-500">{latest.minggu_ke}</span>
          <span className="text-denim-900 font-mono">{latest.views || 0} views</span>
          <span className="text-denim-700 font-mono font-medium">{latest.engagement_rate || "-"} engagement</span>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-denim-100 flex-wrap">
        {canEdit && (
          <>
            <button onClick={onEdit} className="text-xs text-denim-700 underline">Edit</button>
            <button onClick={onDelete} className="text-xs text-red-600 underline">Hapus</button>
            <button onClick={onAddStat} className="text-xs text-denim-700 underline">+ Statistik</button>
          </>
        )}
        {stats.length > 0 && (
          <button onClick={() => setExpanded((e) => !e)} className="text-xs text-muted flex items-center gap-1 ml-auto">
            Riwayat statistik ({stats.length})
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-2.5 pt-2.5 border-t border-denim-50 space-y-1.5">
          {stats.map((s) => (
            <div key={s.id_statistik} className="flex items-center justify-between text-xs">
              <span className="text-denim-500 font-mono">{s.minggu_ke}</span>
              <span className="text-denim-900 font-mono">{s.views || 0} views</span>
              <span className="text-denim-700 font-mono">{s.engagement_rate || "-"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================= FORM MODAL KONTEN =============================

const STEPS = [
  { n: 1, label: "Info Dasar" },
  { n: 2, label: "Script Writer" },
  { n: 3, label: "Video Editor" },
  { n: 4, label: "Graphic Designer" },
];

function KontenFormModal({
  kanal,
  initial,
  editorList,
  writerList,
  designerList,
  onCancel,
  onSaved,
}: {
  kanal: Kanal;
  initial: Konten | null;
  editorList: Person[];
  writerList: Person[];
  designerList: Person[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(
    initial
      ? {
          id_kanal: initial.id_kanal,
          judul_konten: initial.judul_konten,
          status: initial.status,
          tanggal_publish: initial.tanggal_publish,
          cta: initial.cta ?? "",
          referensi_desain: initial.referensi_desain ?? "",
          gaya_copywriting: initial.gaya_copywriting ?? "",
          assigned_script_writer: initial.assigned_script_writer ?? "",
          assigned_editor: initial.assigned_editor ?? "",
          brief_editor: initial.brief_editor ?? "",
          assigned_graphic_designer: initial.assigned_graphic_designer ?? "",
          brief_desain: initial.brief_desain ?? "",
        }
      : { ...KONTEN_FORM_EMPTY, id_kanal: kanal.id_kanal }
  );
  const [step, setStep] = useState(1);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function goNext() {
    if (step === 1) {
      if (!form.judul_konten.trim()) {
        setStep1Error("Judul konten wajib diisi dulu.");
        return;
      }
    }
    setStep1Error(null);
    setStep((s) => Math.min(s + 1, 4));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.judul_konten.trim()) {
      setStep(1);
      setStep1Error("Judul konten wajib diisi dulu.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/socmed/konten", {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(initial ? { id_konten: initial.id_konten, ...form } : form),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal menyimpan.");
      setSaving(false);
      return;
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-denim-900/40 flex items-center justify-center p-5 z-20 overflow-y-auto">
      <form onSubmit={handleSubmit} className="bg-white rounded-signature p-5 w-full max-w-sm space-y-4 my-8">
        <div>
          <h2 className="font-display text-lg text-denim-700">
            {initial ? "Edit Konten" : "Konten Baru"} — {kanal.nama_kanal}
          </h2>
          <div className="flex items-center gap-1.5 mt-2.5">
            {STEPS.map((s) => (
              <button
                key={s.n}
                type="button"
                onClick={() => setStep(s.n)}
                className={`flex-1 text-center py-1 rounded-full text-[10px] font-medium transition-colors ${
                  step === s.n ? "bg-denim-700 text-white" : "bg-surface text-muted hover:bg-denim-50"
                }`}
              >
                {s.n}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted mt-1.5">Langkah {step} dari 4 — {STEPS[step - 1].label}</p>
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <Input
              placeholder="Judul konten"
              value={form.judul_konten}
              onChange={(e) => setForm({ ...form, judul_konten: e.target.value })}
            />
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
            <div>
              <label className="text-xs text-muted mb-1 block">
                Target tanggal publish (dipakai juga sebagai deadline buat Script Writer & Video Editor)
              </label>
              <Input
                type="date"
                value={form.tanggal_publish}
                onChange={(e) => setForm({ ...form, tanggal_publish: e.target.value })}
              />
            </div>
            {step1Error && <p className="text-sm text-red-600">{step1Error}</p>}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-xs text-muted">Kosongin dropdown di bawah kalau konten ini nggak butuh Script Writer.</p>
            <Select value={form.assigned_script_writer} onChange={(e) => setForm({ ...form, assigned_script_writer: e.target.value })}>
              <option value="">— Nggak butuh Script Writer —</option>
              {writerList.map((w) => (
                <option key={w.id} value={w.nama}>{w.nama}</option>
              ))}
            </Select>
            <Input
              placeholder="CTA (Call to Action)"
              value={form.cta}
              onChange={(e) => setForm({ ...form, cta: e.target.value })}
            />
            <Input
              placeholder="Referensi desain (link, opsional)"
              value={form.referensi_desain}
              onChange={(e) => setForm({ ...form, referensi_desain: e.target.value })}
            />
            <Textarea
              placeholder="Gaya copywriting yang diinginkan (brief buat Writer)"
              value={form.gaya_copywriting}
              onChange={(e) => setForm({ ...form, gaya_copywriting: e.target.value })}
              rows={3}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-xs text-muted">Kosongin dropdown di bawah kalau konten ini nggak butuh Video Editor.</p>
            <Select value={form.assigned_editor} onChange={(e) => setForm({ ...form, assigned_editor: e.target.value })}>
              <option value="">— Nggak butuh Video Editor —</option>
              {editorList.map((ed) => (
                <option key={ed.id} value={ed.nama}>{ed.nama}</option>
              ))}
            </Select>
            <Textarea
              placeholder="Brief untuk Video Editor (mis. timestamp footage yang dipakai)"
              value={form.brief_editor}
              onChange={(e) => setForm({ ...form, brief_editor: e.target.value })}
              rows={3}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <p className="text-xs text-muted">Kosongin dropdown di bawah kalau konten ini nggak butuh Graphic Designer.</p>
            <Select value={form.assigned_graphic_designer} onChange={(e) => setForm({ ...form, assigned_graphic_designer: e.target.value })}>
              <option value="">— Nggak butuh Graphic Designer —</option>
              {designerList.map((d) => (
                <option key={d.id} value={d.nama}>{d.nama}</option>
              ))}
            </Select>
            <Textarea
              placeholder="Brief desain (bisa panjang — detail visual yang diinginkan)"
              value={form.brief_desain}
              onChange={(e) => setForm({ ...form, brief_desain: e.target.value })}
              rows={4}
            />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 pt-1">
          {step === 1 ? (
            <Button type="button" variant="secondary" onClick={onCancel} className="flex-1 text-center">Batal</Button>
          ) : (
            <Button type="button" variant="secondary" onClick={() => setStep((s) => Math.max(s - 1, 1))} className="flex-1 text-center">Kembali</Button>
          )}
          {step < 4 ? (
            <Button type="button" onClick={goNext} className="flex-1 text-center">Lanjut</Button>
          ) : (
            <Button type="submit" disabled={saving} className="flex-1 text-center">{saving ? "Menyimpan..." : "Simpan"}</Button>
          )}
        </div>
      </form>
    </div>
  );
}

// ============================= FORM MODAL STATISTIK =============================

function StatFormModal({
  idKonten,
  judul,
  onCancel,
  onSaved,
}: {
  idKonten: string;
  judul: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ ...STAT_FORM_EMPTY, id_konten: idKonten });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = { ...form, engagement_rate: hitungEngagementRate(form) };
    const res = await fetch("/api/socmed/statistik", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal menyimpan.");
      setSaving(false);
      return;
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-denim-900/40 flex items-center justify-center p-5 z-20 overflow-y-auto">
      <form onSubmit={handleSubmit} className="bg-white rounded-signature p-5 w-full max-w-sm space-y-3 my-8">
        <h2 className="font-display text-lg text-denim-700">Statistik Baru</h2>
        <p className="text-xs text-muted -mt-2">{judul}</p>

        <Input required placeholder="Minggu ke (mis. W29)" value={form.minggu_ke} onChange={(e) => setForm({ ...form, minggu_ke: e.target.value })} />
        <Input placeholder="Link konten yang sudah post (opsional)" value={form.link_konten} onChange={(e) => setForm({ ...form, link_konten: e.target.value })} />

        <div className="grid grid-cols-2 gap-2">
          <Input required type="number" placeholder="Views" value={form.views} onChange={(e) => setForm({ ...form, views: e.target.value })} />
          <Input required type="number" placeholder="Likes" value={form.likes} onChange={(e) => setForm({ ...form, likes: e.target.value })} />
          <Input required type="number" placeholder="Reach" value={form.reach} onChange={(e) => setForm({ ...form, reach: e.target.value })} />
          <Input type="number" placeholder="Komentar" value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} />
          <Input type="number" placeholder="Repost" value={form.reposts} onChange={(e) => setForm({ ...form, reposts: e.target.value })} />
          <Input type="number" placeholder="Share" value={form.shares} onChange={(e) => setForm({ ...form, shares: e.target.value })} />
          <Input type="number" placeholder="Save" value={form.saves} onChange={(e) => setForm({ ...form, saves: e.target.value })} />
          <Input type="number" placeholder="Follow" value={form.follows} onChange={(e) => setForm({ ...form, follows: e.target.value })} />
          <Input type="number" placeholder="Klik link eksternal" value={form.external_link_taps} onChange={(e) => setForm({ ...form, external_link_taps: e.target.value })} className="col-span-2" />
        </div>

        <div className="rounded-lg bg-denim-50 px-3 py-2.5 flex items-center justify-between">
          <span className="text-xs text-denim-700">Engagement rate (otomatis)</span>
          <span className="font-display text-lg text-denim-700">{hitungEngagementRate(form)}</span>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1 text-center">Batal</Button>
          <Button type="submit" disabled={saving} className="flex-1 text-center">{saving ? "Menyimpan..." : "Simpan"}</Button>
        </div>
      </form>
    </div>
  );
}
