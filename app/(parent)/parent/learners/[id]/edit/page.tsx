import { LearnerForm } from "@/components/learners/learner-form";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { getLearner } from "@/server/actions/learners";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const { learner } = await getLearner(id);
  return { title: learner ? `Edit ${learner.display_name}` : "Edit learner" };
}

export default async function EditLearnerPage({ params }: Props) {
  const { id } = await params;
  const { learner, error } = await getLearner(id);

  if (!learner) {
    notFound();
  }

  return (
    <div>
      <PanelPageHeader
        eyebrow="Family"
        title={`Edit ${learner.display_name}`}
        description="Update the learner profile used for trials and paid bookings."
        actions={
          <Link href="/parent/learners" className="btn-panel btn-panel-secondary">
            Back
          </Link>
        }
      />
      {error ? (
        <p role="alert" className="mb-4 text-sm text-[var(--color-error)]">
          {error}
        </p>
      ) : null}
      <div className="surface-card p-5 md:p-6">
        <LearnerForm learner={learner} />
      </div>
    </div>
  );
}
