"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, LayoutGrid } from "lucide-react";
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
            const roleLabel = ROLE_LABELS[m.role] ?? m.role;

            return (
              <TeamCard
                key={m.id}
                nama={m.nama}
                avatarUrl={m.avatar_url}
                roleLabel={roleLabel}
                projectCount={projectCount}
                isLeadership={LEADERSHIP_ROLES.has(m.role)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

function TeamCard({
  nama,
  avatarUrl,
  roleLabel,
  projectCount,
  isLeadership,
}: {
  nama: string;
  avatarUrl: string | null;
  roleLabel: string;
  projectCount: number;
  isLeadership: boolean;
}) {
  const [imgBroken, setImgBroken] = useState(false);
  const showImage = avatarUrl && !imgBroken;

  return (
    <div className="relative aspect-[3/4] rounded-signature overflow-hidden bg-denim-700 shadow-sm hover:shadow-md transition-shadow">
      {/* Foto full-bleed — fallback ke inisial gradient kalau belum ada foto / link rusak */}
      {showImage ? (
        <img
          src={avatarUrl!}
          alt={nama}
          onError={() => setImgBroken(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-denim-500 to-denim-900">
          <span className="font-display text-5xl text-white/90">
            {nama.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Gradient scrim biar teks kebaca di atas foto apa pun */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

      {/* Konten: nama, role, count project */}
      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <div className="flex items-center gap-1 mb-0.5">
          <p className="font-display text-sm text-white truncate">{nama}</p>
          {isLeadership && (
            <BadgeCheck size={13} strokeWidth={2} className="text-gold-400 shrink-0" />
          )}
        </div>
        <p className="text-xs text-white/70 truncate mb-2">{roleLabel}</p>
        <span className="flex items-center gap-1 text-xs text-white/90 w-fit">
          <LayoutGrid size={12} strokeWidth={1.75} />
          {projectCount}
        </span>
      </div>
    </div>
  );
}
