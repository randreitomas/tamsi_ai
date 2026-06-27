import type { ButtonHTMLAttributes } from "react";
import { cn } from "@tamsi/ui";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] px-5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-[#0e6b2e] text-white shadow-[0_4px_12px_rgba(14,107,46,.25)] hover:bg-[#0a4d21]",
        variant === "secondary" && "border border-[#d7e2d4] bg-white text-[#0a4d21] hover:border-[#b9cdb3] hover:bg-[#f6faf4]",
        variant === "ghost" && "text-[#0b1f12] hover:bg-[#f6faf4]",
        className
      )}
      {...props}
    />
  );
}
