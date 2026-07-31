import Link from "next/link";
import type { ParentNextStep } from "@/domain/dashboard-home";

export function NextStepBanner({ step }: { step: ParentNextStep }) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--color-primary)]/20 bg-[var(--color-accent-soft)]/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="eyebrow text-[var(--color-accent)]">Next step</p>
        <p className="display-title mt-1 text-xl text-[var(--color-primary)]">
          {step.title}
        </p>
        <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
          {step.body}
        </p>
      </div>
      <Link href={step.href} className="btn-panel btn-panel-primary shrink-0">
        {step.cta}
      </Link>
    </div>
  );
}

export type DashboardBanner = {
  tone: "warning" | "success" | "info";
  title: string;
  body: string;
  href?: string;
  cta?: string;
};

export function DashboardBanners({ banners }: { banners: DashboardBanner[] }) {
  if (banners.length === 0) return null;
  return (
    <div className="mb-6 space-y-3">
      {banners.map((b) => {
        const border =
          b.tone === "warning"
            ? "border-[var(--color-error)]/30 bg-[var(--color-error)]/5"
            : b.tone === "success"
              ? "border-[var(--color-success)]/25 bg-[var(--color-accent-soft)]/50"
              : "border-[var(--color-outline)] bg-[var(--color-surface-elevated)]";
        return (
          <div
            key={b.title}
            role="status"
            className={`flex flex-col gap-3 rounded-[var(--radius-lg)] border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${border}`}
          >
            <div>
              <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                {b.title}
              </p>
              <p className="mt-0.5 text-sm text-[var(--color-on-surface-muted)]">
                {b.body}
              </p>
            </div>
            {b.href && b.cta ? (
              <Link
                href={b.href}
                className="btn-panel btn-panel-secondary shrink-0 !min-h-9"
              >
                {b.cta}
              </Link>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
