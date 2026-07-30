import Link from "next/link";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { enforcementStatusLabel } from "@/domain/tutor-enforcement";
import { listTutorsForAdminEnforcement } from "@/server/actions/admin-enforcement";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tutors" };

function statusPill(status: string) {
  if (status === "clear") return "status-pill status-pill-success";
  if (status === "warned") return "status-pill status-pill-warning";
  if (status === "suspended") return "status-pill status-pill-error";
  return "status-pill status-pill-neutral";
}

export default async function AdminTutorsPage() {
  const { tutors, error } = await listTutorsForAdminEnforcement();

  return (
    <div>
      <PanelPageHeader
        eyebrow="Operations"
        title="Tutors"
        description="Warn, suspend, or unlist tutors for policy breaches. Suspended and unlisted tutors cannot take new bookings."
        actions={
          <span className="status-pill status-pill-neutral">
            {tutors.length} tutors
          </span>
        }
      />

      {error ? (
        <p role="alert" className="mb-6 text-sm text-[var(--color-error)]">
          {error}
        </p>
      ) : null}

      {tutors.length === 0 && !error ? (
        <div className="surface-card px-5 py-12 text-center">
          <p className="display-title text-xl text-[var(--color-primary)]">
            No verified tutors yet
          </p>
          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
            Approved tutors appear here after vetting.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden surface-card">
          <div className="hidden border-b border-[var(--color-outline)] bg-[var(--color-surface-muted)]/60 px-5 py-3 text-xs font-bold uppercase tracking-[0.06em] text-[var(--color-on-surface-muted)] md:grid md:grid-cols-[1.4fr_1fr_1fr_auto] md:gap-4">
            <span>Tutor</span>
            <span>Listing</span>
            <span>Status</span>
            <span className="text-right">Action</span>
          </div>
          <ul className="divide-y divide-[var(--color-outline)]">
            {tutors.map((t) => (
              <li
                key={t.tutorId}
                className="grid gap-3 px-5 py-4 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center md:gap-4"
              >
                <div>
                  <p className="font-semibold text-[var(--color-on-surface)]">
                    {t.email ?? t.tutorId.slice(0, 10)}
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--color-on-surface-muted)]">
                    {t.headline ?? "No listing headline"}
                  </p>
                </div>
                <p className="text-sm">
                  {t.published ? (
                    <span className="status-pill status-pill-success">Published</span>
                  ) : (
                    <span className="status-pill status-pill-neutral">Unpublished</span>
                  )}
                </p>
                <p>
                  <span
                    className={statusPill(t.enforcement.enforcement_status)}
                  >
                    {enforcementStatusLabel(t.enforcement.enforcement_status)}
                  </span>
                </p>
                <div className="md:text-right">
                  <Link
                    href={`/admin/tutors/${t.tutorId}`}
                    className="btn-panel btn-panel-secondary !min-h-9 !px-3 text-[11px]"
                  >
                    Enforce
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
