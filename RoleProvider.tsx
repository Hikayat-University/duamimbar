"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Role } from "@/lib/types";

interface RoleContextValue {
  role: Role;
  setRole: (r: Role) => void;
  editorView: "anggota" | "kepala";
  setEditorView: (v: "anggota" | "kepala") => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("director");
  const [editorView, setEditorView] = useState<"anggota" | "kepala">("anggota");

  return (
    <RoleContext.Provider value={{ role, setRole, editorView, setEditorView }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole harus dipakai di dalam RoleProvider");
  return ctx;
}
