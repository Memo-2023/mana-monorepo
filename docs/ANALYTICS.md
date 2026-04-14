# Analytics & Event Tracking

Mana verwendet Umami für Web Analytics. Alle Events werden zu `stats.mana.how` gesendet.

## Umami Dashboard

- **URL**: https://stats.mana.how
- **Public Stats**: Alle Websites haben Public Sharing aktiviert

## Architektur

Web-App Analytics werden über `hooks.server.ts` injiziert (nicht mehr hardcoded in `app.html`).

```
.env.development              → UMAMI_WEBSITE_ID_CHAT=xxx
       ↓ (scripts/generate-env.mjs)
apps/chat/apps/web/.env       → PUBLIC_UMAMI_WEBSITE_ID=xxx
       ↓ (process.env in hooks.server.ts)
injectUmamiAnalytics(html)    → <script defer src="stats.mana.how/script.js" data-website-id="xxx">
```

### Zentrale Konfiguration

- **Website-IDs**: `.env.development` (`UMAMI_WEBSITE_ID_*`)
- **Env-Verteilung**: `scripts/generate-env.mjs` → `PUBLIC_UMAMI_WEBSITE_ID`
- **Server-Side Injection**: `@mana/shared-utils/analytics-server` (`injectUmamiAnalytics()`)
- **Client-Side Events**: `@mana/shared-utils/analytics` (`trackEvent()`, etc.)

### Neue App hinzufügen

1. Website in Umami anlegen (https://stats.mana.how)
2. `UMAMI_WEBSITE_ID_APPNAME=<uuid>` zu `.env.development` hinzufügen
3. `PUBLIC_UMAMI_WEBSITE_ID` Mapping in `scripts/generate-env.mjs` hinzufügen
4. `@mana/shared-utils` als Dependency in der Web-App `package.json`
5. In `hooks.server.ts`: `import { injectUmamiAnalytics } from '@mana/shared-utils/analytics-server'`
6. `injectUmamiAnalytics(html)` im `transformPageChunk` aufrufen
7. `pnpm setup:env` ausführen

## Website IDs

> **Hinweis**: Die Website-IDs sind in `.env.development` als `UMAMI_WEBSITE_ID_*` definiert. Das ist die Single Source of Truth. Die IDs hier dienen nur als Schnellreferenz.

### Landing Pages

| App | Env-Variable |
|-----|-------------|
| Chat | `UMAMI_WEBSITE_ID_CHAT_LANDING` |
| Mana | `UMAMI_WEBSITE_ID_MANA_LANDING` |
| Cards | `UMAMI_WEBSITE_ID_CARDS_LANDING` |
| Calendar | `UMAMI_WEBSITE_ID_CALENDAR_LANDING` |
| Clock | `UMAMI_WEBSITE_ID_CLOCK_LANDING` |
| Picture | `UMAMI_WEBSITE_ID_PICTURE_LANDING` |
| Todo | `UMAMI_WEBSITE_ID_TODO_LANDING` |
| Food | `UMAMI_WEBSITE_ID_FOOD_LANDING` |
| Presi | `UMAMI_WEBSITE_ID_PRESI_LANDING` |
| Mukke | `UMAMI_WEBSITE_ID_MUKKE_LANDING` |

### Web Apps

| App | Env-Variable |
|-----|-------------|
| Chat | `UMAMI_WEBSITE_ID_CHAT` |
| Mana | `UMAMI_WEBSITE_ID_MANA` |
| Todo | `UMAMI_WEBSITE_ID_TODO` |
| Calendar | `UMAMI_WEBSITE_ID_CALENDAR` |
| Clock | `UMAMI_WEBSITE_ID_CLOCK` |
| Contacts | `UMAMI_WEBSITE_ID_CONTACTS` |
| Picture | `UMAMI_WEBSITE_ID_PICTURE` |
| Cards | `UMAMI_WEBSITE_ID_CARDS` |
| Planta | `UMAMI_WEBSITE_ID_PLANTA` |
| Mukke | `UMAMI_WEBSITE_ID_MUKKE` |
| Questions | `UMAMI_WEBSITE_ID_QUESTIONS` |
| Quotes | `UMAMI_WEBSITE_ID_QUOTES` |
| Presi | `UMAMI_WEBSITE_ID_PRESI` |
| Food | `UMAMI_WEBSITE_ID_FOOD` |
| Storage | `UMAMI_WEBSITE_ID_STORAGE` |
| Photos | `UMAMI_WEBSITE_ID_PHOTOS` |
| SkillTree | `UMAMI_WEBSITE_ID_SKILLTREE` |

---

## Automatisches Auth-Tracking

Auth-Events werden automatisch in `@mana/shared-auth` (`src/core/authService.ts`) getrackt (alle Web-Apps):

| Event | Wann | Data |
|-------|------|------|
| `login` | Erfolgreicher Login | `{ method: 'email' \| 'google' \| 'apple' \| 'sso' }` |
| `login_failed` | Login fehlgeschlagen | `{ method: 'email' \| 'google' \| 'apple' }` |
| `signup` | Erfolgreiche Registrierung | `{ method: 'email' }` |
| `signup_failed` | Registrierung fehlgeschlagen | `{ method: 'email' }` |
| `logout` | Benutzer abgemeldet | - |
| `password_reset_requested` | Passwort-Reset angefragt | - |

Diese Events erfordern **keinen Code in den einzelnen Apps** — sie werden automatisch vom shared Auth-Service ausgelöst.

---

## Landing Page Event Tracking

Alle Landing Pages binden `<Analytics />` aus `@mana/shared-landing-ui` ein. Das Script trackt automatisch:

| Event | Wann | Data |
|-------|------|------|
| `cta_click` | Klick auf CTA-Button/Link | `{ location: 'hero' \| 'pricing' \| 'footer' \| ... }` |
| `pricing_viewed` | Pricing-Section wird sichtbar | - |
| `pricing_plan_selected` | Klick auf Pricing-Plan CTA | `{ plan: 'free' \| 'pro' \| ... }` |

**Auto-Detection:** Das Script erkennt die Section automatisch aus `id`-Attributen oder der Position im DOM (erster/letzter Abschnitt).

**Explizite Attribute (optional):**
```html
<a href="/register" data-track-cta="hero">Jetzt starten</a>
<a href="/pro" data-track-cta="pricing" data-track-pricing="pro">Pro starten</a>
<section data-track-section="pricing">...</section>
```

---

## Custom Event Tracking

### Installation

Die Analytics-Utilities sind in `@mana/shared-utils` verfügbar:

```typescript
import {
  trackEvent,
  trackClick,
  AuthEvents,
  LandingEvents,
  ChatEvents,
  // ...
} from '@mana/shared-utils/analytics';
```

### Basis-Funktionen

#### `trackEvent(eventName, data?)`

Trackt ein benutzerdefiniertes Event.

```typescript
trackEvent('custom_action', { key: 'value' });
```

#### `trackClick(elementId, label?)`

Trackt Button- oder Link-Klicks.

```typescript
trackClick('cta_hero', 'Get Started');
// Trackt: { event: 'click', element: 'cta_hero', label: 'Get Started' }
```

#### `trackView(section)`

Trackt Section/Page Views.

```typescript
trackView('pricing_section');
// Trackt: { event: 'view', section: 'pricing_section' }
```

#### `trackFormSubmit(formId, success)`

Trackt Formular-Submissions.

```typescript
trackFormSubmit('contact_form', true);
// Trackt: { event: 'form_submit', form: 'contact_form', success: true }
```

#### `trackSearch(query, resultsCount)`

Trackt Suchanfragen (nur Länge für Privacy).

```typescript
trackSearch('react hooks', 42);
// Trackt: { event: 'search', query_length: 11, results: 42 }
```

#### `trackError(errorType, message?)`

Trackt Fehler (Message wird auf 100 Zeichen gekürzt).

```typescript
trackError('api_error', 'Failed to fetch data');
```

---

## App-Spezifische Event Helpers

### AuthEvents

> **Hinweis**: Diese Helpers werden in der Regel nicht direkt verwendet. Das automatische Auth-Tracking in `@mana/shared-auth` (siehe oben) deckt alle Login/Signup/Logout-Events ab.

```typescript
import { AuthEvents } from '@mana/shared-utils/analytics';

AuthEvents.login('email');           // login { method: 'email' }
AuthEvents.login('google');          // login { method: 'google' }
AuthEvents.login('github');          // login { method: 'github' }
AuthEvents.logout();                 // logout
AuthEvents.signup('email');          // signup { method: 'email' }
AuthEvents.signupCompleted();        // signup_completed
AuthEvents.passwordReset();          // password_reset
```

### LandingEvents

```typescript
import { LandingEvents } from '@mana/shared-utils/analytics';

LandingEvents.ctaClick('hero');              // cta_click { location: 'hero' }
LandingEvents.ctaClick('pricing');           // cta_click { location: 'pricing' }
LandingEvents.pricingViewed();               // pricing_viewed
LandingEvents.pricingPlanSelected('pro');    // pricing_plan_selected { plan: 'pro' }
LandingEvents.demoStarted();                 // demo_started
LandingEvents.featureExplored('ai-chat');    // feature_explored { feature: 'ai-chat' }
LandingEvents.faqOpened('How does it work?'); // faq_opened { question: 'How does...' }
LandingEvents.contactFormSubmitted();        // contact_form_submitted
LandingEvents.newsletterSubscribed();        // newsletter_subscribed
```

### ChatEvents

```typescript
import { ChatEvents } from '@mana/shared-utils/analytics';

ChatEvents.conversationCreated();            // conversation_created
ChatEvents.messageSent('gpt-4');             // message_sent { model: 'gpt-4' }
ChatEvents.modelChanged('claude-3');         // model_changed { model: 'claude-3' }
ChatEvents.conversationDeleted();            // conversation_deleted
ChatEvents.conversationShared();             // conversation_shared
```

### PictureEvents

```typescript
import { PictureEvents } from '@mana/shared-utils/analytics';

PictureEvents.imageGenerated('flux', 'realistic');  // image_generated { model: 'flux', style: 'realistic' }
PictureEvents.imageDownloaded();                     // image_downloaded
PictureEvents.imageFavorited();                      // image_favorited
PictureEvents.imageShared();                         // image_shared
PictureEvents.modelSelected('sdxl');                 // model_selected { model: 'sdxl' }
PictureEvents.styleSelected('anime');                // style_selected { style: 'anime' }
PictureEvents.generationFailed('timeout');           // generation_failed { reason: 'timeout' }
```

### TodoEvents

```typescript
import { TodoEvents } from '@mana/shared-utils/analytics';

TodoEvents.taskCreated(true);            // task_created { has_deadline: true }
TodoEvents.taskCompleted();              // task_completed
TodoEvents.taskUncompleted();            // task_uncompleted
TodoEvents.taskDeleted();                // task_deleted
TodoEvents.subtaskCompleted();           // subtask_completed
TodoEvents.projectCreated();             // project_created
TodoEvents.projectDeleted();             // project_deleted
TodoEvents.labelCreated();               // label_created
TodoEvents.viewChanged('kanban');        // view_changed { view: 'kanban' }
TodoEvents.quickAddUsed();               // quick_add_used
TodoEvents.filterUsed('priority');       // filter_used { filter: 'priority' }
```

### CalendarEvents

```typescript
import { CalendarEvents } from '@mana/shared-utils/analytics';

CalendarEvents.eventCreated(true);       // event_created { recurring: true }
CalendarEvents.eventUpdated();           // event_updated
CalendarEvents.eventDeleted();           // event_deleted
CalendarEvents.calendarCreated();        // calendar_created
CalendarEvents.calendarDeleted();        // calendar_deleted
CalendarEvents.calendarShared();         // calendar_shared
CalendarEvents.viewChanged('week');      // view_changed { view: 'week' }
CalendarEvents.reminderSet(30);          // reminder_set { minutes: 30 }
CalendarEvents.eventDragged();           // event_dragged
```

### ClockEvents

```typescript
import { ClockEvents } from '@mana/shared-utils/analytics';

ClockEvents.timerStarted('pomodoro');            // timer_started { type: 'pomodoro' }
ClockEvents.timerCompleted('pomodoro', 1500);    // timer_completed { type: 'pomodoro', duration_seconds: 1500 }
ClockEvents.timerCanceled();                     // timer_canceled
ClockEvents.focusSessionStarted();               // focus_session_started
ClockEvents.focusSessionCompleted(45);           // focus_session_completed { duration_minutes: 45 }
```

### ContactsEvents

```typescript
import { ContactsEvents } from '@mana/shared-utils/analytics';

ContactsEvents.contactCreated();             // contact_created
ContactsEvents.contactUpdated();             // contact_updated
ContactsEvents.contactDeleted();             // contact_deleted
ContactsEvents.contactFavorited();           // contact_favorited
ContactsEvents.contactArchived();            // contact_archived
ContactsEvents.contactImported('google', 5); // contact_imported { source: 'google', count: 5 }
ContactsEvents.contactExported('vcard');     // contact_exported { format: 'vcard' }
ContactsEvents.tagCreated();                 // tag_created
ContactsEvents.searchPerformed();            // search_performed
```

### CardsEvents

```typescript
import { CardsEvents } from '@mana/shared-utils/analytics';

CardsEvents.deckCreated();            // deck_created
CardsEvents.deckStudied(25);          // deck_studied { cards: 25 }
CardsEvents.cardCreated();            // card_created
CardsEvents.cardReviewed(4);          // card_reviewed { rating: 4 }
CardsEvents.aiCardsGenerated(10);     // ai_cards_generated { count: 10 }
```

### SubscriptionEvents

```typescript
import { SubscriptionEvents } from '@mana/shared-utils/analytics';

SubscriptionEvents.pricingViewed();              // pricing_viewed
SubscriptionEvents.planSelected('pro');          // plan_selected { plan: 'pro' }
SubscriptionEvents.checkoutStarted('pro');       // checkout_started { plan: 'pro' }
SubscriptionEvents.checkoutCompleted('pro');     // checkout_completed { plan: 'pro' }
SubscriptionEvents.checkoutAbandoned('pro');     // checkout_abandoned { plan: 'pro' }
SubscriptionEvents.subscriptionCanceled('pro');  // subscription_canceled { plan: 'pro' }
SubscriptionEvents.trialStarted();               // trial_started
SubscriptionEvents.trialEnded(true);             // trial_ended { converted: true }
```

### AppEvents

```typescript
import { AppEvents } from '@mana/shared-utils/analytics';

AppEvents.appOpened('chat');             // app_opened { app: 'chat' }
AppEvents.themeChanged('dark');          // theme_changed { theme: 'dark' }
AppEvents.languageChanged('de');         // language_changed { language: 'de' }
AppEvents.feedbackSubmitted('bug');      // feedback_submitted { type: 'bug' }
AppEvents.helpOpened();                  // help_opened
AppEvents.settingsOpened();              // settings_opened
AppEvents.shareClicked('twitter');       // share_clicked { platform: 'twitter' }
```

---

## Integration Guide

### Svelte/SvelteKit

```svelte
<script lang="ts">
  import { LandingEvents } from '@mana/shared-utils/analytics';

  function handleCtaClick() {
    LandingEvents.ctaClick('hero');
    // Navigate to app...
  }
</script>

<button onclick={handleCtaClick}>
  Get Started
</button>
```

### Astro Landing Pages

```astro
---
// Layout.astro - Script tag is already in <head>
---

<script>
  import { LandingEvents } from '@mana/shared-utils/analytics';

  document.querySelectorAll('[data-cta]').forEach(btn => {
    btn.addEventListener('click', () => {
      const location = btn.getAttribute('data-cta');
      LandingEvents.ctaClick(location);
    });
  });
</script>
```

### Development Mode

Im Development-Modus ist Umami normalerweise nicht geladen (kein Script-Tag), daher werden Events stillschweigend ignoriert (`isUmamiAvailable()` gibt `false` zurück). Fehler beim Tracking werden als `console.warn` ausgegeben.

---

## Event Naming Conventions

1. **snake_case** für Event-Namen: `task_created`, nicht `taskCreated`
2. **Kurze, beschreibende Namen**: `signup_completed`, nicht `user_has_completed_signup_process`
3. **Konsistente Suffixe**:
   - `_created`, `_updated`, `_deleted` für CRUD
   - `_started`, `_completed`, `_canceled` für Prozesse
   - `_clicked`, `_viewed` für UI-Interaktionen

## Privacy

- Keine persönlichen Daten in Events (keine E-Mails, Namen, etc.)
- Suchanfragen: Nur Länge wird getracked, nicht der Inhalt
- Error Messages: Auf 100 Zeichen gekürzt
- GDPR-konform: Umami ist privacy-focused und setzt keine Cookies

## Umami Server

- **Host**: Mac Mini (mana-server)
- **Container**: `mana-mon-umami`
- **Image**: `ghcr.io/umami-software/umami:postgresql-latest`
- **Datenbank**: PostgreSQL (`umami` DB, shared Postgres-Instanz)
- **Port**: 3000 (intern) → 8010 (extern), via Cloudflare Tunnel erreichbar unter stats.mana.how
