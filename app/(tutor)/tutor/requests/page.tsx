import { PanelPageHeader } from "@/components/shell/panel-page-header";
import {
  TutorTrialRequestCard,
  TutorTrialRequestsEmpty,
} from "@/components/trials/tutor-trial-request-card";
import { COLLECTIONS, db } from "@/lib/firebase/db";
import { listTutorTrialBookings } from "@/server/actions/trials";
import { getCurrentProfile } from "@/server/services/profile";
import { redirect } from "next/navigation";
import type { LearnerProfile } from "@/domain/learners";

export const metadata = { title: "Trial requests" };

type Props = {
  searchParams: Promise<{
    accepted?: string;
    declined?: string;
    summarised?: string;
    error?: string;
  }>;
};

async function learnerNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, string>();
  await Promise.all(
    unique.map(async (id) => {
      const snap = await db().collection(COLLECTIONS.learnerProfiles).doc(id).get();
      if (snap.exists) {
        map.set(id, (snap.data() as LearnerProfile).display_name);
      } else {
        map.set(id, "Learner");
      }
    }),
  );
  return map;
}

export default async function TutorRequestsPage({ searchParams }: Props) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in?next=/tutor/requests");
  if (profile.role !== "tutor") redirect("/tutor");

  const params = await searchParams;
  const { bookings, error } = await listTutorTrialBookings();
  const names = await learnerNames(bookings.map((b) => b.learner_id));

  const pending = bookings.filter((b) => b.status === "pending_tutor");
  const others = bookings.filter((b) => b.status !== "pending_tutor");

  return (
    <>
      <PanelPageHeader
        eyebrow="Pipeline"
        title="Trial requests"
        description="Accept within 24 hours to confirm the slot and share a join link. Decline frees the slot for the parent."
      />

      {params.accepted ? (
        <p
          role="status"
          className="mb-4 rounded-[var(--radius-lg)] border border-[var(--color-success)]/30 bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-success)]"
        >
          Trial accepted. A join link is ready for you and the parent.
        </p>
      ) : null}
      {params.declined ? (
        <p
          role="status"
          className="mb-4 rounded-[var(--radius-lg)] border border-[var(--color-outline)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm"
        >
          Trial declined. The slot is free again.
        </p>
      ) : null}
      {params.summarised ? (
        <p
          role="status"
          className="mb-4 rounded-[var(--radius-lg)] border border-[var(--color-success)]/30 bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-success)]"
        >
          Summary submitted. The parent can view it on Bookings, and your trial
          stipend appears under Earnings when policy amount is greater than $0.
        </p>
      ) : null}
      {params.error ? (
        <p role="alert" className="mb-4 text-sm text-[var(--color-error)]">
          That request can’t be updated (it may already be closed or timed out).
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mb-4 text-sm text-[var(--color-error)]">
          {error}
        </p>
      ) : null}

      {bookings.length === 0 ? (
        <TutorTrialRequestsEmpty />
      ) : (
        <div className="space-y-10">
          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="display-title text-lg text-[var(--color-on-background)]">
                Needs response
              </h2>
              {pending.length > 0 ? (
                <span className="status-pill status-pill-warning">
                  {pending.length}
                </span>
              ) : null}
            </div>
            {pending.length === 0 ? (
              <p className="surface-card px-4 py-5 text-sm text-[var(--color-on-surface-muted)]">
                You’re all caught up.
              </p>
            ) : (
              <ul className="space-y-3">
                {pending.map((booking) => (
                  <TutorTrialRequestCard
                    key={booking.id}
                    booking={booking}
                    learnerName={names.get(booking.learner_id) ?? "Learner"}
                  />
                ))}
              </ul>
            )}
          </section>

          {others.length > 0 ? (
            <section>
              <h2 className="display-title mb-3 text-lg text-[var(--color-on-background)]">
                Recent
              </h2>
              <ul className="space-y-3">
                {others.map((booking) => (
                  <TutorTrialRequestCard
                    key={booking.id}
                    booking={booking}
                    learnerName={names.get(booking.learner_id) ?? "Learner"}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
