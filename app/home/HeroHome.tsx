"use client";

/**
 * HeroHome — hero full-screen (edge-to-edge, tanpa frame/margin) buat
 * /home, dengan parallax scroll. Fotonya di /public/hero-duamimbar.jpg —
 * ganti file itu langsung kalau mau ganti foto, nggak perlu ubah kode ini.
 *
 * Parallax: teks headline bergerak LEBIH LAMBAT daripada gambar background
 * saat di-scroll. Dikontrol via framer-motion useScroll, jalan sama di
 * touch (iPad) maupun desktop karena berbasis posisi scroll dokumen.
 */

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const HERO_IMAGE_URL = "/hero-duamimbar.jpg";

export default function HeroHome() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Gambar bergerak lebih jauh (lebih cepat) dari teks — rasio ~3:1
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative h-screen w-full overflow-hidden bg-denim-900">
      {/* Background foto — full-bleed, digerakkan parallax */}
      <motion.div style={{ y: imageY }} className="absolute inset-0 h-[135%] w-full">
        <img src={HERO_IMAGE_URL} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-denim-900/75 via-denim-900/15 to-denim-900/35" />
      </motion.div>

      {/* Headline — parallax lebih lambat, fade pas discroll */}
      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="relative flex h-full flex-col items-center justify-center px-5 text-center"
      >
        <h1 className="font-display text-6xl text-white sm:text-8xl">Duamimbar</h1>
        <p className="mt-4 font-sans text-sm text-white/70 sm:text-base">
          Built with heart, mind, body, and soul.
        </p>
      </motion.div>

      {/* Scroll cue — blur di bawah + label */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-denim-900/85 to-transparent backdrop-blur-[2px]" />
      <div className="absolute inset-x-0 bottom-6 flex justify-center">
        <span className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/80">
          Scroll ↓
        </span>
      </div>
    </section>
  );
}
