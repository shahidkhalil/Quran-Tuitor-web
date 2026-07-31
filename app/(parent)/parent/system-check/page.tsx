import { SystemCheckPanel } from "@/components/system-check/system-check-panel";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import Link from "next/link";

export const metadata = { title: "System check" };

type Props = {
  searchParams: Promise<{ join?: string }>;
};

export default async function ParentSystemCheckPage({ searchParams }: Props) {
  const { join } = await searchParams;

  return (
    <>
      <PanelPageHeader
        eyebrow="Tech check"
        title="System check"
        description="Confirm camera, microphone, and browser before joining a lesson."
        actions={
          <Link href="/parent/schedule" className="btn-panel btn-panel-secondary">
            Schedule
          </Link>
        }
      />
      <SystemCheckPanel
        joinUrl={join}
        backHref="/parent/schedule"
        backLabel="Back to schedule"
        helpHref="/parent/help"
      />
    </>
  );
}
