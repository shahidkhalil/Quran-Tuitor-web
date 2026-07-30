import Link from "next/link";
import { AdminEnforcementForm } from "@/components/admin/admin-enforcement-form";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import {
  enforcementActionLabel,
  enforcementStatusLabel,
} from "@/domain/tutor-enforcement";
import { getTutorForAdminEnforcement } from "@/server/actions/admin-enforcement";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ applied?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Tutor ${id.slice(0, 8)}` };
}

export default async function AdminTutorEnforcementPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { applied } = await searchParams;
  const { tutor, events, error } = await getTutorForAdminEnforcement(id);

  if (!tutor) {
    if (error === "Admin only.") {
      return (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {error}
        </p>
      );
    }
    notFound();
  }

  return (
    <div className="space-y-6">
      <PanelPageHeader
        eyebrow="Tutor quality"
        title={tutor.headline ?? tutor.email ?? "Tutor"}
        description={`${tutor.email ?? tutor.tutorId} · ${enforcementStatusLabel(tutor.enforcement.enforcement_status)}`}
        actions={
          <Link href="/admin/tutors" className="btn-panel btn-panel-secondary">
            Back to tutors
          </Link>
        }
      />

      {applied ? (
        <p
          role="status"
          className="rounded-[var(--radius-lg)] border border-[var(--color-success)]/25 bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-success)]"
        >
          {enforcementActionLabel(
            applied as "warn" | "suspend" | "unlist" | "clear",
          )}{" "}
          applied. Action audited. Tutor notified.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <section className="surface-card space-y-3 p-5 md:p-6">
            <h2 className="display-title text-lg text-[var(--color-primary)]">
              Current state
            </h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--color-on-surface-muted)]">Status</dt>
                <dd className="font-semibold">
                  {enforcementStatusLabel(tutor.enforcement.enforcement_status)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-on-surface-muted)]">Listing</dt>
                <dd className="font-semibold">
                  {tutor.published ? "Published" : "Unpublished"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[var(--color-on-surface-muted)]">
                  Public message
                </dt>
                <dd className="font-semibold">
                  {tutor.enforcement.enforcement_public_message ?? "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[var(--color-on-surface-muted)]">
                  Internal reason (admin only)
                </dt>
                <dd className="font-semibold">
                  {tutor.enforcement.enforcement_internal_reason ?? "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="surface-card space-y-3 p-5 md:p-6">
            <h2 className="display-title text-lg text-[var(--color-primary)]">
              History
            </h2>
            {events.length === 0 ? (
              <p className="text-sm text-[var(--color-on-surface-muted)]">
                No enforcement events yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {events.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-[var(--radius-md)] border border-[var(--color-outline)] px-3 py-2 text-sm"
                  >
                    <p className="font-semibold">
                      {enforcementActionLabel(e.action)} →{" "}
                      {enforcementStatusLabel(e.status_after)}
                    </p>
                    <p className="mt-1 text-[var(--color-on-surface-muted)]">
                      {new Date(e.created_at).toLocaleString()}
                    </p>
                    <p className="mt-1">{e.internal_reason}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <AdminEnforcementForm
          tutorId={tutor.tutorId}
          currentStatus={tutor.enforcement.enforcement_status}
        />
      </div>
    </div>
  );
}
