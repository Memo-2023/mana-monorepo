# Figgos — TODO Till

Status: Mobile ist soweit funktional (Create, Loading, Reveal, Collection). Web (SvelteKit) hinkt hinterher. Fokus jetzt auf Web + Design-Polish.

---

## 1. Kartenrueckseite designen (Prio 1)

Die Rueckseite der Karte (`FlippableCard` / Card-Detail) muss designed und korrekt angeordnet werden. Aktuell ist sie ein schneller Entwurf.

**Entscheidungen treffen:**
- Was soll drauf? (Name, Subtitle, Backstory, Stats, Special Attack, Rarity Badge, Items?)
- Layout / Hierarchie — was ist prominent, was ist sekundaer?
- Wie skaliert es bei verschiedenen Textlaengen (kurze vs. lange Backstory)?
- Soll es scrollbar sein oder muss alles reinpassen?

**Referenz:** Mobile-Version in `apps/figgos/apps/mobile/components/FlippableCard.tsx` (Back-Seite ab Zeile ~148)

---

## 2. Generiertes Profil-Modell ueberarbeiten (Prio 1)

Das LLM generiert aktuell fuer jedes Item drei Felder: `name`, `description`, `lore`.

**Frage: Reicht nicht `name` + `lore`?**
- `description` beschreibt das Aussehen des Items — brauchen wir das wirklich separat?
- `lore` ist der Flavor-Text
- Vorschlag: `description` rauswerfen, nur `name` + `lore` behalten
- Falls ja: Shared types (`packages/shared/src/index.ts` → `FigureItem`), Prompt (`prompts.ts` → Schema + System Prompt), und Frontend anpassen

```ts
// Aktuell:
export interface FigureItem {
  name: string;
  description: string;  // <- brauchen wir das?
  lore: string; // <- brauchen wir das?
}
```

---

## 3. Reveal / AI-Loading Animation verbessern (Prio 2)

Aktuell: Blurred Placeholder-Karte + pulsierende gelbe Overlay + zyklische Texte ("Rolling rarity...", "Crafting backstory...").

**Ideen zur Verbesserung:**
- Uebergang von Loading → Reveal smoother machen (z.B. Blur aufloesen)
- Partikel-Effekte oder Glow basierend auf Rarity
- Sound-Effekte? (optional)
- "Unboxing"-Gefuehl staerker machen

---

## 4. Alles in SvelteKit bauen (Prio 3)

Die Web-App (`apps/figgos/apps/web`) hat aktuell nur Grundgeruest. Mobile ist weiter. Folgendes fehlt oder muss angeglichen werden:

- **Create Screen** mit Loading-Animation + Reveal (wie Mobile)
- **Optionaler Face-Image Upload** (File Input statt expo-image-picker)
- **Card-Flip** mit 3D CSS Transform (wie Mobile Gesture, aber mit Click/Hover)
- **Collection View** — Grid mit Karten
- **Error Handling** — Generation-Fehler anzeigen (figure.status === 'failed')

**Referenz:** Web API ist schon vorbereitet in `apps/figgos/apps/web/src/lib/api.ts`

---

## 5. Karten-Fusion UI Konzept (Prio 3)

Ueberlegen wie eine Karten-Fusion im UI aussehen koennte:

- Zwei Karten auswaehlen → verschmelzen zu einer neuen Figur
- Wie sieht die Auswahl-UI aus? (Drag & Drop, Side-by-Side, Slots?)
- Fusion-Animation — wie verschmelzen die Karten visuell?
- Was passiert mit den Ausgangskarten? (Verbraucht, archiviert?)

**Backend-Endpoint existiert bereits:**
```
POST /api/v1/figures/fuse
Body: { "figureIdA": "<uuid>", "figureIdB": "<uuid>" }
```
- Beide Figuren muessen `status: completed` haben
- Rarity wird anhand der Eltern berechnet (Basis = hoeherer Eltern-Rarity, 30% Chance +1 Stufe, 10% +2 Stufen)
- Fusionierte Karte hat eigenen Kartenstil (Lila/Gold mit "FUSION" Badge) + behaelt die gewuerfelte Rarity
- Response: `{ figure }` mit `isFusion: true`, `parentFigureIds: [idA, idB]`
- Profil (Name, Backstory, Items, Stats) wird vom LLM aus beiden Eltern zusammengefuehrt
- Bild wird mit beiden Elternkarten als Referenz generiert

---

## 6. Mana Core Auth + Credits einbauen (Prio 3)

Aktuell laeuft alles mit `DEV_BYPASS_AUTH=true`. Fuer echten Betrieb brauchen wir:

**Auth (Login/Signup):**
- Mobile: `@manacore/shared-auth` fuer Login/Signup Screens
- Web: Supabase SSR Auth oder shared-auth
- Backend nutzt bereits `@manacore/shared-nestjs-auth` (JwtAuthGuard) — muss nur aktiviert werden (`DEV_BYPASS_AUTH=false`)

**Credit-System:**
- Jede Figure-Generation kostet Credits
- `@mana-core/nestjs-integration` mit `CreditClientService` einbinden
- Credit-Check vor Generation, Abzug nach Erfolg
- UI: Credit-Anzeige + "Nicht genug Credits" Fehler

**Referenz:** Siehe `CLAUDE.md` Abschnitt "Authentication Architecture" und Chat/ManaDeck Backends als Beispiel.

---

## 7. Allgemeiner Screen-Review

Einmal ueber alle Screens gehen und schauen wo Verbesserungen moeglich sind:

- Spacing, Alignment, Konsistenz
- Dark Mode / Theme-Konsistenz
- Leere Zustaende (keine Figuren, Loading, Errors)
- Tab-Bar Interaktion (aktiver Tab, Icons)
- Collection: Sortierung, Filter, Rarity-Badges
