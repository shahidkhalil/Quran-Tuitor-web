import { SystemCheckPanel } from "@/components/system-check/system-check-panel";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import Link from "next/link";

export const metadata = { title: "System check" };

type Props = {
  searchParams: Promise<{ join?: string }>;
};

export default async function TutorSystemCheckPage({ searchParams }: Props) {
  const { join } = await searchParams;

  return (
    <>
      <PanelPageHeader
        eyebrow="Tech check"
        title="System check"
        description="Confirm camera, microphone, and browser before joining a lesson."
        actions={
          <Link href="/tutor/calendar" className="btn-panel btn-panel-secondary">
            Calendar
          </Link>
        }
      />
      <SystemCheckPanel
        joinUrl={join}
        backHref="/tutor/calendar"
        backLabel="Back to calendar"
        helpHref="/tutor/help"
      />
    </>
  );
}
