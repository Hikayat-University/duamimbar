import { ReactNode } from "react";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="app-frame">
      <TopBar />
      <main className="no-scrollbar flex-1 overflow-y-auto bg-white px-4 pb-8 pt-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
