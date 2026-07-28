import Link from "next/link";
import { ProgressNoteHistory } from "@/components/progress/progress-note-history";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { listProgressNotesForLearner } from "@/server/actions/progress-notes";
import { getCurrentProfile } from "@/server/services/profile";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Progress · ${id.slice(0, 6)}` };
}

export default async function LearnerProgressPage({ params }: Props) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in?next=/parent/learners");
  if (profile.role !== "parent" && profile.role !== "adult") {
    redirect("/parent");
  }

  const { id } = await params;
  const { notes, learnerName, error } = await listProgressNotesForLearner(id);

  if (error === "Learner not found." || error === "Not allowed.") {
    redirect("/parent/learners");
  }

  return (
    <div>
      <PanelPageHeader
        eyebrow="Learning"
        title={learnerName ? `Progress · ${learnerName}` : "Progress"}
        description="Covered, improve, and homework notes from completed paid lessons."
        actions={
          <Link
            href="/parent/learners"
            className="btn-panel btn-panel-secondary"
          >
            All learners
          </Link>
        }
      />

      {error ? (
        <p role="alert" className="mb-4 text-sm text-[var(--color-error)]">
          {error}
        </p>
      ) : null}

      <ProgressNoteHistory notes={notes} learnerName={learnerName} />
    </div>
  );
}
