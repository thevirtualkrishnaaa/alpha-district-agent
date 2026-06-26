import { getStorage } from "firebase-admin/storage";
import { randomUUID } from "crypto";

// Saves image bytes to the default bucket and returns a public Firebase download
// URL. The Instagram Graph API fetches the media from this URL, so it must be
// publicly reachable. We use a Firebase download token (no signing / IAM needed).
export async function uploadImage(
  bytes: Buffer,
  postId: string
): Promise<{ path: string; url: string }> {
  const bucket = getStorage().bucket();
  const path = `posts/${postId}.png`;
  const file = bucket.file(path);
  const token = randomUUID();

  await file.save(bytes, {
    contentType: "image/png",
    resumable: false,
    metadata: {
      cacheControl: "public, max-age=86400",
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });

  const url =
    `https://firebasestorage.googleapis.com/v0/b/${bucket.name}` +
    `/o/${encodeURIComponent(path)}?alt=media&token=${token}`;

  return { path, url };
}
