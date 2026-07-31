import { PanelPageHeader } from "@/components/shell/panel-page-header";
import {
  buildLearnerTutorLinks,
  uniqueFamilyTutorCount,
  type LearnerTutorLink,
} from "@/domain/parental-watch";
import { formatLessonSlot } from "@/domain/recurring-bookings";
import type { TutorListing } from "@/domain/tutor-listings";
import {
  listSharedWithMe,
  loadParentalWatchBundle,
} from "@/server/actions/family-shares";
import { listPublishedListings } from "@/server/actions/tutor-listings";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/server/services/profile";

export const metadata = { title: "Parental Watch" };

type Props = {
  searchParams: Promise<{ family?: string }>;
};

function tutorStatusLabel(link: LearnerTutorLink): string {
  if (link.kind === "scheduled" && link.slotStart && link.slotEnd) {
    return `Next: ${formatLessonSlot(link.slotStart, link.slotEnd)}`;
  }
  if (link.kind === "trial" && link.trialStatus) {
    return `Trial · ${link.trialStatus.replaceAll("_", " ")}`;
  }
  if (link.kind === "recent") return "Recent lesson";
  return "Has progress notes";
}

function TutorMiniRow({
  link,
  listing,
  viewOnly,
}: {
  link: LearnerTutorLink;
  listing: TutorListing | undefined;
  viewOnly: boolean;
}) {
  const headline = listing?.headline ?? "Tutor";
  const photoUrl = listing?.photo_url;
  const href =
    link.kind === "scheduled"
      ? "/parent/schedule"
      : link.kind === "trial"
        ? "/parent/bookings"
        : `/browse/${link.listingId}`;

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-outline)] px-3 py-3">
      <div className="size-9 shrink-0 overflow-hidden rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            {headline.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--color-on-surface)]">
          {headline}
        </p>
        <p className="text-xs text-[var(--color-on-surface-muted)]">
          {tutorStatusLabel(link)}
        </p>
      </div>
      {!viewOnly ? (
        <div className="flex flex-wrap gap-2">
          <Link href={href} className="btn-panel btn-panel-primary !min-h-9">
            Open
          </Link>
          <Link
            href="/parent/messages"
            className="btn-panel btn-panel-secondary !min-h-9"
          >
            Message
          </Link>
        </div>
      ) : null}
    </li>
  );
}

export default async function ParentalWatchPage({ searchParams }: Props) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in?next=/parent/watch");

  const { family: familyParam } = await searchParams;
  const ownerParentId = familyParam?.trim() || profile.id;

  const [bundle, { shares: shared }, { listings }] = await Promise.all([
    loadParentalWatchBundle(ownerParentId),
    listSharedWithMe(),
    listPublishedListings(),
  ]);

  if (bundle.error) {
    return (
      <>
        <PanelPageHeader
          eyebrow="Oversight"
          title="Parental Watch"
          description="Could not load this family view."
        />
        <div className="surface-card p-5">
          <p role="alert" className="text-sm text-[var(--color-error)]">
            {bundle.error}
          </p>
          <Link href="/parent/watch" className="btn-panel btn-panel-secondary mt-4 inline-flex">
            Your Watch
          </Link>
        </div>
      </>
    );
  }

  const { learners, upcoming, recentAttendance, bookings, notesByLearner, viewOnly } =
    bundle;
  const byListing = new Map(listings.map((l) => [l.id, l]));

  const allLinks = learners.flatMap((learner) =>
    buildLearnerTutorLinks({
      learnerId: learner.id,
      upcoming,
      recent: recentAttendance,
      trials: bookings,
      notes: notesByLearner.get(learner.id) ?? [],
    }),
  );
  const familyTutorCount = uniqueFamilyTutorCount(allLinks);

  return (
    <>
      <PanelPageHeader
        eyebrow="Oversight"
        title="Parental Watch"
        description={
          viewOnly
            ? `View-only · shared by ${bundle.ownerEmail ?? "a co-parent"}.`
            : "See every learner’s tutors in one place — families can work with more than one teacher."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/parent/family" className="btn-panel btn-panel-secondary">
              Family sharing
            </Link>
            <Link href="/parent" className="btn-panel btn-panel-secondary">
              Home
            </Link>
          </div>
        }
      />

      {(shared.length > 0 || viewOnly) && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/parent/watch"
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              !viewOnly
                ? "bg-[var(--color-primary)] text-white"
                : "border border-[var(--color-outline)] text-[var(--color-primary)]"
            }`}
          >
            Your family
          </Link>
          {shared.map((s) => {
            const active = viewOnly && s.owner_parent_id === ownerParentId;
            return (
              <Link
                key={s.id}
                href={`/parent/watch?family=${encodeURIComponent(s.owner_parent_id)}`}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  active
                    ? "bg-[var(--color-primary)] text-white"
                    : "border border-[var(--color-outline)] text-[var(--color-primary)]"
                }`}
              >
                {s.owner_email ?? "Shared"} · view only
              </Link>
            );
          })}
        </div>
      )}

      {viewOnly ? (
        <p
          role="status"
          className="mb-4 rounded-[var(--radius-lg)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-4 py-3 text-sm text-[var(--color-on-surface-muted)]"
        >
          Read-only access — you can follow progress but cannot book, pay, or
          message from this shared view.
        </p>
      ) : null}

      {learners.length === 0 ? (
        <div className="surface-card px-5 py-14 text-center">
          <p className="eyebrow text-[var(--color-accent)]">Family</p>
          <p className="display-title mt-2 text-2xl text-[var(--color-primary)]">
            {viewOnly ? "No learners on this family yet" : "Add a learner to watch progress"}
          </p>
          {!viewOnly ? (
            <Link
              href="/parent/learners"
              className="btn-panel btn-panel-primary mt-5 inline-flex"
            >
              Add learner
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="eyebrow text-[var(--color-accent)]">Family tutors</p>
              <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
                {familyTutorCount === 0
                  ? "No active tutor relationships yet."
                  : `${familyTutorCount} tutor${familyTutorCount === 1 ? "" : "s"} across ${learners.length} learner${learners.length === 1 ? "" : "s"}.`}
              </p>
            </div>
            {!viewOnly ? (
              <Link href="/browse" className="btn-panel btn-panel-primary !min-h-9">
                Find another tutor
              </Link>
            ) : null}
          </div>

          <ul className="space-y-4">
            {learners.map((learner) => {
              const notes = notesByLearner.get(learner.id) ?? [];
              const next = upcoming.filter((l) => l.learner_id === learner.id);
              const recent = recentAttendance.filter(
                (l) => l.learner_id === learner.id,
              );
              const tutors = buildLearnerTutorLinks({
                learnerId: learner.id,
                upcoming,
                recent: recentAttendance,
                trials: bookings,
                notes,
              });
              const latest = notes[0] ?? null;

              return (
                <li key={learner.id} className="surface-card p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="eyebrow text-[var(--color-accent)]">Learner</p>
                      <h2 className="display-title mt-1 text-xl text-[var(--color-primary)]">
                        {learner.display_name}
                      </h2>
                      <p className="mt-1 text-xs font-semibold text-[var(--color-on-surface-muted)]">
                        {tutors.length === 0
                          ? "No tutors linked yet"
                          : `${tutors.length} tutor${tutors.length === 1 ? "" : "s"}`}
                      </p>
                    </div>
                    {!viewOnly ? (
                      <Link
                        href={`/parent/learners/${learner.id}/progress`}
                        className="btn-panel btn-panel-primary !min-h-9"
                      >
                        Progress notes
                      </Link>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-outline)] px-3 py-3">
                      <p className="text-xs font-semibold text-[var(--color-on-surface-muted)]">
                        Upcoming
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-[var(--color-primary)]">
                        {next.length}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-outline)] px-3 py-3">
                      <p className="text-xs font-semibold text-[var(--color-on-surface-muted)]">
                        Recent attendance
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-[var(--color-primary)]">
                        {recent.length}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-outline)] px-3 py-3">
                      <p className="text-xs font-semibold text-[var(--color-on-surface-muted)]">
                        Progress notes
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-[var(--color-primary)]">
                        {notes.length}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--color-on-surface-muted)]">
                      Tutors for this learner
                    </p>
                    {tutors.length === 0 ? (
                      <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                        No tutors linked yet.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {tutors.map((link) => (
                          <TutorMiniRow
                            key={link.listingId}
                            link={link}
                            listing={byListing.get(link.listingId)}
                            viewOnly={viewOnly}
                          />
                        ))}
                      </ul>
                    )}
                  </div>

                  {latest ? (
                    <p className="mt-4 text-sm text-[var(--color-on-surface-muted)]">
                      Latest homework:{" "}
                      <span className="text-[var(--color-on-surface)]">
                        {latest.homework.slice(0, 140)}
                        {latest.homework.length > 140 ? "…" : ""}
                      </span>
                    </p>
                  ) : (
                    <p className="mt-4 text-sm text-[var(--color-on-surface-muted)]">
                      Notes appear after tutors mark lessons completed.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
