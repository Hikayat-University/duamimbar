-- Skema Divisi Produksi Duamimbar.
-- Jalankan sekali di Supabase Dashboard → SQL Editor (project yang dipakai web ini).
-- Setelah itu daftarkan email yang boleh mengelola studio:
--   insert into public.anggota_studio (email, nama) values ('email@kamu.com', 'Nama Kamu');

-- ── Siapa yang boleh mengelola data ─────────────────────────────────────────
create table if not exists public.anggota_studio (
  email text primary key,
  nama text,
  created_at timestamptz not null default now()
);
alter table public.anggota_studio enable row level security;

create or replace function public.is_anggota_studio()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.anggota_studio
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

drop policy if exists "anggota baca diri" on public.anggota_studio;
create policy "anggota baca diri" on public.anggota_studio
  for select to authenticated using (public.is_anggota_studio());

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Portofolio: produk media yang tampil di halaman publik ──────────────────
create table if not exists public.karya (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  judul text not null check (trim(judul) <> ''),
  kategori text not null default 'Video',
  klien text,
  tahun int check (tahun between 1990 and 2100),
  ringkasan text,
  deskripsi text,
  cover_url text,
  video_url text,
  link_url text,
  unggulan boolean not null default false,
  terbit boolean not null default false,
  urutan int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Proyek produksi ─────────────────────────────────────────────────────────
create table if not exists public.proyek (
  id uuid primary key default gen_random_uuid(),
  nama text not null check (trim(nama) <> ''),
  klien text,
  jenis text,
  status text not null default 'ide'
    check (status in ('ide', 'praproduksi', 'produksi', 'pascaproduksi', 'selesai', 'batal')),
  tanggal_mulai date,
  tenggat date,
  tanggal_selesai date,
  pic text,
  catatan text,
  karya_id uuid references public.karya (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Jadwal produksi ─────────────────────────────────────────────────────────
create table if not exists public.jadwal (
  id uuid primary key default gen_random_uuid(),
  proyek_id uuid references public.proyek (id) on delete cascade,
  judul text not null check (trim(judul) <> ''),
  tahap text not null default 'produksi'
    check (tahap in ('praproduksi', 'produksi', 'pascaproduksi', 'review', 'rilis', 'lainnya')),
  tanggal date not null,
  tanggal_akhir date,
  jam text,
  lokasi text,
  kru text,
  status text not null default 'terjadwal'
    check (status in ('terjadwal', 'berjalan', 'selesai', 'ditunda')),
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (tanggal_akhir is null or tanggal_akhir >= tanggal)
);
create index if not exists jadwal_tanggal_idx on public.jadwal (tanggal);

-- ── Laporan kerja ───────────────────────────────────────────────────────────
create table if not exists public.laporan (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null default current_date,
  proyek_id uuid references public.proyek (id) on delete set null,
  dikerjakan text not null check (trim(dikerjakan) <> ''),
  hasil text,
  kendala text,
  rencana text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists laporan_tanggal_idx on public.laporan (tanggal desc);

-- ── Trigger updated_at & RLS ────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['karya', 'proyek', 'jadwal', 'laporan'] loop
    execute format('drop trigger if exists %I_updated_at on public.%I', t, t);
    execute format(
      'create trigger %I_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t, t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "anggota kelola" on public.%I', t);
    execute format(
      'create policy "anggota kelola" on public.%I for all to authenticated
         using (public.is_anggota_studio()) with check (public.is_anggota_studio())', t);
  end loop;
end $$;

-- Pengunjung (tanpa login) hanya bisa melihat karya yang sudah diterbitkan.
drop policy if exists "publik baca karya terbit" on public.karya;
create policy "publik baca karya terbit" on public.karya
  for select to anon, authenticated using (terbit);

-- ── Storage untuk cover portofolio ──────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('portofolio', 'portofolio', true)
on conflict (id) do nothing;

drop policy if exists "anggota unggah portofolio" on storage.objects;
create policy "anggota unggah portofolio" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'portofolio' and public.is_anggota_studio());

drop policy if exists "anggota ubah portofolio" on storage.objects;
create policy "anggota ubah portofolio" on storage.objects
  for update to authenticated
  using (bucket_id = 'portofolio' and public.is_anggota_studio());

drop policy if exists "anggota hapus portofolio" on storage.objects;
create policy "anggota hapus portofolio" on storage.objects
  for delete to authenticated
  using (bucket_id = 'portofolio' and public.is_anggota_studio());
