# Social Feed Auto-Sync (Facebook · Instagram · TikTok)

The storefront `SocialFeed` section renders posts from the `social_posts` D1
table. Posts can be added manually in the admin dashboard **or** auto-synced
from the official platform APIs. This document explains how to enable the
auto-sync (the app ships without credentials, so it degrades gracefully to
manual posts + profile links until you configure them).

## How it works

```
Cron trigger ("*/30 * * * *" in wrangler.jsonc)
   │
   ▼
worker.js → scheduled handler → syncAllSocial()
   │  per platform, only if its credentials are set:
   ├── Facebook  → Graph API  /{page-id}/feed  (+ photos)
   ├── Instagram → Graph API  /{ig-user}/media
   └── TikTok    → Display API /v2/video/list/  (refresh + bearer)
   ▼
Normalize → upsert into D1 keyed by external_id (idempotent).
Manual posts (is_synced=0) are NEVER overwritten.
   ▼
KV cache (catalog:social) invalidated → homepage re-renders live posts.
```

Each platform short-circuits to an empty list when its secrets are missing, so
a partially-configured deployment never errors.

## 1. Meta (Facebook + Instagram)

Both platforms use the **Meta Graph API** with a single long-lived Page/IG
access token.

1. Go to [developers.facebook.com](https://developers.facebook.com) → **My Apps**
   → **Create App** (type: *Business* or *Consumer*).
2. Add the **Facebook Login** and **Instagram Graph API** products.
3. In **App Settings → Basic**, note the **App ID** / **App Secret**.
4. Create a **Meta Business Page** (if you don't have one) and connect your
   Instagram Business/Creator account to it (Page → *Linked Accounts* /
   Instagram).
5. Get a **long-lived Page access token** with these permissions:
   - `pages_read_engagement` (Facebook feed + photos)
   - `instagram_graph_user_media` (Instagram media)
   Use the [Graph API Explorer](https://developers.facebook.com/tools/explorer)
   to generate a short-lived token, then exchange it for a long-lived token via:
   `GET https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=…&client_secret=…&fb_exchange_token=…`
6. Note your **Page ID** (`GET /me/accounts` on the Graph API with the token)
   and your **Instagram User ID** (`GET /{page-id}?fields=instagram_business_account`).

## 2. TikTok (Display API — your own videos)

The Display API only returns the **authenticated author's own videos**.

1. Go to [developers.tiktok.com](https://developers.tiktok.com) → **Console** →
   **Manage Apps** → **Create App** (type: *Web App*).
2. Add the **Display API** product and request the `video.list` scope.
3. Complete the OAuth flow (PKCE) with your own account to obtain:
   - `client_key`, `client_secret`
   - a `refresh_token` (and note your `open_id`)
4. The app stores the refresh token; the sync service exchanges it for a
   short-lived access token on every run.

> Until your Display API app passes review, tokens may be dev-only / short-lived.
> That is expected — the sync simply no-ops (or logs a soft error) until then.

## 3. Set the secrets

Use `wrangler secret put` (these are runtime-only and never bundled to the
client, never prefixed `NEXT_PUBLIC_`):

```bash
# Meta (Facebook + Instagram) — one shared long-lived token
wrangler secret put META_ACCESS_TOKEN
wrangler secret put META_PAGE_ID
wrangler secret put META_INSTAGRAM_USER_ID

# TikTok Display API
wrangler secret put TIKTOK_CLIENT_KEY
wrangler secret put TIKTOK_CLIENT_SECRET
wrangler secret put TIKTOK_REFRESH_TOKEN
wrangler secret put TIKTOK_OPEN_ID
```

For local dev, add the same keys to `.dev.vars` (git-ignored). The app reads
them from the Cloudflare context symbol in the Worker.

## 4. Populate the feed

Two ways:

- **Manual**: open the admin **Social → مزامنة الآن** ("Sync now") button.
  It calls `POST /api/admin/social/sync` (RBAC `social.write`) and reports how
  many posts were inserted / updated / skipped.
- **Cron**: every 30 minutes the deployed Worker's `scheduled` handler runs the
  same sync automatically.

After syncing, reload the homepage — the newest posts appear with thumbnails and
platform badges, opening the real permalinks. Manual "عرض النهارده" posts always
surface first; synced posts keep `featured=false` so curation wins.

## 5. Verification

- `npm run build && node_modules/.bin/opennextjs-cloudflare build` succeeds
  **without** any secret (sync no-ops when missing).
- With secrets set, click **Sync now** → posts persist in D1, KV cache
  invalidated, homepage updates.
- `wrangler dev --test-scheduled` (or deploy a preview) to trigger the cron path.

## Files

- `src/lib/env.ts` — server-only secret getters (`META_*`, `TIKTOK_*`).
- `src/services/social-sync/*` — per-platform sync + orchestrator + D1 upsert.
- `worker.js` — custom Worker entry adding the `scheduled` handler.
- `wrangler.jsonc` — `main: ./worker.js` + `triggers.crons` social-sync entry.
- `drizzle/migrations/0007_social_sync.sql` — `external_id` / `sync_source` /
  `is_synced` columns (also added at runtime via `ensureSocialTable`).
