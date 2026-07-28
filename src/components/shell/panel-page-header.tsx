import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PanelPageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 max-w-2xl">
        {eyebrow ? (
          <p className="eyebrow text-[var(--color-accent)]">{eyebrow}</p>
        ) : null}
        <h1 className="display-title mt-1 text-3xl text-[var(--color-on-background)] md:text-[2.15rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-base text-[var(--color-on-surface-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
