export const AGE_BANDS = [
  { value: "4-6", label: "Ages 4–6" },
  { value: "7-9", label: "Ages 7–9" },
  { value: "10-12", label: "Ages 10–12" },
  { value: "13-16", label: "Ages 13–16" },
  { value: "adult", label: "Adult" },
] as const;

export type AgeBand = (typeof AGE_BANDS)[number]["value"];

export type LearnerProfile = {
  id: string;
  parent_id: string;
  display_name: string;
  age_band: AgeBand | null;
  is_adult_self: boolean;
  level_goals: string | null;
  gender_preference_notes: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export function ageBandLabel(band: string | null | undefined): string {
  if (!band) return "Not set";
  return AGE_BANDS.find((b) => b.value === band)?.label ?? band;
}
