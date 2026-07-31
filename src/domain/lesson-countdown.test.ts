import {
  countdownJoinVisible,
  formatCountdown,
  pickNextCountdownLesson,
} from "./lesson-countdown";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const base = {
  id: "1",
  slot_start: "2026-08-01T12:00:00.000Z",
  slot_end: "2026-08-01T12:45:00.000Z",
  partyLabel: "Aisha",
  meeting_url: "https://meet.example/x",
  kind: "paid" as const,
};

{
  const now = new Date("2026-08-01T11:50:00.000Z").getTime();
  const next = pickNextCountdownLesson([base], now);
  assert(next?.id === "1", "picks upcoming");
  assert(countdownJoinVisible(base.slot_start, base.slot_end, now), "join open");
}

{
  const now = new Date("2026-07-01T12:00:00.000Z").getTime();
  assert(
    !countdownJoinVisible(base.slot_start, base.slot_end, now),
    "join closed far away",
  );
}

assert(formatCountdown(90_000) === "1m 30s", "format mmss");
assert(formatCountdown(3_600_000 + 60_000).includes("1h"), "format hour");

console.log("lesson-countdown ok");
