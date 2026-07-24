"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, LayoutGrid, Mail } from "lucide-react";
import { getAccessibleDashboards, type Role } from "@/lib/permissions";

const ROLE_LABELS: Record<string, string> = {
  head_director: "Head Director",
  kadiv_socmed: "Kepala Divisi Social Media",
  script_writer: "Script Writer",
  graphic_designer: "Graphic Designer",
  video_editor: "Video Editor",
  kadiv_finance: "Kepala Divisi Finance",
  kadiv_business: "Kepala Divisi Business",
};

// Urutan hirarki: Direksi → Social Media (Kadiv, lalu staf) → Video Editor
// → Finance → Business. Dipakai buat sorting card, bukan buat akses/RLS.
const ROLE_ORDER: Record<string, number> = {
  head_director: 0,
  kadiv_socmed: 1,
  script_writer: 2,
  graphic_designer: 3,
  video_editor: 4,
  kadiv_finance: 5,
  kadiv_business: 6,
};

// Badge "verified" cuma buat jajaran leadership (Direksi & Kadiv), bukan
// buat semua orang — biar tetap ada artinya, bukan dekorasi kosong.
const LEADERSHIP_ROLES = new Set(["head_director", "kadiv_socmed", "kadiv_finance", "kadiv_business"]);

type TeamMember = {
  id: string;
  nama: string;
  email: string;
  role: string;
  divisi: string;
  avatar_url: string | null;
  bio: string | null;
  akses_tambahan: string[];
  created_at: string;
};

export default function OurTeamSection() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => setTeam(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...team].sort((a, b) => {
    const orderA = ROLE_ORDER[a.role] ?? 99;
    const orderB = ROLE_ORDER[b.role] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.nama.localeCompare(b.nama);
  });

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl text-denim-700">Our Team</h2>
      <p className="text-muted text-sm mt-0.5 mb-6">Seluruh anggota tim, sesuai hirarki.</p>

      {loading ? (
        <p className="text-muted text-sm">Memuat...</p>
      ) : sorted.length === 0 ? (
        <p className="text-muted text-sm">Belum ada anggota tim terdaftar.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {sorted.map((m) => {
            const projectCount = getAccessibleDashboards(
              m.role as Role,
              m.akses_tambahan ?? []
            ).length;

            return (
              <div
                key={m.id}
                className="rounded-signature overflow-hidden bg-white border border-denim-100 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Foto — full-bleed kalau ada avatar_url, placeholder inisial kalau belum */}
                <div className="aspect-[4/5] relative overflow-hidden">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt={m.nama} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-denim-500 to-denim-900">
                      <span className="font-display text-4xl text-white/90">
                        {m.nama.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3.5">
                  <div className="flex items-center gap-1 mb-0.5">
                    <p className="font-display text-sm text-denim-900 truncate">{m.nama}</p>
                    {LEADERSHIP_ROLES.has(m.role) && (
                      <BadgeCheck size={13} strokeWidth={2} className="text-gold-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted line-clamp-2 mb-3 leading-snug">
                    {m.bio || ROLE_LABELS[m.role] || m.role}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-denim-700">
                      <LayoutGrid size={12} strokeWidth={1.75} />
                      {projectCount}
                    </span>
                    <a
                      href={`mailto:${m.email}`}
                      title="Kirim email"
                      className="flex items-center justify-center w-7 h-7 rounded-full bg-denim-50 hover:bg-denim-100 transition-colors"
                    >
                      <Mail size={12} strokeWidth={1.75} className="text-denim-700" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
