"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import JadwalForm, { type ProyekOpsi } from "./JadwalForm";
import LaporanForm from "./LaporanForm";
import ProyekForm from "./ProyekForm";

/** Tombol pembuka form, supaya halaman server component bisa punya aksi tambah. */
export default function TombolTambah({
  jenis,
  label,
  proyek = [],
  bawaan,
  variant = "primary",
}: {
  jenis: "jadwal" | "laporan" | "proyek";
  label: string;
  proyek?: ProyekOpsi[];
  bawaan?: Record<string, string>;
  variant?: "primary" | "secondary";
}) {
  const [buka, setBuka] = useState(false);
  const tutup = () => setBuka(false);
  return (
    <>
      <Button variant={variant} onClick={() => setBuka(true)} className="flex items-center gap-1.5">
        <Plus size={16} /> {label}
      </Button>
      {buka && jenis === "jadwal" && <JadwalForm proyek={proyek} bawaan={bawaan} onClose={tutup} />}
      {buka && jenis === "laporan" && <LaporanForm proyek={proyek} bawaan={bawaan} onClose={tutup} />}
      {buka && jenis === "proyek" && <ProyekForm onClose={tutup} />}
    </>
  );
}
