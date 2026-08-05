"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      // Sengaja selalu tampilkan pesan sukses yang sama, walau email gagal
      // dikirim (mis. akun nggak ada) — biar orang luar nggak bisa nebak
      // email mana yang terdaftar di sistem cuma dari respons form ini.
      if (error) console.error("resetPasswordForEmail error:", error.message);
      setSent(true);
    } catch (err) {
      setError("Tidak bisa terhubung ke server. Cek koneksi internet, lalu coba lagi.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-denim-700 mb-1">Lupa Password</h1>
        <p className="text-muted text-sm mb-8">
          Masukkan email akunmu, kami kirim link buat bikin password baru.
        </p>

        {sent ? (
          <div className="rounded-lg bg-denim-50 border border-denim-100 px-3 py-2.5">
            <p className="text-sm text-denim-700">
              Kalau email <span className="font-medium">{email}</span> terdaftar, link reset
              password udah dikirim. Cek inbox (atau folder spam) kamu.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-denim-900 mb-1 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-denim-100 px-3 py-2.5 text-sm focus:border-denim-500 outline-none"
                placeholder="nama@perusahaan.com"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-denim-700 text-white py-2.5 text-sm font-medium hover:bg-denim-500 transition-colors disabled:opacity-50"
            >
              {loading ? "Mengirim..." : "Kirim Link Reset"}
            </button>
          </form>
        )}

        <p className="text-xs text-muted mt-6">
          <Link href="/login" className="text-denim-700 underline">
            Kembali ke halaman login
          </Link>
        </p>
      </div>
    </main>
  );
}
