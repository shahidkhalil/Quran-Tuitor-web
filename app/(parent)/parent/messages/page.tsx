import { ThreadList } from "@/components/messages/thread-list";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { listMyMessageThreads } from "@/server/actions/messages";
import { getCurrentProfile } from "@/server/services/profile";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Messages" };

export default async function ParentMessagesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in?next=/parent/messages");
  if (profile.role !== "parent" && profile.role !== "adult") {
    redirect("/parent");
  }

  const { threads, safetyCopy, error } = await listMyMessageThreads();

  return (
    <div>
      <PanelPageHeader
        eyebrow="Inbox"
        title="Messages"
        description="Parent-visible threads with your tutors — private minor chats are never allowed."
        actions={
          <Link href="/parent/bookings" className="btn-panel btn-panel-secondary">
            View bookings
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
        basePath="/parent/messages"
        emptyTitle="No conversations yet"
        emptyBody="Threads appear when a tutor accepts a trial or you schedule paid lessons. Messaging stays on-platform — never send payment details off-site."
        emptyCtaHref="/browse"
        emptyCtaLabel="Find a tutor"
      />
    </div>
  );
}
