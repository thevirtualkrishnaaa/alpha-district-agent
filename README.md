# Alpha District — Auto-Posting Agent

Fully automated Instagram posting agent for the Alpha District apparel brand.
AI generates posts → you approve via Telegram → they publish on schedule.

See [BRAND.md](./BRAND.md) for the brand profile and [ROADMAP.md](./ROADMAP.md) for the build plan.

## Architecture
- **Firebase** (Firestore + Storage + Cloud Functions + Cloud Scheduler), Blaze plan.
- **Claude** (Anthropic) writes captions + hashtags.
- **gpt-image-1** (OpenAI) generates visuals (behind a provider interface; swappable).
- **Telegram bot** for the human approval gate.
- **Instagram Graph API** (official Content Publishing) to post.

## Flow
```
generate (cron) → caption + image → upload to Storage → Firestore (pending_review)
   → Telegram notify → you approve → ready
   → publish (cron) → Graph API create container + publish → posted
```

## Layout
```
functions/
  src/
    config.ts        secrets / env
    types.ts         Post model, Pillar, status
    brand.ts         brand constants for prompts
    pillars.ts       content pillars + image/caption briefs
    lib/
      claude.ts      caption generation
      image.ts       image provider interface (OpenAI / Imagen)
      storage.ts     upload → public URL
      firestore.ts   post-queue CRUD
    generate.ts      generation pipeline
    publish.ts       Graph API publish (Phase 5)
    telegram.ts      approval bot (Phase 4)
    index.ts         Cloud Function entry points
```

## Status
Phase 1 scaffold. Not yet runnable — needs credentials (Phase 2). See ROADMAP.
