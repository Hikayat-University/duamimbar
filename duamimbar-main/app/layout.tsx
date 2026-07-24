import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Dashboard Tim — Duamimbar",
  description: "Dashboard internal untuk memantau & evaluasi kerja tim.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans bg-surface text-denim-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
