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
  /** Optional count badge (e.g. message threads) — additive only */
  badge?: number;
};

export function PanelNavLink({
  href,
  label,
  exact = false,
  icon,
  variant = "top",
  badge,
}: Props) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  const badgeEl =
    badge != null && badge > 0 ? (
      <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-on-accent)]">
        {badge > 9 ? "9+" : badge}
      </span>
    ) : null;

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
        <span className="flex-1">{label}</span>
        {badgeEl}
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
        <span className="flex-1">{label}</span>
        {badge != null && badge > 0 ? (
          <span
            className={cn(
              "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
              active
                ? "bg-white/20 text-white"
                : "bg-[var(--color-accent)] text-[var(--color-on-accent)]",
            )}
          >
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition",
        active
          ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[var(--shadow-sm)]"
          : "text-[var(--color-on-surface-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-primary)]",
      )}
    >
      {label}
      {badge != null && badge > 0 ? (
        <span
          className={cn(
            "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
            active
              ? "bg-white/20 text-white"
              : "bg-[var(--color-accent)] text-[var(--color-on-accent)]",
          )}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </Link>
  );
}
