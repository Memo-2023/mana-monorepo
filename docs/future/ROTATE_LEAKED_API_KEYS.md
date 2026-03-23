# Leaked API Keys — Rotation Required

> Created: 2026-03-23
> Priority: High
> Status: TODO

## Background

During the Supabase cleanup (commit `40718a75`), several **live API keys** were found committed in `.env.development`. The keys have been removed from the file, but they remain in the **Git history** and must be rotated in the respective cloud consoles.

## Keys to Rotate

### 1. OpenAI API Key (Worldream)

- **Key prefix:** `sk-proj-qdYUVUqNvN...`
- **Console:** https://platform.openai.com/api-keys
- **Action:** Delete the key and create a new one if still needed

### 2. Google Gemini API Key (Worldream)

- **Key prefix:** `AIzaSyB74aUj1Km...`
- **Console:** https://aistudio.google.com/apikey
- **Action:** Delete the key and create a new one if still needed

### 3. Replicate API Token (Worldream)

- **Key prefix:** `r8_Qlvkst...`
- **Console:** https://replicate.com/account/api-tokens
- **Action:** Delete the token and create a new one if still needed

### 4. Supabase Anon Key (Worldream)

- **Key prefix:** `eyJhbGciOiJIUzI1NiIs...` (JWT)
- **Project:** `gbsrekoykkesullxdvbd`
- **Console:** https://supabase.com/dashboard/project/gbsrekoykkesullxdvbd/settings/api
- **Action:** Regenerate the anon key or delete the project if unused

## Prevention

To avoid future leaks:
- Never commit real API keys to `.env.development` — use placeholder values
- Store real keys in `.env.local` (gitignored) or a secrets manager
- Consider running `git-secrets` or `gitleaks` as a pre-commit hook
