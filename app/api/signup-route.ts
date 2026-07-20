import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SIGNUP_ROLES, divisiForRole } from "@/lib/signupRoles";

export async function POST(req: NextRequest) {
  const { nama, email, password, role } = await req.json();

  if (!nama || !email || !password || !role) {
    return NextResponse.json({ error: "Semua field wajib diisi." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password minimal 8 karakter." },
      { status: 400 }
    );
  }

  const validRole = SIGNUP_ROLES.some((r) => r.value === role);
  if (!validRole) {
    return NextResponse.json({ error: "Role tidak valid." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 1. Buat akun auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // langsung aktif, tidak perlu verifikasi email
  });

  if (authError || !authData.user) {
    const message = authError?.message?.includes("already registered")
      ? "Email ini sudah terdaftar. Coba login."
      : authError?.message ?? "Gagal membuat akun.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // 2. Insert ke tabel public.users dengan role & divisi sesuai pilihan
  const { error: profileError } = await supabase.from("users").insert({
    id: authData.user.id,
    nama,
    email,
    role,
    divisi: divisiForRole(role),
    akses_tambahan: [], // akses lintas divisi tetap hanya bisa diatur manual oleh Head Director
  });

  if (profileError) {
    // rollback: hapus auth user kalau insert profil gagal, biar tidak ada akun "nyangkut"
    await supabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json(
      { error: "Gagal menyimpan profil: " + profileError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
