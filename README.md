# Duamimbar Produksi

Web Divisi Produksi Duamimbar. Isinya dua bagian:

- **Portofolio publik** (`/`, `/karya/[slug]`): daftar produk media yang sudah diproduksi. Tanpa login.
- **Studio** (`/studio`, wajib login): alat kerja manajer produksi.
  - Ringkasan: proyek berjalan, jadwal 7 hari ke depan, laporan terakhir.
  - Proyek: status dari ide sampai selesai, tenggat, PIC, brief.
  - Jadwal: kalender bulanan per tahap (praproduksi, shooting, editing, review, rilis).
  - Laporan: catatan kerja harian per proyek, bisa difilter per bulan/proyek dan dicetak ke PDF.
  - Portofolio: tambah/ubah karya, unggah cover, atur mana yang tampil di situs.

## Setup

1. Buka Supabase Dashboard → SQL Editor, jalankan isi
   `supabase/migrations/20261002000000_produksi.sql`.
2. Daftarkan email yang boleh masuk Studio:
   ```sql
   insert into public.anggota_studio (email, nama) values ('email@kamu.com', 'Nama');
   ```
   Akun login-nya dibuat di Authentication → Users → Add user.
3. Matikan pendaftaran umum: Authentication → Sign In / Providers → nonaktifkan "Allow new users to sign up".
4. Env var (Vercel / `.env.local`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   NEXT_PUBLIC_KONTAK_EMAIL=   # opsional, tampil di footer portofolio
   NEXT_PUBLIC_KONTAK_WA=      # opsional, format 62812xxxx
   ```
   Env var Google Sheets (`SHEET_ID_*`, `GOOGLE_*`) dan `SUPABASE_SERVICE_ROLE_KEY` tidak dipakai lagi.

Halaman portofolio di-cache 60 detik, jadi perubahan dari Studio muncul di situs paling lambat semenit kemudian.

## Pengembangan

```
npm install
npm run dev
```
