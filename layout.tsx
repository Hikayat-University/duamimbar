import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { RoleProvider } from "@/components/RoleProvider";
import Shell from "@/components/Shell";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Dashboard Internal",
  description: "Dashboard pemantauan & evaluasi kerja tim.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${display.variable} ${body.variable} font-body text-ink`}>
        <RoleProvider>
          <Shell>{children}</Shell>
        </RoleProvider>
      </body>
    </html>
  );
}
