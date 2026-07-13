export type Role = "director" | "social" | "editor" | "finance" | "business";

export type ProjectStatus = "Rencana" | "Berjalan" | "Selesai";

export interface Project {
  id: string;
  name: string;
  pic: string;
  status: ProjectStatus;
  eta: string;
  desc: string;
}

export interface Channel {
  id: string;
  name: string;
  followers: string;
  engagement: string;
  proyek: { sudah: number; sedang: number; akan: number };
}

export interface EditorProject {
  id: string;
  title: string;
  editor: string;
  deadline: string;
  status: "Draft" | "Revisi" | "Final";
  footageLink?: string;
}

export interface CashflowEntry {
  id: string;
  title: string;
  date: string;
  type: "in" | "out";
  amount: string;
}

export interface Debt {
  id: string;
  who: string;
  amount: string;
  due: string;
  status: "Lunas" | "Belum Lunas";
}

export interface BusinessUnit {
  id: string;
  name: string;
  desc: string;
}
