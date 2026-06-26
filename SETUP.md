# Go-Live Runbook

Firebase project: **alphadistrictstore**. Do these in order.

> 🔐 **Never paste API keys or tokens into chat.** Set them as Firebase secrets
> in your own terminal (the command prompts for the value). Only non-secret
> values (the IG account ID, the deployed function URL) need sharing.

---

## 1. Instagram token (Graph API Explorer / Facebook-login flow)

App: **Alpha District Poster**. Grab the **App ID + App Secret** from
**App settings → Basic** first (needed for the long-lived exchange + secrets).

### 1a. Generate a user token
1. Open https://developers.facebook.com/tools/explorer (desktop).
2. Top-right **Meta App** dropdown → select **Alpha District Poster**.
3. **Permissions** dropdown → add: `instagram_basic`, `instagram_content_publish`,
   `pages_show_list`, `pages_read_engagement`, `business_management`.
4. Click **Generate Access Token** → authorise → pick your **Page + IG account**.
   → short-lived user token appears in the box.

### 1b. Exchange for a long-lived token (PowerShell)
```
$r = Invoke-RestMethod "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=SHORT_TOKEN"
$r.access_token
```
→ this is your **long-lived user token**.

### 1c. Get the Page token + IG account ID (PowerShell)
```
Invoke-RestMethod "https://graph.facebook.com/v21.0/me/accounts?access_token=LONG_TOKEN" | ConvertTo-Json -Depth 5
```
→ find your Page; note its `id` and its `access_token` (the **Page token** —
use it as IG_ACCESS_TOKEN).
```
Invoke-RestMethod "https://graph.facebook.com/v21.0/PAGE_ID?fields=instagram_business_account&access_token=LONG_TOKEN"
```
→ `instagram_business_account.id` is your **IG_USER_ID** (not secret — share it).

---

## 2. Telegram chat ID
1. Send any message to your bot in Telegram.
2. Run:
```
curl "https://api.telegram.org/bot<BOT_TOKEN>/getUpdates"
```
→ `result[0].message.chat.id` is your **TELEGRAM_CHAT_ID**.

---

## 3. Set the 6 secrets
Run each (it prompts for the value):
```
cd "C:/Users/saikr/Desktop/AlphaDistrict"
firebase functions:secrets:set ANTHROPIC_API_KEY
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set IG_ACCESS_TOKEN      # long-lived IG token from the script
firebase functions:secrets:set IG_USER_ID           # user_id from the script
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
firebase functions:secrets:set TELEGRAM_CHAT_ID
```

---

## 4. Deploy
```
firebase deploy --only functions
```
First deploy auto-enables required Google APIs (Cloud Functions, Build, Artifact
Registry, Scheduler, Eventarc, Secret Manager) — accept the prompts.
Note the printed **telegramWebhook** URL.

## 5. Wire the Telegram webhook
```
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<TELEGRAM_WEBHOOK_URL>"
```

## 6. Test end-to-end
- Firebase console → Functions → Cloud Scheduler → **Run now** on
  `generateDailyPost`.
- You should get a Telegram message with the post + Approve/Reject buttons.
- Approve it, then **Run now** on `publishReadyPost` → it should appear on Instagram.

Once verified, the weekday crons (generate 9am / publish 5pm London) run on their own.
