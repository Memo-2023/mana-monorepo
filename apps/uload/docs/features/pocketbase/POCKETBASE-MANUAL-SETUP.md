# PocketBase Collections - Manuelle Einrichtung

Da der Schema-Import nicht funktioniert (veraltetes Format), musst du die Collections manuell erstellen.

## 🎯 Admin Login

1. Gehe zu: http://localhost:8090/\_/
2. Login mit:
   - Email: `till.schneider@memoro.ai`
   - Password: `p0ck3t-RAJ`

## 📦 Collections erstellen

### 1. Links Collection

**Collections → New collection → Base collection**

**Name:** `links`

**Fields hinzufügen (+ New field):**

| Field Name     | Type     | Required | Options                                              |
| -------------- | -------- | -------- | ---------------------------------------------------- |
| `short_code`   | text     | ✅       | Unique: ✅, Min: 3, Max: 50                          |
| `original_url` | url      | ✅       | -                                                    |
| `title`        | text     | ❌       | Max: 200                                             |
| `description`  | text     | ❌       | Max: 500                                             |
| `user_id`      | relation | ❌       | Collection: users, Max select: 1, Cascade delete: ✅ |
| `is_active`    | bool     | ❌       | -                                                    |
| `password`     | text     | ❌       | -                                                    |
| `max_clicks`   | number   | ❌       | Min: 0                                               |
| `expires_at`   | date     | ❌       | -                                                    |
| `click_count`  | number   | ❌       | -                                                    |
| `tags`         | json     | ❌       | -                                                    |

**API Rules:**

- List/View rule: `` (leer = public)
- Create rule: `@request.auth.id != ""`
- Update rule: `@request.auth.id = user_id`
- Delete rule: `@request.auth.id = user_id`

### 2. Clicks Collection

**Collections → New collection → Base collection**

**Name:** `clicks`

**Fields:**

| Field Name    | Type     | Required | Options                                              |
| ------------- | -------- | -------- | ---------------------------------------------------- |
| `link_id`     | relation | ✅       | Collection: links, Max select: 1, Cascade delete: ✅ |
| `ip_hash`     | text     | ❌       | -                                                    |
| `user_agent`  | text     | ❌       | -                                                    |
| `referer`     | text     | ❌       | -                                                    |
| `browser`     | text     | ❌       | -                                                    |
| `device_type` | text     | ❌       | -                                                    |
| `os`          | text     | ❌       | -                                                    |
| `country`     | text     | ❌       | -                                                    |
| `city`        | text     | ❌       | -                                                    |
| `clicked_at`  | date     | ❌       | -                                                    |

**API Rules:**

- List/View rule: `` (leer = public)
- Create rule: `` (leer = public)
- Update rule: `null` (keine Updates erlaubt)
- Delete rule: `@request.auth.id = link_id.user_id`

### 3. Accounts Collection (Optional)

**Collections → New collection → Base collection**

**Name:** `accounts`

**Fields:**

| Field Name | Type     | Required | Options                          |
| ---------- | -------- | -------- | -------------------------------- |
| `name`     | text     | ✅       | -                                |
| `owner`    | relation | ✅       | Collection: users, Max select: 1 |
| `members`  | relation | ❌       | Collection: users, Multiple: ✅  |
| `isActive` | bool     | ❌       | -                                |
| `planType` | select   | ❌       | Values: free, team, enterprise   |
| `settings` | json     | ❌       | -                                |

## ✅ Nach dem Erstellen

1. **Speichern** nicht vergessen (Save button oben rechts)

2. **Test-Daten laden:**

   ```bash
   node scripts/seed-local-db.js
   ```

3. **App testen:**
   ```bash
   npm run dev
   ```

## 🎉 Fertig!

Deine lokale PocketBase ist jetzt bereit mit:

- Admin Account ✅
- Collections ✅
- Test-Daten (nach Seed-Script)

## 📝 Test-URLs

Nach dem Seed-Script:

- http://localhost:5173/test1 - Normaler Link
- http://localhost:5173/test2 - Link mit Click-Limit
- http://localhost:5173/protected - Passwort: `secret123`

## 🔍 Troubleshooting

**"Collection not found" Fehler?**

- Stelle sicher, dass alle Collections erstellt und gespeichert wurden
- Name muss exakt sein (case-sensitive)

**"Invalid relation" Fehler?**

- Erst Links Collection erstellen, dann Clicks
- Users Collection existiert bereits (Standard Auth)
