# ClubDesk vs. Mana — Vergleichsanalyse & Lückenplan

**Erstellt:** 2026-04-20
**Autor:** Till (Recherche + Aufbereitung: Claude)
**Zweck:** Gegenüberstellung des Schweizer Marktführers für Vereinsverwaltung (ClubDesk) mit dem aktuellen Stand von Mana, um zu identifizieren, welche Features fehlen, damit Mana ClubDesk als Vereinsplattform ablösen könnte.

---

## 1. Executive Summary

- **ClubDesk** ist eine seit 2008 etablierte, spezialisierte All-in-One-Vereinssoftware mit ca. **20'000 aktiven Vereinen in DACH** (Stand Mai 2025), hergestellt von der **reeweb ag** in Basel. Kernwertversprechen: Mitgliederverwaltung + vollwertige **Schweizer Vereinsbuchhaltung** + integrierter **Website-Baukasten mit Hosting** — alles aus einer Hand.
- **Mana** ist eine moderne, KI-first, local-first Personal-Productivity-Plattform mit 60+ Modulen und einer entstehenden Multi-Tenant-Infrastruktur (Organizations via Better Auth, geteilte Kalender, Events mit RSVP). Die **Basis** für Vereinsverwaltung existiert, aber die **vereinsspezifische Geschäftslogik** (Beiträge, doppelte Buchführung, CH-Zahlungsintegration, Website-Baukasten) fehlt vollständig.
- **Fazit:** Mana ist technisch deutlich moderner (local-first, AI-native, offenes Ökosystem), aber produktseitig nicht vereinsbereit. Ein Ablöseprojekt erfordert **5 größere Feature-Pakete** (siehe §5) — grob geschätzt **6–10 Personenmonate** Entwicklungsaufwand für ein MVP-gleichwertiges Produkt.

---

## 2. ClubDesk — Profil

### 2.1 Unternehmen

| | |
|---|---|
| Hersteller | **reeweb ag**, Wettsteinplatz 7 / Picassoplatz 8, 4052 Basel (CHE-114.676.055) |
| Gründung | 2008/2009 |
| Gründer | Rolf Pfenninger, Tom Studer, Andreas Kling, Guido Hächler |
| Team | 21+ namentlich genannte Mitarbeitende (Entwicklung, Support, Marketing, Admin); 3-köpfige GL |
| Hosting | Nine Internet Solutions AG (CH, ISO 27001) |
| Marktreichweite | **~20'000 Vereine** (DACH), ~250 Neukundschaften/Monat, **3.8 Mio. verwaltete Kontakte** |
| Prominente Partner | Raiffeisen, PostFinance, Deutscher Tennisbund |
| Umsatz | nicht öffentlich (AG, nicht börsenkotiert). Grobschätzung aus Tarifstruktur: 20k Vereine × Ø ~CHF 180/Jahr ≈ **~3.6 Mio. CHF/Jahr ARR** (spekulativ, untere Grenze bei ~40% Free-Anteil) |

### 2.2 Zielgruppe

Ehrenamtlich geführte Vereine in CH/DE/AT — Sport, Musik/Chöre, Theater, Karneval/Fastnacht, Garten, Fanclubs, Fördervereine, Kirche, Feuerwehr-Jugend. Skaliert bis 5'000 Mitglieder/Verein.

### 2.3 Preise (CHF, Jahresabo)

| Tarif | Monatspreis | Mitglieder | Storage | Websites |
|---|---|---|---|---|
| Free | 0 | 50 | 100 MB | 1 (eingeschränkt) |
| S | 13 | 100 | 1 GB | 1 |
| M | 20 | 250 + 50 Kontakte | 2 GB | 2 (eig. Domain) |
| L | 36 | 500 + 200 | 5 GB | 3 |
| XL | 41 | 1'000 + 500 | 8 GB | 5 |

30 Tage Testphase, Individualangebote bis 5'000 Mitglieder.

### 2.4 Module & Features

| Modul | Umfang |
|---|---|
| **Mitgliederverwaltung** | Unbegrenzte Gruppen/Mannschaften, freie Zusatzfelder (Trikotgröße, Instrument, Lizenz), Rollen (Trainer, Kassier, Vorstand), granulare Lese-/Schreibrechte, CSV-Import, Massenupdate, Geburtstags-/Jubiläums-Reminder |
| **Kontaktverwaltung** | Sponsoren, Lieferanten, Ehemalige; Dublettenprüfung; Filter |
| **Rechnungen & Buchhaltung** | **Drei Modi:** Kassenbuch, Einnahmen-Ausgaben, **doppelte Buchführung**. **CH-Zahlverkehr:** QR-Rechnung, ESR/ISR, **TWINT**, camt.053/054-Bankabgleich. **DE:** SEPA-Lastschrift. Mahnwesen, Kontenrahmen SKR42, Mehrwährung, MwSt., Kostenstellen |
| **E-Mail / Mailserver** | Eigener Mailserver, Gruppenadressen (vorstand@…), Serienmails, Newsletter |
| **Kalender & Events** | Zentraler Vereinskalender, wiederkehrende Termine, An-/Abmeldung ("Ja/Nein/Vielleicht"), Export Apple/Google, automatische Benachrichtigung bei Änderungen |
| **Online-Anmeldung** | Events & Kurse mit konfigurierbaren Deadlines, öffentliches Formular |
| **Website-Baukasten** | Drag-&-Drop, responsive, Bilderkarussell, Parallax, Video, News, Terminlisten, Teamseiten. **Auto-Sync** aus Mitglieder- & Kalendermodul. SSL + Hosting inklusive, bis 5 Websites (XL), barrierefreie Variante |
| **Dokumentenverwaltung** | Protokolle, Verträge, Statuten; Ordner; Rechte; Batch-Upload |
| **Berechtigungen** | Rollen-/Gruppenbasiert (frei konfigurierbar ab S-Tarif, 3 Stufen bei Free) |
| **DSGVO** | AVV verfügbar, CH-Datacenter, verschlüsselte Übertragung, Backups inkludiert |

### 2.5 USPs

1. **All-in-One mit integriertem Website-Baukasten + Hosting + SSL** — alles ein Anbieter, eine Rechnung.
2. **Tiefe Schweizer Zahlungsintegration**: QR-Rechnung, TWINT, ISR/ESR, camt-Bankabgleich.
3. **Vollwertige Vereinsbuchhaltung** (inkl. doppelter Buchführung) out-of-the-box.
4. **Marktführerschaft DACH** mit 20'000 Vereinen (Trust-Signal).
5. **Dauerhaft kostenlose Free-Version** bis 50 Mitglieder (Akquise-Trichter).
6. **Inkludierter Support** (Telefon, E-Mail, TeamViewer) — CH-Standard.

### 2.6 Schwächen (aus Reviews / Forum)

- **Keine native Mobile-App** — nur mobile-optimierter Browser-Zugriff. Seit Jahren wiederkehrender Kritikpunkt.
- **Rechnungs-/Finanzbereich unübersichtlich**; steile Lernkurve für Kassiere ohne Buchhaltungs-Background.
- **Kein Lohn-/Entschädigungsmodul** für Trainer/Funktionäre.
- **Storage knapp** (1–8 GB); Zusatzspeicher kostenpflichtig.
- **Wenig dedizierte Sport-Features** (Ligaverwaltung, Tabellen, Spielberichte).
- **Review-Landschaft sehr dünn** (OMR: 4.7/5 bei 55 Ratings, Capterra DE teils nur Einzelreviews).

---

## 3. Mana — aktueller Stand

### 3.1 Architektur-Stärken

- **Local-First:** Alle CRUD-Operationen offline; ein IndexedDB, field-level LWW-Sync via mana-sync (Go, Port 3050) in PostgreSQL mit RLS.
- **AI-Native:** 59 AI-Tools in 19 Modulen, autonomer Mission Runner (mana-ai, Port 3067), Web-Research-Orchestrierung über 16+ Provider (mana-research, 3068).
- **Ein Ökosystem:** 60+ verschränkte Module, ein Session/JWT, SSO über `*.mana.how`.
- **Encryption-at-rest:** AES-GCM-256 in 27 Tables, optionales Zero-Knowledge mit Recovery-Codes.
- **GDPR-ready:** `.mana`-Export, Right-to-be-forgotten.
- **Moderner Stack:** SvelteKit 5, Hono/Bun, Drizzle, Better Auth (inkl. Organizations-Plugin).

### 3.2 Bereits vorhandene vereinsrelevante Bausteine

| Baustein | Zustand |
|---|---|
| **Kontakte** | ✅ Gruppen, Tags, Notizen, Massen-Import. Basis vorhanden, aber keine Rollen/Lizenzen/Zusatzfelder. |
| **Kalender** | ✅ Wiederkehrende Termine, geteilte Kalender, Reminder. |
| **Events** (`services/mana-events`, 3065) | ✅ Öffentliche Share-Links mit Token, RSVP ohne Login, Potluck-Item-Claiming. |
| **Finance** | ⚠️ Nur **persönliche** Einnahmen/Ausgaben — **keine** doppelte Buchführung, keine Rechnungen, keine Mitgliederbeiträge. |
| **Mail** (`services/mana-mail`, 3042 + Stalwart) | ✅ Vollwertiger IMAP/JMAP-Mailserver, Konto-Auto-Provisioning. Keine Newsletter-Kampagnen. |
| **Storage** | ✅ MinIO, Ordner, Versionierung. Keine berechtigungsbasierten Archiv-Funktionen. |
| **Organizations** (Better Auth Plugin) | ✅ Einladungen, Mitgliederrollen (owner/member/admin), active-org. Nur Grundschema — keine Verein-spezifischen Rollen. |
| **Landing Builder** (`services/mana-landing-builder`) | ⚠️ Existiert für interne Landing-Pages — **kein** Vereins-CMS mit Team-/News-/Termin-Bindings. |
| **Quiz / Forms** | ⚠️ Quiz-Builder vorhanden; kein dediziertes Formular-/Anmelde-System. |

### 3.3 Was Mana klar besser kann als ClubDesk

- **AI-Agents & Workbench** — ClubDesk hat null AI.
- **Mobile-First PWA** + Expo-basierte native Apps (im Aufbau).
- **Local-First / Offline** — ClubDesk benötigt Online-Verbindung.
- **Zero-Knowledge-Option** — in DACH-Vereinssoftware einzigartig.
- **Offene Architektur** — Custom-Tools, eigene Module, Open-Source-Prinzipien.

---

## 4. Feature-Gap-Matrix

| Bereich | ClubDesk | Mana heute | Gap-Schweregrad |
|---|---|---|---|
| Mitglieder-Datenmodell (Rollen, Lizenzen, Zusatzfelder) | ✅ voll | 🟡 Kontakte-Basis | **Mittel** |
| Mitgliederbeiträge / Dues | ✅ | ❌ | **Hoch** |
| Doppelte Vereinsbuchhaltung | ✅ | ❌ | **Hoch** |
| QR-Rechnung (CH) | ✅ | ❌ | **Hoch** (CH-Markt-kritisch) |
| TWINT-Integration | ✅ | ❌ | **Hoch** |
| camt.053/054-Bankabgleich | ✅ | ❌ | **Hoch** |
| SEPA-Lastschrift (DE) | ✅ | ❌ | **Hoch** |
| Mahnwesen | ✅ | ❌ | **Mittel** |
| Newsletter / Serienmails | ✅ | 🟡 (Stalwart SMTP da, kein Kampagnen-Tool) | **Mittel** |
| Gruppen-E-Mail-Adressen (vorstand@…) | ✅ | 🟡 (Stalwart kann's technisch) | Niedrig |
| SMS-Versand | ⚠️ optional | ❌ | Niedrig |
| Kalender mit RSVP | ✅ | ✅ | — |
| Online-Event-Anmeldung öffentlich | ✅ | ✅ (mana-events Share-Links) | — |
| Website-Baukasten mit Vereins-Bindings | ✅ (Kern-USP!) | ❌ | **Hoch** |
| Eigene Domain + Hosting + SSL | ✅ | ⚠️ technisch über Cloudflare machbar, kein Self-Service | **Mittel** |
| Dokumentenarchiv mit Rollen-Rechten | ✅ | 🟡 (Storage ohne Governance) | **Mittel** |
| Rollen-/Rechtematrix pro Modul | ✅ frei konfigurierbar | ❌ (nur owner/member/admin) | **Hoch** |
| Mehrere Vereine pro User | ✅ | ✅ (Organizations) | — |
| Mitglieder-Import CSV | ✅ | 🟡 (Kontakte-Import ja, aber ohne Verein-Felder) | Niedrig |
| Geburtstags-/Jubiläums-Reminder | ✅ | ❌ | Niedrig |
| Native Mobile-App | ❌ | 🟡 (Expo im Aufbau) | **Differenzierungs-Chance** |
| KI-Assistent / AI-Tools | ❌ | ✅ | **Differenzierungs-Chance** |
| Offline-Fähigkeit | ❌ | ✅ | **Differenzierungs-Chance** |
| Barrierefreie Website-Variante | ✅ | ❌ | Niedrig |

---

## 5. Was Mana braucht, um ClubDesk zu ersetzen

Die Lücke gliedert sich in **5 Arbeitspakete**. Reihenfolge nach Abhängigkeit und Markt-Kritikalität (CH-first).

### Paket A — Vereins-Datenmodell & Rollen (Foundation)

**Ziel:** Organizations-Schema zu vollwertiger Vereinsentität ausbauen.

- Neues Modul `clubs/` (oder Erweiterung der Better-Auth-Organization) mit: Vereinsname, Logo, IBAN, UID, Rechtsform, Statuten-Upload.
- Mitglieder-Entität mit Zusatzfeldern: Eintrittsdatum, Austrittsdatum, Mitgliedskategorie (Aktiv/Passiv/Ehren), Lizenznummer, benutzerdefinierte Felder.
- **Rollen/Rechtematrix** pro Modul (read/write/admin × Mitglieder/Finanzen/Events/Dokumente).
- Mehrere Gruppen/Teams (Mannschaft U15, Vorstand, Junioren-Chor) mit eigenen Verteilern.
- **Aufwand:** ~1 PM

### Paket B — Finanzen & Beiträge (Kernrisiko)

**Ziel:** Mitgliederbeiträge + Vereinsrechnungen + Schweizer Zahlungsstandards.

- Neues Modul `club-finance` (getrennt vom persönlichen Finance-Modul).
- **Rechnungs-Engine**: PDF-Generierung, fortlaufende Nummernkreise, Serien-Rechnungsläufe (Mitgliederbeitrag jährlich).
- **QR-Rechnung (CH)** via `swissqrbill`-Lib (JS) oder ähnlich — Pflicht für CH-Vereine.
- **camt.053/054-Parser** für Bankabgleich (Raiffeisen, PostFinance, Kantonalbanken liefern alle camt).
- **SEPA-Lastschrift (DE)** — XML-Export pain.008.
- **TWINT**: entweder Business-API (komplex) oder TWINT-QR via Postfinance (einfacher Einstieg).
- Mahnwesen (3 Stufen), Zahlungsstatus-Automatik.
- **Buchhaltung:** erstmal Einnahmen-Ausgaben-Rechnung reicht für 80% der Vereine; doppelte Buchführung als Phase 2.
- **Aufwand:** ~3–4 PM (CH-Banking ist aufwändig), Phase-2 doppelte Buchführung +2 PM.

### Paket C — Website-Baukasten für Vereine (Differenzierungs-USP)

**Ziel:** Öffentliche Vereinswebsite mit Live-Daten aus Mana.

- `mana-landing-builder` von Astro-Templates zu konfigurierbarem Drag-&-Drop-Editor erweitern (oder Alternative wie Builder.io/Astro-Islands + eigenem Block-System).
- **Bindings**: Team-Seite zieht aus `members`, Terminliste aus `calendar`, News aus neuem `news`-Modul.
- Mehrere Seiten pro Verein, eigene (Sub-)Domain via Cloudflare for SaaS.
- SSL automatisch (Let's Encrypt via Cloudflare).
- Öffentliche Anmeldeformulare für Events (existiert teilweise via `mana-events` Share-Links).
- **Aufwand:** ~2 PM (MVP mit Template-Auswahl + Team/Termin-Blöcken)

### Paket D — Kommunikation (Newsletter & Serienmails)

**Ziel:** Vereinsmailings mit Tracking & Rechtssicherheit.

- Neues Modul `club-broadcast`, sitzt auf bestehendem Stalwart-SMTP.
- Empfängerlisten aus Mitgliedergruppen + Filter.
- HTML-Editor (Unlayer oder selbst gebaut mit Svelte).
- Zustellstatistik (Bounces, Opens via Tracking-Pixel, Unsubscribe-Links — DSGVO-konform).
- Automatische Geburtstags-/Jubiläums-Mails.
- Optional: SMS via Twilio/MessageBird-Adapter.
- **Aufwand:** ~1–1.5 PM

### Paket E — Dokumentenarchiv & Berechtigungen

**Ziel:** Protokolle, Verträge, Statuten rechtssicher verwalten.

- Storage-Modul um Archive-Funktion erweitern: Ordner mit Rollen-ACL (nur Vorstand, nur Revisoren).
- Versionierung existiert bereits — UI für Revisionsvergleich fehlt.
- Audit-Log pro Dokument (wer hat wann gelesen/geändert).
- **Aufwand:** ~0.75 PM

### Paket F (optional/später) — Sport/Verbands-Spezifika

Ligaverwaltung, Spielberichte, Tabellen, Platz-/Hallen-Buchung. Nur falls Zielmarkt Sportvereine explizit adressiert werden soll. ClubDesk hat das **selbst nicht stark** → Differenzierungsmöglichkeit, aber kein Blocker.

---

## 6. Gesamtaufwand & Reihenfolge

| Phase | Pakete | Aufwand | Ergebnis |
|---|---|---|---|
| **MVP Verein-Light** | A + D (Newsletter) + B-lite (nur Mitgliederbeitrag-Rechnungen ohne Bankabgleich) | ~3 PM | Small-Club-tauglich (Sport-Junioren-Verein, Chor, Freiwillige Feuerwehr-Jugend) |
| **MVP CH-tauglich** | + B-voll (QR + camt) + E | ~3 PM | Volles CH-Mittelstands-Vereinsprodukt |
| **Marktparität** | + C (Website-Baukasten) | ~2 PM | Ersatzfähig zu ClubDesk M/L |
| **Differenzierung** | + native Mobile-App + AI-Assistent für Kassier/Vorstand | ~1.5 PM | Klare Überlegenheit gegen ClubDesk |

**Summe für vollwertigen Ersatz:** ~**9–10 Personenmonate**.

Kritische externe Abhängigkeiten: (1) **swissqrbill**-Integration + PDF-Rendering, (2) Cloudflare for SaaS für Domain-Self-Service, (3) optional TWINT-Partnerprogramm über Postfinance, (4) DSGVO-AVV-Template + CH-DSG-Addendum.

---

## 7. Dual-Use-Roadmap — Features mit Mehrwert über Vereine hinaus

Nicht jedes ClubDesk-Feature ist nur für Vereine interessant. Viele Bausteine aus §5 bringen **auch dem allgemeinen Mana-User** (Freelancer, Creator, Familien, kleine Teams) massiven Mehrwert. Diese priorisieren wir — so finanziert jeder Sprint zwei Zielgruppen gleichzeitig.

### 7.1 🟢 Schnelle Wins mit breitem Nutzen

| # | Baustein | Dual-Use-Zielgruppe | Warum |
|---|---|---|---|
| 1 | **Rollen- & Rechtematrix pro Modul** (Paket A) | Familien, WGs, kleine Teams, Freelancer-Kollaborationen | Einmal gebaut → Storage, Events, Kalender, Finance & alle künftigen Module profitieren sofort. |
| 2 | **Rechnungs-Engine mit PDF + QR-Rechnung (CH)** (Paket B) | Freelancer, Selbstständige, Einzelunternehmer | Finance-Modul bekommt zweite Hälfte (bisher nur Tracking, kein Ausstellen). Eigenständiges Produkt ("Rechnung stellen mit Mana"). |
| 3 | **camt.053-Bankabgleich** (Paket B) | Jeder mit Business-Konto in CH | "Zieh dein camt, Mana ordnet Zahlungen automatisch Rechnungen zu" — starker Stand-Alone-Hook. |
| 4 | **Newsletter-/Broadcast-Modul** (Paket D) | Creator, Blogger, kleine Shops, Substack-Alternative | Sitzt auf vorhandenem Stalwart → günstig. Kombiniert mit AI (Betreff-Optimierung, Segmentierung) = klarer USP. |

### 7.2 🟡 Mittlerer Aufwand, hoher Crossover

| # | Baustein | Dual-Use-Zielgruppe | Warum |
|---|---|---|---|
| 5 | **Dokumentenarchiv mit Rollen + Audit-Log** (Paket E) | Familien, Steuer, Projektarchive | Storage bekommt den Governance-Layer, den es ohnehin braucht. |
| 6 | **Website-Baukasten mit Live-Daten-Bindings** (Paket C) | Creator, Freelancer | "One-Pager mit Terminen + Newsletter-Anmeldung + Kontakten aus Mana". Cloudflare-for-SaaS (Custom-Domain-Self-Service) auch für Power-User attraktiv. |
| 7 | **Mahnwesen & wiederkehrende Rechnungen** | Freelancer mit Retainer-Kunden | Verbindung zu `habits`/`rituals` (wiederkehrende Events automatisieren). |

### 7.3 🔴 Eher vereinsspezifisch, geringerer Crossover

Diese zuletzt einbauen — nur Vereine profitieren:

- Mitglieder-Datenmodell mit Lizenzen, Trikotgrößen, Eintrittsdatum
- SEPA-Lastschrift-Massenläufe (DE)
- Doppelte Buchführung (Einnahmen-Ausgabe reicht 80% der User)
- Barrierefreie Website-Variante

### 7.4 Empfohlene Sprint-Reihenfolge

```
Sprint 1–2:   Rollen-/Rechtematrix            → alle 27 Module profitieren sofort
Sprint 3–5:   Rechnungs-Engine + QR-Rechnung  → Freelancer-Zielgruppe erschlossen
Sprint 6:     camt-Bankabgleich               → Killer-Feature für CH-Solo-Self-Employed
Sprint 7–8:   Newsletter-Broadcast + AI       → Creator-Zielgruppe erschlossen
Sprint 9:     Dokumentenarchiv mit ACL        → Families/Teams
Sprint 10+:   Vereinsspezifika (Mitglieder-Felder, Mahnwesen, Website-Bindings)
```

**Effekt:** Mit dieser Reihenfolge baust du **~70% der ClubDesk-Features** gleichzeitig als **eigenständige Produkte** für Freelancer, Creator und Familien — und erreichst Vereinstauglichkeit als Nebeneffekt. Jeder Sprint hat zwei Geschäftscases.

---

## 8. Strategische Empfehlung

1. **Nicht direkt gegen ClubDesk im Bestandsmarkt konkurrieren** — die 20'000 installierten Vereine werden nicht wegen Features wechseln, sondern nur wenn sie absolut unzufrieden sind (Mobile-App-Lücke!).
2. **Einfallsflanke: Neugründungen + Vereine mit Digital-First-Vorstand.** Diese suchen heute: Mobile-App + AI-Assistent + moderne UX. Das ist Manas Stärke.
3. **CH-first ausrollen** — QR-Rechnung + camt sind non-negotiable; der Invest lohnt sich, weil in CH die Zahlungsbereitschaft höher ist und ClubDesk dort am stärksten.
4. **Free-Tier dauerhaft** (wie ClubDesk) als Akquise-Trichter bis 50 Mitglieder — passt zu den bestehenden Mana-Tiers.
5. **MVP in ~3 PM** (Paket A + D + B-lite) ermöglicht erste Pilotvereine im eigenen Umfeld, mit denen B-voll und C ko-entwickelt werden können.
6. **AI als Killer-Feature vermarkten**: "Dein Kassier, der mitdenkt" — automatische Beitragsberechnung, Mahnungs-Vorschläge, Protokoll-Zusammenfassungen durch mana-ai-Agenten.

---

## 9. Quellen

- [clubdesk.ch — Startseite](https://www.clubdesk.ch/)
- [clubdesk.ch — Preise](https://www.clubdesk.ch/de/preise)
- [clubdesk.ch — Das Unternehmen](https://www.clubdesk.ch/de/das-unternehmen)
- [clubdesk.ch — Rechnungen & Vereinsbuchhaltung](https://www.clubdesk.ch/de/rechnungen-und-vereinsbuchhaltung)
- [clubdesk.ch — Mitgliederverwaltung](https://www.clubdesk.ch/de/mitgliederverwaltung)
- [clubdesk.ch — News: 20'000 Vereine](https://www.clubdesk.ch/de/news/20-000-vereine-vertrauen-auf-clubdesk)
- [clubdesk.de — Vereinshomepage erstellen](https://www.clubdesk.de/de/vereinshomepage-erstellen)
- [Moneyhouse — reeweb ag](https://www.moneyhouse.ch/en/company/reeweb-ag-4839791831)
- [trusted.de — ClubDesk Test 2026](https://trusted.de/clubdesk)
- [trusted.de — ClubDesk Bewertung (Nachteile)](https://trusted.de/clubdesk-bewertung)
- [OMR Reviews — ClubDesk](https://omr.com/en/reviews/product/clubdesk)
- [Capterra DE — ClubDesk](https://www.capterra.com.de/software/214621/clubdesk)
- [ClubDesk-Forum — "Lebt Clubdesk?"](https://forum.clubdesk.com/topic/2037-lebt-clubdesk/)
- Internes Repo-Audit (Mana-Module, Services, Organizations-Plugin, mana-events, mana-mail, mana-research)
