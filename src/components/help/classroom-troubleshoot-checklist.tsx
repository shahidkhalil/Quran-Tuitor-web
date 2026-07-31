"use client";

import Link from "next/link";
import { useState } from "react";
import type { TroubleshootStep } from "@/domain/classroom-troubleshooting";

type Props = {
  steps: TroubleshootStep[];
  title?: string;
  eyebrow?: string;
};

export function ClassroomTroubleshootChecklist({
  steps,
  title = "Classroom troubleshooting",
  eyebrow = "Tech support",
}: Props) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const completed = steps.filter((s) => done[s.id]).length;

  return (
    <section className="surface-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-[var(--color-accent)]">{eyebrow}</p>
          <h2 className="display-title mt-1 text-xl text-[var(--color-primary)]">
            {title}
          </h2>
          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
            Work through these before or during class. Tick items as you fix
            them.
          </p>
        </div>
        <p className="text-sm font-semibold text-[var(--color-primary)]">
          {completed}/{steps.length} done
        </p>
      </div>

      <ul className="mt-5 space-y-2">
        {steps.map((step) => {
          const checked = Boolean(done[step.id]);
          return (
            <li key={step.id}>
              <div
                className={`rounded-[var(--radius-md)] border px-3 py-3 ${
                  checked
                    ? "border-[var(--color-success)]/30 bg-[var(--color-accent-soft)]/40"
                    : "border-[var(--color-outline)] bg-[var(--color-surface-elevated)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setDone((prev) => ({ ...prev, [step.id]: !checked }))
                  }
                  className="flex w-full items-start gap-3 text-left"
                >
                  <span
                    aria-hidden
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                      checked
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                        : "border-[var(--color-outline-strong)] text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm font-semibold ${
                        checked
                          ? "text-[var(--color-on-surface-muted)] line-through"
                          : "text-[var(--color-on-surface)]"
                      }`}
                    >
                      {step.title}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-[var(--color-on-surface-muted)]">
                      {step.detail}
                    </span>
                  </span>
                  <span className="sr-only">
                    {checked ? "Mark as not done" : "Mark as done"}
                  </span>
                </button>
                {step.href && step.hrefLabel ? (
                  <div className="mt-2 pl-8">
                    <Link
                      href={step.href}
                      className="text-xs font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
                    >
                      {step.hrefLabel} →
                    </Link>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
