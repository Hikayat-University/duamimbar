import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

/**
 * Kirim notifikasi (in-app + email) ke user, dicari berdasarkan `nama`
 * karena sistem assign proyek di seluruh app pakai nama (bukan user ID)
 * — konsisten dengan dropdown assign editor/writer/designer yang sudah ada.
 *
 * Best-effort: kalau user dengan nama itu nggak ketemu, atau proses gagal,
 * cuma di-log — TIDAK melempar error, supaya alur assign proyek utama
 * (yang manggil fungsi ini) tetap berhasil walau notifikasinya gagal.
 */
export async function notifyUserByName(
  nama: string,
  { title, message, link }: { title: string; message: string; link?: string }
) {
  if (!nama) return;

  try {
    const admin = createAdminClient();

    const { data: user, error } = await admin
      .from("users")
      .select("id, email")
      .eq("nama", nama)
      .single();

    if (error || !user) {
      console.error(`notifyUserByName: user dengan nama "${nama}" tidak ditemukan.`);
      return;
    }

    // In-app: insert ke tabel notifications (pakai admin client karena
    // RLS sengaja nggak izinin insert dari client biasa untuk orang lain)
    const { error: insertError } = await admin.from("notifications").insert({
      user_id: user.id,
      title,
      message,
      link: link ?? null,
    });
    if (insertError) console.error("notifyUserByName: gagal insert notifikasi:", insertError.message);

    // Email — best-effort, nggak nge-block kalau gagal
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: title,
        html: `
          <div style="font-family: sans-serif; max-width: 480px;">
            <h2 style="color: #1A2E95;">${title}</h2>
            <p style="color: #1A2634; font-size: 14px;">${message}</p>
            ${
              link
                ? `<p><a href="https://duamimbar.vercel.app${link}" style="color: #1A2E95;">Buka di Duamimbar →</a></p>`
                : ""
            }
            <p style="color: #6B7A8D; font-size: 12px; margin-top: 24px;">
              Email otomatis dari Dashboard Duamimbar.
            </p>
          </div>
        `,
      });
    }
  } catch (err) {
    console.error("notifyUserByName gagal total:", err);
  }
}
