/**
 * Semua role selain head_director, dipakai di halaman kelola user (Head
 * Director yang menentukan role siapa pun) dan buat nentuin divisi.
 */
export const ASSIGNABLE_ROLES = [
  { value: "kadiv_socmed", label: "Kepala Divisi Social Media", divisi: "Social Media" },
  { value: "script_writer", label: "Script Writer", divisi: "Social Media" },
  { value: "graphic_designer", label: "Graphic Designer", divisi: "Social Media" },
  { value: "video_editor", label: "Video Editor", divisi: "Video Editor" },
  { value: "kadiv_finance", label: "Kepala Divisi Finance", divisi: "Finance" },
  { value: "kadiv_business", label: "Kepala Divisi Business", divisi: "Business" },
] as const;

/**
 * Role yang boleh dipilih sendiri saat sign-up: cuma role staf.
 *
 * "head_director" dan semua role kadiv SENGAJA tidak dimasukkan di sini.
 * Kadiv punya akses edit ke data divisinya (kadiv_finance bisa ubah & hapus
 * transaksi keuangan), jadi nggak boleh self-claim. Kadiv daftar sebagai
 * staf dulu, lalu Head Director ganti role-nya lewat halaman Kelola User.
 */
export const SIGNUP_ROLES = ASSIGNABLE_ROLES.filter(
  (r) => !r.value.startsWith("kadiv_")
);

export type SignupRole = (typeof SIGNUP_ROLES)[number]["value"];

export function divisiForRole(role: string): string {
  return ASSIGNABLE_ROLES.find((r) => r.value === role)?.divisi ?? "";
}
