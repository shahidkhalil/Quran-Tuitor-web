import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HIFZ_SURAHS,
  summarizeHifz,
  upsertHifzEntry,
  validateHifzEntryInput,
} from "./hifz-tracker";

describe("hifz-tracker", () => {
  it("has 114 surahs", () => {
    assert.equal(HIFZ_SURAHS.length, 114);
    assert.equal(HIFZ_SURAHS[0]?.name, "Al-Fatiha");
    assert.equal(HIFZ_SURAHS[113]?.n, 114);
  });

  it("validates ayah bounds", () => {
    const bad = validateHifzEntryInput({
      surahNumber: 1,
      status: "in_progress",
      ayahReached: "99",
      notes: "",
    });
    assert.equal(bad.ok, false);

    const ok = validateHifzEntryInput({
      surahNumber: 112,
      status: "memorized",
      ayahReached: "",
      notes: "Solid",
    });
    assert.equal(ok.ok, true);
    if (ok.ok) {
      assert.equal(ok.entry.ayah_reached, 4);
      assert.equal(ok.entry.notes, "Solid");
    }
  });

  it("upserts and summarizes", () => {
    const entries = upsertHifzEntry([], {
      surah_number: 1,
      status: "memorized",
      ayah_reached: 7,
      notes: null,
      updated_at: "2026-01-01T00:00:00.000Z",
    });
    const next = upsertHifzEntry(entries, {
      surah_number: 114,
      status: "in_progress",
      ayah_reached: 2,
      notes: null,
      updated_at: "2026-01-02T00:00:00.000Z",
    });
    const summary = summarizeHifz(next);
    assert.equal(summary.memorized, 1);
    assert.equal(summary.inProgress, 1);
    assert.equal(summary.percentMemorized, 1);
  });
});
