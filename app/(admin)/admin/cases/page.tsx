import Link from "next/link";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import {
  supportCaseStatusLabel,
  supportCategoryLabel,
} from "@/domain/support-cases";
import { listSupportCasesForAdmin } from "@/server/actions/admin-support-cases";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Support cases" };

type Props = {
  searchParams: Promise<{ status?: string }>;
};

function statusPill(status: string) {
  if (status === "open") return "status-pill status-pill-warning";
  if (status === "in_progress") return "status-pill status-pill-accent";
  if (status === "resolved") return "status-pill status-pill-success";
  return "status-pill status-pill-neutral";
}

export default async function AdminCasesPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const filter =
    status === "all" ||
    status === "open" ||
    status === "in_progress" ||
    status === "resolved" ||
    status === "closed"
      ? status
      : "active";

  const { cases, error } = await listSupportCasesForAdmin({ status: filter });

  return (
    <div>
      <PanelPageHeader
        eyebrow="Operations"
        title="Support cases"
        description="Review parent and tutor cases with booking and message context. Resolve inside SLA."
        actions={
          <span className="status-pill status-pill-warning">
            {cases.length} shown
          </span>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ["active", "Active"],
            ["open", "Open"],
            ["in_progress", "In progress"],
            ["resolved", "Resolved"],
            ["closed", "Closed"],
            ["all", "All"],
          ] as const
        ).map(([value, label]) => (
          <Link
            key={value}
            href={value === "active" ? "/admin/cases" : `/admin/cases?status=${value}`}
            className={
              filter === value
                ? "btn-panel btn-panel-primary !min-h-9 !px-3 text-[11px]"
                : "btn-panel btn-panel-secondary !min-h-9 !px-3 text-[11px]"
            }
          >
            {label}
          </Link>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mb-6 text-sm text-[var(--color-error)]">
          {error}
        </p>
      ) : null}

      {cases.length === 0 && !error ? (
        <div className="surface-card px-5 py-12 text-center">
          <p className="display-title text-xl text-[var(--color-primary)]">
            No cases in this filter
          </p>
          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
            When parents or tutors open Support, cases appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden surface-card">
          <div className="hidden border-b border-[var(--color-outline)] bg-[var(--color-surface-muted)]/60 px-5 py-3 text-xs font-bold uppercase tracking-[0.06em] text-[var(--color-on-surface-muted)] md:grid md:grid-cols-[1.2fr_1fr_1fr_auto] md:gap-4">
            <span>Case</span>
            <span>Reporter</span>
            <span>Opened</span>
            <span className="text-right">Action</span>
          </div>
          <ul className="divide-y divide-[var(--color-outline)]">
            {cases.map((item) => (
              <li
                key={item.id}
                className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center md:gap-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={statusPill(item.status)}>
                      {supportCaseStatusLabel(item.status)}
                    </span>
                    <span className="status-pill status-pill-neutral">
                      {supportCategoryLabel(item.category)}
                    </span>
                  </div>
                  <p className="mt-2 font-semibold text-[var(--color-on-surface)]">
                    {item.bookingLabel}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--color-on-surface-muted)]">
                    {item.description}
                  </p>
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-[var(--color-on-surface)]">
                    {item.reporterEmail ?? item.reporter_id.slice(0, 8)}
                  </p>
                  <p className="text-[var(--color-on-surface-muted)]">
                    {item.reporter_role} · parent {item.parentEmail ?? "—"}
                  </p>
                </div>
                <p className="text-sm text-[var(--color-on-surface-muted)]">
                  {new Date(item.created_at).toLocaleString()}
                </p>
                <div className="md:text-right">
                  <Link
                    href={`/admin/cases/${item.id}`}
                    className="btn-panel btn-panel-secondary !min-h-9 !px-3 text-[11px]"
                  >
                    Open
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
