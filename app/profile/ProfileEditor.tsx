"use client";

import { useState } from "react";
import { Pencil, Check, X, LayoutGrid } from "lucide-react";

export default function ProfileEditor({
  nama,
  email,
  divisi,
  roleLabel,
  avatarUrl,
  bio,
  projectCount,
}: {
  nama: string;
  email: string;
  divisi: string;
  roleLabel: string;
  avatarUrl: string;
  bio: string;
  projectCount: number;
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
    <div className="space-y-6">
      {/* Foto — signature asymmetric shape, sengaja bukan lingkaran, dikasih
          shadow + border putih supaya kesan "timbul" (embossed sticker),
          bukan avatar generic. */}
      <div className="flex items-start gap-5">
        <div className="relative shrink-0">
          {avatarShown && !imgBroken ? (
            <img
              src={avatarShown}
              alt={nama}
              onError={() => setImgBroken(true)}
              className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-signature border-4 border-white shadow-[0_8px_20px_-4px_rgba(19,32,95,0.35)]"
            />
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-signature border-4 border-white shadow-[0_8px_20px_-4px_rgba(19,32,95,0.35)] bg-denim-700 flex items-center justify-center">
              <span className="font-display text-2xl text-white">
                {nama.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0 pt-1">
          <p className="font-display text-xl text-denim-900 truncate">{nama}</p>
          <p className="text-xs text-muted truncate mb-2">{email}</p>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-denim-50 text-denim-700">
              {divisi}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-gold-400/15 text-gold-500">
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Bio */}
      {!editing && (
        <p className="text-sm text-denim-900 leading-relaxed">
          {bioShown || <span className="text-muted italic">Belum ada bio.</span>}
        </p>
      )}

      {/* Stat: project count */}
      <div className="flex items-center gap-2.5 rounded-signature bg-denim-50 px-4 py-3 w-fit">
        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-denim-700">
          <LayoutGrid size={16} strokeWidth={1.75} className="text-white" />
        </span>
        <div>
          <p className="font-display text-lg text-denim-900 leading-none">{projectCount}</p>
          <p className="text-xs text-muted leading-none mt-1">Dashboard/Project</p>
        </div>
      </div>

      {/* Edit form */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {editing ? (
        <div className="space-y-3 pt-2 border-t border-denim-100">
          <div className="pt-3">
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
              className="flex items-center gap-1.5 text-xs text-muted px-3 py-2 rounded-lg hover:bg-surface"
            >
              <X size={13} strokeWidth={2.5} />
              Batal
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-denim-700 underline"
        >
          <Pencil size={12} strokeWidth={2} />
          Edit foto & bio
        </button>
      )}
    </div>
  );
}
