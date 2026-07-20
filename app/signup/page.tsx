"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SIGNUP_ROLES } from "@/lib/signupRoles";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nama: "",
    email: "",
    password: "",
    role: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Terjadi kesalahan. Coba lagi.");
      setLoading(false);
      return;
    }

    // Langsung login setelah akun berhasil dibuat
    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (loginError) {
      // Akun berhasil dibuat tapi auto-login gagal — arahkan ke login manual
      router.push("/login");
      return;
    }

    router.push("/home");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-denim-700 mb-1">Buat Akun</h1>
        <p className="text-muted text-sm mb-8">
          Daftar sebagai anggota tim Duamimbar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-denim-900 mb-1 block">Nama lengkap</label>
            <input
              required
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2.5 text-sm focus:border-denim-500 outline-none"
              placeholder="Nama kamu"
            />
          </div>

          <div>
            <label className="text-sm text-denim-900 mb-1 block">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2.5 text-sm focus:border-denim-500 outline-none"
              placeholder="nama@perusahaan.com"
            />
          </div>

          <div>
            <label className="text-sm text-denim-900 mb-1 block">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2.5 text-sm focus:border-denim-500 outline-none"
              placeholder="Minimal 8 karakter"
            />
          </div>

          <div>
            <label className="text-sm text-denim-900 mb-1 block">Role / Divisi</label>
            <select
              required
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-lg border border-denim-100 px-3 py-2.5 text-sm focus:border-denim-500 outline-none bg-white"
            >
              <option value="" disabled>
                Pilih role kamu
              </option>
              {SIGNUP_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted mt-1">
              Head Director tidak tersedia di sini — dibuatkan manual oleh direksi.
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-denim-700 text-white py-2.5 text-sm font-medium hover:bg-denim-500 transition-colors disabled:opacity-50"
          >
            {loading ? "Membuat akun..." : "Buat Akun"}
          </button>
        </form>

        <p className="text-xs text-muted mt-6">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-denim-700 underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </main>
  );
}
