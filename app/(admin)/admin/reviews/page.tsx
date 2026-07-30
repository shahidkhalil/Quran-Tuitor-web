import Link from "next/link";
import { AdminHideReviewForm } from "@/components/admin/admin-hide-review-form";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import {
  adminUnhideLessonReview,
  listReviewsForAdminModeration,
} from "@/server/actions/reviews";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reviews" };

type Props = {
  searchParams: Promise<{ hidden?: string; restored?: string }>;
};

export default async function AdminReviewsPage({ searchParams }: Props) {
  const { hidden, restored } = await searchParams;
  const { reviews, error } = await listReviewsForAdminModeration();

  return (
    <div>
      <PanelPageHeader
        eyebrow="Moderation"
        title="Reviews"
        description="Hide abusive reviews from public listings. Aggregates update automatically. Actions are audited."
        actions={
          <span className="status-pill status-pill-neutral">
            {reviews.length} total
          </span>
        }
      />

      {hidden ? (
        <p
          role="status"
          className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-success)]/25 bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-success)]"
        >
          Review hidden from the public listing. Rating aggregate refreshed.
        </p>
      ) : null}

      {restored ? (
        <p
          role="status"
          className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-success)]/25 bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-success)]"
        >
          Review restored to the public listing.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mb-6 text-sm text-[var(--color-error)]">
          {error}
        </p>
      ) : null}

      {reviews.length === 0 && !error ? (
        <div className="surface-card px-5 py-12 text-center">
          <p className="display-title text-xl text-[var(--color-primary)]">
            No reviews yet
          </p>
          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
            Parent reviews after completed paid lessons appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="surface-card p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    {r.hidden_at ? (
                      <span className="status-pill status-pill-error">Hidden</span>
                    ) : (
                      <span className="status-pill status-pill-success">Public</span>
                    )}
                    <span className="status-pill status-pill-accent">
                      {r.rating}★
                    </span>
                  </div>
                  <h2 className="display-title mt-3 text-lg text-[var(--color-primary)]">
                    {r.listingHeadline ?? "Listing"}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
                    {r.author_display} · {new Date(r.created_at).toLocaleString()}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--color-on-surface)]">
                    {r.body}
                  </p>
                  {r.hidden_at && r.hidden_reason ? (
                    <p className="mt-2 text-xs text-[var(--color-on-surface-muted)]">
                      Hidden reason: {r.hidden_reason}
                    </p>
                  ) : null}
                </div>
                <div className="w-full max-w-sm shrink-0">
                  {!r.hidden_at ? (
                    <AdminHideReviewForm reviewId={r.id} />
                  ) : (
                    <form action={adminUnhideLessonReview}>
                      <input type="hidden" name="reviewId" value={r.id} />
                      <button
                        type="submit"
                        className="btn-panel btn-panel-secondary !min-h-9 !px-3 text-[11px]"
                      >
                        Restore to listing
                      </button>
                    </form>
                  )}
                  <Link
                    href={`/browse/${r.listing_id}`}
                    className="btn-panel btn-panel-secondary mt-2 !min-h-9 !px-3 text-[11px]"
                  >
                    View listing
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
