import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}

/**
 * Cek siapa yang login dan apakah emailnya terdaftar di tabel
 * anggota_studio (yang boleh mengelola data produksi).
 */
export async function getStudioAccess() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, isAnggota: false };

  const { data, error } = await supabase.rpc("is_anggota_studio");
  if (error) console.error("getStudioAccess: is_anggota_studio gagal:", error.message);

  return { user, isAnggota: data === true };
}
