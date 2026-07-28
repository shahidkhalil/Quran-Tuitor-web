export const MESSAGE_BODY_MAX_CHARS = 2000;

export type MessageThread = {
  id: string;
  /** Deterministic: parent_id_tutor_id_learner_id */
  unique_key: string;
  parent_id: string;
  tutor_id: string;
  learner_id: string;
  /** parent_id + tutor_id — for rules and queries */
  participant_ids: string[];
  source: "trial" | "paid" | "relationship";
  last_message_at: string | null;
  last_message_preview: string | null;
  last_sender_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ThreadMessage = {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_role: "parent" | "adult" | "tutor" | "admin";
  body: string;
  created_at: string;
};

export function threadUniqueKey(
  parentId: string,
  tutorId: string,
  learnerId: string,
): string {
  return `${parentId}_${tutorId}_${learnerId}`;
}

export function normalizeMessageBody(raw: string): {
  ok: true;
  body: string;
} | { ok: false; error: string } {
  const body = raw.replace(/\r\n/g, "\n").trim();
  if (!body) return { ok: false, error: "Message cannot be empty." };
  if (body.length > MESSAGE_BODY_MAX_CHARS) {
    return {
      ok: false,
      error: `Keep messages under ${MESSAGE_BODY_MAX_CHARS} characters.`,
    };
  }
  return { ok: true, body };
}

export function messagePreview(body: string, max = 80): string {
  const oneLine = body.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max - 1)}…`;
}

/** Soft nudge — never instruct off-platform payment. */
export const MESSAGES_SAFETY_COPY =
  "Keep scheduling and payments on the platform. Never share card details or ask to pay outside Quran Tutor Marketplace.";
