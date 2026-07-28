import {
  statusDescription,
  statusLabel,
  type ApplicationEvent,
  type ApplicationStatus,
  type TutorApplication,
} from "@/domain/tutor-applications";
import { cn } from "@/lib/cn";

const PIPELINE: ApplicationStatus[] = ["pending", "needs_info", "approved"];

type Props = {
  application: TutorApplication;
  events: ApplicationEvent[];
};

function stepState(
  step: ApplicationStatus,
  current: ApplicationStatus,
): "done" | "current" | "upcoming" | "skipped" {
  if (current === "rejected") {
    if (step === "pending") return "done";
    return "skipped";
  }
  if (current === "approved") {
    if (step === "approved") return "current";
    return "done";
  }
  if (current === "needs_info") {
    if (step === "pending") return "done";
    if (step === "needs_info") return "current";
    return "upcoming";
  }
  if (step === "pending") return "current";
  return "upcoming";
}

function statusPill(status: ApplicationStatus) {
  if (status === "approved") return "status-pill status-pill-success";
  if (status === "rejected") return "status-pill status-pill-error";
  if (status === "needs_info") return "status-pill status-pill-warning";
  return "status-pill status-pill-accent";
}

export function ApplicationStatusTimeline({ application, events }: Props) {
  const current = application.status;

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-outline)] shadow-[var(--shadow-md)]">
        <div className="account-hero-band px-5 py-6 sm:px-7 sm:py-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/65">
            Application
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="font-[family-name:var(--font-fraunces)] text-3xl text-white">
              {application.full_name}
            </h2>
            <span className={statusPill(current)}>{statusLabel(current)}</span>
          </div>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80">
            {statusDescription(current)}
          </p>
          <p className="mt-3 text-xs text-white/55">
            Last update{" "}
            {new Date(
              events[events.length - 1]?.created_at ?? application.updated_at,
            ).toLocaleString()}
          </p>
        </div>

        {(current === "needs_info" || current === "rejected") && (
          <div
            role="status"
            className={cn(
              "border-t px-5 py-4 sm:px-7",
              current === "rejected"
                ? "border-[var(--color-error)]/20 bg-[color-mix(in_srgb,var(--color-error)_8%,white)]"
                : "border-[var(--color-warning)]/25 bg-[var(--color-accent-soft)]/70",
            )}
          >
            <p className="text-sm font-semibold text-[var(--color-on-surface)]">
              {current === "rejected" ? "Reason" : "What we need from you"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-on-surface)]">
              {application.status_reason?.trim() ||
                (current === "rejected"
                  ? "No reason was recorded — please contact support."
                  : "Please respond below with the requested details.")}
            </p>
          </div>
        )}
      </div>

      {current === "rejected" ? (
        <ol className="space-y-0 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)]">
          <li className="border-b border-[var(--color-outline)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-muted)]">
              Submitted
            </p>
            <p className="mt-1 text-sm text-[var(--color-on-surface)]">
              {new Date(application.submitted_at).toLocaleString()}
            </p>
          </li>
          <li className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-error)]">
              Not approved
            </p>
            <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
              {application.status_reason?.trim() || "See reason above."}
            </p>
          </li>
        </ol>
      ) : (
        <div>
          <p className="eyebrow text-[var(--color-accent)]">Pipeline</p>
          <ol className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-3">
            {PIPELINE.map((step, index) => {
              const state = stepState(step, current);
              return (
                <li
                  key={step}
                  className={cn(
                    "application-step",
                    state === "current" && "application-step-current",
                    state === "done" && "application-step-done",
                    state === "upcoming" && "opacity-70",
                    state === "skipped" && "opacity-40",
                  )}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-on-surface-muted)]">
                    Step {index + 1}
                  </p>
                  <p className="mt-1 font-semibold text-[var(--color-on-surface)]">
                    {statusLabel(step)}
                  </p>
                  {state === "current" ? (
                    <p className="mt-1 text-xs font-semibold text-[var(--color-primary)]">
                      You are here
                    </p>
                  ) : state === "done" ? (
                    <p className="mt-1 text-xs text-[var(--color-success)]">
                      Complete
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="rounded-[var(--radius-xl)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
        <p className="eyebrow text-[var(--color-accent)]">History</p>
        <h3 className="display-title mt-1 text-xl text-[var(--color-primary)]">
          Activity
        </h3>
        {events.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-on-surface-muted)]">
            Submitted {new Date(application.submitted_at).toLocaleString()}
          </p>
        ) : (
          <ol className="relative mt-5 space-y-0 border-l-2 border-[var(--color-outline)] pl-5">
            {events.map((event) => (
              <li key={event.id} className="relative pb-5 last:pb-0">
                <span
                  aria-hidden
                  className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-surface-elevated)] bg-[var(--color-primary)]"
                />
                <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                  {statusLabel(event.status)}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-on-surface-muted)]">
                  {new Date(event.created_at).toLocaleString()}
                </p>
                {event.note ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-on-surface-muted)]">
                    {event.note}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
