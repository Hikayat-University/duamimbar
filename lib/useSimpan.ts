"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Bungkus operasi tulis ke Supabase: atur status loading/error, lalu
 * refresh data halaman (server component) kalau berhasil.
 */
export function useSimpan() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function jalankan(op: () => PromiseLike<{ error: { message: string } | null }>) {
    setLoading(true);
    setError(null);
    const { error } = await op();
    setLoading(false);
    if (error) {
      setError(error.message);
      return false;
    }
    router.refresh();
    return true;
  }

  return { jalankan, loading, error, setError };
}
