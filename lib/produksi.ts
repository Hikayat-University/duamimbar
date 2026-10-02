export type Karya = {
  id: string;
  slug: string;
  judul: string;
  kategori: string;
  klien: string | null;
  tahun: number | null;
  ringkasan: string | null;
  deskripsi: string | null;
  cover_url: string | null;
  video_url: string | null;
  link_url: string | null;
  unggulan: boolean;
  terbit: boolean;
  urutan: number;
  created_at: string;
};

export type StatusProyek = "ide" | "praproduksi" | "produksi" | "pascaproduksi" | "selesai" | "batal";

export type Proyek = {
  id: string;
  nama: string;
  klien: string | null;
  jenis: string | null;
  status: StatusProyek;
  tanggal_mulai: string | null;
  tenggat: string | null;
  tanggal_selesai: string | null;
  pic: string | null;
  catatan: string | null;
  karya_id: string | null;
  created_at: string;
};

export type TahapJadwal = "praproduksi" | "produksi" | "pascaproduksi" | "review" | "rilis" | "lainnya";
export type StatusJadwal = "terjadwal" | "berjalan" | "selesai" | "ditunda";

export type Jadwal = {
  id: string;
  proyek_id: string | null;
  judul: string;
  tahap: TahapJadwal;
  tanggal: string;
  tanggal_akhir: string | null;
  jam: string | null;
  lokasi: string | null;
  kru: string | null;
  status: StatusJadwal;
  catatan: string | null;
};

export type Laporan = {
  id: string;
  tanggal: string;
  proyek_id: string | null;
  dikerjakan: string;
  hasil: string | null;
  kendala: string | null;
  rencana: string | null;
  created_at: string;
};

export const KATEGORI_KARYA = [
  "Video",
  "Film Pendek",
  "Dokumenter",
  "Iklan",
  "Podcast",
  "Konten Sosmed",
  "Live Streaming",
  "Fotografi",
  "Desain",
];

export const STATUS_PROYEK: { value: StatusProyek; label: string }[] = [
  { value: "ide", label: "Ide" },
  { value: "praproduksi", label: "Praproduksi" },
  { value: "produksi", label: "Produksi" },
  { value: "pascaproduksi", label: "Pascaproduksi" },
  { value: "selesai", label: "Selesai" },
  { value: "batal", label: "Batal" },
];

export const TAHAP_JADWAL: { value: TahapJadwal; label: string }[] = [
  { value: "praproduksi", label: "Praproduksi" },
  { value: "produksi", label: "Shooting / Produksi" },
  { value: "pascaproduksi", label: "Editing / Pascaproduksi" },
  { value: "review", label: "Review klien" },
  { value: "rilis", label: "Rilis / Tayang" },
  { value: "lainnya", label: "Lainnya" },
];

export const STATUS_JADWAL: { value: StatusJadwal; label: string }[] = [
  { value: "terjadwal", label: "Terjadwal" },
  { value: "berjalan", label: "Berjalan" },
  { value: "selesai", label: "Selesai" },
  { value: "ditunda", label: "Ditunda" },
];

/** Warna titik/garis per tahap, dipakai di kalender & daftar jadwal. */
export const WARNA_TAHAP: Record<TahapJadwal, string> = {
  praproduksi: "bg-orange-400",
  produksi: "bg-denim-700",
  pascaproduksi: "bg-violet-500",
  review: "bg-emerald-500",
  rilis: "bg-gold-500",
  lainnya: "bg-slate-400",
};

export function labelDari<T extends string>(list: { value: T; label: string }[], value: T) {
  return list.find((x) => x.value === value)?.label ?? value;
}

export const PROYEK_AKTIF: StatusProyek[] = ["praproduksi", "produksi", "pascaproduksi"];

/** Tanggal hari ini dalam format YYYY-MM-DD menurut zona waktu Jakarta. */
export function hariIni() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

export function tambahHari(isoDate: string, n: number) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function formatTanggal(isoDate: string | null, opsi: Intl.DateTimeFormatOptions = {}) {
  if (!isoDate) return "-";
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("id-ID", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opsi,
  });
}

export function slugify(teks: string) {
  return teks
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Ubah link YouTube/Vimeo jadi URL embed. Link lain dikembalikan null. */
export function embedUrl(url: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (host.endsWith("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return url;
      if (u.pathname.startsWith("/shorts/")) return `https://www.youtube.com/embed/${u.pathname.split("/")[2]}`;
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (host === "vimeo.com") return `https://player.vimeo.com/video/${u.pathname.split("/").filter(Boolean)[0]}`;
    if (host === "player.vimeo.com") return url;
  } catch {
    return null;
  }
  return null;
}

/** Thumbnail otomatis YouTube kalau karya belum punya cover. */
export function thumbnailDari(karya: Pick<Karya, "cover_url" | "video_url">) {
  if (karya.cover_url) return karya.cover_url;
  const embed = embedUrl(karya.video_url);
  const m = embed?.match(/youtube\.com\/embed\/([\w-]+)/);
  return m ? `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` : null;
}
