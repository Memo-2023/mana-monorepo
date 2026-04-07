# Cycles Module — Roadmap

Ideen für Features, Tests und Refinements, die im aktuellen Sprint nicht gemacht wurden. Sortiert grob nach Aufwand und Impact. Dies ist kein Commitment, sondern ein Ideenspeicher.

## Was bereits drin ist

- Datenschicht (v7): `cycles`, `cycleDayLogs`, `cycleSymptoms` mit Sync-Registrierung
- Stores: `cyclesStore`, `dayLogsStore`, `symptomsStore` mit Auto-Close, Upsert, Symptom-Counter
- Pure Utils: Phase-Ableitung, Prediction (gleitender Mittelwert), Auto-Start/Auto-End-Detection
- UI: ListView mit Phase-Karte, Quick-Log (Flow/Mood/Symptome/BBT/Notizen), Kalender-Ansicht, Symptom-Manager, Edit-/Delete-vergangener-Tage-Banner
- Dashboard-Widget mit Phase + Countdown
- i18n: Voll lokalisiert für de/en/it/fr/es, mit Parity-Test
- Tests: 81 Tests (Pure + Store-Integration via fake-indexeddb + i18n-Parity)

## Kurzfristig — kleine Lücken

### UX-Quick-Wins

- **Keyboard-Shortcuts** in ListView: `1-5` für Flow-Level, `Esc` für "Zurück zu heute", `J/K` für Previous/Next im Log-Verlauf
- **Date-Picker im Edit-Banner**: `<input type="date">` um direkt zu einem Tag zu springen statt im Kalender suchen zu müssen
- **Cycle-Notizen-UI**: `cycles.notes` wird gespeichert aber nirgends gerendert. Textarea in der Phase-Karte oder separater Cycle-Detail-View
- **Funnel-Tracking**: `trackFirstContent('cycles')` beim ersten Log, analog zu anderen Modulen

### Pure-Function-Robustheit

- **Orphaned Symptom-IDs**: Wenn ein Symptom gelöscht wird, bleiben Day-Logs mit toten IDs zurück. Entweder `symptomsStore.deleteSymptom()` entfernt die IDs aus allen Logs, oder die UI filtert `sym?.deletedAt == null` beim Rendern
- **Manual recalculate button**: `cyclesStore.recalculateCycles()` die alle Zyklen re-validiert (Auto-End auch für Tage nachfeuert, die nicht durch einen `logDay`-Aufruf gingen)
- **Temperature-Units**: Placeholder in en.json sagt "98.6 °F", gespeichert wird aber als `number` ohne Einheit. Entweder `temperatureUnit: 'C' | 'F'` auf `cycles` oder in `userSettings`

### i18n-Details

- **Plural-Forms**: `daysAgo: "{days} days ago"` ist für `days=1` grammatikalisch falsch in allen Sprachen. svelte-i18n unterstützt ICU-Plural: `{days, plural, one {# day ago} other {# days ago}}`
- **Relative Wochentage**: "Montag", "Dienstag" statt "vor 3 Tagen" für bessere Lesbarkeit

## Mittelfristig — echte Features

### BBT-Chart

Liniendiagramm der Basaltemperatur über den aktuellen Zyklus. Daten sind schon da (`cycleDayLogs.temperature`), es fehlt nur ein SVG-Chart-Component.

- Reines SVG, keine Library nötig
- Markiere Ovulation (erkannter Temperaturanstieg) visuell
- Eventuell auch als Dashboard-Widget-Variante

### History-Seite

`/cycles/history` mit Liste aller Zyklen:

- Länge pro Zyklus, Durchschnitt, Min/Max
- Visuelle Bar pro Zyklus (Menstruation rot, Follikular gelb, Ovulation grün, Luteal lila)
- Markiere ungewöhnlich kurze/lange Zyklen (> 1σ Abweichung)
- Export als CSV

### Detail-Page pro Tag

`/cycles/log/[date]`:

- Vollständiger Editor mit allen Feldern: cervicalMucus-Picker, sexualActivity-Toggle, Energy-Slider
- Textarea mit mehr Platz für Notizen statt Inline-Input
- Vergleich mit Vortag / Vorjahr

### Cycle-Notizen-Panel

In der Phase-Karte eine ausklappbare Notiz-Sektion pro Zyklus. `cycles.notes` wird aktuell persistiert aber nicht angezeigt.

### Pattern-Erkennung (lokal, ohne LLM)

- "Du hast in 4 von 5 Lutealphasen Kopfschmerzen" — reine Aggregation über `cycleDayLogs` + `cycleSymptoms`
- "Dein aktueller Zyklus ist {avg + 7} Tage lang — ungewöhnlich lang"
- "Das fruchtbare Fenster beginnt in 2 Tagen"
- Eigene Sektion in der ListView unter "Statistik"

### Dashboard-Widget: BBT-Chart-Variante

Kleines SVG-Sparkline-Chart der letzten 14 Tage als Alternative zum aktuellen Countdown-Widget. User kann zwischen beiden wählen.

## Mittelfristig — Testing-Gaps

### Component-Tests

Vitest + `@testing-library/svelte` für ListView-Interaktionen:

- Klick auf Flow-Level → Store-Aufruf, State-Update
- Klick auf Log-Zeile → editingDate wechselt, Input-Values updaten sich
- Symptom-Manager öffnet/schließt, Symptom anlegen erzeugt Tabellen-Eintrag

### E2E-Test (Playwright)

Vollständiger Happy Path über die neu hinzugefügte `e2e/`-Infrastruktur:

1. Route öffnen → Phase-Card leer
2. "Periode starten" klicken → Phase wechselt auf `menstruation`
3. Tag loggen mit Symptomen → Counter inkrementiert
4. Kalender öffnen → Tag ist eingefärbt
5. Vergangenen Tag im Kalender anklicken → Edit-Banner erscheint
6. Reload → Daten persistent

### Migration-Tests

Unit-Test mit `fake-indexeddb` der eine alte v6-DB erstellt, die Migration auf v10+ laufen lässt, und prüft:

- `cycles`-Tabellen existieren
- Legacy-Daten unverändert
- `_pendingChanges` korrekt getaggt mit `appId: 'cycles'`

### Guest-Seed-Test

Beim ersten Öffnen als Guest sollten die 10 Default-Symptome angelegt werden. Aktuell ist `CYCLES_GUEST_SEED` exportiert, aber es gibt keinen Test, der prüft dass das Seed-Laden tatsächlich passiert.

## Langfristig — Produktreife

### Integrationen

- **Notifications via mana-notify**: "Periode in 2 Tagen erwartet", "Fruchtbares Fenster beginnt heute"
- **Calendar-Cross-App**: Zyklus-Events in das `calendar`-Modul einblenden (via `automations` oder als read-only Overlay)
- **Memoro-Audio-Notes**: Tages-Notiz per Audio diktieren, Transkription via mana-stt
- **Apple Health / Google Fit Import**: BBT, Periode, Symptome aus Health-Daten ziehen
- **Partner-Sharing**: Read-only Link via `manaLinks` (mana-links service). Partner sieht aktuelle Phase + Hinweise, keine sensiblen Details

### AI-Features (via mana-llm)

- **Natürliche Insights**: "Du hast in den letzten 3 Zyklen durchschnittlich 2 Tage früher angefangen als vorhergesagt"
- **Symptom-Clustering**: Zeitliche Muster über Monate hinweg erkennen
- **Konfidenzintervalle** statt Punkt-Vorhersage: "Nächste Periode: 3.–7. März (hohe Konfidenz)"

### Export

- **PDF-Report** für Frauenarzt-Besuche: letzter 6-12 Zyklen, Statistik, Auffälligkeiten, BBT-Chart
- **CSV-Export** der rohen Daten für eigene Analysen

### Datenschutz-Modus

Cycles ist sensibler als die meisten anderen Module. Optionen:

- **App-Lock**: Extra PIN / Biometrie vor Öffnen von `/cycles`
- **Versteckter App-Switcher-Eintrag**: Nur über Direkt-URL erreichbar
- **Lokale Verschlüsselung**: `cycles`-Tabellen mit einem User-Passwort verschlüsseln (würde ein neues Pattern im Repo etablieren, das später auch Memoro/Dreams nutzen könnten)
- **Field-level Sync-Control**: Manche Felder (sexualActivity, detaillierte Notizen) nur lokal halten, andere syncen. Bräuchte Erweiterung von `SYNC_APP_MAP` um Pro-Feld-Regeln

### Mobile-App

Cycles ist ein klassischer Mobile-First-Use-Case. Ein Expo-Port kann die unified IndexedDB nicht nutzen, müsste die Sync-Brücke als primäre Datenquelle verwenden. Das wäre ein größeres Projekt, lohnt sich aber nach Produkt-Validierung.

## Monitoring / Ops

### ManaScore-Entry

Modul in `apps/mana/apps/landing/src/content/manascore/cycles.md` eintragen. Initiale Scores (geschätzt):

| Kategorie     | Score | Begründung                                                          |
| ------------- | ----- | ------------------------------------------------------------------- |
| Backend       | N/A   | kein eigenes Backend, läuft über mana-sync                          |
| Frontend      | 70    | Runes, i18n, komponentenbasiert, Modal via shared-ui                |
| Database      | 65    | Drei Tabellen, sauber indiziert, in Registry integriert             |
| Testing       | 60    | 81 Tests (Pure + Integration), aber keine Component/E2E             |
| Deployment    | 75    | läuft mit dem unified web deploy                                    |
| Documentation | 40    | Diese Roadmap + Code-Kommentare, kein CLAUDE.md im Modul            |
| Security      | 25    | Keine Verschlüsselung, keine App-Lock, sensible Daten syncen normal |
| UX            | 70    | Kalender, Quick-Log, Past-Day-Edit funktionieren gut                |

**Gesamtscore**: ~58 → Beta-Status

### Ecosystem Health

Nach nächstem `ecosystem-audit.mjs`-Lauf sollte Cycles positiv zählen für:

- Shared Packages (@mana/shared-ui, @mana/local-store, svelte-i18n)
- i18n-Coverage (5 Locales, alle voll übersetzt, Parity-Test)
- Tests (81 Tests im Modul)
- TypeScript Strict
- Modals (Symptom-Manager)

## Kleine Code-Aufräumung

- **FLOW_LABELS / MOOD_LABELS / PHASE_LABELS / CERVICAL_MUCUS_LABELS** in `types.ts` sind seit der i18n-Umstellung unbenutzt — entweder löschen oder als explizite Fallbacks dokumentieren
- **Module CLAUDE.md** im Ordner anlegen, das die Architektur kurz beschreibt (wie andere Module es haben)
- **JSDoc-Comments** auf public Store-Methoden erweitern, besonders auf `cyclesStore.createCycle` (Auto-Close-Verhalten ist nicht offensichtlich)

## Nicht-Ziele (bewusst ausgeklammert)

- **Symptom-AI-Klassifikation**: "Welches Symptom meinst du mit 'Bauchweh'?" — zu viel Overhead für zu wenig Nutzen
- **Soziale Features**: Gruppen, Foren, Vergleich mit anderen Usern — nicht im Scope des Mana-Lokal-First-Ansatzes
- **Medizinische Diagnosen**: "Das könnte PMS sein" — Haftungsrisiko, nicht unser Kompetenzbereich
- **Multi-User pro Account**: Ein User = ein Zyklus. Zweit-Personen brauchen einen eigenen Mana-Account

## Nächste sinnvolle Schritte (Empfehlung)

Wenn du irgendwann weitermachen willst, sind in dieser Reihenfolge gute Kandidaten:

1. **Pattern-Erkennung** (mittel, hoher Impact) — macht aus "Daten-Logging" echte Insights
2. **BBT-Chart** (mittel, hoher Impact für Nutzerinnen die BBT tracken)
3. **Notifications** (mittel, praktisch im Alltag)
4. **Datenschutz-Modus** (groß, aber nötig für Produkt-Launch mit echten Nutzerinnen)
5. **Plural-Forms in i18n** (klein, einmal ordentlich fixen)
