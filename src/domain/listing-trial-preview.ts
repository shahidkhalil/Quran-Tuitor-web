import {
  groupSlotsByDay,
  type TrialSlotOption,
} from "@/domain/trials";

/** Limit preview for listing page — booking page still shows the full set. */
export function previewTrialSlots(
  slots: TrialSlotOption[],
  maxSlots = 8,
): TrialSlotOption[] {
  return slots.slice(0, maxSlots);
}

export function previewSlotsByDay(
  slots: TrialSlotOption[],
  maxSlots = 8,
): ReturnType<typeof groupSlotsByDay> {
  return groupSlotsByDay(previewTrialSlots(slots, maxSlots));
}
