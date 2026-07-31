import { ClassroomTroubleshootChecklist } from "@/components/help/classroom-troubleshoot-checklist";
import { HelpFaqPanel } from "@/components/dashboard/help-faq-panel";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { CLASSROOM_TROUBLESHOOT_STEPS } from "@/domain/classroom-troubleshooting";
import { PARENT_HELP_FAQS } from "@/domain/dashboard-home";
import Link from "next/link";

export const metadata = { title: "Help" };

export default function ParentHelpPage() {
  return (
    <>
      <PanelPageHeader
        eyebrow="Support"
        title="Help center"
        description="FAQs plus a classroom troubleshooting checklist for mic, camera, and join issues."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/parent/system-check"
              className="btn-panel btn-panel-secondary"
            >
              System check
            </Link>
            <Link href="/parent/support/new" className="btn-panel btn-panel-primary">
              Open a case
            </Link>
          </div>
        }
      />

      <div className="mb-6">
        <ClassroomTroubleshootChecklist steps={CLASSROOM_TROUBLESHOOT_STEPS} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <HelpFaqPanel faqs={PARENT_HELP_FAQS} moreHref="/parent/support" />
        <section className="surface-card p-5 sm:p-6">
          <p className="eyebrow text-[var(--color-accent)]">Still stuck?</p>
          <h2 className="display-title mt-1 text-xl text-[var(--color-primary)]">
            Contact platform support
          </h2>
          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
            Cases stay on the booking — never share personal payment details with
            tutors.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/parent/support" className="btn-panel btn-panel-primary">
              My cases
            </Link>
            <Link href="/parent/bookings" className="btn-panel btn-panel-secondary">
              Bookings
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
