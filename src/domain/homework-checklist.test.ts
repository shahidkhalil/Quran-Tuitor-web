import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  checklistProgress,
  parseHomeworkChecklistItems,
  toggleDoneKeys,
} from "./homework-checklist";

describe("homework-checklist", () => {
  it("parses bullet and numbered lines", () => {
    const items = parseHomeworkChecklistItems(
      "- Practice Surah Al-Fatiha\n• Review madd rules\n1. Read page 12",
    );
    assert.equal(items.length, 3);
    assert.equal(items[0]?.label, "Practice Surah Al-Fatiha");
    assert.equal(items[2]?.label, "Read page 12");
  });

  it("treats a single paragraph as one item", () => {
    const items = parseHomeworkChecklistItems("Practice Juz Amma daily.");
    assert.equal(items.length, 1);
    assert.equal(items[0]?.label, "Practice Juz Amma daily.");
  });

  it("toggles done keys and reports progress", () => {
    const items = parseHomeworkChecklistItems("A\nB\nC");
    const keys = toggleDoneKeys([], items[0]!.key, true);
    assert.deepEqual(keys, [items[0]!.key]);
    const removed = toggleDoneKeys(keys, items[0]!.key, false);
    assert.deepEqual(removed, []);
    const progress = checklistProgress(items, [items[1]!.key]);
    assert.deepEqual(progress, { done: 1, total: 3 });
  });
});
