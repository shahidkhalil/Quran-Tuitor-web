import { toggleHomeworkChecklistItem } from "@/server/actions/progress-notes";
import type { HomeworkChecklistItem } from "@/domain/homework-checklist";
import { checklistProgress } from "@/domain/homework-checklist";

type Props = {
  noteId: string;
  items: HomeworkChecklistItem[];
  doneKeys: string[];
  returnTo?: string;
};

export function HomeworkChecklist({
  noteId,
  items,
  doneKeys,
  returnTo = "/parent/revision",
}: Props) {
  if (items.length === 0) return null;

  const doneSet = new Set(doneKeys);
  const { done, total } = checklistProgress(items, doneKeys);

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--color-on-surface-muted)]">
          Checklist
        </p>
        <p className="text-xs font-semibold text-[var(--color-primary)]">
          {done}/{total} done
        </p>
      </div>
      <ul className="mt-2 space-y-2">
        {items.map((item) => {
          const checked = doneSet.has(item.key);
          return (
            <li key={item.key}>
              <form action={toggleHomeworkChecklistItem}>
                <input type="hidden" name="noteId" value={noteId} />
                <input type="hidden" name="itemKey" value={item.key} />
                <input
                  type="hidden"
                  name="intent"
                  value={checked ? "undone" : "done"}
                />
                <input type="hidden" name="returnTo" value={returnTo} />
                <button
                  type="submit"
                  className={`flex w-full items-start gap-3 rounded-[var(--radius-md)] border px-3 py-2.5 text-left transition hover:border-[var(--color-primary)]/35 ${
                    checked
                      ? "border-[var(--color-success)]/30 bg-[var(--color-accent-soft)]/40"
                      : "border-[var(--color-outline)] bg-[var(--color-surface-elevated)]"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                      checked
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                        : "border-[var(--color-outline-strong)] text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span
                    className={`text-sm ${
                      checked
                        ? "text-[var(--color-on-surface-muted)] line-through"
                        : "font-medium text-[var(--color-on-surface)]"
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="sr-only">
                    {checked ? "Mark as not done" : "Mark as done"}
                  </span>
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
