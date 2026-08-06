import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Duamimbar — Dashboard Tim",
    short_name: "Duamimbar",
    description: "Dashboard internal untuk memantau & evaluasi kerja tim.",
    start_url: "/home",
    display: "standalone",
    background_color: "#F6F8FA",
    theme_color: "#1A2E95",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
