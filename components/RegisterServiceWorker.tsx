"use client";

import { useEffect } from "react";

/**
 * Daftarin Service Worker (public/sw.js) sekali pas app dibuka pertama kali
 * selagi online -- ini yang bikin browser bisa nyimpen halaman
 * public/offline.html duluan, jadi begitu internet mati dan orang coba
 * buka/refresh halaman apapun di app ini, yang muncul game Pocong Run,
 * bukan halaman error bawaan browser.
 */
export default function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Gagal daftarin service worker:", err);
      });
    }
  }, []);

  return null;
}
