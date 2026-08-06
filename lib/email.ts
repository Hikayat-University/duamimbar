import nodemailer from "nodemailer";

/**
 * Kirim email lewat Gmail SMTP. Butuh 2 env var:
 * - EMAIL_USER: alamat Gmail pengirim (mis. duamimbar.notif@gmail.com)
 * - EMAIL_APP_PASSWORD: App Password 16-karakter dari akun Gmail itu
 *   (Google Account → Security → 2-Step Verification → App Passwords).
 *   BUKAN password login Gmail biasa — Gmail nolak SMTP login pakai
 *   password biasa demi keamanan, harus App Password khusus.
 *
 * Sengaja "best-effort": kalau kirim gagal, cuma di-log ke console,
 * TIDAK melempar error — supaya alur utama (assign proyek, dst) tetap
 * jalan walau emailnya gagal terkirim.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.error("sendEmail: EMAIL_USER / EMAIL_APP_PASSWORD belum di-set, email dilewati.");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Duamimbar" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("sendEmail gagal:", err);
  }
}
