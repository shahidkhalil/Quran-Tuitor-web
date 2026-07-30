import Link from "next/link";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { getAdminOpsSummary } from "@/server/actions/admin-ops";
import { listPendingApplicationsForAdmin } from "@/server/actions/tutor-applications";
import { statusLabel } from "@/domain/tutor-applications";

export const metadata = { title: "Admin" };

type Props = {
  searchParams: Promise<{ decided?: string }>;
};

const opsLinks = [
  {
    href: "/admin",
    title: "Vetting queue",
    body: "Approve, reject, or request info on applications",
  },
  {
    href: "/admin/cases",
    title: "Support cases",
    body: "Resolve disputes and run free rematch",
  },
  {
    href: "/admin/tutors",
    title: "Tutors / suspensions",
    body: "Warn, suspend, or unlist for policy breaches",
  },
  {
    href: "/admin/reviews",
    title: "Review moderation",
    body: "Hide abusive reviews from public listings",
  },
  {
    href: "/admin/bookings",
    title: "Bookings",
    body: "Overview of trials and paid lessons",
  },
  {
    href: "/admin/listings",
    title: "Listings",
    body: "All published and draft tutor listings",
  },
  {
    href: "/admin/ledger",
    title: "Ledger & payouts",
    body: "Adjustments and payout resolutions",
  },
  {
    href: "/admin/settings",
    title: "Commission settings",
    body: "Platform take rate (audited)",
  },
] as const;

export default async function AdminHomePage({ searchParams }: Props) {
  const { decided } = await searchParams;
  const [{ applications, error }, summary] = await Promise.all([
    listPendingApplicationsForAdmin(),
    getAdminOpsSummary(),
  ]);

  return (
    <>
      <PanelPageHeader
        eyebrow="Operations"
        title="Admin console"
        description="Managed marketplace day-to-day: vetting, bookings, listings, cases, suspensions, and commission."
      />

      {decided ? (
        <p className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-success)]/25 bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-success)]">
          Decision saved. Applicant has been notified.
        </p>
      ) : null}

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending apps" value={summary.pendingApplications} />
        <StatCard label="Open cases" value={summary.openCases} />
        <StatCard label="Published listings" value={summary.publishedListings} />
        <StatCard label="Upcoming lessons" value={summary.upcomingLessons} />
      </div>

      <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {opsLinks.map((link) => (
          <Link
            key={link.href + link.title}
            href={link.href}
            className="surface-card-interactive block p-5"
          >
            <p className="font-semibold text-[var(--color-primary)]">{link.title}</p>
            <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
              {link.body}
            </p>
          </Link>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="display-title text-xl text-[var(--color-primary)]">
          Vetting queue
        </h2>
        <span className="status-pill status-pill-warning">
          {applications.length} pending
        </span>
      </div>

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
                </div>
                <p className="text-sm text-[var(--color-on-surface-muted)]">
                  {app.country || "—"}
                </p>
                <p className="text-sm text-[var(--color-on-surface-muted)]">
                  {new Date(app.submitted_at || app.created_at).toLocaleDateString()}
                </p>
                <div className="md:text-right">
                  <Link
                    href={`/admin/vetting/${app.id}`}
                    className="btn-panel btn-panel-secondary !min-h-9 !px-3 text-[11px]"
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-card px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-on-surface-muted)]">
        {label}
      </p>
      <p className="display-title mt-1 text-2xl text-[var(--color-primary)]">
        {value}
      </p>
    </div>
  );
}
