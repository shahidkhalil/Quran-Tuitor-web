import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { LearnerForm } from "@/components/learners/learner-form";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add learner",
};

export default function NewLearnerPage() {
  return (
    <div>
      <PanelPageHeader
        eyebrow="Family"
        title="Add learner"
        description="A learner profile is required before you can book a free trial."
        actions={
          <Link href="/parent/learners" className="btn-panel btn-panel-secondary">
            Back
          </Link>
        }
      />
      <div className="surface-card p-5 md:p-6">
        <LearnerForm />
      </div>
    </div>
  );
}
