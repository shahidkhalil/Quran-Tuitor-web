import Link from "next/link";
import { AdminCaseUpdateForm } from "@/components/admin/admin-case-update-form";
import { AdminRematchForm } from "@/components/admin/admin-rematch-form";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import {
  supportCaseStatusLabel,
  supportCategoryLabel,
} from "@/domain/support-cases";
import { getSupportCaseForAdmin } from "@/server/actions/admin-support-cases";
import { getRematchContextForCase } from "@/server/actions/admin-rematch";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; rematched?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Case ${id.slice(0, 8)}` };
}

export default async function AdminCaseDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { saved, rematched } = await searchParams;
  const [{ detail, error }, rematchResult] = await Promise.all([
    getSupportCaseForAdmin(id),
    getRematchContextForCase(id),
  ]);

  if (!detail) {
    if (error === "Admin only.") {
      return (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {error}
        </p>
      );
    }
    notFound();
  }

  const { case: caseRow, messages } = detail;

  return (
    <div className="space-y-6">
      <PanelPageHeader
        eyebrow="Support case"
        title={detail.bookingLabel}
        description={`${supportCategoryLabel(caseRow.category)} · ${supportCaseStatusLabel(caseRow.status)}`}
        actions={
          <Link href="/admin/cases" className="btn-panel btn-panel-secondary">
            Back to queue
          </Link>
        }
      />

      {saved ? (
        <p
          role="status"
          className="rounded-[var(--radius-lg)] border border-[var(--color-success)]/25 bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-success)]"
        >
          Case updated. Reporter has been notified.
        </p>
      ) : null}

      {rematched ? (
        <p
          role="status"
          className="rounded-[var(--radius-lg)] border border-[var(--color-success)]/25 bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-success)]"
        >
          Free rematch completed ($0). Unused prepaid lessons transferred where
          applicable. Parent and new tutor notified.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <section className="surface-card space-y-3 p-5 md:p-6">
            <h2 className="display-title text-lg text-[var(--color-primary)]">
              Parties & booking
            </h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--color-on-surface-muted)]">Reporter</dt>
                <dd className="font-semibold text-[var(--color-on-surface)]">
                  {caseRow.reporter_role}
                  {detail.parentEmail && caseRow.reporter_id === caseRow.parent_id
                    ? ` · ${detail.parentEmail}`
                    : detail.tutorEmail && caseRow.reporter_id === caseRow.tutor_id
                      ? ` · ${detail.tutorEmail}`
                      : ""}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-on-surface-muted)]">Parent</dt>
                <dd className="font-semibold">{detail.parentEmail ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-on-surface-muted)]">Tutor</dt>
                <dd className="font-semibold">{detail.tutorEmail ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-on-surface-muted)]">Learner</dt>
                <dd className="font-semibold">{detail.learnerLabel ?? "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[var(--color-on-surface-muted)]">Listing</dt>
                <dd className="font-semibold">{detail.listingHeadline ?? "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[var(--color-on-surface-muted)]">Booking</dt>
                <dd className="font-semibold">{detail.bookingSummary}</dd>
              </div>
              {detail.attendanceLabel ? (
                <div>
                  <dt className="text-[var(--color-on-surface-muted)]">
                    Attendance
                  </dt>
                  <dd className="font-semibold">{detail.attendanceLabel}</dd>
                </div>
              ) : null}
              {caseRow.rematch_id ? (
                <div className="sm:col-span-2">
                  <dt className="text-[var(--color-on-surface-muted)]">Rematch</dt>
                  <dd className="font-semibold text-[var(--color-success)]">
                    Free rematch recorded · {caseRow.rematch_at
                      ? new Date(caseRow.rematch_at).toLocaleString()
                      : "done"}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="surface-card space-y-3 p-5 md:p-6">
            <h2 className="display-title text-lg text-[var(--color-primary)]">
              Reporter description
            </h2>
            <p className="whitespace-pre-wrap text-sm text-[var(--color-on-surface)]">
              {caseRow.description}
            </p>
            {caseRow.outcome_note ? (
              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm">
                <p className="font-semibold">Current outcome note</p>
                <p className="mt-1 text-[var(--color-on-surface-muted)]">
                  {caseRow.outcome_note}
                </p>
              </div>
            ) : null}
          </section>

          <section className="surface-card space-y-3 p-5 md:p-6">
            <h2 className="display-title text-lg text-[var(--color-primary)]">
              Parent-visible thread
            </h2>
            {!detail.threadId ? (
              <p className="text-sm text-[var(--color-on-surface-muted)]">
                No message thread yet for this parent–tutor–learner relationship.
              </p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-[var(--color-on-surface-muted)]">
                Thread exists but has no messages yet.
              </p>
            ) : (
              <ul className="max-h-80 space-y-3 overflow-y-auto">
                {messages.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-[var(--radius-md)] border border-[var(--color-outline)] px-3 py-2 text-sm"
                  >
                    <p className="text-xs font-semibold text-[var(--color-on-surface-muted)]">
                      {m.sender_role} · {new Date(m.created_at).toLocaleString()}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-[var(--color-on-surface)]">
                      {m.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <AdminCaseUpdateForm
            caseId={caseRow.id}
            status={caseRow.status}
            adminInternalNotes={caseRow.admin_internal_notes}
            outcomeNote={caseRow.outcome_note}
          />
          {rematchResult.context ? (
            <AdminRematchForm
              caseId={caseRow.id}
              context={rematchResult.context}
            />
          ) : rematchResult.error ? (
            <p className="text-sm text-[var(--color-error)]" role="alert">
              {rematchResult.error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
