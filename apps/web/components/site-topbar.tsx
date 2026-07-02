import Link from "next/link";
import type { ReactNode } from "react";

type SiteTopbarProps = {
  end?: ReactNode;
  homeHref?: string;
  variant?: "default" | "landing" | "fixed";
};

export function SiteTopbar({ end, homeHref = "/", variant = "default" }: SiteTopbarProps) {
  const isFixed = variant === "landing" || variant === "fixed";

  return (
    <header className={isFixed ? "site-topbar site-topbar--fixed" : "site-topbar"}>
      <div className="site-topbar-inner">
        <Link className={isFixed ? "site-brand site-brand--landing" : "site-brand"} href={homeHref}>
          Tamsi
        </Link>
        {end ? <div className="site-topbar-end">{end}</div> : null}
      </div>
    </header>
  );
}
