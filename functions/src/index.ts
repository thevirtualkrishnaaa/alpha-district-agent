import { initializeApp } from "firebase-admin/app";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";

import {
  ANTHROPIC_API_KEY,
  OPENAI_API_KEY,
  IG_ACCESS_TOKEN,
  IG_USER_ID,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  CONFIG,
} from "./config";
import { generatePost } from "./generate";
import { getNextReadyPost, getPost, setStatus, updatePost } from "./lib/firestore";
import {
  getAccessToken,
  publishPhoto,
  refreshLongLivedToken,
} from "./lib/instagram";
import {
  sendForApproval,
  parseCallback,
  answerCallback,
  markDecided,
} from "./lib/telegram";

initializeApp();

// 1) GENERATE — weekday mornings. Produces a post and sends it for approval.
export const generateDailyPost = onSchedule(
  {
    schedule: "0 9 * * 1,3,5", // Mon/Wed/Fri 09:00 — gentler cadence for a new account
    timeZone: CONFIG.timezone,
    secrets: [ANTHROPIC_API_KEY, OPENAI_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID],
    timeoutSeconds: 300,
    memory: "1GiB",
  },
  async () => {
    const post = await generatePost({
      anthropic: ANTHROPIC_API_KEY.value(),
      openai: OPENAI_API_KEY.value(),
    });
    const messageId = await sendForApproval(
      TELEGRAM_BOT_TOKEN.value(),
      TELEGRAM_CHAT_ID.value(),
      post
    );
    await updatePost(post.id, { telegramMessageId: messageId });
    logger.info("Generated post for review", { id: post.id, pillar: post.pillar });
  }
);

// 2) APPROVE — Telegram webhook. Approving publishes to Instagram immediately.
export const telegramWebhook = onRequest(
  { secrets: [TELEGRAM_BOT_TOKEN, IG_ACCESS_TOKEN, IG_USER_ID], timeoutSeconds: 120 },
  async (req, res) => {
    const cb = parseCallback(req.body);
    if (!cb) {
      res.sendStatus(200);
      return;
    }
    const token = TELEGRAM_BOT_TOKEN.value();
    const post = await getPost(cb.postId);
    if (!post) {
      await answerCallback(token, cb.callbackQueryId, "Post not found");
      res.sendStatus(200);
      return;
    }

    // Skip only if it's already posted or a publish is in flight (the latter
    // guards against Telegram re-delivering the same callback). A post still in
    // pending_review / ready / failed can still be approved & published.
    if (post.status === "posted" || post.status === "publishing") {
      await answerCallback(token, cb.callbackQueryId, "Already handled");
      res.sendStatus(200);
      return;
    }

    if (cb.action === "reject") {
      await setStatus(cb.postId, "rejected");
      await answerCallback(token, cb.callbackQueryId, "Rejected ❌");
      await markDecided(token, cb.chatId, cb.messageId, "❌ Rejected");
      res.sendStatus(200);
      return;
    }

    // Approve → publish to Instagram right now.
    if (!post.imageUrl) {
      await answerCallback(token, cb.callbackQueryId, "Missing image");
      res.sendStatus(200);
      return;
    }
    await answerCallback(token, cb.callbackQueryId, "Publishing… ⏳");
    await setStatus(cb.postId, "publishing"); // guard so a retry won't double-post
    try {
      const accessToken = await getAccessToken(IG_ACCESS_TOKEN.value());
      const { containerId, mediaId } = await publishPhoto({
        igUserId: IG_USER_ID.value(),
        accessToken,
        imageUrl: post.imageUrl,
        caption: `${post.caption}\n\n${post.hashtags.join(" ")}`,
      });
      await updatePost(cb.postId, {
        status: "posted",
        igContainerId: containerId,
        igMediaId: mediaId,
      });
      await markDecided(token, cb.chatId, cb.messageId, "✅ Posted to Instagram");
      logger.info("Published on approval", { id: cb.postId, mediaId });
    } catch (err: any) {
      await updatePost(cb.postId, { status: "failed", error: String(err?.message ?? err) });
      await markDecided(token, cb.chatId, cb.messageId, "⚠️ Publish failed");
      logger.error("Approval publish failed", { id: cb.postId, err });
    }
    res.sendStatus(200);
  }
);

// 3) PUBLISH — weekday afternoons. Posts the next approved item that is due.
export const publishReadyPost = onSchedule(
  {
    schedule: "0 17 * * 1-5",
    timeZone: CONFIG.timezone,
    secrets: [IG_ACCESS_TOKEN, IG_USER_ID],
    timeoutSeconds: 300,
  },
  async () => {
    const post = await getNextReadyPost();
    if (!post || !post.imageUrl) {
      logger.info("No ready post to publish");
      return;
    }
    try {
      const accessToken = await getAccessToken(IG_ACCESS_TOKEN.value());
      const { containerId, mediaId } = await publishPhoto({
        igUserId: IG_USER_ID.value(),
        accessToken,
        imageUrl: post.imageUrl,
        caption: `${post.caption}\n\n${post.hashtags.join(" ")}`,
      });
      await updatePost(post.id, {
        status: "posted",
        igContainerId: containerId,
        igMediaId: mediaId,
      });
      logger.info("Published post", { id: post.id, mediaId });
    } catch (err: any) {
      await updatePost(post.id, { status: "failed", error: String(err?.message ?? err) });
      logger.error("Publish failed", { id: post.id, err });
      throw err;
    }
  }
);

// 4) TOKEN REFRESH — monthly. Keeps the long-lived IG token from expiring.
export const refreshIgToken = onSchedule(
  {
    schedule: "0 3 1 * *",
    timeZone: CONFIG.timezone,
    secrets: [IG_ACCESS_TOKEN],
  },
  async () => {
    const current = await getAccessToken(IG_ACCESS_TOKEN.value());
    await refreshLongLivedToken(current);
    logger.info("Refreshed IG access token");
  }
);
