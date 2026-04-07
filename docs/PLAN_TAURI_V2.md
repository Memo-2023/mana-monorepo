# Implementierungsplan: PWA + Tauri v2 für Mana

> Schrittweiser Plan um die Mana Unified Web App zuerst als PWA auszubauen und anschliessend als native Desktop- und Mobile-App via Tauri v2 auszuliefern — Plattform für Plattform.
>
> Stand: April 2026

---

## Übersicht

### Roadmap

```
Phase 1     Phase 2      Phase 3       Phase 4        Phase 5       Phase 6       Phase 7       Phase 8
PWA      →  SPA-Modus →  macOS      →  Windows     →  Linux      →  Android   →  iOS        →  CI/CD & QA
(Web)       (Basis)      (Desktop)     (Desktop)      (Desktop)     (Mobile)      (Mobile)      (alle)
✅ DONE

 ◄── geringster Aufwand                                                    höchster Aufwand ──►
```

Jede Phase liefert ein funktionsfähiges Release. Man muss nicht alle Plattformen gleichzeitig fertig haben.

### Zielstruktur

```
apps/mana/
├── apps/
│   ├── web/          # Bestehende SvelteKit-App (Web + PWA)
│   ├── tauri/        # NEU: Tauri v2 Shell (alle nativen Plattformen)
│   │   ├── src-tauri/
│   │   │   ├── src/          # Rust Backend
│   │   │   ├── capabilities/ # Permissions pro Plattform
│   │   │   ├── icons/        # App-Icons
│   │   │   ├── Cargo.toml
│   │   │   └── tauri.conf.json
│   │   └── package.json
│   └── ...
```

---

## Phase 1: PWA ausbauen ✅ ABGESCHLOSSEN

> **Abgeschlossen am 2026-04-05.** Alle Unterpunkte implementiert und verifiziert (Build erfolgreich, keine neuen Type-Errors).

**Ziel:** Die Web-App wird installierbar, offline-fähig und fühlt sich auf allen Geräten wie eine App an. Diese Arbeit ist **direkte Vorarbeit für Tauri** — nichts davon ist verschwendet.

### 1.1 Service Worker Caching-Strategie ✅

- [x] **App-Shell** (HTML, CSS, JS, Fonts) → Precaching via `@vite-pwa/sveltekit` globPatterns
- [x] **Modul-Assets** (Icons, Bilder) → CacheFirst (30 Tage)
- [x] **API-Calls** → NetworkFirst mit 24h Fallback-Cache
- [x] **Fonts** → CacheFirst (1 Jahr) — Preset von `standard` auf `full` hochgestuft
- [x] **Externe CDN-Ressourcen** → StaleWhileRevalidate (7 Tage)
- [x] Dexie.js Daten brauchen kein SW-Caching (liegen in IndexedDB)

### 1.2 Icons & Manifest ✅

- [x] PWA-Icons generiert: `pwa-192x192.png`, `pwa-512x512.png` (aus favicon.png via sharp)
- [x] Apple Touch Icon: `apple-touch-icon.png` (180×180)
- [x] `app.html` erweitert: Apple PWA Meta-Tags, `theme-color`, `viewport-fit=cover`
- [x] Manifest: `display: "standalone"`, `orientation: "any"`, Shortcuts (Dashboard, Todo, Kalender, Chat)

### 1.3 Offline-UX ✅

- [x] **OfflineIndicator** Komponente — rotes Top-Banner bei Offline, Sync-Status-Badge oben rechts
- [x] **networkStore** — trackt `isOnline`, `syncStatus`, `pendingCount`, integriert mit Unified Sync Manager
- [x] **Sync-Status-Anzeige** — Pending-Count Badge + pulsierender Sync-Dot
- [x] Offline-Page Text aktualisiert (passt zur local-first Architektur)

### 1.4 Update-Flow ✅

- [x] `registerType` auf `prompt` umgestellt (statt `autoUpdate`)
- [x] **PwaUpdatePrompt** Komponente — erkennt wartenden SW via `updatefound`, "Neue Version verfügbar" Banner
- [x] Skip-Waiting mit User-Bestätigung, Reload nach Controller-Wechsel

### 1.5 Responsive UI ✅

**Navigation (shared-ui):**
- [x] PillNavigation: Icon-only auf Mobile (<640px), 44px min Touch-Targets
- [x] QuickInputBar: Kompaktere Darstellung auf Mobile (48px Höhe, reduziertes Padding)
- [x] PillDropdown: Full-Width Bottom-Sheet auf Mobile mit Backdrop
- [x] GlobalSpotlight: Bottom-Sheet auf Mobile, verhindert iOS Auto-Zoom, versteckt Keyboard-Hints
- [x] TagStrip: 44px min-height auf allen Pill-Buttons
- [x] AppDrawer: 44px Touch-Targets auf Buttons und Suche

**Globale Styles:**
- [x] Responsive Typografie (h1–h3 skalieren auf Mobile)
- [x] Safe-Area Body-Padding für PWA Standalone-Modus
- [x] Content-Area: `px-3 py-4 sm:px-6 sm:py-8`

**Module — ListViews (29/29):**
- [x] Alle 29 ListViews haben responsive Container-Padding (`p-3 sm:p-4` bzw. `0.75rem`)
- [x] Alle interaktiven Items haben `min-h-[44px]` / `min-height: 44px`
- [x] Picture/Moodlit: `grid-cols-2 sm:grid-cols-3`

**Module — DetailViews (17/17):**
- [x] Alle 17 DetailViews haben reduziertes Padding auf Mobile
- [x] Alle Buttons, Inputs, Selects haben 44px min-height auf Mobile

**Modals (14/14):**
- [x] Shared Modal.svelte: Bottom-Sheet-Pattern auf Mobile (von unten, volle Breite, `rounded-t-2xl`)
- [x] 13 App-spezifische Modals: Gleiches Bottom-Sheet-Pattern
- [x] Reduziertes Padding, grössere Close-Buttons, `max-h-[95vh]`

**Weitere Komponenten:**
- [x] SplitPaneLayout: Stapelt vertikal auf Mobile, versteckt Resize-Handle
- [x] ToastContainer: 48px Touch-Targets, Safe-Area-Positionierung

### 1.6 Validierung

- [ ] Chrome DevTools → Lighthouse PWA-Audit → Score prüfen
- [ ] App installieren auf: macOS (Chrome), Android (Chrome), iOS (Safari)
- [ ] Offline testen: Flugmodus → App öffnen → CRUD-Operationen → Internet an → Sync
- [ ] Update testen: Neue Version deployen → "Update verfügbar" erscheint

> **Build-Validierung:** `pnpm --filter @mana/web build` erfolgreich. 308 pre-existierende Type-Errors (keine neuen durch PWA-Änderungen).

### 1.7 Bekannte PWA-Limitationen (beobachten, nicht lösen)

Diese Punkte sind der Grund warum Tauri als nächster Schritt folgt:

- iOS Safari: IndexedDB-Löschung nach 7 Tagen Inaktivität (betrifft local-first)
- iOS Safari: Keine Push-Notifications im Hintergrund
- Kein System Tray, keine globalen Shortcuts
- Kein Deep Link Protocol (`mana://`)
- App Store Präsenz nicht möglich (ausser TWA auf Android)

---

## Phase 2: SvelteKit SPA-Modus

**Ziel:** Die Web-App kann als statische SPA gebaut werden — Voraussetzung für Tauri.

**Aufwand:** 2–4 Tage

### 2.1 Adapter-Static Konfiguration

Aktuell nutzt die App `@sveltejs/adapter-node`. Für Tauri brauchen wir `adapter-static`:

- [ ] `@sveltejs/adapter-static` als Dependency hinzufügen
- [ ] Build-Flag für Tauri-Modus:

```js
// svelte.config.js
import adapterNode from '@sveltejs/adapter-node';
import adapterStatic from '@sveltejs/adapter-static';

const isTauri = process.env.TAURI_ENV === 'true';

const config = {
  kit: {
    adapter: isTauri
      ? adapterStatic({ pages: 'build-static', assets: 'build-static', fallback: 'index.html' })
      : adapterNode({ out: 'build' }),
  },
};
```

- [ ] `fallback: 'index.html'` setzen für SPA-Routing (alle Routen → index.html)

### 2.2 Server-seitige Logik auflösen

**`hooks.server.ts` — Runtime Env-Injection (grösste Hürde):**

Aktuell injiziert `hooks.server.ts` ~15 API-URLs als `window.__PUBLIC_*__` Variablen. Lösung:

- [ ] Config-Abstraktionsschicht bauen die Web und Tauri bedient:

```typescript
// src/lib/config/env.ts
export async function getApiUrl(key: string): Promise<string> {
  if (window.__TAURI__) {
    const config = await invoke('get_config');
    return config[key];
  }
  return window[`__PUBLIC_${key}__`] || import.meta.env[`PUBLIC_${key}`] || '';
}
```

- [ ] Bestehende `window.__PUBLIC_*__` Lösung bleibt für Web-Deployment intakt

**`hooks.server.ts` — Subdomain-Routing & Security Headers:**

- [ ] Beide irrelevant in Tauri — werden automatisch übersprungen

**Server-Routes (`routes/api/`, `routes/status/`):**

- [ ] `routes/api/*` Endpunkte inventarisieren
- [ ] Falls Client sie aufruft: auf direkte Backend-Aufrufe umstellen
- [ ] `routes/status/+page.server.ts` → Client-seitige Health-Checks

### 2.3 Validierung

- [ ] `TAURI_ENV=true pnpm --filter @mana/web build` erzeugt `build-static/` mit `index.html`
- [ ] `build-static/` in einem einfachen HTTP-Server testen (`npx serve build-static`)
- [ ] Alle 27+ Module durchklicken — Client-Side-Routing funktioniert
- [ ] **Go/No-Go:** Falls fundamental SSR-abhängig → Plan überdenken

---

## Phase 3: macOS Desktop

**Ziel:** Mana läuft als native Desktop-App auf macOS. Erste Tauri-Plattform.

**Aufwand:** 2–3 Tage (inkrementell über SPA-Basis)

**Warum zuerst:** Entwicklung passiert auf macOS → direktes Testen, kein Extra-Setup. Tauri Desktop seit 2022 stabil (4 Jahre Reife). WebKit auf macOS = gleiche Engine wie Safari, bekanntes Verhalten. Kein App Store nötig — DMG direkt verteilen.

### 3.1 Voraussetzungen

- [ ] Rust Toolchain installieren (`rustup`)
- [ ] Xcode installieren/aktualisieren (für macOS Builds)
- [ ] Tauri CLI: `pnpm add -D @tauri-apps/cli`

### 3.2 Tauri-Projekt initialisieren

- [ ] `apps/mana/apps/tauri/` erstellen
- [ ] `package.json` mit Workspace-Referenz zu `@mana/web`
- [ ] `tauri.conf.json` konfigurieren:

```json
{
  "build": {
    "beforeBuildCommand": "TAURI_ENV=true pnpm --filter @mana/web build",
    "devUrl": "http://localhost:5173",
    "frontendDist": "../../web/build-static"
  },
  "app": {
    "title": "Mana",
    "windows": [
      {
        "title": "Mana",
        "width": 1280,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600
      }
    ]
  },
  "bundle": {
    "identifier": "how.mana.app",
    "icon": ["icons/icon.png"]
  }
}
```

### 3.3 Rust-Backend Setup

- [ ] Minimales `src-tauri/src/main.rs` mit Config-Provider:

```rust
#[tauri::command]
fn get_config() -> serde_json::Value {
    serde_json::json!({
        "MANA_AUTH_URL": "https://auth.mana.how",
        "SYNC_SERVER_URL": "wss://sync.mana.how",
        // ...
    })
}
```

### 3.4 Capabilities & Permissions

- [ ] `capabilities/default.json`:
  - `core:default` (Fenster, Events)
  - `http:default` (HTTP-Requests an Backend-APIs)
  - `notification:default` (Benachrichtigungen)
  - `clipboard-manager:default` (Zwischenablage)
  - `shell:default` (URLs im Browser öffnen)

### 3.5 Dev-Workflow einrichten

- [ ] Turborepo-Tasks für `tauri:dev`, `tauri:build`
- [ ] Root-Level Script: `"dev:mana:desktop": "pnpm --filter @mana/tauri dev"`
- [ ] Tauri Dev-Mode nutzt Vite Dev-Server (`devUrl: http://localhost:5173`) → Hot Reload

### 3.6 IndexedDB auf macOS WebKit testen

- [ ] Dexie.js Persistenz: App schliessen → öffnen → Daten noch da?
- [ ] Speicherverbrauch der 120+ Collections messen
- [ ] WebSocket-Sync zu mana-sync funktioniert?
- [ ] Reconnect nach Sleep/Wake?

### 3.7 Validierung

- [ ] App startet als natives macOS-Fenster
- [ ] Login/Auth funktioniert (gegen mana-auth)
- [ ] IndexedDB/Dexie.js persistiert Daten
- [ ] Sync funktioniert (WebSocket zu mana-sync)
- [ ] Mindestens 10 Module durchklicken und testen
- [ ] **Go/No-Go:** IndexedDB/Sync stabil? → Weiter. Instabil? → Electron-Fallback evaluieren.

---

## Phase 4: Windows Desktop

**Ziel:** Mana als native Windows-App.

**Aufwand:** 2–3 Tage (inkrementell über macOS)

**Warum als Zweites:** Relevanteste Desktop-Plattform nach macOS. Nutzt WebView2 (Chromium-basiert) — **andere Rendering-Engine als macOS** (WebKit). Das Testen hier bereitet auf Android vor (ebenfalls Chromium-basiert).

### 4.1 Voraussetzungen

- [ ] Windows-Testumgebung (VM, Dual-Boot, oder CI)
- [ ] WebView2 Runtime (auf Windows 10/11 vorinstalliert, Fallback für ältere Systeme einrichten)
- [ ] Rust Target hinzufügen: `rustup target add x86_64-pc-windows-msvc`

### 4.2 Plattform-spezifische Anpassungen

- [ ] NSIS oder MSI Installer konfigurieren in `tauri.conf.json`
- [ ] Code Signing Zertifikat beschaffen und einrichten
- [ ] Windows-spezifische Fenster-Optionen (Dekorationen, Startmenü-Integration)

### 4.3 Rendering-Unterschiede testen

Da WebView2 auf Chromium basiert (≠ macOS WebKit):

- [ ] CSS Rendering vergleichen (Flexbox, Grid, Scrollbars)
- [ ] IndexedDB-Verhalten prüfen (Chromium hat andere Limits/Verhalten als WebKit)
- [ ] Font-Rendering prüfen (Windows rendert Fonts anders)
- [ ] Scroll-Verhalten (Windows hat keine Rubber-Band-Scrolling)

### 4.4 Validierung

- [ ] App startet auf Windows 10 + 11
- [ ] Alle Module funktionieren (besonders UI-intensive: Calendar, Presi, Music)
- [ ] Installer erzeugt saubere Installation + Deinstallation
- [ ] Auto-Start Option funktioniert

---

## Phase 5: Linux Desktop

**Ziel:** Mana als native Linux-App.

**Aufwand:** 0.5–1 Tag (inkrementell über macOS)

**Warum als Drittes:** Technisch fast identisch zu macOS (beide WebKitGTK-basiert). Geringster zusätzlicher Aufwand aller Plattformen. Kein Signing nötig.

### 5.1 Voraussetzungen

- [ ] Linux-Testumgebung (VM, WSL2, oder GPU-Server)
- [ ] WebKitGTK + System-Dependencies: `sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev`
- [ ] Rust Target: `rustup target add x86_64-unknown-linux-gnu`

### 5.2 Paketformate

- [ ] AppImage generieren (universell, kein Install nötig)
- [ ] DEB-Paket für Debian/Ubuntu
- [ ] Optional: RPM für Fedora, Flatpak für breitere Distribution

### 5.3 Validierung

- [ ] App startet auf Ubuntu 22.04+ und Fedora 38+
- [ ] WebKitGTK-spezifische Rendering-Checks
- [ ] AppImage funktioniert ohne Installation
- [ ] System-Tray Integration (falls in Phase 8 implementiert)

---

## Phase 6: Android

**Ziel:** Mana als Android-App im Play Store.

**Aufwand:** 1–2 Wochen (inkrementell über Desktop)

**Warum vor iOS:** Android WebView basiert auf Chromium — ähnlich wie Windows WebView2, also bereits vertrautes Terrain. Kein Developer Account nötig zum Testen (APK Sideloading). Tauri v2 Android-Support ist etwas reifer als iOS.

### 6.1 Voraussetzungen

- [ ] Android Studio + Android SDK installieren
- [ ] Android Emulator oder physisches Testgerät
- [ ] Tauri Android-Target: `tauri android init`
- [ ] Keystore für Signing erstellen
- [ ] Google Play Developer Account (25$ einmalig)

### 6.2 Android-spezifische Anpassungen

- [ ] `AndroidManifest.xml` — Permissions (Internet, Notifications, Camera falls nötig)
- [ ] Minimum SDK Version festlegen (API 24 / Android 7.0 = WebView 80+)
- [ ] Status Bar / Navigation Bar Farben anpassen
- [ ] Back-Button Verhalten (Android Hardware-Back)
- [ ] Splash Screen (`tauri-plugin-splash-screen`)

### 6.3 Responsive UI auf echten Geräten testen

Die Responsive-Arbeit aus Phase 1.5 (PWA) wird hier validiert:

- [ ] Navigation auf kleinen Screens (Bottom-Tab / Drawer)
- [ ] Touch-Targets auf verschiedenen Bildschirmgrössen
- [ ] Landscape vs Portrait Orientation
- [ ] Soft-Keyboard schiebt Layout nicht kaputt
- [ ] Scroll-Performance in langen Listen

### 6.4 WebView-Versionen

Grösstes Android-spezifisches Risiko — die System-WebView variiert je nach Gerät:

- [ ] Minimum WebView-Version definieren und enforzen
- [ ] Auf älteren Geräten testen (Android 8, 9, 10)
- [ ] Feature-Detection für kritische APIs (IndexedDB, WebSocket)

### 6.5 Mobile-spezifische Plugins

- [ ] `tauri-plugin-haptics` — Haptisches Feedback bei Interaktionen
- [ ] `tauri-plugin-biometric` — Fingerprint für Login
- [ ] Push Notifications via FCM (Firebase Cloud Messaging)

### 6.6 Play Store Vorbereitung

- [ ] App-Icons in allen Android-Grössen (Adaptive Icons)
- [ ] Play Store Screenshots (Phone + Tablet)
- [ ] Privacy Policy URL
- [ ] App-Beschreibung (Deutsch + Englisch)
- [ ] Internal Testing Track einrichten
- [ ] AAB (Android App Bundle) statt APK für Store-Upload

### 6.7 Validierung

- [ ] App läuft auf Android 10+ stabil
- [ ] IndexedDB-Persistenz über App-Neustarts
- [ ] Sync funktioniert (inkl. Reconnect nach Background/Foreground)
- [ ] Play Store Internal Testing erfolgreich
- [ ] **Go/No-Go:** Android stabil? → Weiter zu iOS. Probleme? → Capacitor als Mobile-Fallback evaluieren.

---

## Phase 7: iOS

**Ziel:** Mana als iOS-App im App Store.

**Aufwand:** 1–2 Wochen (inkrementell über Android)

**Warum zuletzt:** Höchster Overhead aller Plattformen: Apple Developer Account (99$/Jahr), Provisioning Profiles, Xcode-Pflicht, strengster App Store Review. iOS WebKit hat die strengsten IndexedDB-Limits. Hier entscheidet sich ob ein SQLite-Fallback nötig wird.

### 7.1 Voraussetzungen

- [ ] Apple Developer Account (99$/Jahr) — zwingend auch zum Testen auf echtem Gerät
- [ ] Xcode aktualisieren (neueste Version)
- [ ] Provisioning Profile + Signing Certificates erstellen
- [ ] Tauri iOS-Target: `tauri ios init`
- [ ] Physisches iOS-Gerät zum Testen (Simulator reicht nicht für alles)

### 7.2 iOS-spezifische Anpassungen

- [ ] `Info.plist` — Permissions, URL Schemes, Privacy Descriptions
- [ ] Safe Area Insets (Notch, Dynamic Island, Home Indicator)
- [ ] `viewport-fit=cover` + CSS `env(safe-area-inset-*)` für Edge-to-Edge
- [ ] iOS-spezifische Scroll-Bouncing / Overscroll-Verhalten
- [ ] Status Bar Style (Light/Dark Content je nach Theme)

### 7.3 IndexedDB Stresstest (kritisch)

Das ist der **wichtigste Test der gesamten Roadmap:**

- [ ] Speicherverbrauch der 120+ Collections unter realer Nutzung messen
- [ ] iOS WebKit-Limit (~500 MB) Stresstest — wie nah kommen wir?
- [ ] Persistenz: App schliessen → Tage warten → öffnen → Daten noch da?
- [ ] Vergleich: PWA Safari vs installierte Tauri-App (Tauri sollte stabiler sein)

Falls Limits zum Problem werden:

- [ ] `tauri-plugin-sql` (SQLite) als Fallback evaluieren
- [ ] Hybride Strategie: IndexedDB im Web, SQLite in Tauri iOS
- [ ] Storage-Abstraktionsschicht in Dexie.js integrieren

### 7.4 Mobile-spezifische Plugins (iOS)

- [ ] `tauri-plugin-haptics` — Taptic Engine Feedback
- [ ] `tauri-plugin-biometric` — Face ID / Touch ID
- [ ] Push Notifications via APNs (Apple Push Notification service)
- [ ] Optional: `tauri-plugin-barcode-scanner` für QR-Codes

### 7.5 App Store Vorbereitung

- [ ] App-Icons in allen iOS-Grössen (1024×1024 Store Icon)
- [ ] App Store Screenshots (iPhone 6.7", 6.1", iPad)
- [ ] App Store Beschreibung + Keywords (Deutsch + Englisch)
- [ ] Privacy Policy + Terms of Service URLs
- [ ] App Review Information (Demo-Account für Apple Reviewer)
- [ ] TestFlight einrichten für Beta-Tester

### 7.6 App Store Review vorbereiten

Apple prüft strenger als Google. Wichtige Punkte:

- [ ] Guideline 4.2 (Minimum Functionality) — App muss Mehrwert über Website hinaus bieten
- [ ] Tauri erzeugt echte native Apps (kein reiner WebView-Wrapper) → sollte akzeptiert werden
- [ ] Native Features dokumentieren (Notifications, Biometrics, Haptics) als Differenzierung zur Web-App
- [ ] Offline-Fähigkeit hervorheben

### 7.7 Validierung

- [ ] App läuft auf iOS 16+ stabil (iPhone + iPad)
- [ ] IndexedDB-Persistenz über Wochen (!) testen
- [ ] Face ID / Touch ID funktioniert
- [ ] Push Notifications kommen an
- [ ] TestFlight Beta-Test erfolgreich
- [ ] App Store Review bestanden

---

## Phase 8: Desktop-Features, CI/CD & Qualitätssicherung

**Ziel:** Plattformübergreifende Stabilität, native Desktop-Features und automatisierte Builds.

**Aufwand:** 2–3 Wochen

### 8.1 Desktop-Features (alle Desktop-Plattformen)

- [ ] **System Tray** — `tauri-plugin-positioner`, Minimieren in Tray, Quick-Actions
- [ ] **Auto-Updater** — `tauri-plugin-updater`, Update-Server, In-App Dialog
- [ ] **Native Notifications** — `tauri-plugin-notification`, Calendar-Erinnerungen
- [ ] **Globale Shortcuts** — `Cmd/Ctrl+N` (Neues Item), `Cmd/Ctrl+K` (Quick-Suche), `Cmd/Ctrl+1-9` (Modul wechseln)
- [ ] **Deep Links** — `mana://` Protocol für Links aus Emails/Chat
- [ ] **Dateisystem** — Drag & Drop, "Öffnen mit", Export (PDF/CSV)

### 8.2 Build Pipeline (Forgejo CI)

- [ ] macOS Build → DMG + App Bundle
- [ ] Windows Build → MSI + NSIS Installer
- [ ] Linux Build → AppImage + DEB
- [ ] Android Build → APK + AAB
- [ ] iOS Build → IPA
- [ ] Signing für alle Plattformen automatisieren
- [ ] Build-Artefakte als Releases veröffentlichen

### 8.3 Auto-Update Infrastruktur

- [ ] Update-Server / Release-Endpunkt auf Mac Mini
- [ ] Versionierung: SemVer aus Git-Tags
- [ ] Delta-Updates wo möglich

### 8.4 App Store Deployment

- [ ] Apple App Store: Upload via `xcrun altool` oder Transporter
- [ ] Google Play: Upload via Fastlane oder Play Console API
- [ ] Optional: Microsoft Store (MSIX), Snapcraft (Linux)

### 8.5 Testmatrix

| Test | macOS | Windows | Linux | Android | iOS |
|------|-------|---------|-------|---------|-----|
| App startet | | | | | |
| Login/Auth | | | | | |
| IndexedDB Persistenz | | | | | |
| Sync (Push/Pull) | | | | | |
| WebSocket Reconnect | | | | | |
| Alle 27+ Module | | | | | |
| Offline-Modus | | | | | |
| Auto-Update | | | | | |
| Deep Links | | | | | |
| Native Notifications | | | | | |
| Biometrics | — | — | — | | |

### 8.6 Performance-Benchmarks

- [ ] Cold-Start: Ziel < 2s Desktop, < 3s Mobile
- [ ] RAM: Ziel < 150 MB Desktop, < 100 MB Mobile
- [ ] IndexedDB R/W Performance: Web vs Tauri vergleichen
- [ ] Scroll-Performance mit 1000+ Items in Listen

### 8.7 Edge Cases

- [ ] Kein Internet → App funktioniert offline
- [ ] Sleep/Wake → Sync reconnect
- [ ] Mehrere Desktop-Instanzen gleichzeitig
- [ ] Web-Nutzer öffnet Desktop-App → Daten synchronisieren automatisch

---

## Aufwand-Übersicht

| Phase | Plattform | Aufwand (inkrementell) | Kumuliert | Grösste Hürde |
|-------|-----------|----------------------|-----------|---------------|
| **1** | PWA (Web) | ~~1–2 Wochen~~ ✅ | ✅ Done | ~~Responsive UI~~ Erledigt |
| **2** | SPA-Basis | 2–4 Tage | ~2.5 Wochen | `hooks.server.ts` → Client-Config |
| **3** | macOS | 2–3 Tage | ~3 Wochen | — (geringster Aufwand) |
| **4** | Windows | 2–3 Tage | ~3.5 Wochen | Andere Rendering-Engine (Chromium) |
| **5** | Linux | 0.5–1 Tag | ~3.5 Wochen | Nur Testen |
| **6** | Android | 1–2 Wochen | ~5.5 Wochen | WebView-Versionen älterer Geräte |
| **7** | iOS | 1–2 Wochen | ~7.5 Wochen | IndexedDB-Limits, App Store Review |
| **8** | CI/CD & QA | 2–3 Wochen | ~10 Wochen | Plattformübergreifende Stabilität |

**Gesamt: ca. 8–12 Wochen** von PWA bis zur stabilen Auslieferung auf allen 5 Plattformen + App Stores.

### Was jede Phase freischaltet

| Nach Phase | Nutzer können... |
|------------|-----------------|
| Phase 1 | App auf jedem Gerät aus dem Browser installieren (PWA) |
| Phase 3 | Mana als macOS Desktop-App nutzen (DMG) |
| Phase 4 | Mana als Windows Desktop-App nutzen (Installer) |
| Phase 5 | Mana auf Linux nutzen (AppImage) |
| Phase 6 | Mana aus dem Play Store installieren |
| Phase 7 | Mana aus dem App Store installieren |
| Phase 8 | Automatische Updates, native Features, stabile CI/CD |

---

## Risiken & Mitigationen

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| iOS WebKit IndexedDB-Limit | Mittel | Hoch | SQLite-Fallback evaluieren (Phase 7.3) |
| WebView-Inkonsistenzen Android | Mittel | Mittel | Minimum WebView-Version enforzen, Polyfills |
| Server-Routes im SPA-Modus | Sicher | Mittel | Phase 2.2 löst dies systematisch |
| Tauri Mobile Bugs | Mittel | Hoch | Capacitor als Fallback bereithalten |
| App Store Rejection (Apple) | Niedrig | Hoch | Native Features als Differenzierung betonen |
| Bundle-Grösse zu gross | Niedrig | Niedrig | Tauri-Bundles typisch 2–10 MB |
| Responsive UI Aufwand unterschätzt | Mittel | Mittel | In Phase 1 (PWA) anpacken, nicht aufschieben |

---

## Entscheidungspunkte (Go/No-Go)

| Nach Phase | Frage | Falls Nein |
|------------|-------|------------|
| **Phase 2** | Funktioniert die App stabil als SPA? | Falls fundamental SSR-abhängig → Architektur überdenken |
| **Phase 3** | Läuft Desktop auf macOS? IndexedDB/Sync stabil? | → Electron als Desktop-Fallback |
| **Phase 6** | Android stabil? WebView-Performance akzeptabel? | → Capacitor als Mobile-Fallback |
| **Phase 7** | iOS IndexedDB-Persistenz ausreichend? | → SQLite-Fallback oder Capacitor + SQLite |
| **Phase 7** | App Store Review bestanden? | → Native Features nachrüsten, ggf. Capacitor |
