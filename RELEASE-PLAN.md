# Manacore Monorepo - Release-Plan & Priorisierung

> Erstellt am: 2024-12-05
> Basierend auf: Analyse aller 31 Apps im Monorepo

## Inhaltsverzeichnis

- [Bewertungskriterien](#bewertungskriterien)
- [Release-Phasen](#release-phasen)
- [Phase 1: Foundation](#phase-1-foundation)
- [Phase 2: Quick Wins](#phase-2-quick-wins)
- [Phase 3: Core Productivity](#phase-3-core-productivity)
- [Phase 4: AI-Powered Apps](#phase-4-ai-powered-apps)
- [Phase 5: Nischen-Apps](#phase-5-nischen-apps)
- [Phase 6: Games](#phase-6-games)
- [Archivierte Apps](#archivierte-apps)
- [Zusammenfassung](#zusammenfassung)

---

## Bewertungskriterien

Jede App wurde anhand folgender Kriterien bewertet:

| Kriterium | Gewichtung | Beschreibung |
|-----------|------------|--------------|
| **Reifegrad** | 25% | Wie vollständig ist die App? (Backend, Web, Mobile, Landing) |
| **Marktpotenzial** | 25% | Größe der Zielgruppe, Monetarisierungspotenzial |
| **Komplexität** | 20% | Technische Komplexität, externe Abhängigkeiten (APIs, AI) |
| **Strategische Bedeutung** | 15% | Wichtigkeit für das Manacore-Ökosystem |
| **Wartungsaufwand** | 15% | Erwarteter laufender Aufwand nach Release |

### Reifegrad-Matrix (Aktive Apps)

| App | Backend | Web | Mobile | Landing | Reifegrad |
|-----|---------|-----|--------|---------|-----------|
| chat | ✅ | ✅ | ✅ | ✅ | Sehr hoch |
| picture | ✅ | ✅ | ✅ | ✅ | Sehr hoch |
| manadeck | ✅ | ✅ | ✅ | ✅ | Sehr hoch |
| zitare | ✅ | ✅ | ✅ | ✅ | Hoch |
| presi | ✅ | ✅ | ✅ | ✅ | Hoch |
| mail | ✅ | ✅ | ✅ | ✅ | Mittel |
| calendar | ✅ | ✅ | - | ✅ | Mittel |
| clock | ✅ | ✅ | - | ✅ | Mittel |
| manacore | - | ✅ | ✅ | ✅ | Mittel |
| contacts | ✅ | ✅ | 🔲 | 🔲 | Mittel |
| todo | ✅ | ✅ | - | 🔲 | Niedrig |
| storage | ✅ | ✅ | - | 🔲 | Niedrig |
| moodlit | ✅ | ✅ | ✅ | ✅ | Neu |
| finance | ✅ | ✅ | 🔲 | 🔲 | Neu |

✅ = Vorhanden | 🔲 = Leer/Skeleton | - = Nicht vorhanden

---

## Release-Phasen

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RELEASE-ROADMAP                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  Phase 1        Phase 2       Phase 3        Phase 4       Phase 5      │
│  Foundation     Quick Wins    Core Prod.     AI-Powered    Nischen      │
│  ──────────     ──────────    ──────────     ──────────    ──────────   │
│  mana-core-auth zitare        todo           chat          mail         │
│  manacore       clock         calendar       picture       storage      │
│                 manadeck      contacts       presi                      │
│                               finance                                    │
│                                                                          │
│  ◄────────────────────────────────────────────────────────────────────► │
│  Woche 1-2      Woche 3-4     Woche 5-8      Woche 9-12    Woche 13+    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation

**Zeitrahmen:** Zuerst | **Priorität:** KRITISCH

### 1.1 mana-core-auth (Zentrale Authentifizierung)

| Eigenschaft | Wert |
|-------------|------|
| **Priorität** | 1 (Höchste) |
| **Status** | Aktiv, funktionsfähig |
| **Port** | 3001 |

**Warum zuerst?**
- Alle anderen Apps hängen von diesem Service ab
- Ohne Auth funktioniert keine App im Produktivbetrieb
- EdDSA JWT-basierte Authentifizierung ist das Rückgrat des Ökosystems

**Vor Release zu tun:**
- [ ] Security Audit durchführen
- [ ] Rate Limiting implementieren
- [ ] Monitoring & Alerting einrichten
- [ ] Backup-Strategie für DB

---

### 1.2 manacore (Multi-App Ecosystem Platform)

| Eigenschaft | Wert |
|-------------|------|
| **Priorität** | 2 |
| **Status** | Web ✅, Mobile ✅, Landing ✅ |
| **Beschreibung** | Zentrales Dashboard für alle Mana-Apps |

**Warum in Phase 1?**
- Ist das "Schaufenster" des gesamten Ökosystems
- Nutzer verwalten hier ihre App-Zugänge und Credits
- Marketing-Hub für alle anderen Apps

**Vor Release zu tun:**
- [ ] Dashboard-Widgets für alle Phase-2-Apps vorbereiten
- [ ] Credit-System UI finalisieren
- [ ] App-Store-Übersicht einbauen

---

## Phase 2: Quick Wins

**Zeitrahmen:** Woche 3-4 | **Priorität:** HOCH

Diese Apps sind release-ready und haben klare Use Cases mit geringem Risiko.

### 2.1 zitare (Tägliche Inspirations-Zitate)

| Eigenschaft | Wert |
|-------------|------|
| **Priorität** | 3 |
| **Reifegrad** | Hoch (alle Komponenten vorhanden) |
| **Komplexität** | Niedrig |

**Warum hier?**
- Einfache App mit klarem Mehrwert
- Geringe API-Kosten (keine AI-Aufrufe)
- Perfekt für virale Verbreitung (Zitate teilen)
- Gut für Nutzerbindung (tägliche Routine)

**Besonderheiten:**
- Favoriten-System
- Personalisierte Empfehlungen
- Share-Funktionalität

---

### 2.2 clock (Uhren-App)

| Eigenschaft | Wert |
|-------------|------|
| **Priorität** | 4 |
| **Reifegrad** | Mittel (kein Mobile) |
| **Komplexität** | Niedrig |

**Warum hier?**
- Utility-App ohne externe Abhängigkeiten
- Keine laufenden API-Kosten
- Breite Zielgruppe (jeder braucht Timer/Wecker)
- Pomodoro-Timer für Produktivitäts-Fokus

**Features:**
- Weltzeituhr
- Wecker
- Timer
- Stoppuhr
- Pomodoro-Timer

---

### 2.3 manadeck (Lernkarten/Spaced Repetition)

| Eigenschaft | Wert |
|-------------|------|
| **Priorität** | 5 |
| **Reifegrad** | Sehr hoch (alle Komponenten) |
| **Komplexität** | Mittel |

**Warum hier?**
- Bewährtes Konzept (Anki-Alternative)
- Klare Monetarisierung (Freemium)
- Sehr hoher Reifegrad im Code
- Große Zielgruppe (Studenten, Sprachlerner)

**Besonderheiten:**
- Spaced Repetition Algorithmus
- Deck-Sharing
- Import/Export

---

## Phase 3: Core Productivity

**Zeitrahmen:** Woche 5-8 | **Priorität:** HOCH

Produktivitäts-Apps, die das tägliche Leben verbessern.

### 3.1 todo (Task-Management)

| Eigenschaft | Wert |
|-------------|------|
| **Priorität** | 6 |
| **Reifegrad** | Niedrig (Landing fehlt) |
| **Komplexität** | Mittel |

**Warum hier?**
- Grundlegende Produktivitäts-App
- Synergien mit calendar
- Großer Markt (wenn auch wettbewerbsintensiv)

**Features:**
- Projekte
- Subtasks
- Labels
- Wiederkehrende Aufgaben

**Vor Release:**
- [ ] Landing Page erstellen
- [ ] Mobile App entwickeln

---

### 3.2 calendar (Kalender)

| Eigenschaft | Wert |
|-------------|------|
| **Priorität** | 7 |
| **Reifegrad** | Mittel (kein Mobile) |
| **Komplexität** | Hoch |

**Warum hier?**
- Natürliche Ergänzung zu todo
- CalDAV/iCal-Sync ist starkes Feature
- Wiederkehrende Termine sind komplex aber wertvoll

**Vor Release:**
- [ ] CalDAV-Sync testen
- [ ] Mobile App entwickeln
- [ ] Integration mit todo

---

### 3.3 contacts (Kontaktverwaltung)

| Eigenschaft | Wert |
|-------------|------|
| **Priorität** | 8 |
| **Reifegrad** | Mittel |
| **Komplexität** | Mittel |

**Warum hier?**
- Synergien mit mail und calendar
- Google-Sync ist starkes Feature
- Import/Export für Migration

**Vor Release:**
- [ ] Mobile App entwickeln
- [ ] Landing Page erstellen
- [ ] Google OAuth finalisieren

---

### 3.4 finance (Budget-Tracker)

| Eigenschaft | Wert |
|-------------|------|
| **Priorität** | 9 |
| **Reifegrad** | Neu |
| **Komplexität** | Mittel |

**Warum hier?**
- Wichtige Produktivitäts-App
- Multi-Currency ist differenzierendes Feature
- Gutes Monetarisierungspotenzial

**Vor Release:**
- [ ] Core-Features fertigstellen
- [ ] Mobile App entwickeln
- [ ] Landing Page erstellen

---

## Phase 4: AI-Powered Apps

**Zeitrahmen:** Woche 9-12 | **Priorität:** MITTEL

Diese Apps haben höhere Komplexität und laufende API-Kosten.

### 4.1 chat (KI-Chat-Anwendung)

| Eigenschaft | Wert |
|-------------|------|
| **Priorität** | 10 |
| **Reifegrad** | Sehr hoch |
| **Komplexität** | Hoch |
| **API-Kosten** | Hoch (LLM-Aufrufe) |

**Warum hier und nicht früher?**
- Höchster Reifegrad, ABER:
- Hohe laufende API-Kosten (OpenAI, Claude, etc.)
- Intensiver Wettbewerb (ChatGPT, Claude.ai)
- Credit-System muss zuerst stabil laufen

**Vor Release:**
- [ ] Cost-per-request Monitoring
- [ ] Rate Limiting pro User
- [ ] Model-Fallback bei API-Ausfällen
- [ ] Prompt-Injection-Schutz

---

### 4.2 picture (KI-Bildgenerierung)

| Eigenschaft | Wert |
|-------------|------|
| **Priorität** | 11 |
| **Reifegrad** | Sehr hoch |
| **Komplexität** | Hoch |
| **API-Kosten** | Sehr hoch (Bildgenerierung) |

**Warum hier?**
- Sehr hoher Reifegrad
- Starkes Monetarisierungspotenzial
- Aber: Höchste API-Kosten im Portfolio

**Vor Release:**
- [ ] Credit-Verbrauch pro Generation kalibrieren
- [ ] Galerie-Moderation (NSFW-Filter)
- [ ] Wasserzeichen-Option

---

### 4.3 presi (Präsentations-Tool)

| Eigenschaft | Wert |
|-------------|------|
| **Priorität** | 12 |
| **Reifegrad** | Hoch |
| **Komplexität** | Hoch |

**Warum hier?**
- Weniger AI-lastig als chat/picture
- Gute Nische (Canva/Pitch-Alternative)
- Enterprise-Potenzial

**Vor Release:**
- [ ] Export-Formate (PDF, PPTX)
- [ ] Kollaboration-Features
- [ ] Templates-Bibliothek

---

## Phase 5: Nischen-Apps

**Zeitrahmen:** Woche 13+ | **Priorität:** NIEDRIG

Spezialisierte Apps mit kleinerer Zielgruppe.

### 5.1 mail (E-Mail-Client)

| Eigenschaft | Wert |
|-------------|------|
| **Priorität** | 13 |
| **Reifegrad** | Mittel |
| **Komplexität** | Sehr hoch |

**Warum so spät?**
- E-Mail-Clients sind extrem komplex
- IMAP/SMTP-Integration ist fehleranfällig
- Starke Konkurrenz (Gmail, Outlook, ProtonMail)
- AI-Features erhöhen Komplexität weiter

**Vor Release:**
- [ ] Umfangreiche E-Mail-Provider-Tests
- [ ] Spam-Handling
- [ ] Attachment-Limits
- [ ] End-to-End-Encryption?

---

### 5.2 storage (Cloud-Speicher)

| Eigenschaft | Wert |
|-------------|------|
| **Priorität** | 14 |
| **Reifegrad** | Niedrig |
| **Komplexität** | Sehr hoch |

**Warum so spät?**
- Hohe Infrastrukturkosten
- Starke Konkurrenz (Dropbox, Google Drive)
- Rechtliche Aspekte (Datenspeicherung)

**Vor Release:**
- [ ] Storage-Limits pro Plan definieren
- [ ] Backup-Strategie
- [ ] DSGVO-Compliance
- [ ] Deduplizierung

---

### 5.3 moodlit (Ambient Lighting)

| Eigenschaft | Wert |
|-------------|------|
| **Priorität** | 15 |
| **Reifegrad** | Neu |
| **Komplexität** | Niedrig |

**Warum so spät?**
- Sehr nischiger Use Case
- Wenig Monetarisierungspotenzial
- Kann als "Nice-to-have" warten

---

## Phase 6: Games

**Zeitrahmen:** Parallel/Später | **Priorität:** OPTIONAL

Games sind unabhängig vom Hauptökosystem und können flexibel released werden.

| Game | Beschreibung | Status |
|------|--------------|--------|
| **mana-games** | Browser-Spieleplatform | Aktiv |
| **figgos** | Collectible Figure Game | Neu strukturiert |
| **voxel-lava** | 3D Voxel Building Game | In Entwicklung |
| **whopixels** | Pixel-Art-Editor-Spiel | Einfache Struktur |

**Empfehlung:** Games als eigenständiges Produkt betrachten, nicht im Manacore-Ökosystem integrieren (außer mana-games als Platform).

---

## Archivierte Apps

Diese Apps sind aktuell pausiert. Reaktivierung nach Bedarf:

| App | Beschreibung | Reaktivierungs-Empfehlung |
|-----|--------------|---------------------------|
| **uload** | URL-Shortener (Live: ulo.ad) | Eigenständig halten |
| **maerchenzauber** | KI-Kindermärchen | Nach picture (AI-Synergien) |
| **memoro** | Sprachnotizen | Nach mail (Backend-Synergien) |
| **nutriphi** | Ernährungs-Tracker | Nach finance (Tracking-Synergien) |
| **wisekeep** | YouTube-Wissensextraktion | Nach chat (AI-Synergien) |
| **news** | News-Aggregator | Niedrige Priorität |
| **bauntown** | Community-Website | Nur Landing, niedrige Priorität |
| **reader** | Text-to-Speech | Nach mail (Komplexität ähnlich) |

---

## Zusammenfassung

### Release-Reihenfolge (Top 15)

| # | App | Phase | Begründung |
|---|-----|-------|------------|
| 1 | mana-core-auth | Foundation | Alle Apps hängen davon ab |
| 2 | manacore | Foundation | Ökosystem-Hub |
| 3 | zitare | Quick Wins | Niedrige Komplexität, hohe Viralität |
| 4 | clock | Quick Wins | Utility ohne Abhängigkeiten |
| 5 | manadeck | Quick Wins | Sehr hoher Reifegrad |
| 6 | todo | Core Prod. | Basis-Produktivität |
| 7 | calendar | Core Prod. | Ergänzt todo |
| 8 | contacts | Core Prod. | Ergänzt mail/calendar |
| 9 | finance | Core Prod. | Starkes Monetarisierungspotenzial |
| 10 | chat | AI-Powered | Hoher Reifegrad, aber hohe Kosten |
| 11 | picture | AI-Powered | Höchste API-Kosten |
| 12 | presi | AI-Powered | Enterprise-Potenzial |
| 13 | mail | Nischen | Sehr hohe Komplexität |
| 14 | storage | Nischen | Hohe Infrastrukturkosten |
| 15 | moodlit | Nischen | Nischen-App |

### Kritische Erfolgsfaktoren

1. **mana-core-auth MUSS stabil sein** - Ein Auth-Ausfall betrifft ALLE Apps
2. **Credit-System vor AI-Apps** - Ohne funktionierende Abrechnung keine AI-Features
3. **Quick Wins für Momentum** - zitare/clock/manadeck für frühe Nutzerbasis
4. **API-Kosten im Blick** - chat/picture erst wenn Monetarisierung funktioniert

### Nächste Schritte

1. [ ] Security Audit für mana-core-auth planen
2. [ ] Landing Pages für todo/storage/finance/contacts erstellen
3. [ ] Mobile Apps für clock/calendar entwickeln
4. [ ] Monitoring-Infrastruktur aufbauen
5. [ ] Beta-Tester-Programm für Phase-2-Apps starten

---

*Dieses Dokument wird regelmäßig aktualisiert, wenn sich Prioritäten ändern.*
