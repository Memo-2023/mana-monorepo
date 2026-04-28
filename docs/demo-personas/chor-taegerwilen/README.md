# Recherche-Brief — chor tägerwilen

**Persona-Slug:** `chor-taegerwilen`
**Account-Email:** `chor-taegerwilen@mana.how`
**Initial-Passwort:** `Chor-Taegerwilen-2026`
**User-ID:** `TCYOdiUdpMSCkw4OW8i7JB7Vn6XI81qf`
**Personal-Space-ID:** `PzzwRkbDTcmFGdotQYwGn` (slug `chor-taegerwilen`)
**Club-Space-ID:** `6a3a4d4c1c0e4e5ea918dd30102067cb` (slug `chor-taegerwilen-2`)
**Recherche-Datum:** 2026-04-28
**Status:** Live auf `mana.how`-Prod, 118 Records geseedet

> **Pitch-Hook:** Der chor tägerwilen ist aktuell selbst ClubDesk-Kunde
> (alte Site auf `chor-taegerwilen.clubdesk.com`, neue Site nennt
> ClubDesk-Software in der Code-Spur). Sie sind buchstäblich der
> Verein, den der Mana-Pitch aus dem ClubDesk-Vergleich
> (`docs/reports/clubdesk-vs-mana-comparison.md`) abgreifen will.
> Migrations-Story ist eingebaut.

---

## 1. Quellen

| URL | Geprüft | Hauptinhalt |
|---|---|---|
| https://www.chor-taegerwilen.ch/ | 2026-04-28 | Startseite, Motto, kommende Termine |
| https://www.chor-taegerwilen.ch/verein/vorstand | 2026-04-28 | 5-köpfiger Vorstand (Vornamen) |
| https://www.chor-taegerwilen.ch/verein/chorleitung | 2026-04-28 | Wolfgang Feucht — Bio |
| https://www.chor-taegerwilen.ch/verein/geschichte | 2026-04-28 | Gegründet 1880, ~55 Mitglieder |
| https://www.chor-taegerwilen.ch/verein/register_sopran | 2026-04-28 | 16 Sopranistinnen |
| https://www.chor-taegerwilen.ch/verein/register_alt | 2026-04-28 | 22 Altistinnen |
| https://www.chor-taegerwilen.ch/verein/register_tenor | 2026-04-28 | 7 Tenöre |
| https://www.chor-taegerwilen.ch/verein/register_bass | 2026-04-28 | 9 Bässe |
| https://www.chor-taegerwilen.ch/agenda | 2026-04-28 | Probetermine April–Juni 2026 |
| https://www.chor-taegerwilen.ch/konzerte | 2026-04-28 | Frühlingskonzert 14./15.3. |
| https://www.chor-taegerwilen.ch/impressum | 2026-04-28 | Adresse, Telefon, Email |
| https://thurgau-singt.ch/chor/chor-taegerwilen/ | 2026-04-28 | Verbands-Eintrag, bestätigt Daten |

---

## 2. Daten

### 2.1 Stammdaten

| Feld | Wert |
|---|---|
| Vereinsname | chor tägerwilen *(klein-geschrieben, bewusst)* |
| Gegründet | 1880 |
| Mitglieder | 54 (öffentlich, Stand 2026-04) |
| Adresse | c/o Ralf Schneider, Hauptstrasse 142, CH-8274 Tägerwilen |
| Telefon | +41 79 176 21 02 |
| E-Mail | info@chor-taegerwilen.ch |
| Probe | Donnerstag 20:00–21:45, Aula Sekundarschule Tägerwilen |
| Motto | „Singen macht Spass" |

### 2.2 Vorstand (5 Personen)

| Name | Funktion | Quellen-Konfidenz |
|---|---|---|
| **Ralf Schneider** | Präsident | hoch — Impressum + Tenor-Liste |
| **Monika Friemelt** | Kassierin | mittel — einzige Monika in Stimmgruppen |
| **Sonja Hegermann** | Aktuarin | tief — zwei Sonjas im Alt; Annahme dokumentiert |
| **Nadine Ruf** | Sponsoring & Werbung | mittel — einzige Nadine |
| **Liesbeth Zürcher** | Mitgliederbetreuung | mittel — einzige Liesbeth |

### 2.3 Chorleitung

**Wolfgang Feucht** (seit November 2022), Methode Complete Vocal
Technique, Studium Schulmusik, Aufbaustudium Chorpädagogik Örebro.
Persönliche Site: www.wolfgang-feucht.de.

### 2.4 Mitglieder-Roster (54 Personen)

Komplett gepflegt in `scripts/demo/personas/chor-taegerwilen/data.ts`.
Verteilung: Sopran 16, Alt 22, Tenor 7, Bass 9.

### 2.5 Termine

7 Probetermine April–Juni 2026 (Donnerstag 20:00, mit Sonderfall 4.6.
um 19:30) plus 5 Konzerte 2026 (14./15.3. Happy Together, 26.6. Chornacht,
26.9. Herbstkonzert, Dezember Adventskonzerte).

### 2.6 Konzert-Historie

11 Programme von 2015 bis 2025. Stilistisches Profil: Pop/Crossover mit
gelegentlichen geistlichen Werken (aktuell Vivaldi Magnificat).

---

## 3. Lücken + Annahmen

| Lücke | Wie wir damit umgehen |
|---|---|
| Vorname-only beim Vorstand | Nachnamen via Cross-Reference Stimmgruppen abgeleitet, Annahmen in `data.ts` notiert |
| Mitglieder-Beitragshöhe | `invoices` leer — keine Erfindung |
| Vereinsbilanz | `finance` leer |
| IBAN | Nicht in kontextDoc |
| Mitglieder-Geburtstage + Adressen | `contacts.birthday` + `address` leer |
| Statuten-PDF | `storage` leer |
| Mitglieder-Emails | Nur `info@chor-taegerwilen.ch` als Sammelpostfach |
| Newsletter-Archiv | `broadcast` leer |

---

## 4. Geseedete Inhalte (Stand 2026-04-28)

| Modul | Records | Tabelle(n) |
|---|---|---|
| kontext | 1 | kontextDoc |
| contacts | 56 | contacts |
| calendar | 14 | calendars (1) + events (13) |
| timeblocks | 14 | timeBlocks |
| events | 1 | socialEvents |
| library | 12 | libraryEntries |
| notes | 3 | notes |
| website | 14 | websites (1) + websitePages (4) + websiteBlocks (9) |
| ai-missions | 3 | aiMissions |

**Total: 118 Records** in `mana_sync.sync_changes`.

---

## 5. Pitch-Story-Hooks

1. **„Das ist euer Verein"** — Empfänger erkennt echte Mitglieder, Konzerte, Repertoire wieder.
2. **„Ihr seid auf ClubDesk; das hier wäre die Mana-Variante"** — direkte Vergleichbarkeit.
3. **„Wolfgang Feucht nutzt Complete Vocal Technique"** — kontextDoc kennt das Detail.
4. **„22 Altistinnen, 7 Tenöre — Newsletter mit Tag-Filter"** — broadcast-Audience-Demo.
5. **„Ein Klick, Public-Share-Link für Sommerkonzert"** — events vs. ClubDesk-Anmeldeformular.

---

## 6. Status

- [x] Recherche
- [x] Live-Account auf Mac-Mini-Prod
- [x] Personal-Space (auto via createPersonalSpaceFor)
- [x] Club-Space „Chor Tägerwilen" (slug `chor-taegerwilen-2`)
- [x] Persona-Skript geschrieben + ausgeführt (118 Records)
- [ ] Smoke-Test im Browser
- [x] Lessons ins Runbook
