import { ReactNode } from "react";

export default function Card({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const interactive = Boolean(onClick);
  return (
    <div
      onClick={onClick}
      className={`rounded-card border border-border border-l-4 border-l-denim-soft bg-white p-4 shadow-card transition-transform ${
        interactive ? "cursor-pointer active:scale-[0.98]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
