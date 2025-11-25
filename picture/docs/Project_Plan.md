# Picture App - MVP Projektplan

## 📋 Projektstatus

### ✅ Bereits implementiert
- **Grundgerüst**: Expo React Native App mit TypeScript
- **Navigation**: Tab-Navigation mit Expo Router
- **Styling**: NativeWind (Tailwind CSS) konfiguriert
- **State Management**: Zustand Store vorbereitet
- **Backend**: Supabase Client konfiguriert (Umgebungsvariablen fehlen noch)
- **Datenbank**: Vollständiges Schema mit allen Tabellen, RLS Policies und Indizes
- **UI-Komponenten**: Button, Container, TabBarIcon, HeaderButton

### 🚧 Aktueller Stand
- Basis-App läuft mit Placeholder-Screens
- Datenbank ist vollständig aufgesetzt
- Authentifizierung noch nicht implementiert
- Keine Verbindung zwischen App und Datenbank

## 🎯 MVP-Zieldefinition

Ein funktionsfähiges AI-Bildgenerierungs-Tool mit folgenden Kernfunktionen:
1. Benutzer können sich registrieren und anmelden
2. Bilder über Texteingaben (Prompts) generieren
3. Generierte Bilder in einer persönlichen Galerie speichern und verwalten
4. Grundlegende Bildbearbeitung (Favoriten, Löschen, Tags)

## 📝 Implementierungsschritte zum MVP

### Phase 1: Backend-Konfiguration (1-2 Tage)
#### 1.1 Supabase-Umgebung
- [ ] Supabase Projekt-URL und Anon-Key in `.env` eintragen
- [ ] Storage Bucket für Bilder erstellen
- [ ] Edge Functions für Bildgenerierung vorbereiten

#### 1.2 API Integration
- [ ] API-Key Management für Bildgenerierungs-Service (Replicate/Stability AI)
- [ ] Sichere API-Key-Speicherung in Supabase Secrets

### Phase 2: Authentifizierung (2-3 Tage)
#### 2.1 Auth-Screens
- [ ] Login Screen erstellen
- [ ] Registrierungs-Screen mit E-Mail/Passwort
- [ ] Passwort-Reset Funktionalität
- [ ] Auth-Navigation Guard implementieren

#### 2.2 Profilverwaltung
- [ ] Profil-Screen mit Avatar-Upload
- [ ] Username-Eingabe bei Erstregistrierung
- [ ] Profile-Tabelle automatisch bei Registrierung befüllen

### Phase 3: Kern-Funktionalität (4-5 Tage)
#### 3.1 Bildgenerierungs-Interface
- [ ] Hauptscreen mit Prompt-Eingabefeld
- [ ] Erweiterte Optionen (Negative Prompt, Style-Auswahl)
- [ ] Parameter-Einstellungen (Größe, Steps, Guidance Scale)
- [ ] Generierungs-Status-Anzeige (Loading, Progress)

#### 3.2 Bildgenerierungs-Backend
- [ ] Supabase Edge Function für API-Calls
- [ ] Queue-System für Generierungsanfragen
- [ ] Fehlerbehandlung und Retry-Logik
- [ ] Bild-Upload zu Supabase Storage nach Generierung

#### 3.3 Integration mit AI-Service
- [ ] Replicate API Integration (empfohlen für MVP)
- [ ] Modell-Auswahl (SDXL, Stable Diffusion 3)
- [ ] Response-Handling und Bild-Download

### Phase 4: Galerie & Bildverwaltung (3-4 Tage)
#### 4.1 Galerie-Screen
- [ ] Grid-Ansicht aller generierten Bilder
- [ ] Infinite Scrolling/Pagination
- [ ] Filter und Sortieroptionen
- [ ] Pull-to-Refresh

#### 4.2 Bild-Detailansicht
- [ ] Vollbild-Ansicht mit Zoom
- [ ] Anzeige der Generation-Parameter
- [ ] Aktionen: Favorit, Löschen, Teilen, Download
- [ ] Tag-System implementieren

#### 4.3 Such- und Filter-Funktionen
- [ ] Suche nach Prompts
- [ ] Filter nach Datum, Favoriten, Tags
- [ ] Sortierung nach verschiedenen Kriterien

### Phase 5: UI/UX-Optimierung (2-3 Tage)
#### 5.1 Design-System
- [ ] Konsistente Farbpalette definieren
- [ ] Dark/Light Mode Support
- [ ] Loading States und Skeletons
- [ ] Error States und Empty States

#### 5.2 Performance
- [ ] Bildoptimierung (Thumbnails, Lazy Loading)
- [ ] Cache-Strategie implementieren
- [ ] Offline-Support für Galerie

### Phase 6: Testing & Deployment (2 Tage)
#### 6.1 Testing
- [ ] Manuelle Tests aller Features
- [ ] Edge Cases und Fehlerbehandlung
- [ ] Performance-Tests

#### 6.2 Deployment
- [ ] iOS Build mit EAS
- [ ] Android Build mit EAS
- [ ] TestFlight/Internal Testing

## 🔧 Technische Implementierungsdetails

### Navigation-Struktur (Expo Router)
```
app/
├── (auth)/
│   ├── login.tsx
│   ├── register.tsx
│   └── reset-password.tsx
├── (tabs)/
│   ├── _layout.tsx
│   ├── generate.tsx     // Hauptscreen für Generierung
│   ├── gallery.tsx      // Galerie-Übersicht
│   └── profile.tsx      // Profil & Einstellungen
├── image/[id].tsx       // Bild-Detailansicht
└── _layout.tsx
```

### State Management (Zustand)
```typescript
// stores/authStore.ts
- user
- session
- signIn/signOut

// stores/generationStore.ts
- currentPrompt
- generationParams
- generationStatus
- generatedImages

// stores/galleryStore.ts
- images
- filters
- sortOrder
- selectedTags
```

### API-Services
```typescript
// services/supabase/
├── auth.ts          // Authentifizierung
├── profiles.ts      // Profilverwaltung
├── images.ts        // Bildverwaltung
├── generation.ts    // Generierungs-Logik
└── storage.ts       // File Upload/Download
```

### Komponenten-Bibliothek
```
components/
├── auth/
│   ├── LoginForm.tsx
│   └── RegisterForm.tsx
├── generation/
│   ├── PromptInput.tsx
│   ├── ParameterControls.tsx
│   └── GenerationStatus.tsx
├── gallery/
│   ├── ImageGrid.tsx
│   ├── ImageCard.tsx
│   └── FilterBar.tsx
└── common/
    ├── LoadingSpinner.tsx
    ├── ErrorMessage.tsx
    └── EmptyState.tsx
```

## 📊 Zeitplan

**Geschätzte Gesamtdauer: 14-19 Arbeitstage**

### Woche 1
- Phase 1: Backend-Konfiguration
- Phase 2: Authentifizierung

### Woche 2
- Phase 3: Kern-Funktionalität (Bildgenerierung)

### Woche 3
- Phase 4: Galerie & Bildverwaltung
- Phase 5: UI/UX-Optimierung

### Woche 4
- Phase 6: Testing & Deployment
- Buffer für Bugfixes

## 🚀 Nächste Schritte nach MVP

### Version 1.1
- Social Features (öffentliche Galerie, Likes)
- Prompt Templates und Presets
- Batch-Generierung

### Version 1.2
- Community Features (Following, Kommentare)
- Erweiterte Bildbearbeitung
- Model-Training mit eigenen Bildern

### Version 1.3
- Monetarisierung (Credits-System)
- Premium-Features
- API-Zugang für Power-User

## 🛠️ Entwicklungs-Prioritäten

1. **Kritisch für MVP**
   - Authentifizierung
   - Bildgenerierung
   - Basisspeicherung

2. **Wichtig für Benutzererfahrung**
   - Intuitive UI
   - Schnelle Ladezeiten
   - Fehlerbehandlung

3. **Nice-to-Have für MVP**
   - Tags-System
   - Erweiterte Filter
   - Share-Funktion

## 📌 Wichtige Entscheidungen

### AI-Service-Auswahl
**Empfehlung: Replicate API**
- Pro: Viele Modelle, Pay-per-Use, gute Dokumentation
- Contra: Kosten bei hohem Volumen
- Alternative: Stability AI API oder selbst gehostete Modelle

### Bildformat & Speicherung
- Format: WebP für optimale Größe/Qualität
- Thumbnails: 256x256px für Galerie
- Original: Max 2048x2048px für MVP

### Authentifizierung
- Start mit E-Mail/Passwort
- Social Login (Google, Apple) als nächster Schritt

## ✅ Definition of Done für MVP

- [ ] Benutzer kann sich registrieren und anmelden
- [ ] Benutzer kann Prompts eingeben und Bilder generieren
- [ ] Generierte Bilder werden in der Galerie angezeigt
- [ ] Benutzer kann Bilder favorisieren und löschen
- [ ] App läuft stabil auf iOS und Android
- [ ] Grundlegende Fehlerbehandlung implementiert
- [ ] Basis-Performance-Optimierungen durchgeführt

## 🔗 Ressourcen & Dokumentation

- [Supabase Docs](https://supabase.com/docs)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [Replicate API Docs](https://replicate.com/docs)
- [NativeWind Docs](https://www.nativewind.dev/)
- [Zustand Docs](https://github.com/pmndrs/zustand)

---

**Letztes Update:** ${new Date().toLocaleDateString('de-DE')}
**Erstellt für:** Picture App MVP
**Version:** 1.0.0