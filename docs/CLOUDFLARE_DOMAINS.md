# Cloudflare Pages — Domains & Projekte

> Stand: 2026-03-24

## Ausstehende Aktionen

### 1. `it.mana.how` — Custom Domain hinzufügen (NEU)

**Cloudflare Dashboard:**
1. Gehe zu **Pages → it-landing → Custom domains**
2. Klicke **Set up a custom domain**
3. Gib ein: `it.mana.how`
4. Cloudflare setzt automatisch den CNAME (da `mana.how` bereits bei Cloudflare liegt)

**Status:** Deployed unter `it-landing-9hg.pages.dev`, Custom Domain fehlt noch.

---

### 2. Landing Pages ohne Custom Domain

Diese Projekte sind deployed aber nur unter `*.pages.dev` erreichbar — keine `*.mana.how` Domain konfiguriert:

| CF Projekt | Aktuelle URL | Gewünschte Domain | Aktion |
|------------|-------------|-------------------|--------|
| `it-landing` | `it-landing-9hg.pages.dev` | **it.mana.how** | Custom Domain hinzufügen |
| `citycorners-landing` | `citycorners-landing.pages.dev` | **citycorners.mana.how** | Custom Domain hinzufügen |
| `nutriphi-landing` | `nutriphi-landing.pages.dev` | **nutriphi.mana.how** | Custom Domain hinzufügen |
| `todo-landing` | `todo-landing.pages.dev` | **todo.mana.how** (Landing, nicht App!) | Prüfen: Konflikt mit App-URL? |
| `manadeck-landing` | `manadeck-landing.pages.dev` | **manadeck.mana.how** | Custom Domain hinzufügen |
| `manacore-docs` | `manacore-docs.pages.dev` | **docs.mana.how** | Custom Domain hinzufügen |

**Hinweis `todo.mana.how`:** Die App läuft bereits unter `todo.mana.how` via Cloudflare Tunnel. Die Landing Page muss eine andere Domain bekommen, z.B. `todo-info.mana.how` oder die Landing wird auf einer Unterseite der App eingebunden.

### 3. Landing Pages die noch nicht deployed sind

Diese haben ein `deploy:landing:*` Script aber kein CF-Projekt:

| Script | CF Projekt | Status |
|--------|-----------|--------|
| `deploy:landing:calendar` | `calendars-landing` | Kein CF-Projekt gefunden — evtl. anderer Name? |
| `deploy:landing:mail` | `mail-landing` | Kein CF-Projekt — muss erstellt werden |
| `deploy:landing:moodlit` | `moodlit-landing` | Kein CF-Projekt — muss erstellt werden |

**Erstellen mit:**
```bash
npx wrangler pages project create mail-landing --production-branch=main
npx wrangler pages project create moodlit-landing --production-branch=main
```

---

## Bestehende Projekte (korrekt konfiguriert)

| CF Projekt | pages.dev URL | Custom Domain | Status |
|-----------|---------------|---------------|--------|
| `chat-landing` | `chat-landing-90m.pages.dev` | **chats.mana.how** | OK |
| `clocks-landing` | `clocks-landing.pages.dev` | **clocks.mana.how** | OK |
| `picture-landing` | `picture-landing.pages.dev` | **pics.mana.how** | OK |
| `presi-landing` | `presi-landing.pages.dev` | **presis.mana.how** | OK |
| `zitare-landing` | `zitare-landing.pages.dev` | **zitares.mana.how** | OK |
| `manacore-landing` | `manacore-landing.pages.dev` | **devlog.mana.how**, **woh.mana.how** | OK |

---

## Alle Custom Domains — Schritt-für-Schritt

Für jede ausstehende Domain im Cloudflare Dashboard:

1. **Pages → [Projektname] → Custom domains → Set up a custom domain**
2. Domain eingeben (z.B. `it.mana.how`)
3. Cloudflare prüft automatisch die DNS-Zone
4. Da `mana.how` bereits bei Cloudflare ist → CNAME wird automatisch angelegt
5. SSL-Zertifikat wird automatisch erstellt (~1-2 Minuten)

### Batch: Alle fehlenden Domains auf einmal

```
it-landing          → it.mana.how
citycorners-landing → citycorners.mana.how
nutriphi-landing    → nutriphi.mana.how
manadeck-landing    → manadeck.mana.how
manacore-docs       → docs.mana.how
```

---

## Domain-Namenskonvention

| Typ | Pattern | Beispiel |
|-----|---------|----------|
| **App (Backend + Web)** | `{app}.mana.how` | `chat.mana.how`, `todo.mana.how` |
| **Landing Page** | `{app}.mana.how` oder `{plural}.mana.how` | `pics.mana.how`, `chats.mana.how` |
| **Service** | `{service}.mana.how` | `auth.mana.how`, `matrix.mana.how` |
| **Informational** | `{topic}.mana.how` | `it.mana.how`, `docs.mana.how` |

**Problem:** Einige Apps und ihre Landing Pages konkurrieren um die gleiche Subdomain (z.B. `todo.mana.how` ist die App, aber die Landing Page braucht auch eine URL). Aktuell gelöst durch Plural-Formen (`chats`, `pics`, `clocks`, etc.).

---

## Cloudflare Tunnel vs. Pages

Wichtig: Es gibt zwei verschiedene Routing-Mechanismen:

| Typ | Routing | Beispiel |
|-----|---------|---------|
| **Cloudflare Tunnel** | `cloudflared-config.yml` → localhost-Port | `chat.mana.how` → `localhost:3000` (App) |
| **Cloudflare Pages** | Pages Custom Domain → statische Dateien | `chats.mana.how` → `chat-landing` (Landing) |

Diese dürfen **nicht** die gleiche Domain verwenden! Eine Domain kann entweder Tunnel ODER Pages zugeordnet sein, nicht beiden.
