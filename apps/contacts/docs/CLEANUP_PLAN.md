# Contacts App - Cleanup Plan

Dieser Plan dokumentiert Features und Code, die überdurchschnittlich viel Komplexität erzeugen bei geringem Nutzen. Ziel ist eine schlankere, wartbarere Codebase.

## Status-Legende

- ✅ Erledigt
- 🔄 In Bearbeitung
- ⏳ Geplant
- ❌ Abgelehnt

---

## Geplante Aufräumarbeiten

### Priorität 1: Quick Wins (Hoher ROI)

#### ✅ 1.1 Statistiken entfernen

**Status:** Erledigt
**Geschätzte Ersparnis:** ~560 Zeilen
**Komplexität:** MITTEL | **Nutzen:** NIEDRIG

**Beschreibung:**
Analytics-Dashboard mit Activity Heatmap, Trend Charts, Donut Charts. Geringe Nutzung bei hoher Komplexität.

**Entfernte Dateien:**
- `src/lib/stores/statistics.svelte.ts` (~276 Zeilen)
- `src/routes/(app)/statistics/+page.svelte` (~282 Zeilen)

**Geänderte Dateien:**
- `src/routes/(app)/+layout.svelte` - Nav-Item entfernt

---

#### ✅ 1.2 Network View entfernen

**Status:** Erledigt
**Geschätzte Ersparnis:** ~1.100 Zeilen
**Komplexität:** HOCH | **Nutzen:** NIEDRIG

**Beschreibung:**
D3.js Force-Directed Graph zur Visualisierung von Kontakt-Beziehungen. Komplex (Force Simulation, Node Dragging, Filtering) aber wenig genutzt.

**Entfernte Dateien:**
- `src/lib/stores/network.svelte.ts` (~540 Zeilen)
- `src/lib/api/network.ts` (~50 Zeilen)
- `src/lib/components/network/NetworkGraph.svelte`
- `src/lib/components/network/NetworkControls.svelte`
- `src/lib/components/views/ContactNetworkView.svelte`

**Geänderte Dateien:**
- `src/lib/components/ContactList.svelte` - Network-View entfernt
- `src/lib/components/ContactsToolbarContent.svelte` - Network-Controls entfernt

---

#### ✅ 1.3 Session Contacts → Demo-Modus

**Status:** Erledigt
**Geschätzte Ersparnis:** ~100 Zeilen (netto)
**Komplexität:** MITTEL | **Nutzen:** HOCH (bessere UX)

**Beschreibung:**
Wie bei Calendar/Todo: Session-basiertes Kontakt-Management durch statischen Demo-Modus ersetzen. Statt frustrierender UX (Kontakte verschwinden bei Tab-Schließung) zeigt die App Beispiel-Kontakte.

**Entfernte Dateien:**
- `src/lib/stores/session-contacts.svelte.ts` (~236 Zeilen)

**Neue Dateien:**
- `src/lib/data/demo-contacts.ts` (~215 Zeilen) - 10 Demo-Kontakte

**Geänderte Dateien:**
- `src/lib/stores/contacts.svelte.ts` - Demo-Kontakte statt Session-Logik
- `src/routes/(app)/+layout.svelte` - Demo-Banner, Auth-Gate Events
- `src/lib/components/ContactList.svelte` - Auth-Gate bei Favoriten
- `src/lib/components/ContactDetailModal.svelte` - Auth-Gate bei Demo-Kontakten
- `src/lib/components/NewContactModal.svelte` - Auth-Gate bei Erstellung
- `src/lib/components/AuthGateModal.svelte` - Angepasste Demo-Modus Texte

---

## Zusammenfassung

| Phase | Features | LOC Ersparnis | Status |
|-------|----------|---------------|--------|
| 🟢 Prio 1.1 | Statistiken | ~560 | ✅ Erledigt |
| 🟢 Prio 1.2 | Network View | ~1.100 | ✅ Erledigt |
| 🟢 Prio 1.3 | Sessions → Demo | ~100 | ✅ Erledigt |
| **Gesamt** | | **~1.760** | ✅ |

**Erreicht:** ~20% Code-Reduktion bei gleichem/besserem Nutzererlebnis

---

## Changelog

| Datum | Aktion | Commit |
|-------|--------|--------|
| 2026-01-28 | Statistiken, Network View, Session Contacts entfernt; Demo-Modus implementiert | - |
