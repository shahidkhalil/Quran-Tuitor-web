import { ClassroomTroubleshootChecklist } from "@/components/help/classroom-troubleshoot-checklist";
import { HelpFaqPanel } from "@/components/dashboard/help-faq-panel";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { TUTOR_CLASSROOM_TROUBLESHOOT_STEPS } from "@/domain/classroom-troubleshooting";
import { TUTOR_HELP_FAQS } from "@/domain/dashboard-home";
import Link from "next/link";

export const metadata = { title: "Help" };

export default function TutorHelpPage() {
  return (
    <>
      <PanelPageHeader
        eyebrow="Support"
        title="Help center"
        description="Classroom troubleshooting and short answers for joining lessons and payouts."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/tutor/system-check"
              className="btn-panel btn-panel-secondary"
            >
              System check
            </Link>
            <Link href="/tutor/support/new" className="btn-panel btn-panel-primary">
              Open a case
            </Link>
          </div>
        }
      />

      <div className="mb-6">
        <ClassroomTroubleshootChecklist
          steps={TUTOR_CLASSROOM_TROUBLESHOOT_STEPS}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <HelpFaqPanel faqs={TUTOR_HELP_FAQS} moreHref="/tutor/support" />
        <section className="surface-card p-5 sm:p-6">
          <p className="eyebrow text-[var(--color-accent)]">Still stuck?</p>
          <h2 className="display-title mt-1 text-xl text-[var(--color-primary)]">
            Platform support
          </h2>
          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
            Open a case from a trial or paid lesson when something blocks class.
          </p>
          <Link href="/tutor/support" className="btn-panel btn-panel-primary mt-4 inline-flex">
            My cases
          </Link>
        </section>
      </div>
    </>
  );
}
