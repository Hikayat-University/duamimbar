"use client";

/**
 * HeroHome — hero full-bleed buat /home, dengan parallax scroll.
 *
 * GANTI FOTO: cari konstanta HERO_IMAGE_URL di bawah, ganti ke path foto
 * asli (taruh file-nya di /public, misal /public/hero-duamimbar.jpg, lalu
 * isi HERO_IMAGE_URL = "/hero-duamimbar.jpg"). Sekarang masih placeholder
 * gradient supaya section ini tetap tampil bagus sebelum fotonya ada.
 *
 * Parallax: teks headline bergerak LEBIH LAMBAT daripada gambar background
 * saat di-scroll (bukan kebalikannya) — sesuai request. Dikontrol via
 * framer-motion useScroll, jalan sama di touch (iPad) maupun desktop
 * karena berbasis posisi scroll, bukan hover/mouse-only.
 */

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const HERO_IMAGE_URL = ""; // TODO: isi path foto asli di sini

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
    <section ref={ref} className="px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="relative h-[78vh] min-h-[520px] overflow-hidden rounded-mega bg-denim-900">
        {/* Background — foto atau fallback gradient, digerakkan parallax */}
        <motion.div style={{ y: imageY }} className="absolute inset-0 h-[135%]">
          {HERO_IMAGE_URL ? (
            <img
              src={HERO_IMAGE_URL}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-denim-500 via-denim-700 to-denim-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-denim-900/70 via-denim-900/10 to-denim-900/30" />
        </motion.div>

        {/* Headline — digerakkan parallax lebih lambat, fade pas discroll */}
        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="relative flex h-full flex-col items-center justify-center px-5 text-center"
        >
          <h1 className="font-display text-6xl text-white sm:text-7xl">Duamimbar</h1>
          <p className="mt-4 font-sans text-sm text-white/70 sm:text-base">
            Built with heart, mind, body, and soul.
          </p>
        </motion.div>

        {/* Scroll cue — blur di bawah + label, ngasih cue buat scroll */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-denim-900/80 to-transparent backdrop-blur-[2px]" />
        <div className="absolute inset-x-0 bottom-5 flex justify-center">
          <span className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/80">
            Scroll ↓
          </span>
        </div>
      </div>
    </section>
  );
}
