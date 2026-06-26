# Alpha District — Auto-Posting Agent · Roadmap

## Decided architecture
- **Route:** Official Instagram Graph API (Content Publishing). NOT browser automation.
- **Hosting:** Firebase — Firestore + Storage + Cloud Functions + Cloud Scheduler (Blaze plan).
- **Language:** Node / TypeScript.
- **Content:** AI-generated — Claude API (captions/hashtags) + AI image API (aesthetic/manga visuals).
- **Cadence:** 5x/week, generated ~1 day ahead.
- **Approval gate:** Telegram bot with ✅/❌ inline buttons before anything publishes.
- **Token refresh:** scheduled function auto-renews long-lived IG token (~every 50 days).

## Flow
generate (Claude + image API → upload to Storage → Firestore `pending_review`)
→ Telegram notify → approve → `ready`
→ publish (Graph API: create container → publish) → `posted`

## Phases

### Phase 0 — Brand identity assets  ← START HERE
- [ ] Finalise color palette (deep purple + orange + near-black)
- [ ] Pick fonts (display + body)
- [ ] Create the "A" logo / wordmark
- [ ] Lock these into BRAND.md

### Phase 1 — Project scaffold  ✅ DONE
- [x] Create project folder + BRAND.md + ROADMAP.md
- [x] Firebase config (firebase.json, firestore/storage rules), TS Functions skeleton
- [x] Firestore data model for the post queue (types.ts, lib/firestore.ts)
- [x] Compiles clean (npm run build)

Note: generation (Phase 3), Telegram approval (Phase 4), and publish + token
refresh (Phase 5) logic are all written and type-checked. They go LIVE once
Phase 2 credentials are in and we deploy + wire the Telegram webhook + crons.

### Phase 2 — Accounts & credentials (USER actions, guided)
- [ ] IG account is Business/Creator + linked to a Facebook Page
- [ ] Meta Developer App (App ID + Secret)
- [ ] Instagram Graph API product + `instagram_content_publish` permission
- [ ] Long-lived access token
- [ ] Firebase on Blaze plan
- [ ] Anthropic API key
- [ ] Image-gen API key
- [ ] Telegram bot token + chat ID

### Phase 3 — Generation function
- [ ] Claude prompt that reads BRAND.md + rotates content pillars → caption + hashtags
- [ ] Image generation per pillar → upload to Storage (public URL)
- [ ] Write post to Firestore `pending_review`

### Phase 4 — Approval (Telegram)
- [ ] Bot sends image + caption with ✅/❌ buttons
- [ ] Callback updates Firestore status (`ready` / `rejected`)

### Phase 5 — Publish function
- [ ] Pull next `ready` post → Graph API create container → publish
- [ ] Mark `posted`, log result, handle errors/retries
- [ ] Token-refresh scheduled function

### Phase 6 — Schedule & go live
- [ ] Cloud Scheduler crons (generate + publish on weekday cadence)
- [ ] End-to-end dry run, then live
