import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "@tamsi/ui";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  href?: string;
};

type ExternalButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant;
};

export function buttonClassName(variant: ButtonVariant = "primary", className?: string) {
  return cn(
    "btn",
    variant === "primary" && "btn-primary",
    variant === "secondary" && "btn-secondary",
    variant === "ghost" && "btn-ghost",
    className
  );
}

export function Button({ className, variant = "primary", children, href, ...props }: ButtonProps) {
  const classes = buttonClassName(variant, className);

  if (href) {
    return (
      <Link className={classes} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} type="button" {...props}>
      {children}
    </button>
  );
}

export function ExternalButtonLink({ className, variant = "primary", children, ...props }: ExternalButtonLinkProps) {
  return (
    <a className={buttonClassName(variant, className)} {...props}>
      {children}
    </a>
  );
}
