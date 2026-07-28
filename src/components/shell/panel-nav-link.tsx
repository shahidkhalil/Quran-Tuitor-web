"use client";

import { cn } from "@/lib/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  href: string;
  label: string;
  exact?: boolean;
  icon?: ReactNode;
  variant?: "top" | "side" | "side-light";
};

export function PanelNavLink({
  href,
  label,
  exact = false,
  icon,
  variant = "top",
}: Props) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  if (variant === "side") {
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-semibold transition",
          active
            ? "bg-white/15 text-white shadow-[var(--shadow-xs)]"
            : "text-white/70 hover:bg-white/10 hover:text-white",
        )}
      >
        {icon ? <span className="opacity-90">{icon}</span> : null}
        {label}
      </Link>
    );
  }

  if (variant === "side-light") {
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-semibold transition",
          active
            ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[var(--shadow-sm)]"
            : "text-[var(--color-on-surface-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-primary)]",
        )}
      >
        {icon ? <span className="opacity-90">{icon}</span> : null}
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3.5 py-2 text-sm font-semibold transition",
        active
          ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[var(--shadow-sm)]"
          : "text-[var(--color-on-surface-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-primary)]",
      )}
    >
      {label}
    </Link>
  );
}
