import type { HTMLAttributes } from "react";
import { cn } from "@tamsi/ui";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("app-card", className)} {...props} />;
}
