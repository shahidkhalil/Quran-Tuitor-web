import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { statusLabel } from "@/domain/tutor-applications";
import { listPendingApplicationsForAdmin } from "@/server/actions/tutor-applications";
import Link from "next/link";

export const metadata = { title: "Admin" };

type Props = {
  searchParams: Promise<{ decided?: string }>;
};

export default async function AdminHomePage({ searchParams }: Props) {
  const { decided } = await searchParams;
  const { applications, error } = await listPendingApplicationsForAdmin();

  return (
    <>
      <PanelPageHeader
        eyebrow="Operations"
        title="Vetting queue"
        description="Review pending tutor applications. Approve, reject, or request more information."
        actions={
          <span className="status-pill status-pill-warning">
            {applications.length} pending
          </span>
        }
      />

      {decided ? (
        <p className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-success)]/25 bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-success)]">
          Decision saved. Applicant has been notified.
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mb-6 rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-[color-mix(in_srgb,var(--color-error)_8%,white)] px-3 py-2 text-sm text-[var(--color-error)]"
        >
          {error}
        </p>
      ) : null}

      {applications.length === 0 && !error ? (
        <div className="surface-card px-5 py-12 text-center">
          <p className="display-title text-xl text-[var(--color-primary)]">
            Queue clear
          </p>
          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
            No pending applications right now.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden surface-card">
          <div className="hidden border-b border-[var(--color-outline)] bg-[var(--color-surface-muted)]/60 px-5 py-3 text-xs font-bold uppercase tracking-[0.06em] text-[var(--color-on-surface-muted)] md:grid md:grid-cols-[1.4fr_1fr_1fr_auto] md:gap-4">
            <span>Applicant</span>
            <span>Location</span>
            <span>Submitted</span>
            <span className="text-right">Action</span>
          </div>
          <ul className="divide-y divide-[var(--color-outline)]">
            {applications.map((app) => (
              <li
                key={app.id}
                className="grid gap-3 px-5 py-4 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center md:gap-4"
              >
                <div>
                  <p className="font-semibold text-[var(--color-on-surface)]">
                    {app.full_name}
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--color-on-surface-muted)]">
                    <span className="status-pill status-pill-warning mr-2">
                      {statusLabel(app.status)}
                    </span>
                    {app.languages}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--color-on-surface)] md:hidden">
                    {app.credentials_summary}
                  </p>
                </div>
                <p className="text-sm text-[var(--color-on-surface-muted)]">
                  {app.country}
                </p>
                <p className="text-sm text-[var(--color-on-surface-muted)]">
                  {new Date(app.submitted_at).toLocaleString()}
                </p>
                <div className="md:text-right">
                  <Link
                    href={`/admin/vetting/${app.id}`}
                    className="btn-panel btn-panel-primary !min-h-10"
                  >
                    Review
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
