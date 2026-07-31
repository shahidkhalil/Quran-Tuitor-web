import {
  shouldSend15mReminder,
  shouldSend24hReminder,
} from "./lesson-reminders";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const start = new Date("2026-08-01T12:00:00.000Z");

{
  const now = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  assert(shouldSend24hReminder(start.toISOString(), now, false), "24h at -24h");
  assert(
    !shouldSend24hReminder(start.toISOString(), now, true),
    "24h skipped when sent",
  );
}

{
  const now = new Date(start.getTime() - 10 * 60 * 1000);
  assert(shouldSend15mReminder(start.toISOString(), now, false), "15m at -10m");
  assert(
    !shouldSend24hReminder(start.toISOString(), now, false),
    "not 24h at -10m",
  );
}

{
  const now = new Date(start.getTime() + 60 * 1000);
  assert(!shouldSend15mReminder(start.toISOString(), now, false), "not after start");
}

console.log("lesson-reminders ok");
