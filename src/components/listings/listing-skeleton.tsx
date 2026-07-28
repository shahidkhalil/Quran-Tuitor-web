export function ListingCardSkeleton() {
  return (
    <li className="animate-pulse py-5" aria-hidden>
      <div className="h-3 w-24 rounded bg-[var(--color-surface-muted)]" />
      <div className="mt-3 h-6 w-3/4 max-w-md rounded bg-[var(--color-surface-muted)]" />
      <div className="mt-3 h-4 w-full max-w-xl rounded bg-[var(--color-surface-muted)]" />
      <div className="mt-2 h-4 w-2/3 max-w-lg rounded bg-[var(--color-surface-muted)]" />
      <div className="mt-3 h-3 w-48 rounded bg-[var(--color-surface-muted)]" />
    </li>
  );
}

export function BrowseResultsSkeleton() {
  return (
    <ul
      className="divide-y divide-[var(--color-outline)] border-y border-[var(--color-outline)]"
      aria-busy="true"
      aria-label="Loading tutors"
    >
      <ListingCardSkeleton />
      <ListingCardSkeleton />
      <ListingCardSkeleton />
    </ul>
  );
}
