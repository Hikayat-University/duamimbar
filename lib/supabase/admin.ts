import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin client — HANYA dipakai di server (API routes), tidak pernah di client.
 * Pakai service role key yang bisa bypass RLS, dibutuhkan untuk membuat
 * akun baru (auth user + baris di tabel users) saat proses sign-up.
 *
 * Env var SUPABASE_SERVICE_ROLE_KEY diambil dari:
 * Supabase Dashboard → Settings → API → "service_role" secret key.
 * JANGAN pernah expose key ini ke browser (jangan pakai prefix NEXT_PUBLIC_).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
