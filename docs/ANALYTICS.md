# Analytics & Event Tracking

ManaCore verwendet Umami für Web Analytics. Alle Events werden zu `stats.mana.how` gesendet.

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
- **Server-Side Injection**: `@manacore/shared-utils/analytics-server` (`injectUmamiAnalytics()`)
- **Client-Side Events**: `@manacore/shared-utils/analytics` (`trackEvent()`, etc.)

### Neue App hinzufügen

1. Website in Umami anlegen (https://umami.mana.how)
2. `UMAMI_WEBSITE_ID_APPNAME=<uuid>` zu `.env.development` hinzufügen
3. `PUBLIC_UMAMI_WEBSITE_ID` Mapping in `scripts/generate-env.mjs` hinzufügen
4. `@manacore/shared-utils` als Dependency in der Web-App `package.json`
5. In `hooks.server.ts`: `import { injectUmamiAnalytics } from '@manacore/shared-utils/analytics-server'`
6. `injectUmamiAnalytics(html)` im `transformPageChunk` aufrufen
7. `pnpm setup:env` ausführen

## Website IDs

### Landing Pages

| App | Website ID | Public URL |
|-----|-----------|------------|
| Chat | `a264b165-80d2-47ab-91f4-2efc01de0b66` | stats.mana.how/share/chatlanding |
| ManaCore | `cef3798d-85ae-47df-a44a-e9bee09dbcf9` | stats.mana.how/share/manacorelanding |
| ManaDeck | `2ac83d50-107f-4d4e-ac23-5540946e96e3` | stats.mana.how/share/manadecklanding |
| Calendar | `84862d98-727e-4e25-8645-639241dd1544` | stats.mana.how/share/calendarlanding |
| Clock | `0332b471-a022-46af-a726-0f45932bfd58` | stats.mana.how/share/clocklanding |
| Picture | `d3ac98e6-0d1a-47a3-a218-2a81fff596bd` | stats.mana.how/share/picturelanding |

### Web Apps

| App | Website ID | Public URL |
|-----|-----------|------------|
| Chat | `5cf9d569-3266-4a57-80dd-3a652dc32786` | stats.mana.how/share/chatwebapp |
| ManaCore | `4a14016d-394a-44e0-8ecc-67271f63ffb0` | stats.mana.how/share/manacorewebapp |
| Todo | `ac021d98-778e-46cf-b6b2-2f650ea78f07` | stats.mana.how/share/todowebapp |
| Calendar | `884fc0a8-3b67-43bd-903b-2be531c66792` | stats.mana.how/share/calendarwebapp |
| Clock | `1e7b5006-87a5-4547-8a3d-ab30eac15dd4` | stats.mana.how/share/clockwebapp |
| Contacts | `ab89a839-be15-4949-99b4-e72492cee4ff` | stats.mana.how/share/contactswebapp |
| Picture | `bc552bd2-667d-44b4-a717-0dce6a8db98f` | stats.mana.how/share/picturewebapp |
| ManaDeck | `314fc57a-c63d-4008-b19e-5e272c0329d6` | stats.mana.how/share/manadeckwebapp |
| Planta | `876f30bd-43e3-405a-9697-6157db67ca6b` | stats.mana.how/share/plantawebapp |
| Mukke | `89015bbb-dc59-45b7-ad51-2a68a1391553` | stats.mana.how/share/mukkewebapp |
| Questions | `4940b9a8-834a-483a-8696-a3086bd531e6` | stats.mana.how/share/questionswebapp |

---

## Automatisches Auth-Tracking

Auth-Events werden automatisch in `@manacore/shared-auth` getrackt (alle Web-Apps):

| Event | Wann | Data |
|-------|------|------|
| `login` | Erfolgreicher Login | `{ method: 'email' \| 'google' \| 'apple' \| 'sso' }` |
| `login_failed` | Login fehlgeschlagen | `{ method: 'email' \| 'google' \| 'apple' }` |
| `signup` | Erfolgreiche Registrierung | `{ method: 'email' }` |
| `signup_failed` | Registrierung fehlgeschlagen | `{ method: 'email' }` |
| `logout` | Benutzer hat sich abgemeldet | - |
| `password_reset_requested` | Passwort-Reset angefragt | - |

Diese Events erfordern **keinen Code in den einzelnen Apps** — sie werden automatisch vom shared Auth-Service ausgelöst.

---

## Custom Event Tracking

### Installation

Die Analytics-Utilities sind in `@manacore/shared-utils` verfügbar:

```typescript
import {
  trackEvent,
  trackClick,
  AuthEvents,
  LandingEvents,
  ChatEvents,
  // ...
} from '@manacore/shared-utils/analytics';
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

```typescript
import { AuthEvents } from '@manacore/shared-utils/analytics';

AuthEvents.login('email');           // login { method: 'email' }
AuthEvents.login('google');          // login { method: 'google' }
AuthEvents.logout();                 // logout
AuthEvents.signup('email');          // signup { method: 'email' }
AuthEvents.signupCompleted();        // signup_completed
AuthEvents.passwordReset();          // password_reset
```

### LandingEvents

```typescript
import { LandingEvents } from '@manacore/shared-utils/analytics';

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
import { ChatEvents } from '@manacore/shared-utils/analytics';

ChatEvents.conversationCreated();            // conversation_created
ChatEvents.messageSent('gpt-4');             // message_sent { model: 'gpt-4' }
ChatEvents.modelChanged('claude-3');         // model_changed { model: 'claude-3' }
ChatEvents.conversationDeleted();            // conversation_deleted
ChatEvents.conversationShared();             // conversation_shared
```

### PictureEvents

```typescript
import { PictureEvents } from '@manacore/shared-utils/analytics';

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
import { TodoEvents } from '@manacore/shared-utils/analytics';

TodoEvents.taskCreated(true);            // task_created { has_deadline: true }
TodoEvents.taskCompleted();              // task_completed
TodoEvents.taskDeleted();                // task_deleted
TodoEvents.projectCreated();             // project_created
TodoEvents.labelCreated();               // label_created
TodoEvents.viewChanged('today');         // view_changed { view: 'today' }
```

### CalendarEvents

```typescript
import { CalendarEvents } from '@manacore/shared-utils/analytics';

CalendarEvents.eventCreated(true);       // event_created { recurring: true }
CalendarEvents.eventUpdated();           // event_updated
CalendarEvents.eventDeleted();           // event_deleted
CalendarEvents.calendarCreated();        // calendar_created
CalendarEvents.calendarShared();         // calendar_shared
CalendarEvents.viewChanged('week');      // view_changed { view: 'week' }
CalendarEvents.reminderSet(30);          // reminder_set { minutes: 30 }
```

### ClockEvents

```typescript
import { ClockEvents } from '@manacore/shared-utils/analytics';

ClockEvents.timerStarted('pomodoro');            // timer_started { type: 'pomodoro' }
ClockEvents.timerCompleted('pomodoro', 1500);    // timer_completed { type: 'pomodoro', duration_seconds: 1500 }
ClockEvents.timerCanceled();                     // timer_canceled
ClockEvents.focusSessionStarted();               // focus_session_started
ClockEvents.focusSessionCompleted(45);           // focus_session_completed { duration_minutes: 45 }
```

### ContactsEvents

```typescript
import { ContactsEvents } from '@manacore/shared-utils/analytics';

ContactsEvents.contactCreated();             // contact_created
ContactsEvents.contactUpdated();             // contact_updated
ContactsEvents.contactDeleted();             // contact_deleted
ContactsEvents.contactImported('google');    // contact_imported { source: 'google' }
ContactsEvents.contactExported('vcard');     // contact_exported { format: 'vcard' }
ContactsEvents.tagCreated();                 // tag_created
ContactsEvents.searchPerformed();            // search_performed
```

### ManaDeckEvents

```typescript
import { ManaDeckEvents } from '@manacore/shared-utils/analytics';

ManaDeckEvents.deckCreated();            // deck_created
ManaDeckEvents.deckStudied(25);          // deck_studied { cards: 25 }
ManaDeckEvents.cardCreated();            // card_created
ManaDeckEvents.cardReviewed(4);          // card_reviewed { rating: 4 }
ManaDeckEvents.aiCardsGenerated(10);     // ai_cards_generated { count: 10 }
```

### SubscriptionEvents

```typescript
import { SubscriptionEvents } from '@manacore/shared-utils/analytics';

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
import { AppEvents } from '@manacore/shared-utils/analytics';

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
  import { LandingEvents } from '@manacore/shared-utils/analytics';

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
  import { LandingEvents } from '@manacore/shared-utils/analytics';

  document.querySelectorAll('[data-cta]').forEach(btn => {
    btn.addEventListener('click', () => {
      const location = btn.getAttribute('data-cta');
      LandingEvents.ctaClick(location);
    });
  });
</script>
```

### Development Mode

Im Development-Modus (`import.meta.env?.DEV`) werden Events in die Console geloggt:

```
[Analytics] cta_click { location: 'hero' }
```

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
- **Container**: `umami`
- **Datenbank**: PostgreSQL (shared mit anderen Services)
- **Port**: 3200 (intern), via Caddy erreichbar unter stats.mana.how
