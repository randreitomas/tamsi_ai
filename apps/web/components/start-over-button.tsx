"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { clearAllSessionData } from "../lib/tamsi-storage";

type StartOverButtonProps = {
  className?: string;
  label?: string;
};

export function StartOverButton({ className = "", label = "Start over" }: StartOverButtonProps) {
  const router = useRouter();

  return (
    <button
      className={`inline-flex items-center gap-2 text-sm font-bold text-[#5c6b5e] transition hover:text-[#0a4d21] ${className}`}
      onClick={() => {
        clearAllSessionData();
        router.push("/upload");
      }}
      type="button"
    >
      <RotateCcw aria-hidden="true" size={16} />
      {label}
    </button>
  );
}
