"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  // "checking" -> lagi nunggu Supabase proses link dari email
  // "ready"    -> link valid, boleh isi password baru
  // "invalid"  -> link nggak valid/kadaluarsa
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Supabase otomatis proses token dari URL pas halaman ini dibuka lewat
    // link email, lalu kirim event PASSWORD_RECOVERY. Kalau event itu nggak
    // pernah muncul dalam beberapa detik, berarti link-nya nggak valid.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStatus("ready");
    });

    // Jaga-jaga kalau event-nya udah keburu lewat sebelum listener terpasang.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStatus((s) => (s === "checking" ? "ready" : s));
    });

    const timeout = setTimeout(() => {
      setStatus((s) => (s === "checking" ? "invalid" : s));
    }, 4000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message ?? "Gagal mengubah password. Coba lagi.");
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-denim-700 mb-1">Password Baru</h1>
        <p className="text-muted text-sm mb-8">Bikin password baru buat akunmu.</p>

        {status === "checking" && (
          <p className="text-sm text-muted">Memeriksa link...</p>
        )}

        {status === "invalid" && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
            <p className="text-sm text-red-600">
              Link ini nggak valid atau udah kadaluarsa. Minta link baru lewat halaman{" "}
              <Link href="/forgot-password" className="underline">
                Lupa Password
              </Link>
              .
            </p>
          </div>
        )}

        {status === "ready" && !success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-denim-900 mb-1 block">Password baru</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-denim-100 px-3 py-2.5 text-sm focus:border-denim-500 outline-none"
                placeholder="Minimal 8 karakter"
              />
            </div>
            <div>
              <label className="text-sm text-denim-900 mb-1 block">Konfirmasi password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-denim-100 px-3 py-2.5 text-sm focus:border-denim-500 outline-none"
                placeholder="Ulangi password baru"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-denim-700 text-white py-2.5 text-sm font-medium hover:bg-denim-500 transition-colors disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Password Baru"}
            </button>
          </form>
        )}

        {success && (
          <div className="rounded-lg bg-denim-50 border border-denim-100 px-3 py-2.5">
            <p className="text-sm text-denim-700">
              Password berhasil diubah. Mengarahkan ke halaman login...
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
