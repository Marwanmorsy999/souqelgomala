# Task: Fix Wrangler migrations path and commit migration

## Steps
- [x] Edit `wrangler.jsonc` — add `"migrations_dir": "drizzle/migrations"` field
- [x] Run `npx wrangler d1 migrations apply souk-el-gomla-prod --remote`
- [x] Commit & push:
  - `git add drizzle/migrations/0000_wooden_champions.sql wrangler.jsonc`
  - `git commit -m "fix: add migrations_dir to wrangler config, add full schema migration"`
  - `git push origin master`
