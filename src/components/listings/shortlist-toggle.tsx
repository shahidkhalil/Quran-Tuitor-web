import { toggleShortlistAction } from "@/server/actions/shortlist";
import { cn } from "@/lib/cn";

type Props = {
  listingId: string;
  saved: boolean;
  returnTo: string;
  variant?: "button" | "link" | "icon";
  className?: string;
};

export function ShortlistToggle({
  listingId,
  saved,
  returnTo,
  variant = "button",
  className,
}: Props) {
  return (
    <form action={toggleShortlistAction}>
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="intent" value={saved ? "remove" : "add"} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button
        type="submit"
        aria-label={saved ? "Remove from shortlist" : "Save to shortlist"}
        className={cn(
          variant === "icon"
            ? "inline-flex size-10 items-center justify-center rounded-full bg-white/90 text-[var(--color-primary)] shadow-[var(--shadow-sm)] backdrop-blur transition hover:bg-white"
            : variant === "button"
              ? "inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[var(--color-outline-strong)] px-5 text-xs font-semibold tracking-[0.04em] text-[var(--color-primary)] hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              : "inline-flex min-h-11 items-center text-xs font-semibold tracking-[0.04em] text-[var(--color-primary)] underline-offset-4 hover:underline",
          className,
        )}
      >
        {variant === "icon" ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={saved ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        ) : saved ? (
          "Remove from shortlist"
        ) : (
          "Save to shortlist"
        )}
      </button>
    </form>
  );
}
