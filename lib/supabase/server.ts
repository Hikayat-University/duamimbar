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

/** Ambil profil user (role, divisi, akses_tambahan, avatar_url, bio) dari tabel public.users. */
export async function getUserProfile() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("getUserProfile: auth.getUser() error:", authError.message);
  }
  if (!user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, nama, email, role, divisi, akses_tambahan, avatar_url, bio")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error(
      `getUserProfile: gagal ambil profil untuk user id=${user.id}, email=${user.email}. Error:`,
      profileError.message,
      profileError.details
    );
  }

  return profile;
}
