/** Parent-facing homework checklist derived from progress-note homework text. */

export type HomeworkChecklistItem = {
  key: string;
  label: string;
};

/** Split homework into checklist lines (newlines / bullets). */
export function parseHomeworkChecklistItems(
  homework: string,
): HomeworkChecklistItem[] {
  const lines = homework
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/^[-*•]+\s+/, "").replace(/^\d+[.)]\s+/, "").trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  // Single paragraph without newlines → one checklist item
  if (lines.length === 1) {
    return [{ key: itemKey(0, lines[0]!), label: lines[0]! }];
  }

  return lines.map((label, index) => ({
    key: itemKey(index, label),
    label,
  }));
}

export function itemKey(index: number, label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${index}:${slug || "item"}`;
}

export function toggleDoneKeys(
  current: string[] | null | undefined,
  key: string,
  done: boolean,
): string[] {
  const set = new Set(current ?? []);
  if (done) set.add(key);
  else set.delete(key);
  return [...set];
}

export function checklistProgress(
  items: HomeworkChecklistItem[],
  doneKeys: string[] | null | undefined,
): { done: number; total: number } {
  const doneSet = new Set(doneKeys ?? []);
  const done = items.filter((i) => doneSet.has(i.key)).length;
  return { done, total: items.length };
}
