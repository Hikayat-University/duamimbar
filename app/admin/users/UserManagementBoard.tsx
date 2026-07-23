"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { SIGNUP_ROLES, divisiForRole } from "@/lib/signupRoles";

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
  created_at: string;
};

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
        <div className="space-y-3">
          {users.map((u) => {
            const isEditing = editingId === u.id;
            return (
              <Card key={u.id}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <p className="font-medium text-denim-900 text-sm">{u.nama}</p>
                    <p className="text-xs text-muted">{u.email}</p>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-denim-50 text-denim-700">
                    {u.divisi}
                  </span>
                </div>

                {!isEditing ? (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-denim-100">
                    <p className="text-xs text-muted font-mono">
                      {ROLE_OPTIONS.find((r) => r.value === u.role)?.label ?? u.role}
                      {u.akses_tambahan?.length > 0 && ` · +${u.akses_tambahan.length} akses tambahan`}
                    </p>
                    <button
                      onClick={() => setEditingId(u.id)}
                      className="text-xs text-denim-700 underline"
                    >
                      Kelola
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-denim-100 space-y-3">
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

                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs text-denim-700 underline"
                      >
                        Selesai
                      </button>
                      <button
                        onClick={() => handleDelete(u.id, u.nama)}
                        className="text-xs text-red-600 underline"
                      >
                        Hapus Akun
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
