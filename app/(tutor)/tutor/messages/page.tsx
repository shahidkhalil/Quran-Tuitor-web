import { ThreadList } from "@/components/messages/thread-list";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { listMyMessageThreads } from "@/server/actions/messages";
import { getCurrentProfile } from "@/server/services/profile";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Messages" };

export default async function TutorMessagesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in?next=/tutor/messages");
  if (profile.role !== "tutor") redirect("/tutor");

  const { threads, safetyCopy, error } = await listMyMessageThreads();

  return (
    <div>
      <PanelPageHeader
        eyebrow="Inbox"
        title="Messages"
        description="Families see every message you send. Keep lesson talk here — payments stay on the platform."
        actions={
          <Link href="/tutor/requests" className="btn-panel btn-panel-secondary">
            Trial requests
          </Link>
        }
      />

      <div className="mb-5 flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/25 bg-[var(--color-accent-soft)]/70 px-4 py-3">
        <span
          aria-hidden
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-elevated)] text-sm font-bold text-[var(--color-warning)]"
        >
          ✓
        </span>
        <p className="text-sm leading-relaxed text-[var(--color-on-surface)]">
          {safetyCopy}
        </p>
      </div>

      {error ? (
        <p role="alert" className="mb-4 text-sm text-[var(--color-error)]">
          {error}
        </p>
      ) : null}

      <ThreadList
        threads={threads}
        basePath="/tutor/messages"
        emptyTitle="No family threads yet"
        emptyBody="When you accept a trial or a parent books paid lessons, a parent-visible thread appears here."
        emptyCtaHref="/tutor/requests"
        emptyCtaLabel="Open requests"
      />
    </div>
  );
}
