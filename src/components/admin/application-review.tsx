import { VettingDecisionForm } from "@/components/admin/vetting-decision-form";
import { PAYOUT_METHODS, statusLabel } from "@/domain/tutor-applications";
import { getSignedAssetUrl } from "@/server/actions/admin-vetting";
import type { TutorApplication } from "@/domain/tutor-applications";

type Props = {
  application: TutorApplication;
};

function payoutLabel(value: string) {
  return PAYOUT_METHODS.find((m) => m.value === value)?.label ?? value;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="eyebrow text-[var(--color-on-surface-muted)]">{label}</h2>
      <div className="mt-2 text-[var(--color-on-surface)]">{children}</div>
    </section>
  );
}

export async function ApplicationReview({ application }: Props) {
  const credentialLinks = await Promise.all(
    (application.credential_paths ?? []).map(async (path) => {
      const { url } = await getSignedAssetUrl(path);
      return { path, url };
    }),
  );

  let introVideoHref = application.intro_video_url;
  if (!introVideoHref && application.intro_video_path) {
    const { url } = await getSignedAssetUrl(application.intro_video_path);
    introVideoHref = url;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-4">
        <div className="surface-card p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="status-pill status-pill-warning">
              {statusLabel(application.status)}
            </span>
            <span className="text-sm text-[var(--color-on-surface-muted)]">
              Submitted {new Date(application.submitted_at).toLocaleString()}
            </span>
          </div>
          <p className="mt-3 text-sm text-[var(--color-on-surface-muted)]">
            {application.country}
            {application.phone ? ` · ${application.phone}` : ""}
          </p>
        </div>

        <div className="surface-card space-y-6 p-5 md:p-6">
          <Field label="Languages">
            <p>{application.languages}</p>
          </Field>

          <Field label="Credentials">
            <p>{application.credentials_summary}</p>
            {credentialLinks.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm">
                {credentialLinks.map(({ path, url }) => (
                  <li key={path}>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-panel btn-panel-secondary !min-h-9"
                      >
                        View credential
                      </a>
                    ) : (
                      <span className="text-[var(--color-on-surface-muted)]">
                        Could not load file
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </Field>

          <Field label="Child teaching experience">
            <p className="whitespace-pre-wrap">{application.child_experience}</p>
            {application.years_teaching != null ? (
              <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                {application.years_teaching} years teaching
              </p>
            ) : null}
          </Field>

          <Field label="Intro video">
            {introVideoHref ? (
              <a
                href={introVideoHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
              >
                Open intro video
              </a>
            ) : (
              <p className="text-[var(--color-on-surface-muted)]">Not provided</p>
            )}
          </Field>

          <Field label="Payout preference">
            <p>{payoutLabel(application.payout_method)}</p>
            {application.payout_notes ? (
              <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
                {application.payout_notes}
              </p>
            ) : null}
          </Field>
        </div>

        {application.applicant_response ? (
          <div className="surface-card p-5 md:p-6">
            <h2 className="eyebrow text-[var(--color-accent)]">
              Applicant response
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm">
              {application.applicant_response}
            </p>
            {application.applicant_response_at ? (
              <p className="mt-2 text-xs text-[var(--color-on-surface-muted)]">
                {new Date(application.applicant_response_at).toLocaleString()}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <aside className="surface-card h-fit p-5 md:sticky md:top-24 md:p-6">
        <h2 className="display-title text-xl text-[var(--color-primary)]">
          Decision
        </h2>
        <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
          Approve, reject, or request more information. The applicant is notified.
        </p>
        <div className="mt-5">
          {application.status === "pending" ? (
            <VettingDecisionForm applicationId={application.id} />
          ) : (
            <p className="text-sm text-[var(--color-on-surface-muted)]">
              This application is {statusLabel(application.status).toLowerCase()}
              .
              {application.status_reason
                ? ` Reason: ${application.status_reason}`
                : ""}
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
