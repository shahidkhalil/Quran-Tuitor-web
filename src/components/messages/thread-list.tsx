import Link from "next/link";
import type { ThreadListItem } from "@/server/actions/messages";
import { UserAvatar } from "@/components/profile/user-avatar";

type Props = {
  threads: ThreadListItem[];
  basePath: "/parent/messages" | "/tutor/messages";
  emptyTitle: string;
  emptyBody: string;
  emptyCtaHref: string;
  emptyCtaLabel: string;
};

function relativeTime(iso: string | null) {
  if (!iso) return "New";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function ThreadList({
  threads,
  basePath,
  emptyTitle,
  emptyBody,
  emptyCtaHref,
  emptyCtaLabel,
}: Props) {
  if (threads.length === 0) {
    return (
      <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-md)]">
        <div className="relative px-6 py-16 text-center sm:px-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--color-accent)_18%,transparent),transparent_55%),radial-gradient(ellipse_at_bottom_right,color-mix(in_srgb,var(--color-primary)_12%,transparent),transparent_50%)]"
          />
          <div className="relative">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[0_12px_28px_color-mix(in_srgb,var(--color-primary)_28%,transparent)]">
              <svg
                viewBox="0 0 24 24"
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden
              >
                <path
                  d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4 3.5V16H6.5A2.5 2.5 0 0 1 4 13.5v-7Z"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="eyebrow text-[var(--color-accent)]">Inbox</p>
            <p className="display-title mt-2 text-3xl text-[var(--color-primary)]">
              {emptyTitle}
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--color-on-surface-muted)]">
              {emptyBody}
            </p>
            <Link
              href={emptyCtaHref}
              className="btn-panel btn-panel-primary mt-7"
            >
              {emptyCtaLabel}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-sm)]">
      {threads.map((t, i) => {
        const name = t.learner_name ?? "Learner";
        return (
          <li
            key={t.id}
            className={
              i > 0
                ? "border-t border-[var(--color-outline)]/80"
                : undefined
            }
          >
            <Link
              href={`${basePath}/${t.id}`}
              className="messages-inbox-row focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-focus-ring)]"
            >
              <UserAvatar name={name} size="md" />
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="truncate font-semibold text-[var(--color-on-surface)]">
                    {name}
                  </p>
                  <span className="status-pill status-pill-neutral shrink-0">
                    {t.source === "paid" ? "Paid" : "Trial"}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-[var(--color-on-surface-muted)]">
                  {t.counterpart_label}
                </p>
                <p className="mt-1.5 truncate text-sm text-[var(--color-on-surface-muted)]">
                  {t.last_message_preview ?? "Say hello to open the thread"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 pt-0.5">
                <span className="text-[11px] font-semibold tabular-nums text-[var(--color-on-surface-muted)]">
                  {relativeTime(t.last_message_at)}
                </span>
                <span
                  aria-hidden
                  className="text-[var(--color-primary)] opacity-50 transition group-hover:opacity-100"
                >
                  →
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
