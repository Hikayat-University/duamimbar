import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Duamimbar Studio Produksi",
    short_name: "Duamimbar",
    description: "Laporan, proyek, dan jadwal Divisi Produksi Duamimbar.",
    start_url: "/studio",
    display: "standalone",
    background_color: "#F6F8FA",
    theme_color: "#1A2E95",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
