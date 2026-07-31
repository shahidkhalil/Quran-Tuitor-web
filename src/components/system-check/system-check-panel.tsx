"use client";

import { useEffect, useRef, useState } from "react";
import { safeExternalJoinUrl } from "@/domain/system-check";

type CheckState = "idle" | "checking" | "pass" | "fail";

type Row = {
  id: string;
  label: string;
  state: CheckState;
  detail: string;
};

type Props = {
  joinUrl?: string | null;
  backHref: string;
  backLabel?: string;
  helpHref?: string;
};

function tone(state: CheckState) {
  if (state === "pass") return "status-pill status-pill-success";
  if (state === "fail") return "status-pill status-pill-error";
  if (state === "checking") return "status-pill status-pill-accent";
  return "status-pill status-pill-neutral";
}

function labelFor(state: CheckState) {
  if (state === "pass") return "OK";
  if (state === "fail") return "Issue";
  if (state === "checking") return "Checking";
  return "Pending";
}

const INITIAL: Row[] = [
  {
    id: "secure",
    label: "Secure connection",
    state: "idle",
    detail: "Lessons need HTTPS (or localhost).",
  },
  {
    id: "media",
    label: "Browser media support",
    state: "idle",
    detail: "Camera and microphone APIs.",
  },
  {
    id: "mic",
    label: "Microphone",
    state: "idle",
    detail: "Allow access when prompted.",
  },
  {
    id: "cam",
    label: "Camera",
    state: "idle",
    detail: "Allow access when prompted.",
  },
];

export function SystemCheckPanel({
  joinUrl,
  backHref,
  backLabel = "Back",
  helpHref = "/parent/help",
}: Props) {
  const safeJoin = safeExternalJoinUrl(joinUrl);
  const [rows, setRows] = useState<Row[]>(INITIAL);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (el && stream) {
      el.srcObject = stream;
      void el.play().catch(() => {});
    }
    return () => {
      if (el) el.srcObject = null;
    };
  }, [stream]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  function patch(id: string, next: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...next } : r)));
  }

  async function runChecks() {
    setRunning(true);
    setDone(false);
    setStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
    setRows(INITIAL.map((r) => ({ ...r, state: "checking", detail: "Checking…" })));

    const secure =
      window.isSecureContext ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1";
    patch("secure", {
      state: secure ? "pass" : "fail",
      detail: secure
        ? "This page is secure."
        : "Open the site over HTTPS, then try again.",
    });

    const mediaOk = Boolean(navigator.mediaDevices?.getUserMedia);
    patch("media", {
      state: mediaOk ? "pass" : "fail",
      detail: mediaOk
        ? "Your browser supports camera and mic."
        : "Use a modern browser (Chrome, Edge, Firefox, Safari).",
    });

    if (!secure || !mediaOk) {
      patch("mic", {
        state: "fail",
        detail: "Skipped — fix secure connection / browser first.",
      });
      patch("cam", {
        state: "fail",
        detail: "Skipped — fix secure connection / browser first.",
      });
      setRunning(false);
      setDone(true);
      return;
    }

    try {
      const both = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      const hasMic = both.getAudioTracks().some((t) => t.readyState === "live");
      const hasCam = both.getVideoTracks().some((t) => t.readyState === "live");
      patch("mic", {
        state: hasMic ? "pass" : "fail",
        detail: hasMic
          ? "Microphone is working."
          : "No live microphone — check OS permissions.",
      });
      patch("cam", {
        state: hasCam ? "pass" : "fail",
        detail: hasCam
          ? "Camera is working."
          : "No live camera — check OS permissions.",
      });
      setStream(both);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Permission denied or device busy.";

      try {
        const micOnly = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        micOnly.getTracks().forEach((t) => t.stop());
        patch("mic", { state: "pass", detail: "Microphone is working." });
      } catch {
        patch("mic", {
          state: "fail",
          detail: `Microphone blocked or unavailable. (${msg})`,
        });
      }

      try {
        const camOnly = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true,
        });
        patch("cam", { state: "pass", detail: "Camera is working." });
        setStream(camOnly);
      } catch {
        patch("cam", {
          state: "fail",
          detail: `Camera blocked or unavailable. (${msg})`,
        });
      }
    }

    setRunning(false);
    setDone(true);
  }

  const allPass = rows.every((r) => r.state === "pass");
  const camPass = rows.find((r) => r.id === "cam")?.state === "pass";

  return (
    <div className="space-y-6">
      <div className="surface-card p-5 sm:p-6">
        <p className="eyebrow text-[var(--color-accent)]">Before you join</p>
        <h2 className="display-title mt-1 text-xl text-[var(--color-primary)]">
          Device & browser check
        </h2>
        <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
          Run this before class so audio and video work. Your meeting link stays
          the same — this only verifies your device.
        </p>

        <button
          type="button"
          className="btn-panel btn-panel-primary mt-4"
          onClick={() => void runChecks()}
          disabled={running}
        >
          {running ? "Checking…" : done ? "Run check again" : "Start check"}
        </button>

        <ul className="mt-5 space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-outline)] px-3 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                  {row.label}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-on-surface-muted)]">
                  {row.detail}
                </p>
              </div>
              <span className={tone(row.state)}>{labelFor(row.state)}</span>
            </li>
          ))}
        </ul>

        {camPass && stream ? (
          <div className="mt-5 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-outline)] bg-black/90">
            <video
              ref={videoRef}
              className="mx-auto max-h-56 w-full object-contain"
              muted
              playsInline
              autoPlay
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {safeJoin ? (
          <>
            <a
              href={safeJoin}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-panel btn-panel-primary"
              onClick={() => {
                stream?.getTracks().forEach((t) => t.stop());
              }}
            >
              {allPass ? "Join lesson" : done ? "Join anyway" : "Skip check & join"}
            </a>
            <a href={backHref} className="btn-panel btn-panel-secondary">
              {backLabel}
            </a>
          </>
        ) : (
          <a href={backHref} className="btn-panel btn-panel-primary">
            {backLabel}
          </a>
        )}
      </div>

      {!allPass && done ? (
        <p className="text-sm text-[var(--color-on-surface-muted)]">
          You can still join if needed. Allow Camera and Microphone for this
          site in browser settings, then run the check again. Or open the{" "}
          <a
            href={helpHref}
            className="font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
          >
            classroom troubleshooting checklist
          </a>
          .
        </p>
      ) : (
        <p className="text-sm text-[var(--color-on-surface-muted)]">
          Need more steps?{" "}
          <a
            href={helpHref}
            className="font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
          >
            Classroom troubleshooting
          </a>
        </p>
      )}
    </div>
  );
}
