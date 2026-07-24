"use client";

import { useEffect, useState } from "react";
import {
  Pencil,
  Trash2,
  ArrowRight,
  LayoutGrid,
  KeyRound,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";
import { SIGNUP_ROLES, divisiForRole } from "@/lib/signupRoles";
import { getAccessibleDashboards, type Role } from "@/lib/permissions";

const ROLE_OPTIONS = [
  { value: "head_director", label: "Head Director" },
  ...SIGNUP_ROLES.map((r) => ({ value: r.value, label: r.label })),
];

const AKSES_TAMBAHAN_OPTIONS = [
  { value: "video_editor_dashboard", label: "Dashboard Video Editor (biasanya Kadiv SocMed)" },
  { value: "script_writer_dashboard", label: "Dashboard Script Writer (biasanya Kadiv SocMed)" },
  { value: "graphic_designer_dashboard", label: "Dashboard Graphic Designer (biasanya Kadiv SocMed)" },
  { value: "business_overview_dashboard", label: "Business Overview" },
  { value: "flow_business_dashboard", label: "Flow Business (view + komentar)" },
  { value: "budget_planner_dashboard", label: "Budget Planner (biasanya Kadiv Business)" },
];

type User = {
  id: string;
  nama: string;
  email: string;
  role: string;
  divisi: string;
  akses_tambahan: string[];
  avatar_url?: string | null;
  created_at: string;
};

/** Format singkat "berapa lama sejak bergabung" — 1 angka + satuan, biar muat di stat pill. */
function joinedShort(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days < 1) return "Baru";
  if (days < 30) return `${days}h`;
  if (days < 365) return `${Math.floor(days / 30)}bln`;
  return `${Math.floor(days / 365)}th`;
}

export default function UserManagementBoard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/users/manage")
      .then((res) => res.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function updateUser(id: string, updates: Partial<User>) {
    setSavingId(id);
    setError(null);

    const res = await fetch("/api/users/manage", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal menyimpan perubahan.");
      setSavingId(null);
      return;
    }

    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    setSavingId(null);
  }

  async function handleDelete(id: string, nama: string) {
    if (!confirm(`Hapus akun "${nama}"? Orang ini tidak akan bisa login lagi. Tindakan ini tidak bisa dibatalkan.`))
      return;

    const res = await fetch("/api/users/manage", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal menghapus akun.");
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  function toggleAksesTambahan(user: User, key: string) {
    const current = user.akses_tambahan ?? [];
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    updateUser(user.id, { akses_tambahan: next });
  }

  if (loading) return <p className="text-sm text-muted">Memuat...</p>;

  return (
    <div>
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {users.length === 0 ? (
        <p className="text-sm text-muted">Belum ada user terdaftar.</p>
      ) : (
        <div className="space-y-4">
          {users.map((u) => {
            const isEditing = editingId === u.id;
            const roleLabel = ROLE_OPTIONS.find((r) => r.value === u.role)?.label ?? u.role;
            const projectCount = getAccessibleDashboards(
              u.role as Role,
              u.akses_tambahan ?? []
            ).length;

            return (
              <div key={u.id} className="rounded-signature overflow-hidden shadow-md">
                {/* Kartu profil — gradient denim + blob blur, gantiin card putih polos lama */}
                <div className="relative bg-gradient-to-br from-denim-500 via-denim-700 to-denim-900 p-5 overflow-hidden">
                  <div className="absolute -top-10 -right-6 w-40 h-40 rounded-full bg-gold-400/30 blur-3xl" />
                  <div className="absolute -bottom-14 -left-10 w-44 h-44 rounded-full bg-denim-300/25 blur-3xl" />

                  <div className="relative flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {u.avatar_url ? (
                        <img
                          src={u.avatar_url}
                          alt={u.nama}
                          className="w-14 h-14 rounded-full object-cover border-2 border-white/70 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-white/15 border-2 border-white/40 flex items-center justify-center shrink-0">
                          <span className="font-display text-lg text-white">
                            {u.nama.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-display text-white text-base truncate">{u.nama}</p>
                        <p className="text-white/70 text-xs truncate">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setEditingId(isEditing ? null : u.id)}
                        title="Kelola role & akses"
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
                      >
                        <Pencil size={14} strokeWidth={1.75} className="text-white" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id, u.nama)}
                        title="Hapus akun"
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-white/15 hover:bg-red-500/60 transition-colors"
                      >
                        <Trash2 size={14} strokeWidth={1.75} className="text-white" />
                      </button>
                    </div>
                  </div>

                  <div className="relative flex items-center gap-4 mb-4 pb-4 border-b border-white/15">
                    <StatPill icon={LayoutGrid} value={projectCount} label="Project" />
                    <StatPill icon={KeyRound} value={u.akses_tambahan?.length ?? 0} label="Akses" />
                    <StatPill icon={CalendarDays} value={joinedShort(u.created_at)} label="Bergabung" />
                  </div>

                  <div className="relative flex items-center justify-between">
                    <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/15 text-white">
                      {u.divisi} · {roleLabel}
                    </span>
                  </div>

                  <button
                    onClick={() => setEditingId(isEditing ? null : u.id)}
                    className="relative mt-4 w-full flex items-center justify-center gap-2 rounded-full bg-white text-denim-900 text-sm font-medium py-2.5 hover:bg-denim-50 transition-colors"
                  >
                    {isEditing ? "Tutup" : "Kelola Akses"}
                    <ArrowRight size={15} strokeWidth={2} className={isEditing ? "rotate-90 transition-transform" : "transition-transform"} />
                  </button>
                </div>

                {/* Panel edit — dibuka lewat tombol "Kelola Akses" di atas */}
                {isEditing && (
                  <div className="bg-white border border-t-0 border-denim-100 px-5 py-4 space-y-3">
                    <div>
                      <label className="text-xs text-muted mb-1 block">Role</label>
                      <select
                        value={u.role}
                        disabled={savingId === u.id}
                        onChange={(e) =>
                          updateUser(u.id, {
                            role: e.target.value,
                            divisi:
                              e.target.value === "head_director"
                                ? "Direksi"
                                : divisiForRole(e.target.value),
                          })
                        }
                        className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white disabled:opacity-50"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-muted mb-1 block">
                        Akses tambahan lintas divisi
                      </label>
                      <div className="space-y-1.5">
                        {AKSES_TAMBAHAN_OPTIONS.map((opt) => (
                          <label key={opt.value} className="flex items-start gap-2 text-xs text-denim-900">
                            <input
                              type="checkbox"
                              checked={(u.akses_tambahan ?? []).includes(opt.value)}
                              disabled={savingId === u.id}
                              onChange={() => toggleAksesTambahan(u, opt.value)}
                              className="mt-0.5"
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-denim-700 underline"
                    >
                      Selesai
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatPill({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={13} strokeWidth={1.75} className="text-white/70" />
      <div className="leading-tight">
        <p className="text-white text-sm font-display leading-none">{value}</p>
        <p className="text-white/60 text-[10px] leading-none mt-0.5">{label}</p>
      </div>
    </div>
  );
}
