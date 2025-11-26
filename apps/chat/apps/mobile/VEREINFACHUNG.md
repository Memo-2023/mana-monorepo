# Vereinfachungsplan für Chat App

Basierend auf der Codeanalyse schlage ich folgende Maßnahmen zur Vereinfachung des Projekts vor:

## 1. Komponenten-Konsolidierung

- **Chat-Eingabefelder**: `MessageInput.tsx` und `ChatPromptInput.tsx` zu einer Komponente zusammenführen
- **Modell-Auswahl**: Die Logik aus `ModelDropdown.tsx` und `model-selection.tsx` in einen gemeinsamen Service extrahieren
- **Nachrichten-Darstellung**: Eine wiederverwendbare `MessageRenderer`-Komponente für alle Nachrichten-Displaytypen erstellen

## 2. Code-Reduktion

- **Redundante Modell-Definitionen**: Gemeinsame Typendefinitionen in `types/index.ts` zentralisieren
- **API-Wrapper**: XHR durch einfachen Fetch-API-Wrapper in `utils/api.ts` ersetzen
- **Error Handling**: Zentrales Fehlerbehandlungssystem statt wiederholter try/catch-Blöcke
- **Styling**: Vollständig auf NativeWind umstellen und StyleSheet.create entfernen

## 3. Architektur-Optimierung

- **State Management**: 
  - Auth-Zustand über einen zentralen Store verwalten
  - Modell- und Konversationszustand aus UI-Komponenten in Services verlagern

- **Typ-System**:
  - Gemeinsame Schnittstellen für Modelle, Nachrichten und Konversationen
  - Striktere Typprüfung für alle API-Antworten

- **Service-Layer**:
  - Klare Trennung zwischen UI, Datenmodell und API-Logik
  - Einheitliche Fehlerrückgabe mit Typisierung

## 4. Dateistruktur

```
/app             - Screens & Routing
/components      - UI-Komponenten
/hooks           - Gemeinsame React Hooks
/services        - Business-Logik
/types           - Typendefinitionen
/utils           - Hilfsfunktionen
```

## 5. Performance-Optimierungen

- Virtualisierte Listen für große Nachrichtenthreads
- Optimistische UI-Updates für bessere UX
- Caching von Modellantworten zur Reduzierung von API-Aufrufen

## Implementierungsreihenfolge

1. Typensystem konsolidieren
2. API-Wrapper erstellen
3. State Management umstellen
4. UI-Komponenten vereinheitlichen
5. Styling standardisieren