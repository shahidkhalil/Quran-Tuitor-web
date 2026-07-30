import Link from "next/link";
import { SupportCaseList } from "@/components/support/support-case-list";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { listMySupportCases } from "@/server/actions/support-cases";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Support" };

type Props = {
  searchParams: Promise<{ opened?: string }>;
};

export default async function TutorSupportPage({ searchParams }: Props) {
  const { opened } = await searchParams;
  const { cases, error } = await listMySupportCases();

  return (
    <div>
      <PanelPageHeader
        eyebrow="Help"
        title="Support"
        description="Open a case from a trial request or paid lesson. Payout issues welcome — handled in-platform."
        actions={
          <Link href="/tutor/support/new" className="btn-panel btn-panel-primary">
            Open a case
          </Link>
        }
      />

      {opened ? (
        <p
          role="status"
          className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-success)]/25 bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-success)]"
        >
          Support case opened. We aim to respond within 4 business hours.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mb-6 text-sm text-[var(--color-error)]">
          {error}
        </p>
      ) : null}

      <SupportCaseList cases={cases} newHref="/tutor/support/new" />
    </div>
  );
}
