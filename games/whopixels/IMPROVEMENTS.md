# WhoPixels - Verbesserungen

Übersicht aller Verbesserungen für das WhoPixels-Spiel.

## Architektur & Code-Qualität

- [x] **1. RPGScene.js aufteilen** — 1210 Zeilen → 5 Module: WorldManager, PlayerManager, NPCManager, ChatUI, RPGScene (Orchestrator)
- [x] **2. Doppelter Code entfernen** — `createTestNPC()` entfernt, war Duplikat von `spawnNewNPC()`
- [x] **3. Magic Numbers eliminieren** — `js/config/constants.js` mit `GAME_CONFIG`-Objekt erstellt
- [x] **4. TypeScript-Migration** — JSDoc-Typen + `jsconfig.json` für IDE-Type-Safety (kein Build-System nötig)

## Gameplay & Features

- [x] **5. Persistenz/Speichersystem** — `StorageManager` mit LocalStorage: entdeckte NPCs, Statistiken, Fortschritt
- [x] **6. Sound & Musik** — `SoundManager` mit Web Audio API: programmatische Sounds für Chat, Reveal, NPC-Spawn
- [x] **7. Mehr NPCs** — Von 10 auf 26 NPCs erweitert in 3 Kategorien: Erfinder, Wissenschaftler, Künstler & Denker
- [x] **8. Leaderboard/Punktesystem** — Statistiken im Hauptmenü (Entlarvt, Durchschn. Fragen, Beste Serie), Reset-Option
- [x] **9. Pixel-Editor Integration** — Avatar im Editor malen, speichern und als Spieler-Sprite im RPG verwenden

## UX & Visuelles

- [x] **10. Mobile-Unterstützung** — `TouchControls` mit virtuellem Joystick (links) und Interaktions-Button (rechts)
- [x] **11. Chat-UI verbessern** — Typing-Indicator, Chat-Historie (letzte 4 Nachrichten), bessere Anzeige
- [x] **12. Animations-Feedback** — Schwebendes Fragezeichen-Icon über NPCs in Interaktions-Reichweite
- [x] **13. Tutorial/Onboarding** — Overlay beim ersten Start mit Steuerungshinweisen (Desktop/Mobile)

## Sicherheit & Backend

- [x] **14. Rate Limiting** — 30 Requests/Minute pro IP, 429-Status bei Überschreitung
- [x] **15. Input-Sanitization** — Längenbegrenzung (2000 Zeichen), Control-Character-Entfernung, Typ-Validierung
- [x] **16. CORS einschränken** — Nur erlaubte Origins, konfigurierbar via `ALLOWED_ORIGINS` Env-Variable
- [x] **17. Retry-Logik & Timeouts** — 15s Timeout mit AbortController, saubere Fehlerbehandlung
- [x] **18. Conversation History begrenzen** — Max 20 Einträge, ältere werden abgeschnitten

## Performance

- [x] **19. Object Pooling** — Partikel-Pool einmalig erstellt, Emitter wird wiederverwendet statt neu erstellt
- [x] **20. Phaser-Version updaten** — Von 3.55.2 auf 3.80.1, Particle-API auf neue `add.particles(x, y, key, config)` Syntax migriert

## Lokalisierung

- [x] **21. i18n-Framework** — `I18N`-System mit Deutsch/Englisch, Sprach-Umschalter im Hauptmenü, alle Texte lokalisiert
