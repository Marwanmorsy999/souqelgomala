# Authentication (Cloudflare-native, no Supabase)

Authentication is implemented in `src/services/auth.ts` on top of D1
(`profiles`, `sessions`, `auth_audit_logs`) and Web Crypto.

---

## Passwords

- Hash: **PBKDF2-HMAC-SHA-256**, 100,000 iterations, 16-byte random salt.
- Stored format: `base64(salt(16) || derivedKey(32))`.
- Implemented in `src/lib/crypto.ts` (`hashPassword` / `verifyPassword`) —
  pure Web Crypto, works on Workers and Node.
- Raw passwords are **never** stored or logged.

## Sessions

1. On login a cryptographically-random **opaque token** is produced
   (`generateOpaqueToken`).
2. Only the **SHA-256 hash** of the token is stored in `sessions.session_token`.
3. The raw token is placed in an **HttpOnly** cookie (`souk_session`),
   `Secure` in production, `SameSite=Lax`, 7-day expiry.
4. `getUserFromSession()` hashes the cookie value and looks it up in D1.
5. `logoutAction()` deletes the session row and clears the cookie.

## Server Actions / Guards

- `requireAuth()` — redirects to `/admin/login` when no valid session.
- `requireRole(roles)` — additionally enforces a role allow-list.
- Route Handlers should check `getUserFromSession()` directly.

## CSRF & Turnstile

- `loginAction` verifies a CSRF cookie/token pair.
- `verifyTurnstile` validates the Turnstile token **server-side**; a
  client-supplied “passed” boolean is never trusted.

---

## Creating the first OWNER account

There is intentionally **no public admin registration page**. Create the first
account with the seed script (see `scripts/seed-admin.ts`):

```bash
SEED_ADMIN_EMAIL=owner@example.com SEED_ADMIN_PASSWORD='very-strong-password' pnpm seed:admin
```

This writes `drizzle/seed-admin.sql` (INSERT OR IGNORE + UPDATE by email) with
a properly hashed password. Apply it to a database:

```bash
wrangler d1 execute DB --local  --file=drizzle/seed-admin.sql
wrangler d1 execute DB --remote --file=drizzle/seed-admin.sql
```

Re-running the script refreshes the password of an existing owner account.

---

## RBAC

Server-side authorization lives in `src/lib/permissions.ts`. Roles:

| Role       | Access                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| **owner**  | Full access; can manage employees, settings, system/backup operations |
| **manager**| Read/write operational data; **cannot** manage employees/settings    |
| **employee**| Read orders/products/customers; update allowed order statuses       |

Every protected mutation must validate: session → role → permission → Zod
schema. Never trust the client for authorization.
