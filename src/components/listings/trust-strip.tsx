type TrustStripProps = {
  className?: string;
};

/** UX-DR12 — Listing + checkout trust messaging */
export function TrustStrip({ className }: TrustStripProps) {
  return (
    <p
      className={
        className ??
        "text-sm text-[var(--color-on-surface-muted)]"
      }
      role="note"
    >
      <span className="font-medium text-[var(--color-on-surface)]">
        Platform payments
      </span>
      <span aria-hidden="true"> · </span>
      Parent-visible chat
      <span aria-hidden="true"> · </span>
      Free rematch
    </p>
  );
}
