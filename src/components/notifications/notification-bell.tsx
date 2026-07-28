"use client";

import { IconBell } from "@/components/shell/panel-icons";
import { cn } from "@/lib/cn";
import type { AppNotification } from "@/domain/tutor-applications";
import {
  markNotificationRead,
  openNotification,
} from "@/server/actions/notifications";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

type Props = {
  notifications: AppNotification[];
  tone?: "light" | "dark";
};

export function NotificationBell({ notifications, tone = "light" }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read_at).length;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative inline-flex h-10 w-10 items-center justify-center rounded-full transition",
          tone === "dark"
            ? "text-white/85 hover:bg-white/10 hover:text-white"
            : "text-[var(--color-on-surface-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-primary)]",
        )}
      >
        <IconBell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-[var(--color-on-accent)]">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-lg)]"
        >
          <div className="flex items-center justify-between border-b border-[var(--color-outline)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--color-on-surface)]">
              Notifications
            </p>
            {unread > 0 ? (
              <span className="status-pill status-pill-warning">{unread} new</span>
            ) : (
              <span className="text-xs text-[var(--color-on-surface-muted)]">
                All caught up
              </span>
            )}
          </div>

          <ul className="max-h-[min(24rem,60vh)] overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-[var(--color-on-surface-muted)]">
                No notifications yet.
              </li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "border-b border-[var(--color-outline)] px-4 py-3 last:border-b-0",
                    !n.read_at &&
                      "bg-[color-mix(in_srgb,var(--color-accent-soft)_55%,white)]",
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.read_at ? (
                      <span
                        aria-hidden
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]"
                      />
                    ) : (
                      <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-sm leading-snug text-[var(--color-on-surface-muted)]">
                        {n.body}
                      </p>
                      <p className="mt-1.5 text-[11px] text-[var(--color-on-surface-muted)]">
                        {new Date(n.created_at).toLocaleString()}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {n.link ? (
                          <form
                            action={openNotification}
                            onSubmit={() => setOpen(false)}
                          >
                            <input type="hidden" name="id" value={n.id} />
                            <input type="hidden" name="link" value={n.link} />
                            <button
                              type="submit"
                              className="inline-flex min-h-8 items-center rounded-full bg-[var(--color-primary)] px-3.5 text-[11px] font-semibold tracking-[0.03em] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
                            >
                              Open
                            </button>
                          </form>
                        ) : null}
                        {!n.read_at ? (
                          <form
                            action={async (formData) => {
                              await markNotificationRead(formData);
                              router.refresh();
                            }}
                          >
                            <input type="hidden" name="id" value={n.id} />
                            <button
                              type="submit"
                              className="inline-flex min-h-8 items-center rounded-full border border-[var(--color-outline-strong)] bg-white px-3.5 text-[11px] font-semibold tracking-[0.03em] text-[var(--color-primary)] hover:bg-[var(--color-surface-muted)]"
                            >
                              Mark as read
                            </button>
                          </form>
                        ) : (
                          <span className="inline-flex min-h-8 items-center text-[11px] font-medium text-[var(--color-on-surface-muted)]">
                            Read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
