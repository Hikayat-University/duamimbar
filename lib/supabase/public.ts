import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client tanpa cookie/sesi untuk halaman portofolio publik. Karena tidak
 * membaca cookie, Next.js bisa men-cache halamannya (lihat `revalidate`).
 * RLS hanya mengizinkan baca karya yang `terbit = true`.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
