"use client";

import { UserAvatar } from "@/components/profile/user-avatar";
import {
  removeProfilePhoto,
  uploadProfilePhoto,
  type ProfilePhotoState,
} from "@/server/actions/profile";
import { useActionState } from "react";

type Props = {
  photoUrl?: string | null;
  email?: string | null;
  /** When true, omit outer card chrome (used inside AccountWorkspace). */
  embedded?: boolean;
};

const initial: ProfilePhotoState = {};

export function ProfilePhotoForm({
  photoUrl,
  email,
  embedded = false,
}: Props) {
  const [uploadState, uploadAction, uploading] = useActionState(
    uploadProfilePhoto,
    initial,
  );
  const [removeState, removeAction, removing] = useActionState(
    removeProfilePhoto,
    initial,
  );

  const currentUrl =
    uploadState.photoUrl !== undefined
      ? uploadState.photoUrl
      : removeState.photoUrl !== undefined
        ? removeState.photoUrl
        : photoUrl;
  const error = uploadState.error ?? removeState.error;
  const success = uploadState.success ?? removeState.success;
  const pending = uploading || removing;

  const body = (
    <>
      <div className="flex flex-wrap items-start gap-4">
        {!embedded ? (
          <UserAvatar photoUrl={currentUrl} email={email} size="xl" />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-[var(--color-accent)]">Photo</p>
          <p className="display-title mt-1 text-xl text-[var(--color-primary)]">
            Profile photo
          </p>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[var(--color-on-surface-muted)]">
            Used across your workspace
            {embedded
              ? ". Tutors also show this on public listings when no listing photo is set."
              : "."}{" "}
            JPG, PNG, or WebP · max 5 MB.
          </p>
        </div>
        {embedded ? (
          <UserAvatar photoUrl={currentUrl} email={email} size="lg" />
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-[color-mix(in_srgb,var(--color-error)_8%,white)] px-3 py-2 text-sm text-[var(--color-error)]"
        >
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          role="status"
          className="rounded-[var(--radius-md)] border border-[var(--color-success)]/30 bg-[var(--color-accent-soft)] px-3 py-2 text-sm text-[var(--color-success)]"
        >
          {success}
        </p>
      ) : null}

      <form
        action={uploadAction}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <label
            htmlFor="profile-photo"
            className="text-sm font-semibold text-[var(--color-on-surface)]"
          >
            Choose image
          </label>
          <input
            id="profile-photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="block w-full rounded-[var(--radius-md)] border border-dashed border-[var(--color-outline-strong)]/40 bg-[var(--color-surface-muted)]/50 px-3 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[var(--color-primary)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="btn-panel btn-panel-primary shrink-0"
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </form>

      {currentUrl ? (
        <form action={removeAction}>
          <button
            type="submit"
            disabled={pending}
            className="btn-panel btn-panel-secondary"
          >
            {removing ? "Removing…" : "Remove photo"}
          </button>
        </form>
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <div className="space-y-5 rounded-[var(--radius-xl)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
        {body}
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-[var(--radius-xl)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] p-5 shadow-[var(--shadow-md)] sm:p-6">
      {body}
    </div>
  );
}
