import type { HTMLAttributes } from "react";
import { cn } from "@tamsi/ui";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("overflow-hidden rounded-[20px] border border-[#d7e2d4] bg-white shadow-[0_1px_0_rgba(11,31,18,.02)]", className)} {...props} />;
}
