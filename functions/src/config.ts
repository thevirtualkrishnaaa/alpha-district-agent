import { defineSecret } from "firebase-functions/params";

// Secrets are set with: firebase functions:secrets:set <NAME>
// They are injected into functions that declare them in their runWith/options.
export const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");
export const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");
export const IG_ACCESS_TOKEN = defineSecret("IG_ACCESS_TOKEN"); // long-lived IG token
export const IG_USER_ID = defineSecret("IG_USER_ID"); // IG user_id (from /me)
export const TELEGRAM_BOT_TOKEN = defineSecret("TELEGRAM_BOT_TOKEN");
export const TELEGRAM_CHAT_ID = defineSecret("TELEGRAM_CHAT_ID");

// Non-secret tunables.
export const CONFIG = {
  // Caption model — Sonnet is plenty for captions and cheaper than Opus.
  captionModel: "claude-sonnet-4-6",
  // Image model + size.
  imageModel: "gpt-image-1",
  imageSize: "1024x1024" as const,
  // Timezone for scheduling (London).
  timezone: "Europe/London",
  // How far ahead a generated post is scheduled to publish (hours).
  publishLeadHours: 20,
};
