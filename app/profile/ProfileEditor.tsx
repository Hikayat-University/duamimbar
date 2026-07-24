"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";

function joinedShort(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days < 1) return "Baru";
  if (days < 30) return `${days}h`;
  if (days < 365) return `${Math.floor(days / 30)}bln`;
  return `${Math.floor(days / 365)}th`;
}

export default function ProfileEditor({
  nama,
  email,
  divisi,
  roleLabel,
  avatarUrl,
  bio,
  projectCount,
  createdAt,
}: {
  nama: string;
  email: string;
  divisi: string;
  roleLabel: string;
  avatarUrl: string;
  bio: string;
  projectCount: number;
  createdAt: string;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [avatarDraft, setAvatarDraft] = useState(avatarUrl);
  const [bioDraft, setBioDraft] = useState(bio);
  const [avatarShown, setAvatarShown] = useState(avatarUrl);
  const [bioShown, setBioShown] = useState(bio);
  const [imgBroken, setImgBroken] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar_url: avatarDraft, bio: bioDraft }),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal menyimpan perubahan.");
      return;
    }

    setAvatarShown(avatarDraft);
    setBioShown(bioDraft);
    setImgBroken(false);
    setEditing(false);
  }

  function cancel() {
    setAvatarDraft(avatarShown);
    setBioDraft(bioShown);
    setError(null);
    setEditing(false);
  }

  return (
    <div className="rounded-signature overflow-hidden bg-white border border-denim-100 shadow-sm">
      {/* Cover banner */}
      <div className="h-24 sm:h-28 bg-gradient-to-br from-denim-100 via-denim-300/50 to-surface" />

      <div className="relative px-5 pb-5">
        {/* Tombol edit — icon-only, pojok kanan atas area putih */}
        <button
          onClick={() => setEditing((v) => !v)}
          title={editing ? "Tutup" : "Edit foto & bio"}
          className="absolute top-3 right-3 flex items-center justify-center w-9 h-9 rounded-full bg-white border border-denim-100 shadow-sm hover:bg-denim-50 transition-colors"
        >
          {editing ? (
            <X size={15} strokeWidth={2} className="text-denim-700" />
          ) : (
            <Pencil size={14} strokeWidth={1.75} className="text-denim-700" />
          )}
        </button>

        {/* Foto — signature asymmetric shape (bukan lingkaran), overlap ke
            banner, border putih + shadow biar kesan "timbul". */}
        <div className="-mt-10 sm:-mt-12 mb-3">
          {avatarShown && !imgBroken ? (
            <img
              src={avatarShown}
              alt={nama}
              onError={() => setImgBroken(true)}
              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-signature border-4 border-white shadow-[0_8px_20px_-4px_rgba(19,32,95,0.35)]"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-signature border-4 border-white shadow-[0_8px_20px_-4px_rgba(19,32,95,0.35)] bg-denim-700 flex items-center justify-center">
              <span className="font-display text-2xl text-white">
                {nama.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <p className="font-display text-xl text-denim-900">{nama}</p>
        <p className="text-xs text-muted mb-2.5">{email}</p>

        <span className="inline-block text-xs font-mono px-2.5 py-1 rounded-full bg-gold-400/15 text-gold-500">
          {roleLabel}
        </span>

        {/* Stats — dipisah garis vertikal, gaya label kecil di atas + value di bawah */}
        <div className="flex divide-x divide-denim-100 border-t border-denim-100 mt-4 pt-4">
          <StatCol label="Divisi" value={divisi} />
          <StatCol label="Project" value={projectCount} />
          <StatCol label="Bergabung" value={joinedShort(createdAt)} />
        </div>

        {!editing && (
          <p className="text-sm text-denim-900 leading-relaxed mt-4 pt-4 border-t border-denim-100">
            {bioShown || <span className="text-muted italic">Belum ada bio.</span>}
          </p>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 mt-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {editing && (
          <div className="space-y-3 mt-4 pt-4 border-t border-denim-100">
            <div>
              <label className="text-xs text-muted mb-1 block">
                Link foto profile (URL — Google Drive, Imgur, dst)
              </label>
              <input
                type="url"
                value={avatarDraft}
                onChange={(e) => setAvatarDraft(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white"
              />
            </div>

            <div>
              <label className="text-xs text-muted mb-1 block">Bio singkat (maks 160 karakter)</label>
              <textarea
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value.slice(0, 160))}
                rows={3}
                placeholder="Ceritain singkat soal peranmu di tim..."
                className="w-full rounded-lg border border-denim-100 px-3 py-2 text-sm outline-none focus:border-denim-500 bg-white resize-none"
              />
              <p className="text-xs text-muted mt-1 text-right">{bioDraft.length}/160</p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-denim-900 text-white disabled:opacity-50"
              >
                <Check size={13} strokeWidth={2.5} />
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
              <button
                onClick={cancel}
                disabled={saving}
                className="text-xs text-muted px-3 py-2 rounded-lg hover:bg-surface"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCol({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex-1 px-3 first:pl-0 last:pr-0">
      <p className="text-[11px] text-muted mb-0.5">{label}</p>
      <p className="font-display text-sm text-denim-900">{value}</p>
    </div>
  );
}
