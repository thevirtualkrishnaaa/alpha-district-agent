import axios from "axios";
import { db } from "./firestore";

// Instagram API with Instagram Login uses the graph.instagram.com host and a
// long-lived Instagram user access token (refreshed every ~60 days).
const GRAPH = "https://graph.instagram.com/v21.0";
const REFRESH_URL = "https://graph.instagram.com/refresh_access_token";
const TOKEN_DOC = "config/instagram";

// The long-lived token is rotated periodically, so the live value lives in
// Firestore. Falls back to the secret-provided token on first run.
export async function getAccessToken(secretToken: string): Promise<string> {
  const snap = await db().doc(TOKEN_DOC).get();
  const stored = snap.exists ? (snap.data()?.accessToken as string) : undefined;
  return stored || secretToken;
}

// Publishes a single image post. Two-step: create a media container, wait for
// it to finish processing, then publish it.
export async function publishPhoto(opts: {
  igUserId: string;
  accessToken: string;
  imageUrl: string;
  caption: string;
}): Promise<{ containerId: string; mediaId: string }> {
  const { igUserId, accessToken, imageUrl, caption } = opts;

  const create = await axios.post(`${GRAPH}/${igUserId}/media`, null, {
    params: { image_url: imageUrl, caption, access_token: accessToken },
  });
  const containerId: string = create.data.id;

  await waitForContainer(containerId, accessToken);

  const publish = await axios.post(`${GRAPH}/${igUserId}/media_publish`, null, {
    params: { creation_id: containerId, access_token: accessToken },
  });

  return { containerId, mediaId: publish.data.id };
}

async function waitForContainer(
  containerId: string,
  accessToken: string,
  attempts = 10
): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    const res = await axios.get(`${GRAPH}/${containerId}`, {
      params: { fields: "status_code", access_token: accessToken },
    });
    const status = res.data.status_code;
    if (status === "FINISHED") return;
    if (status === "ERROR") throw new Error("IG media container failed");
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("IG media container not ready in time");
}

// Refreshes a long-lived Instagram token (valid 60 days, refreshable after 24h).
// No app secret needed for the Instagram-login refresh — just the live token.
export async function refreshLongLivedToken(currentToken: string): Promise<void> {
  const res = await axios.get(REFRESH_URL, {
    params: { grant_type: "ig_refresh_token", access_token: currentToken },
  });
  const accessToken: string = res.data.access_token;
  const expiresIn: number = res.data.expires_in ?? 0;
  await db().doc(TOKEN_DOC).set(
    {
      accessToken,
      refreshedAt: Date.now(),
      expiresAt: Date.now() + expiresIn * 1000,
    },
    { merge: true }
  );
}
