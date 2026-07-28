"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  sendThreadMessage,
  type SendMessageState,
} from "@/server/actions/messages";
import { subscribeThreadMessages } from "@/lib/firebase/client-firestore";
import type { ThreadMessage } from "@/domain/messages";
import { MESSAGE_BODY_MAX_CHARS } from "@/domain/messages";
import { UserAvatar } from "@/components/profile/user-avatar";

const initial: SendMessageState = {};

type Props = {
  threadId: string;
  currentUserId: string;
  safetyCopy: string;
  title: string;
  subtitle: string;
  backHref: string;
};

function dayKeyFromDate(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayKey(iso: string) {
  return dayKeyFromDate(new Date(iso));
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(iso) === dayKeyFromDate(today)) return "Today";
  if (dayKey(iso) === dayKeyFromDate(yesterday)) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function SendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden
    >
      <path
        d="M5 12h12M13 6l6 6-6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChatThreadView({
  threadId,
  currentUserId,
  safetyCopy,
  title,
  subtitle,
  backHref,
}: Props) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [state, action, pending] = useActionState(sendThreadMessage, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const learnerName = title.replace(/^Chat ·\s*/, "") || "Conversation";

  useEffect(() => {
    const unsub = subscribeThreadMessages(
      threadId,
      (next) => {
        setMessages(next);
        setReady(true);
        setLiveError(null);
      },
      (err) => {
        setLiveError(err);
        setReady(true);
      },
    );
    return unsub;
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  let lastDay = "";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-primary)] transition hover:opacity-80"
        >
          <span aria-hidden>←</span>
          Inbox
        </Link>
        <span className="text-[var(--color-outline-strong)]/30">/</span>
        <span className="truncate text-[var(--color-on-surface-muted)]">
          {learnerName}
        </span>
      </div>

      <div className="messages-shell">
        <header className="messages-shell-header">
          <UserAvatar name={learnerName} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="display-title truncate text-xl text-[var(--color-primary)] sm:text-2xl">
                {learnerName}
              </h1>
              <span className="status-pill status-pill-accent">
                Parent-visible
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm text-[var(--color-on-surface-muted)]">
              {subtitle}
            </p>
          </div>
          <span
            className="hidden items-center gap-1.5 rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-warning)] sm:inline-flex"
            title="Messages update live"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
            </span>
            Live
          </span>
        </header>

        <div className="messages-thread-bg px-3 py-4 sm:px-5">
          <div className="relative z-[1] space-y-1">
            {!ready ? (
              <div className="space-y-3 py-8">
                <div className="mx-auto h-6 w-24 animate-pulse rounded-full bg-[var(--color-surface-muted)]" />
                <div className="ml-0 h-12 w-2/3 animate-pulse rounded-[1.15rem] bg-[var(--color-surface-elevated)]" />
                <div className="ml-auto h-12 w-1/2 animate-pulse rounded-[1.15rem] bg-[var(--color-surface-muted)]" />
              </div>
            ) : null}

            {ready && messages.length === 0 ? (
              <div className="mx-auto max-w-sm py-14 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-7 w-7"
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
                <p className="display-title text-2xl text-[var(--color-primary)]">
                  Start the conversation
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-on-surface-muted)]">
                  Ask about goals, schedule, or practice. Every message stays
                  visible to the parent.
                </p>
              </div>
            ) : null}

            {messages.map((m) => {
              const mine = m.sender_id === currentUserId;
              const day = dayKey(m.created_at);
              const showDay = day !== lastDay;
              lastDay = day;
              return (
                <div key={m.id}>
                  {showDay ? (
                    <p className="messages-day-chip">{dayLabel(m.created_at)}</p>
                  ) : null}
                  <div
                    className={`mb-2.5 flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`messages-bubble ${
                        mine ? "messages-bubble-mine" : "messages-bubble-theirs"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p
                        className={`mt-1.5 text-[10px] font-medium tracking-wide ${
                          mine
                            ? "text-right text-white/65"
                            : "text-[var(--color-on-surface-muted)]"
                        }`}
                      >
                        {timeLabel(m.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </div>

        {liveError ? (
          <p
            role="alert"
            className="border-t border-[var(--color-error)]/20 bg-[var(--color-error)]/5 px-4 py-2 text-xs text-[var(--color-error)]"
          >
            {liveError}
          </p>
        ) : null}

        <div className="messages-composer">
          <p className="mb-2.5 px-1 text-[11px] leading-snug text-[var(--color-on-surface-muted)]">
            {safetyCopy}
          </p>
          <form ref={formRef} action={action}>
            <input type="hidden" name="threadId" value={threadId} />
            <label className="sr-only" htmlFor={`msg-${threadId}`}>
              Message
            </label>
            <div className="messages-composer-field">
              <textarea
                id={`msg-${threadId}`}
                name="body"
                rows={1}
                required
                maxLength={MESSAGE_BODY_MAX_CHARS}
                placeholder="Write a message…"
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
                }}
              />
              <button
                type="submit"
                disabled={pending}
                className="messages-send"
                aria-label={pending ? "Sending" : "Send message"}
              >
                {pending ? (
                  <span className="h-4 w-4 animate-pulse rounded-full bg-white/80" />
                ) : (
                  <SendIcon />
                )}
              </button>
            </div>
            {state.error ? (
              <p role="alert" className="mt-2 px-1 text-sm text-[var(--color-error)]">
                {state.error}
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}
