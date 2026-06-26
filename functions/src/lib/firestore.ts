import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { Post, PostStatus } from "../types";

const COLLECTION = "posts";
// This project's Firestore database was created with the id "default" (a named
// database), not the special "(default)" one, so target it explicitly.
const DATABASE_ID = "default";

export function db() {
  return getFirestore(DATABASE_ID);
}

function col() {
  return db().collection(COLLECTION);
}

export async function createPost(
  post: Omit<Post, "id" | "createdAt" | "updatedAt">
): Promise<Post> {
  const now = Date.now();
  const ref = col().doc();
  const full: Post = { ...post, id: ref.id, createdAt: now, updatedAt: now };
  await ref.set(full);
  return full;
}

export async function updatePost(
  id: string,
  patch: Partial<Post>
): Promise<void> {
  await col().doc(id).set({ ...patch, updatedAt: Date.now() }, { merge: true });
}

export async function setStatus(id: string, status: PostStatus): Promise<void> {
  await updatePost(id, { status });
}

export async function getPost(id: string): Promise<Post | null> {
  const snap = await col().doc(id).get();
  return snap.exists ? (snap.data() as Post) : null;
}

// Next approved post waiting to publish. Picks one "ready" post; the publish
// cron controls timing, and the approval gate controls what goes out, so we
// don't gate on scheduledFor here (also keeps the query to a single-field index).
export async function getNextReadyPost(): Promise<Post | null> {
  const snap = await col().where("status", "==", "ready").limit(1).get();
  return snap.empty ? null : (snap.docs[0].data() as Post);
}

export { FieldValue };
