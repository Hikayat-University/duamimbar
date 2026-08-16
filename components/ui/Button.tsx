import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-denim-700 text-white hover:bg-denim-500 disabled:opacity-50",
  secondary: "border border-denim-100 text-denim-900 hover:border-denim-300",
  danger: "text-red-600 hover:underline",
  ghost: "text-denim-700 hover:underline",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    variant === "danger" || variant === "ghost"
      ? "text-sm"
      : "text-sm py-2 px-3.5 rounded-lg transition-colors";
  return (
    <button className={`${base} ${VARIANT_CLASS[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
