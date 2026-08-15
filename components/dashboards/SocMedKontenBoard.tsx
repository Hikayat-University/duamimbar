"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, StatusBadge } from "@/components/ui/Card";

const STATUS_OPTIONS = ["Akan", "Sedang", "Siap Post", "Sudah"];

const STEPS = [
  { n: 1, label: "Info Dasar" },
  { n: 2, label: "Script Writer" },
  { n: 3, label: "Video Editor" },
  { n: 4, label: "Graphic Designer" },
];

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
type Kanal = { id_kanal: string; nama_kanal: string };
type Person = { id: string; nama: string };
type Statistik = { id_konten: string; minggu_ke: string; engagement_rate: string; views: string };

const EMPTY_FORM = {
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

export default function SocMedKontenBoard({ canEdit }: { canEdit: boolean }) {
  const [list, setList] = useState<Konten[]>([]);
  const [kanalList, setKanalList] = useState<Kanal[]>([]);
  const [editorList, setEditorList] = useState<Person[]>([]);
  const [writerList, setWriterList] = useState<Person[]>([]);
  const [designerList, setDesignerList] = useState<Person[]>([]);
  const [statList, setStatList] = useState<Statistik[]>([]);
  const [kanalFilter, setKanalFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  function load() {
    setLoading(true);
    Promise.allSettled([
      fetch("/api/socmed/konten").then((res) => res.json()),
      fetch("/api/socmed/kanal").then((res) => res.json()),
      fetch("/api/users/video-editors").then((res) => res.json()),
      fetch("/api/users/script-writers").then((res) => res.json()),
      fetch("/api/users/graphic-designers").then((res) => res.json()),
      fetch("/api/socmed/statistik").then((res) => res.json()),
    ]).then(([kontenResult, kanalResult, editorResult, writerResult, designerResult, statResult]) => {
      if (kontenResult.status === "fulfilled") setList(kontenResult.value);
      else console.error("Gagal ambil konten:", kontenResult.reason);

      if (kanalResult.status === "fulfilled") setKanalList(kanalResult.value);
      else console.error("Gagal ambil kanal:", kanalResult.reason);

      if (editorResult.status === "fulfilled") setEditorList(editorResult.value);
      else console.error("Gagal ambil daftar editor:", editorResult.reason);

      if (writerResult.status === "fulfilled") setWriterList(writerResult.value);
      else console.error("Gagal ambil daftar writer:", writerResult.reason);

      if (designerResult.status === "fulfilled") setDesignerList(designerResult.value);
      else console.error("Gagal ambil daftar designer:", designerResult.reason);

      if (statResult.status === "fulfilled") setStatList(statResult.value);
      else console.error("Gagal ambil statistik:", statResult.reason);

      setLoading(false);
    });
  }

  useEffect(load, []);

  function namaKanal(id: string) {
    return kanalList.find((k) => k.id_kanal === id)?.nama_kanal ?? "(kanal tidak dikenal)";
  }

  // Statistik paling baru per konten -- biar performa kelihatan langsung
  // di sini, nggak perlu loncat ke tab Statistik Performa lagi.
  function statistikTerakhir(idKonten: string) {
    const rows = statList.filter((s) => s.id_konten === idKonten);
    if (rows.length === 0) return null;
    return rows[rows.length - 1];
  }

  const filteredList = useMemo(() => {
    return list.filter((k) => {
      if (kanalFilter !== "all" && k.id_kanal !== kanalFilter) return false;
      if (search.trim() && !k.judul_konten.toLowerCase().includes(search.trim().toLowerCase()))
        return false;
      return true;
    });
  }, [list, kanalFilter, search]);

  function openNew() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, id_kanal: kanalList[0]?.id_kanal ?? "" });
    setStep(1);
    setStep1Error(null);
    setFormOpen(true);
  }

  function openEdit(k: Konten) {
    setEditingId(k.id_konten);
    setForm({
      id_kanal: k.id_kanal,
      judul_konten: k.judul_konten,
      status: k.status,
      tanggal_publish: k.tanggal_publish,
      cta: k.cta ?? "",
      referensi_desain: k.referensi_desain ?? "",
      gaya_copywriting: k.gaya_copywriting ?? "",
      assigned_script_writer: k.assigned_script_writer ?? "",
      assigned_editor: k.assigned_editor ?? "",
      brief_editor: k.brief_editor ?? "",
      assigned_graphic_designer: k.assigned_graphic_designer ?? "",
      brief_desain: k.brief_desain ?? "",
    });
    setStep(1);
    setStep1Error(null);
    setFormOpen(true);
  }

  function goNext() {
    if (step === 1) {
      if (!form.id_kanal || !form.judul_konten.trim()) {
        setStep1Error("Kanal & judul konten wajib diisi dulu.");
        return;
      }
    }
    setStep1Error(null);
    setStep((s) => Math.min(s + 1, 4));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.id_kanal || !form.judul_konten.trim()) {
      setStep(1);
      setStep1Error("Kanal & judul konten wajib diisi dulu.");
      return;
    }

    setSaving(true);
    setError(null);

    const res = await fetch("/api/socmed/konten", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id_konten: editingId, ...form } : form),
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
    if (!confirm("Hapus konten ini?")) return;
    await fetch("/api/socmed/konten", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_konten: id }),
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
          disabled={kanalList.length === 0}
          className="mb-4 text-sm bg-denim-700 text-white px-3.5 py-2 rounded-lg hover:bg-denim-500 transition-colors disabled:opacity-50"
        >
          + Tambah Konten
        </button>
      )}
      {canEdit && kanalList.length === 0 && (
        <p className="text-xs text-muted mb-4">
          Tambahkan kanal dulu di tab Kanal sebelum bisa bikin konten.
        </p>
      )}

      {list.length > 0 && (
        <div className="mb-4 space-y-2.5">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setKanalFilter("all")}
              className={`shrink-0 text-xs font-mono px-2.5 py-1.5 rounded-full border transition-colors ${
                kanalFilter === "all"
                  ? "bg-denim-700 text-white border-denim-700"
                  : "bg-white text-muted border-denim-100 hover:border-denim-300"
              }`}
            >
              Semua Kanal
            </button>
            {kanalList.map((k) => (
              <button
                key={k.id_kanal}
                onClick={() => setKanalFilter(k.id_kanal)}
                className={`shrink-0 text-xs font-mono px-2.5 py-1.5 rounded-full border transition-colors ${
                  kanalFilter === k.id_kanal
                    ? "bg-denim-700 text-white border-denim-700"
                    : "bg-white text-muted border-denim-100 hover:border-denim-300"
                }`}
              >
                {k.nama_kanal}
              </button>
            ))}
          </div>
          <input
            placeholder="Cari judul konten..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-lg border border-denim-100 px-3 py-1.5 text-sm outline-none focus:border-denim-500"
          />
        </div>
      )}

      {filteredList.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-denim-100 rounded-signature">
          <p className="text-sm text-muted">
            {list.length === 0 ? "Belum ada konten yang digarap." : "Tidak ada konten yang cocok."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((k) => {
            const stat = statistikTerakhir(k.id_konten);
            return (
            <Card key={k.id_konten}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <p className="font-medium text-denim-900 text-sm">{k.judul_konten}</p>
                  <p className="text-xs text-muted font-mono">{namaKanal(k.id_kanal)}</p>
                </div>
                <StatusBadge status={k.status} />
              </div>
              {k.cta && (
                <p className="text-sm text-denim-900 mb-1">
                  <span className="text-xs text-muted">CTA: </span>
                  {k.cta}
                </p>
              )}
              <p className="text-xs text-muted mb-2">
                Writer: {k.assigned_script_writer || "belum di-assign"} · Designer:{" "}
                {k.assigned_graphic_designer || "belum di-assign"} · Editor:{" "}
                {k.assigned_editor || "belum di-assign"}
                {k.tanggal_publish && ` · Publish: ${k.tanggal_publish}`}
              </p>
              {stat && (
                <div className="flex items-center gap-3 text-xs bg-denim-50 rounded-lg px-2.5 py-1.5 mb-2 w-fit">
                  <span className="text-denim-500">{stat.minggu_ke}</span>
                  <span className="text-denim-900 font-mono">{stat.views || 0} views</span>
                  <span className="text-denim-700 font-mono font-medium">
                    {stat.engagement_rate || "-"} engagement
                  </span>
                </div>
              )}
              {canEdit && (
                <div className="flex gap-3 mt-2 pt-2 border-t border-denim-100">
                  <button onClick={() => openEdit(k)} className="text-xs text-denim-700 underline">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(k.id_konten)}
                    className="text-xs text-red-600 underline"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </Card>
            );
          })}
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 bg-denim-900/40 flex items-center justify-center p-5 z-20 overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-signature p-5 w-full max-w-sm space-y-4 my-8"
          >
            <div>
              <h2 className="font-display text-lg text-denim-700">
                {editingId ? "Edit Konten" : "Konten Baru"}
              </h2>
              {/* Indikator langkah -- bisa diklik langsung buat loncat (berguna
                  pas edit, nggak perlu klik "Lanjut" berkali-kali). */}
              <div className="flex items-center gap-1.5 mt-2.5">
                {STEPS.map((s) => (
                  <button
                    key={s.n}
                    type="button"
                    onClick={() => setStep(s.n)}
                    className={`flex-1 text-center py-1 rounded-full text-[10px] font-medium transition-colors ${
                      step === s.n
                        ? "bg-denim-700 text-white"
                        : "bg-surface text-muted hover:bg-denim-50"
                    }`}
                  >
                    {s.n}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted mt-1.5">
                Langkah {step} dari 4 — {STEPS[step - 1].label}
              </p>
            </div>

            {/* ===== Langkah 1: Info Dasar ===== */}
            {step === 1 && (
              <div className="space-y-3">
                <select
                  value={form.id_kanal}
                  onChange={(e) => setForm({ ...form, id_kanal: e.target.value })}
                  className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
                >
                  <option value="" disabled>
                    Pilih kanal
                  </option>
                  {kanalList.map((k) => (
                    <option key={k.id_kanal} value={k.id_kanal}>
                      {k.nama_kanal}
                    </option>
                  ))}
                </select>

                <input
                  placeholder="Judul konten"
                  value={form.judul_konten}
                  onChange={(e) => setForm({ ...form, judul_konten: e.target.value })}
                  className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
                />

                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <div>
                  <label className="text-xs text-muted mb-1 block">
                    Target tanggal publish (dipakai juga sebagai deadline buat Script Writer &
                    Video Editor)
                  </label>
                  <input
                    type="date"
                    value={form.tanggal_publish}
                    onChange={(e) => setForm({ ...form, tanggal_publish: e.target.value })}
                    className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
                  />
                </div>

                {step1Error && <p className="text-sm text-red-600">{step1Error}</p>}
              </div>
            )}

            {/* ===== Langkah 2: Script Writer ===== */}
            {step === 2 && (
              <div className="space-y-3">
                <p className="text-xs text-muted">
                  Kosongin dropdown di bawah kalau konten ini nggak butuh Script Writer.
                </p>
                <select
                  value={form.assigned_script_writer}
                  onChange={(e) => setForm({ ...form, assigned_script_writer: e.target.value })}
                  className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
                >
                  <option value="">— Nggak butuh Script Writer —</option>
                  {writerList.map((w) => (
                    <option key={w.id} value={w.nama}>
                      {w.nama}
                    </option>
                  ))}
                </select>

                <input
                  placeholder="CTA (Call to Action)"
                  value={form.cta}
                  onChange={(e) => setForm({ ...form, cta: e.target.value })}
                  className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
                />
                <input
                  placeholder="Referensi desain (link, opsional)"
                  value={form.referensi_desain}
                  onChange={(e) => setForm({ ...form, referensi_desain: e.target.value })}
                  className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
                />
                <textarea
                  placeholder="Gaya copywriting yang diinginkan (brief buat Writer)"
                  value={form.gaya_copywriting}
                  onChange={(e) => setForm({ ...form, gaya_copywriting: e.target.value })}
                  className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
                  rows={3}
                />
              </div>
            )}

            {/* ===== Langkah 3: Video Editor ===== */}
            {step === 3 && (
              <div className="space-y-3">
                <p className="text-xs text-muted">
                  Kosongin dropdown di bawah kalau konten ini nggak butuh Video Editor.
                </p>
                <select
                  value={form.assigned_editor}
                  onChange={(e) => setForm({ ...form, assigned_editor: e.target.value })}
                  className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
                >
                  <option value="">— Nggak butuh Video Editor —</option>
                  {editorList.map((ed) => (
                    <option key={ed.id} value={ed.nama}>
                      {ed.nama}
                    </option>
                  ))}
                </select>

                <textarea
                  placeholder="Brief untuk Video Editor (mis. timestamp footage yang dipakai)"
                  value={form.brief_editor}
                  onChange={(e) => setForm({ ...form, brief_editor: e.target.value })}
                  className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
                  rows={3}
                />
                {editingId && (
                  <p className="text-[11px] text-muted">
                    Kosongin brief kalau nggak mau nimpa yang udah diisi manual di dashboard Video
                    Editor.
                  </p>
                )}
              </div>
            )}

            {/* ===== Langkah 4: Graphic Designer ===== */}
            {step === 4 && (
              <div className="space-y-3">
                <p className="text-xs text-muted">
                  Kosongin dropdown di bawah kalau konten ini nggak butuh Graphic Designer.
                </p>
                <select
                  value={form.assigned_graphic_designer}
                  onChange={(e) => setForm({ ...form, assigned_graphic_designer: e.target.value })}
                  className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
                >
                  <option value="">— Nggak butuh Graphic Designer —</option>
                  {designerList.map((d) => (
                    <option key={d.id} value={d.nama}>
                      {d.nama}
                    </option>
                  ))}
                </select>

                <textarea
                  placeholder="Brief desain (bisa panjang — detail visual yang diinginkan)"
                  value={form.brief_desain}
                  onChange={(e) => setForm({ ...form, brief_desain: e.target.value })}
                  className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500"
                  rows={4}
                />
                <p className="text-[11px] text-muted">
                  Assign di sini langsung muncul ke dashboard Designer, nggak perlu nunggu Script
                  Writer selesai.
                </p>
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2 pt-1">
              {step === 1 ? (
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="flex-1 text-sm py-2 rounded-lg border border-denim-100 text-denim-900"
                >
                  Batal
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex-1 text-sm py-2 rounded-lg border border-denim-100 text-denim-900"
                >
                  Kembali
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="flex-1 text-sm py-2 rounded-lg bg-denim-700 text-white"
                >
                  Lanjut
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 text-sm py-2 rounded-lg bg-denim-700 text-white disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
