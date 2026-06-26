import axios from "axios";
import { Post } from "../types";

const api = (token: string, method: string) =>
  `https://api.telegram.org/bot${token}/${method}`;

// Sends a generated post to the reviewer with Approve / Reject buttons.
export async function sendForApproval(
  token: string,
  chatId: string,
  post: Post
): Promise<number> {
  const caption =
    `🆕 ${post.pillar}\n\n${post.caption}\n\n${post.hashtags.join(" ")}`.slice(
      0,
      1024
    );

  const res = await axios.post(api(token, "sendPhoto"), {
    chat_id: chatId,
    photo: post.imageUrl,
    caption,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Approve", callback_data: `approve:${post.id}` },
          { text: "❌ Reject", callback_data: `reject:${post.id}` },
        ],
      ],
    },
  });

  return res.data.result.message_id as number;
}

export interface TelegramCallback {
  action: "approve" | "reject";
  postId: string;
  callbackQueryId: string;
  chatId: number;
  messageId: number;
}

export function parseCallback(update: any): TelegramCallback | null {
  const cb = update?.callback_query;
  if (!cb?.data) return null;
  const [action, postId] = String(cb.data).split(":");
  if (action !== "approve" && action !== "reject") return null;
  return {
    action,
    postId,
    callbackQueryId: cb.id,
    chatId: cb.message.chat.id,
    messageId: cb.message.message_id,
  };
}

export async function answerCallback(
  token: string,
  callbackQueryId: string,
  text: string
): Promise<void> {
  await axios.post(api(token, "answerCallbackQuery"), {
    callback_query_id: callbackQueryId,
    text,
  });
}

// Removes the buttons after a decision and appends the outcome.
export async function markDecided(
  token: string,
  chatId: number,
  messageId: number,
  outcome: string
): Promise<void> {
  await axios.post(api(token, "editMessageReplyMarkup"), {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: { inline_keyboard: [[{ text: outcome, callback_data: "noop" }]] },
  });
}
