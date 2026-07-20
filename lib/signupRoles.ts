/**
 * Role yang boleh dipilih sendiri saat sign-up.
 *
 * "head_director" SENGAJA tidak dimasukkan di sini — role itu hanya boleh
 * ditentukan manual oleh direksi lewat Supabase dashboard, bukan self-claim,
 * karena head_director punya akses lihat ke semua dashboard (termasuk
 * Cash Flow dan Flow Business).
 */
export const SIGNUP_ROLES = [
  { value: "kadiv_socmed", label: "Kepala Divisi Social Media", divisi: "Social Media" },
  { value: "video_editor", label: "Video Editor", divisi: "Video Editor" },
  { value: "kadiv_finance", label: "Kepala Divisi Finance", divisi: "Finance" },
  { value: "kadiv_business", label: "Kepala Divisi Business", divisi: "Business" },
] as const;

export type SignupRole = (typeof SIGNUP_ROLES)[number]["value"];

export function divisiForRole(role: string): string {
  return SIGNUP_ROLES.find((r) => r.value === role)?.divisi ?? "";
}
