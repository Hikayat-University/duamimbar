import {
  Project,
  Channel,
  EditorProject,
  CashflowEntry,
  Debt,
  BusinessUnit,
} from "./types";

// Catatan: seluruh data di file ini adalah DUMMY untuk kebutuhan tampilan.
// Begitu database & auth siap, ganti sumbernya ke fetch dari Supabase.

export const projects: Project[] = [
  {
    id: "p1",
    name: "Peluncuran Kampanye Q3",
    pic: "Tim Kreatif",
    status: "Berjalan",
    eta: "Agu 2026",
    desc: "Kampanye lintas kanal untuk kuartal 3.",
  },
  {
    id: "p2",
    name: "Podcast Series: Ruang Bicara",
    pic: "Divisi Konten",
    status: "Rencana",
    eta: "Sep 2026",
    desc: "Rencana produksi 8 episode.",
  },
  {
    id: "p3",
    name: "Dokumenter Internal 5th Anniversary",
    pic: "Video Editor",
    status: "Selesai",
    eta: "Jun 2026",
    desc: "Sudah tayang di kanal YouTube utama.",
  },
];

export const channels: Channel[] = [
  { id: "c1", name: "Instagram", followers: "128K", engagement: "4.2%", proyek: { sudah: 6, sedang: 2, akan: 3 } },
  { id: "c2", name: "TikTok", followers: "340K", engagement: "6.8%", proyek: { sudah: 9, sedang: 1, akan: 4 } },
  { id: "c3", name: "YouTube", followers: "52K", engagement: "—", proyek: { sudah: 3, sedang: 1, akan: 1 } },
];

export const editorProjects: EditorProject[] = [
  { id: "e1", title: "Cutdown Reels — Kampanye Q3", editor: "Rangga", deadline: "18 Jul", status: "Revisi" },
  { id: "e2", title: "Long-form Podcast Ep.1", editor: "Sari", deadline: "22 Jul", status: "Draft" },
  { id: "e3", title: "Dokumenter Anniversary", editor: "Rangga", deadline: "Selesai", status: "Final" },
];

export const cashflow: CashflowEntry[] = [
  { id: "cf1", title: "Pembayaran klien — Kampanye Q3", date: "10 Jul", type: "in", amount: "Rp 45.000.000" },
  { id: "cf2", title: "Sewa peralatan kamera", date: "09 Jul", type: "out", amount: "Rp 3.200.000" },
  { id: "cf3", title: "Gaji freelance editor", date: "08 Jul", type: "out", amount: "Rp 6.000.000" },
];

export const debts: Debt[] = [
  { id: "d1", who: "CV Mitra Produksi", amount: "Rp 12.000.000", due: "25 Jul 2026", status: "Belum Lunas" },
  { id: "d2", who: "Klien — Brand X", amount: "Rp 8.500.000", due: "Lunas 05 Jul", status: "Lunas" },
];

export const businesses: BusinessUnit[] = [
  { id: "b1", name: "Studio Rental", desc: "Unit bisnis penyewaan studio produksi." },
  { id: "b2", name: "Merchandise Line", desc: "Lini merchandise brand internal." },
];

export const roleMeta: Record<
  string,
  { label: string; initials: string }
> = {
  director: { label: "Head Director", initials: "HD" },
  social: { label: "Social Media Manager", initials: "SM" },
  editor: { label: "Video Editor", initials: "VE" },
  finance: { label: "Finance Manager", initials: "FM" },
  business: { label: "Business Manager", initials: "BM" },
};
