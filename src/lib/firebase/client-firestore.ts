import { getAuth, signInWithCustomToken, type Auth } from "firebase/auth";
import {
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseClientApp, isFirebaseConfigured } from "@/lib/firebase/client";
import type { ThreadMessage } from "@/domain/messages";
import { getFirestoreClientToken } from "@/server/actions/messages";

let authReady: Promise<Auth> | null = null;

export function getClientFirestore(): Firestore {
  return getFirestore(getFirebaseClientApp());
}

/** Sign browser into Firebase Auth so Firestore rules see request.auth. */
export async function ensureClientFirebaseAuth(): Promise<Auth> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured.");
  }
  if (!authReady) {
    authReady = (async () => {
      const auth = getAuth(getFirebaseClientApp());
      if (auth.currentUser) return auth;
      const result = await getFirestoreClientToken();
      if (!result.token) {
        throw new Error(result.error ?? "Could not start live messaging.");
      }
      await signInWithCustomToken(auth, result.token);
      return auth;
    })().catch((err) => {
      authReady = null;
      throw err;
    });
  }
  return authReady;
}

export function subscribeThreadMessages(
  threadId: string,
  onMessages: (messages: ThreadMessage[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  let unsub: Unsubscribe = () => {};
  let cancelled = false;

  void (async () => {
    try {
      await ensureClientFirebaseAuth();
      if (cancelled) return;
      const q = query(
        collection(
          getClientFirestore(),
          "message_threads",
          threadId,
          "messages",
        ),
        orderBy("created_at", "asc"),
      );
      unsub = onSnapshot(
        q,
        (snap) => {
          const messages = snap.docs.map((d) => {
            const data = d.data() as ThreadMessage;
            return { ...data, id: d.id };
          });
          onMessages(messages);
        },
        (err) => {
          console.error("[subscribeThreadMessages]", err);
          onError("Live updates paused. Refresh the page to retry.");
        },
      );
    } catch (err) {
      console.error("[subscribeThreadMessages boot]", err);
      onError(
        err instanceof Error
          ? err.message
          : "Could not connect to live messaging.",
      );
    }
  })();

  return () => {
    cancelled = true;
    unsub();
  };
}
