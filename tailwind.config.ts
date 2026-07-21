import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Denim blue — dikalibrasi persis dari warna logo Duamimbar (#1A2E95)
        denim: {
          50: "#F1F2F9",
          100: "#DDE0EF",
          300: "#98A1CF",
          500: "#4858AA", // primary interaktif
          700: "#1A2E95", // primary utama (header, tombol) — sama persis dengan logo
          900: "#13205F", // teks utama
        },
        // Aksen hangat — supaya tidak terasa robotic/kaku
        gold: {
          400: "#D9A566",
          500: "#C68F4A",
        },
        surface: "#F6F8FA",
        muted: "#6B7A8D",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        signature: "18px 18px 18px 4px", // sudut asimetris — elemen signature kartu
      },
    },
  },
  plugins: [],
};
export default config;
