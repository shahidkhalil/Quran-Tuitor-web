import { ApplicationStatusTimeline } from "@/components/tutors/application-status-timeline";
import { NeedsInfoResponseForm } from "@/components/tutors/needs-info-response-form";
import { TutorApplicationForm } from "@/components/tutors/tutor-application-form";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import {
  getMyApplication,
  getMyApplicationEvents,
} from "@/server/actions/tutor-applications";
import { getCurrentProfile } from "@/server/services/profile";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Tutor application" };

type Props = {
  searchParams: Promise<{ submitted?: string; responded?: string }>;
};

export default async function TutorApplicationPage({ searchParams }: Props) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/sign-in?next=/tutor/application");
  }
  if (profile.role !== "tutor_applicant" && profile.role !== "tutor") {
    redirect("/teach");
  }

  const { submitted, responded } = await searchParams;
  const { application, error } = await getMyApplication();

  if (application) {
    const { events } = await getMyApplicationEvents(application.id);

    return (
      <div className="mx-auto max-w-3xl">
        <PanelPageHeader
          eyebrow="Onboarding"
          title="Application status"
          description={
            submitted
              ? `Thanks, ${application.full_name}. We’ve received your application.`
              : responded
                ? "Response sent. Your application is back in the review queue."
                : "Track review progress and respond if we ask for more information."
          }
          actions={
            application.status === "approved" ? (
              <Link href="/tutor/listing" className="btn-panel btn-panel-primary">
                Complete listing
              </Link>
            ) : (
              <Link href="/tutor/account" className="btn-panel btn-panel-secondary">
                Account
              </Link>
            )
          }
        />

        {(submitted || responded) && (
          <p
            role="status"
            className="mb-5 rounded-[var(--radius-lg)] border border-[var(--color-success)]/25 bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-success)]"
          >
            {submitted
              ? "Application submitted — we’ll notify you as review progresses."
              : "Response received — back in the review queue."}
          </p>
        )}

        <ApplicationStatusTimeline
          application={application}
          events={events}
        />

        {application.status === "needs_info" ? (
          <div className="mt-6 rounded-[var(--radius-xl)] border border-[var(--color-warning)]/30 bg-[var(--color-surface-elevated)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
            <NeedsInfoResponseForm />
          </div>
        ) : null}

        {application.status === "approved" ? (
          <div className="mt-6 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-success)]/25 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-success)_8%,white),color-mix(in_srgb,var(--color-accent)_10%,white))] p-5 sm:p-6">
            <p className="eyebrow text-[var(--color-accent)]">Next step</p>
            <p className="display-title mt-1 text-2xl text-[var(--color-primary)]">
              You’re approved
            </p>
            <p className="mt-2 max-w-lg text-sm text-[var(--color-on-surface-muted)]">
              Complete your public listing so parents can find you on Browse.
            </p>
            <Link href="/tutor/listing" className="btn-panel btn-panel-primary mt-4">
              Open listing editor
            </Link>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PanelPageHeader
        eyebrow="Onboarding"
        title="Tutor application"
        description={
          profile.email
            ? `Applying under ${profile.email}. Share credentials, child-teaching experience, and an optional intro.`
            : "Share credentials, child-teaching experience, and an optional intro. Our team reviews every application before listing."
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { t: "Verify", d: "Credentials reviewed by our team" },
          { t: "Safeguard", d: "Child-teaching experience required" },
          { t: "List", d: "Publish after approval" },
        ].map((item) => (
          <div
            key={item.t}
            className="rounded-[var(--radius-lg)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-4 py-3"
          >
            <p className="text-sm font-semibold text-[var(--color-primary)]">
              {item.t}
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-on-surface-muted)]">
              {item.d}
            </p>
          </div>
        ))}
      </div>

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-[color-mix(in_srgb,var(--color-error)_8%,white)] px-3 py-2 text-sm text-[var(--color-error)]"
        >
          {error}
        </p>
      ) : null}

      <div className="rounded-[var(--radius-xl)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] p-5 shadow-[var(--shadow-md)] sm:p-7">
        <TutorApplicationForm />
      </div>
    </div>
  );
}
