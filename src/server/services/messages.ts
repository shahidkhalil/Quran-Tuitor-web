import {
  messagePreview,
  threadUniqueKey,
  type MessageThread,
  type ThreadMessage,
} from "@/domain/messages";
import { COLLECTIONS, db, docId, nowIso } from "@/lib/firebase/db";

export async function ensureMessageThread(input: {
  parentId: string;
  tutorId: string;
  learnerId: string;
  source: MessageThread["source"];
}): Promise<MessageThread> {
  const uniqueKey = threadUniqueKey(
    input.parentId,
    input.tutorId,
    input.learnerId,
  );
  const existing = await db()
    .collection(COLLECTIONS.messageThreads)
    .where("unique_key", "==", uniqueKey)
    .limit(1)
    .get();

  if (!existing.empty) {
    const doc = existing.docs[0]!;
    return { ...(doc.data() as MessageThread), id: doc.id };
  }

  const stamp = nowIso();
  const id = docId();
  const thread: MessageThread = {
    id,
    unique_key: uniqueKey,
    parent_id: input.parentId,
    tutor_id: input.tutorId,
    learner_id: input.learnerId,
    participant_ids: [input.parentId, input.tutorId],
    source: input.source,
    last_message_at: null,
    last_message_preview: null,
    last_sender_id: null,
    created_at: stamp,
    updated_at: stamp,
  };
  await db().collection(COLLECTIONS.messageThreads).doc(id).set(thread);
  return thread;
}

export async function appendThreadMessage(input: {
  thread: MessageThread;
  senderId: string;
  senderRole: ThreadMessage["sender_role"];
  body: string;
}): Promise<ThreadMessage> {
  const stamp = nowIso();
  const messageId = docId();
  const message: ThreadMessage = {
    id: messageId,
    thread_id: input.thread.id,
    sender_id: input.senderId,
    sender_role: input.senderRole,
    body: input.body,
    created_at: stamp,
  };

  const threadRef = db()
    .collection(COLLECTIONS.messageThreads)
    .doc(input.thread.id);
  const msgRef = threadRef.collection("messages").doc(messageId);

  const batch = db().batch();
  batch.set(msgRef, message);
  batch.set(
    threadRef,
    {
      last_message_at: stamp,
      last_message_preview: messagePreview(input.body),
      last_sender_id: input.senderId,
      updated_at: stamp,
    },
    { merge: true },
  );
  await batch.commit();
  return message;
}

/** Epic 7 ready: admin/support can load full thread history. */
export async function listThreadMessagesForAdmin(
  threadId: string,
  limit = 200,
): Promise<ThreadMessage[]> {
  const snap = await db()
    .collection(COLLECTIONS.messageThreads)
    .doc(threadId)
    .collection("messages")
    .orderBy("created_at", "asc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ ...(d.data() as ThreadMessage), id: d.id }));
}
