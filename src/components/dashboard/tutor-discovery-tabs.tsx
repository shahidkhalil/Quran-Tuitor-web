"use client";

import Link from "next/link";
import { useState } from "react";
import { RecommendTutorCard } from "@/components/dashboard/recommend-tutor-card";
import type { TutorListing } from "@/domain/tutor-listings";

type Tab = "recommended" | "shortlist" | "past";

type Props = {
  recommended: TutorListing[];
  shortlisted: TutorListing[];
  past: TutorListing[];
  shortlistedIds: string[];
};

export function TutorDiscoveryTabs({
  recommended,
  shortlisted,
  past,
  shortlistedIds,
}: Props) {
  const [tab, setTab] = useState<Tab>("recommended");
  const saved = new Set(shortlistedIds);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "recommended", label: "Recommended", count: recommended.length },
    { id: "shortlist", label: "Shortlisted", count: shortlisted.length },
    { id: "past", label: "Past tutors", count: past.length },
  ];

  const list =
    tab === "recommended"
      ? recommended
      : tab === "shortlist"
        ? shortlisted
        : past;

  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-[var(--color-outline)] px-4 pt-4 sm:px-5">
        <p className="eyebrow text-[var(--color-accent)]">Discover</p>
        <h2 className="display-title mt-1 text-xl text-[var(--color-primary)]">
          Tutor suggestions
        </h2>
        <div
          className="mt-4 flex gap-1 overflow-x-auto"
          role="tablist"
          aria-label="Tutor suggestions"
        >
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={[
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  active
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-on-surface-muted)] hover:bg-[var(--color-surface-muted)]",
                ].join(" ")}
              >
                {t.label}
                <span className="ml-1 tabular-nums opacity-80">{t.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        {list.length === 0 ? (
          <div className="px-2 py-8 text-center">
            <p className="text-sm text-[var(--color-on-surface-muted)]">
              {tab === "shortlist"
                ? "No saved tutors yet — shortlist while browsing."
                : tab === "past"
                  ? "Past tutors appear after trials or paid lessons."
                  : "No recommendations yet — browse the marketplace."}
            </p>
            <Link
              href={tab === "shortlist" ? "/browse" : "/browse"}
              className="btn-panel btn-panel-primary mt-4 inline-flex"
            >
              Find a tutor
            </Link>
          </div>
        ) : (
          list.map((listing) => (
            <RecommendTutorCard
              key={listing.id}
              listing={listing}
              saved={saved.has(listing.id)}
              returnTo="/parent"
            />
          ))
        )}
      </div>
    </section>
  );
}
