import Link from "next/link";
import {
  supportCaseStatusLabel,
  supportCategoryLabel,
  type SupportCase,
} from "@/domain/support-cases";

type Item = SupportCase & { bookingLabel: string };

type Props = {
  cases: Item[];
  newHref: string;
};

function statusPill(status: SupportCase["status"]) {
  if (status === "open") return "status-pill status-pill-warning";
  if (status === "in_progress") return "status-pill status-pill-accent";
  if (status === "resolved") return "status-pill status-pill-success";
  return "status-pill status-pill-neutral";
}

export function SupportCaseList({ cases, newHref }: Props) {
  if (cases.length === 0) {
    return (
      <div className="surface-card px-5 py-14 text-center">
        <p className="eyebrow text-[var(--color-accent)]">Support</p>
        <p className="display-title mt-2 text-2xl text-[var(--color-primary)]">
          No open cases yet
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-on-surface-muted)]">
          If a lesson or payout goes wrong, open a case here. We handle it
          in-platform — you never need to chase anyone elsewhere.
        </p>
        <Link href={newHref} className="btn-panel btn-panel-primary mt-6">
          Open a support case
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {cases.map((item) => (
        <li key={item.id} className="surface-card p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className={statusPill(item.status)}>
                  {supportCaseStatusLabel(item.status)}
                </span>
                <span className="status-pill status-pill-neutral">
                  {supportCategoryLabel(item.category)}
                </span>
              </div>
              <h2 className="display-title mt-3 text-xl text-[var(--color-primary)]">
                {item.bookingLabel}
              </h2>
              <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                Opened {new Date(item.created_at).toLocaleString()}
              </p>
              <p className="mt-3 text-sm text-[var(--color-on-surface)]">
                {item.description}
              </p>
              {item.outcome_note ? (
                <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm">
                  <p className="font-semibold text-[var(--color-on-surface)]">
                    Support update
                  </p>
                  <p className="mt-1 text-[var(--color-on-surface-muted)]">
                    {item.outcome_note}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
