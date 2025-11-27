# Manuelle Schema-Erstellung für PocketBase

Da das pb_schema.json veraltet ist, erstelle die Collections manuell:

## 1. Users Collection

**Bereits vorhanden** (PocketBase Standard Auth Collection)

Füge diese zusätzlichen Felder hinzu:

- `username` (text, unique, required)
- `bio` (text, optional)
- `website` (url, optional)
- `location` (text, optional)
- `github` (text, optional)
- `twitter` (text, optional)
- `linkedin` (text, optional)
- `instagram` (text, optional)
- `publicProfile` (bool, default: false)
- `showClickStats` (bool, default: true)
- `isPremium` (bool, default: false)
- `stripeCustomerId` (text, optional)
- `stripeSubscriptionId` (text, optional)
- `subscriptionStatus` (text, optional)
- `planType` (select: free, monthly, yearly, lifetime)

## 2. Links Collection

**New → Collection → Base Collection**

Name: `links`

Fields:

- `short_code` (text, unique, required, min: 3, max: 50)
- `custom_code` (text, optional)
- `original_url` (url, required)
- `title` (text, optional, max: 200)
- `description` (text, optional, max: 500)
- `user_id` (relation → users, required, cascade delete)
- `is_active` (bool, default: true)
- `password` (text, optional)
- `max_clicks` (number, optional, min: 0)
- `expires_at` (date, optional)
- `click_count` (number, default: 0)
- `qr_code` (file, optional, single)
- `tags` (json, optional)
- `utm_source` (text, optional)
- `utm_medium` (text, optional)
- `utm_campaign` (text, optional)
- `account_owner` (relation → accounts, optional)

API Rules:

- List/View: @request.auth.id != "" && (@request.auth.id = user_id || is_active = true)
- Create: @request.auth.id != ""
- Update: @request.auth.id = user_id
- Delete: @request.auth.id = user_id

## 3. Clicks Collection

**New → Collection → Base Collection**

Name: `clicks`

Fields:

- `link_id` (relation → links, required)
- `ip_hash` (text, optional)
- `user_agent` (text, optional)
- `referer` (text, optional)
- `browser` (text, optional)
- `device_type` (text, optional)
- `os` (text, optional)
- `country` (text, optional)
- `city` (text, optional)
- `clicked_at` (date, required)
- `utm_source` (text, optional)
- `utm_medium` (text, optional)
- `utm_campaign` (text, optional)

API Rules:

- List/View: @request.auth.id != "" && @request.auth.id = link_id.user_id
- Create: "" (public)
- Update: none
- Delete: @request.auth.id = link_id.user_id

## 4. Accounts Collection

**New → Collection → Base Collection**

Name: `accounts`

Fields:

- `name` (text, required)
- `owner` (relation → users, required)
- `members` (relation → users, multiple)
- `isActive` (bool, default: true)
- `planType` (select: free, team, enterprise)
- `settings` (json, optional)

API Rules:

- List/View: @request.auth.id = owner || @request.auth.id in members
- Create: @request.auth.id != ""
- Update: @request.auth.id = owner
- Delete: @request.auth.id = owner

## 5. Payments Collection (Optional)

**New → Collection → Base Collection**

Name: `payments`

Fields:

- `user_id` (relation → users, required)
- `stripe_payment_intent_id` (text, unique)
- `amount` (number, required)
- `currency` (text, default: "eur")
- `status` (select: pending, succeeded, failed)
- `plan_type` (select: monthly, yearly, lifetime)
- `created_at` (date, auto)

## Quick Setup Script

Nach dem manuellen Erstellen der Collections, führe das Seed-Script aus:

```bash
node scripts/seed-local-db.js
```

Dies erstellt Test-Daten für alle Collections.
