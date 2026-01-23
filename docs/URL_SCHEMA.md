# URL Schema - mana.how

This document defines the URL schema for all mana.how subdomains.

## Naming Convention

- **Landing Pages**: Plural form (e.g., `calendars.mana.how`)
- **Web Apps**: Singular form (e.g., `calendar.mana.how`)
- **APIs**: Singular + `-api` suffix (e.g., `calendar-api.mana.how`)
- **Short URLs**: Redirect to Web Apps for convenience

---

## Complete URL Mapping

### Core Apps

| App | Landing Page | Web App | API |
|-----|--------------|---------|-----|
| **Calendar** | calendars.mana.how | calendar.mana.how | calendar-api.mana.how |
| **Clock** | clocks.mana.how | clock.mana.how | clock-api.mana.how |
| **Todo** | todos.mana.how | todo.mana.how | todo-api.mana.how |
| **Contacts** | contacts.mana.how | contact.mana.how | contact-api.mana.how |
| **Chat** | chats.mana.how | chat.mana.how | chat-api.mana.how |
| **Picture** | pictures.mana.how | picture.mana.how | picture-api.mana.how |
| **Zitare** | zitares.mana.how | zitare.mana.how | zitare-api.mana.how |

### Platform

| Service | URL |
|---------|-----|
| **Main Dashboard** | mana.how |
| **Dashboard App** | app.mana.how |
| **Auth Service** | auth.mana.how |

---

## Short URL Redirects

Convenience redirects for quick access to Web Apps:

| Short URL | Redirects To |
|-----------|--------------|
| cal.mana.how | calendar.mana.how |
| clok.mana.how | clock.mana.how |
| con.mana.how | contact.mana.how |
| pic.mana.how | picture.mana.how |
| zit.mana.how | zitare.mana.how |

---

## Hosting

### Landing Pages (Astro Static Sites)

**Platform:** Cloudflare Pages

Landing pages are deployed via Cloudflare Pages using Wrangler CLI:

```bash
# Deploy individual landing page
pnpm deploy:landing:calendar
pnpm deploy:landing:clock
pnpm deploy:landing:todo
pnpm deploy:landing:contacts
pnpm deploy:landing:chat
pnpm deploy:landing:picture
pnpm deploy:landing:zitare

# Deploy all landing pages
pnpm deploy:landing:all
```

**Cloudflare Project Names:**

| App | Cloudflare Project | Custom Domain |
|-----|-------------------|---------------|
| Calendar | calendars-landing | calendars.mana.how |
| Clock | clocks-landing | clocks.mana.how |
| Todo | todos-landing | todos.mana.how |
| Contacts | contacts-landing | contacts.mana.how |
| Chat | chats-landing | chats.mana.how |
| Picture | pictures-landing | pictures.mana.how |
| Zitare | zitares-landing | zitares.mana.how |

### Web Apps & APIs

**Platform:** Hetzner Server (46.224.108.214) via Docker + Caddy

See [PRODUCTION_LAUNCH.md](./PRODUCTION_LAUNCH.md) for deployment details.

---

## DNS Configuration

All subdomains point to Hetzner server, except landing pages which use Cloudflare:

### A Records (Hetzner - Web Apps & APIs)

```
calendar.mana.how    A    46.224.108.214
calendar-api.mana.how A   46.224.108.214
clock.mana.how       A    46.224.108.214
clock-api.mana.how   A    46.224.108.214
todo.mana.how        A    46.224.108.214
todo-api.mana.how    A    46.224.108.214
contact.mana.how     A    46.224.108.214
contact-api.mana.how A    46.224.108.214
chat.mana.how        A    46.224.108.214
chat-api.mana.how    A    46.224.108.214
picture.mana.how     A    46.224.108.214
picture-api.mana.how A    46.224.108.214
zitare.mana.how      A    46.224.108.214
zitare-api.mana.how  A    46.224.108.214
app.mana.how         A    46.224.108.214
auth.mana.how        A    46.224.108.214
```

### CNAME Records (Cloudflare - Landing Pages)

```
calendars.mana.how   CNAME  calendars-landing.pages.dev
clocks.mana.how      CNAME  clocks-landing.pages.dev
todos.mana.how       CNAME  todos-landing.pages.dev
contacts.mana.how    CNAME  contacts-landing.pages.dev
chats.mana.how       CNAME  chats-landing.pages.dev
pictures.mana.how    CNAME  pictures-landing.pages.dev
zitares.mana.how     CNAME  zitares-landing.pages.dev
```

### Short URL Redirects (Cloudflare Redirect Rules or CNAME)

```
cal.mana.how   → 301 redirect to calendar.mana.how
clok.mana.how  → 301 redirect to clock.mana.how
con.mana.how   → 301 redirect to contact.mana.how
pic.mana.how   → 301 redirect to picture.mana.how
zit.mana.how   → 301 redirect to zitare.mana.how
```

---

## Adding a New App

1. Create landing page in `apps/{app}/apps/landing/`
2. Add `wrangler.toml` with project name `{apps}-landing`
3. Add deploy script to root `package.json`
4. Create Cloudflare Pages project: `npx wrangler pages project create {apps}-landing`
5. Add custom domain in Cloudflare dashboard
6. Update this documentation
