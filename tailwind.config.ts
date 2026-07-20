import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Denim blue — warna dominan brand
        denim: {
          50: "#EEF3F8",
          100: "#D6E2EE",
          300: "#9AB6D2",
          500: "#4A6C94", // primary interaktif
          700: "#2C4A6E", // primary utama (header, tombol)
          900: "#1A2634", // teks utama
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
