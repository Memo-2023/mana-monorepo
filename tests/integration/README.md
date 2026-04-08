# Integration tests

End-to-end tests that exercise real services against real Postgres + Redis + a fake SMTP server (Mailpit), via `docker-compose.test.yml`.

## What's covered

| File | Flow under test |
|------|----------|
| `auth-flow.test.ts` | register → email verification (via Mailpit) → login → JWT validation → `/me/data` → encryption vault init/key → logout |

## Running locally

```bash
./scripts/run-integration-tests.sh
```

That script:

1. Brings up `docker-compose.test.yml` (postgres, redis, mailpit, mana-auth, mana-notify) on isolated ports (`5443`, `6390`, `8026`, `3091`, `3092`)
2. Waits for everything to be healthy
3. Pushes the `@mana/auth` Drizzle schema into the test database
4. Applies the encryption-vault SQL migrations (`002_encryption_vaults.sql`, `003_recovery_wrap.sql`)
5. Runs `bun test auth-flow.test.ts` from this directory
6. Tears the stack down on exit (success or failure)

The whole thing runs in well under a minute on a warm Docker cache.

## Mailpit web UI

While the stack is up you can also browse incoming mail manually at <http://127.0.0.1:8026>.

## Why this exists

Bugs caught by this test the first time it ran:

- `services/mana-auth` imported `nanoid` but didn't declare it in its `package.json` → `Cannot find package 'nanoid'` at startup, register endpoint 500'd. Local `pnpm install` resolved it transitively via `postcss → nanoid@3.3.11`, an isolated container build couldn't.
- `MANA_AUTH_KEK` was never passed through to the mana-auth container in `docker-compose.macmini.yml`, so the prod service hard-failed at startup with `MANA_AUTH_KEK env var is required in production`.
- The encryption-vault SQL migrations (`002`, `003`) had never been applied to prod Postgres, so any vault endpoint 500'd with `relation "auth.encryption_vaults" does not exist`.
- `/api/v1/auth/login` minted a JWT by reconstructing the session cookie under the wrong name (`mana.session_token` instead of `__Secure-mana.session_token`), so the JWT-mint silently fell through and clients got `accessToken: undefined`.
- mana-notify SMTP credentials were misconfigured against Stalwart, so no verification email actually went out — the failure was buried in mana-notify worker logs and the auth flow appeared to "work" only because the user could be flipped to verified by other means.

Each of those would have been a single red `bun test` run instead of a multi-hour debugging session.

## Adding more flows

Drop another `<name>.test.ts` next to `auth-flow.test.ts` and update `package.json` to include it. Use the same helpers (`postJson`, `waitForMail`, `pgExec`) — they're free to copy.

## CI

The same script runs in `.github/workflows/ci.yml` as a required PR check. Don't bypass it.
