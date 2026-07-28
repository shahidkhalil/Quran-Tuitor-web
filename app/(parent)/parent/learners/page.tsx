import { LearnerList } from "@/components/learners/learner-list";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { listLearners } from "@/server/actions/learners";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learners",
};

export default async function LearnersPage() {
  const { learners, error } = await listLearners();

  return (
    <div>
      <PanelPageHeader
        eyebrow="Family"
        title="Learners"
        description="Family profiles plus Progress notes from completed paid lessons (Covered / Improve / Homework)."
        actions={
          <Link href="/parent/learners/new" className="btn-panel btn-panel-primary">
            Add learner
          </Link>
        }
      />

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-[color-mix(in_srgb,var(--color-error)_8%,white)] px-3 py-2 text-sm text-[var(--color-error)]"
        >
          {error}
        </p>
      ) : null}

      <LearnerList learners={learners} />
    </div>
  );
}
