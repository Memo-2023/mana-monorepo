

MVP Projektplan: KI-Kalorien Tracker Nutriphi (Finaler Plan)
1. Projekt-Übersicht
Ziel: React Native App mit Expo für automatische Kalorienschätzung durch Foto-Analyse Architektur: Local-First mit optionaler Cloud-Synchronisation (Supabase-ready) UI-Framework: NativeWind (Tailwind CSS für React Native) Sync-Strategy: Bidirektionale Synchronisation mit Konfliktlösung
2. Technologie-Stack
Frontend
* React Native: 0.73+
* Expo SDK: 50+
* TypeScript: Vollständige Typisierung
* NativeWind: 2.0+ für Styling
* React Navigation: 6.x für Navigation
* Zustand: Lightweight State Management
* Expo Camera: Foto-Aufnahme
* React Native Reanimated: Smooth Animationen
Datenschicht
* Expo SQLite: Primäre lokale Datenbank
* Expo FileSystem: Lokale Foto-Speicherung
* AsyncStorage: App-Einstellungen
* Supabase: Cloud-Backend (optional, später)
* Supabase Storage: Cloud-Foto-Speicherung
KI & APIs
* Google Gemini Vision API: Primäre Bilderkennung
* Optimierter Prompt: Strukturierte Nährwert-Analyse
* Fallback-System: Graceful Degradation bei API-Fehlern
Development Tools
* Expo Dev Tools: Development Environment
* TypeScript: Compile-time Type Safety
* ESLint + Prettier: Code Quality
* Jest: Unit Testing
3. Erweiterte Datenbank-Architektur
Haupttabelle: meals (Dual-kompatibel)

sql
CREATE TABLE meals (
  -- Primärschlüssel (dual-kompatibel)
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- SQLite
  cloud_id TEXT UNIQUE,                 -- UUID für Supabase
  
  -- Sync-Metadaten
  user_id TEXT,                         -- NULL lokal, UUID in Cloud
  sync_status TEXT DEFAULT 'local',    -- local, synced, conflict, pending
  version INTEGER DEFAULT 1,           -- Für Konfliktlösung
  last_sync_at TEXT,                   -- ISO DateTime
  
  -- Foto & Metadaten
  photo_path TEXT NOT NULL,            -- Lokaler Pfad
  photo_url TEXT,                      -- Cloud Storage URL
  photo_size INTEGER,                  -- Dateigröße in Bytes
  photo_dimensions TEXT,               -- JSON: {"width": 1920, "height": 1080}
  
  -- Zeitstempel
  timestamp TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  -- Mahlzeit-Kontext
  meal_type TEXT,                      -- breakfast, lunch, dinner, snack
  location TEXT,                       -- Optional: GPS oder manuell
  
  -- KI-Analyse Ergebnisse
  analysis_result TEXT,                -- Vollständiges JSON der Gemini-Antwort
  analysis_confidence REAL,            -- 0.0 - 1.0
  analysis_status TEXT DEFAULT 'pending', -- pending, completed, failed, manual
  
  -- Aggregierte Nährwerte
  total_calories INTEGER,
  total_protein REAL,
  total_carbs REAL,
  total_fat REAL,
  total_fiber REAL,
  total_sugar REAL,
  
  -- Gesundheitsbewertung
  health_score REAL,                   -- 1.0 - 10.0
  health_category TEXT,                -- very_healthy, healthy, moderate, unhealthy
  
  -- User-Interaktion
  user_notes TEXT,
  user_modified INTEGER DEFAULT 0,    -- Boolean als Integer
  user_rating INTEGER,                -- 1-5 Sterne für KI-Genauigkeit
  
  -- API-Metadaten
  api_provider TEXT DEFAULT 'gemini',
  api_cost REAL,                      -- Kosten in Cent
  processing_time INTEGER             -- Millisekunden
);
Detailtabelle: food_items

sql
CREATE TABLE food_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cloud_id TEXT UNIQUE,
  meal_id INTEGER NOT NULL,
  
  -- Sync-Metadaten
  sync_status TEXT DEFAULT 'local',
  version INTEGER DEFAULT 1,
  
  -- Lebensmittel-Details
  name TEXT NOT NULL,
  category TEXT,                      -- protein, vegetable, grain, fruit, dairy, fat, processed, beverage
  portion_size TEXT,                  -- "150g", "1 Stück", "1 Tasse"
  
  -- Nährwerte pro Item
  calories INTEGER,
  protein REAL,
  carbs REAL,
  fat REAL,
  fiber REAL,
  sugar REAL,
  
  -- KI-Metadaten
  confidence REAL,                    -- 0.0 - 1.0
  bounding_box TEXT,                  -- JSON: Position im Bild
  
  -- Eigenschaften
  is_organic INTEGER DEFAULT 0,
  is_processed INTEGER DEFAULT 0,
  allergens TEXT,                     -- JSON Array
  
  created_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
);
Sync-Metadaten

sql
CREATE TABLE sync_metadata (
  table_name TEXT NOT NULL,
  record_id INTEGER NOT NULL,
  cloud_id TEXT,
  last_sync_at TEXT,
  conflict_data TEXT,                 -- JSON für Konfliktlösung
  retry_count INTEGER DEFAULT 0,
  
  PRIMARY KEY (table_name, record_id)
);
Performance-Indizes

sql
CREATE INDEX idx_meals_timestamp ON meals(timestamp DESC);
CREATE INDEX idx_meals_sync_status ON meals(sync_status);
CREATE INDEX idx_meals_meal_type ON meals(meal_type);
CREATE INDEX idx_food_items_meal ON food_items(meal_id);
CREATE INDEX idx_food_items_category ON food_items(category);
CREATE INDEX idx_sync_metadata_status ON sync_metadata(table_name, last_sync_at);
4. Optimierter Gemini Prompt
Haupt-Prompt-Template:

Du bist ein professioneller Ernährungsexperte. Analysiere dieses Essen-Foto präzise und detailliert.

AUFGABE:
1. Erkenne alle sichtbaren Lebensmittel und schätze realistische Portionsgrößen
2. Berechne Nährwerte basierend auf Standard-Portionen
3. Bewerte die Gesundheit der gesamten Mahlzeit
4. Berücksichtige versteckte Zutaten (Öle, Saucen, Gewürze)

ANTWORT-FORMAT (nur JSON, keine zusätzlichen Texte):
{
  "meal_analysis": {
    "total_calories": <Gesamtkalorien>,
    "total_protein": <Protein in g>,
    "total_carbs": <Kohlenhydrate in g>,
    "total_fat": <Fett in g>,
    "total_fiber": <Ballaststoffe in g>,
    "total_sugar": <Zucker in g>,
    "health_score": <1.0-10.0>,
    "health_category": "healthy|moderate|unhealthy",
    "confidence": <0.0-1.0>,
    "meal_type_suggestion": "breakfast|lunch|dinner|snack"
  },
  "food_items": [
    {
      "name": "Gegrilltes Hähnchen",
      "category": "protein",
      "portion_size": "120g",
      "calories": 180,
      "protein": 27.0,
      "carbs": 0.0,
      "fat": 7.5,
      "fiber": 0.0,
      "sugar": 0.0,
      "confidence": 0.9,
      "is_organic": false,
      "is_processed": false,
      "allergens": []
    }
  ],
  "analysis_notes": {
    "health_reasoning": "Ausgewogene Mahlzeit mit hochwertigem Protein und Gemüse",
    "improvement_suggestions": [
      "Mehr Vollkornprodukte hinzufügen",
      "Portion der Kohlenhydrate erhöhen"
    ],
    "cooking_method": "grilled",
    "estimated_freshness": "fresh",
    "hidden_ingredients": ["Olivenöl (1 TL)", "Gewürze"],
    "portion_accuracy": "high"
  }
}

BEWERTUNGSKRITERIEN health_score:
10: Optimal (viel Gemüse, mageres Protein, Vollkorn, minimal verarbeitet)
8-9: Sehr gesund (ausgewogen, natürliche Zutaten)
6-7: Gesund (gute Balance, moderate Verarbeitung)
4-5: Mittelmäßig (gemischt, einige verarbeitete Komponenten)
2-3: Ungesund (viel verarbeitet, hoher Zucker/Fett)
1: Sehr ungesund (Fast Food, stark verarbeitet)

KATEGORIEN:
- protein: Fleisch, Fisch, Eier, Hülsenfrüchte, Nüsse
- vegetable: Alle Gemüsesorten
- grain: Reis, Nudeln, Brot, Getreide
- fruit: Alle Früchte
- dairy: Milchprodukte
- fat: Öle, Butter, Avocado
- processed: Verarbeitete Lebensmittel
- beverage: Getränke

WICHTIG:
- Realistische Portionsgrößen (Deutsche Standards)
- Kalorien auf 5er-Schritte runden
- Bei Unsicherheit: confidence reduzieren
- Versteckte Fette/Öle nicht vergessen
- Mehrere gleiche Items separat listen
Kontext-spezifische Erweiterungen:

typescript
const promptContexts = {
  breakfast: "KONTEXT: Frühstück - berücksichtige typische deutsche Frühstücksportionen",
  restaurant: "KONTEXT: Restaurant - größere Portionen, mehr versteckte Fette wahrscheinlich",
  homemade: "KONTEXT: Hausgemacht - tendenziell gesünder, weniger versteckte Zusätze",
  fastfood: "KONTEXT: Fast Food - höhere Kaloriendichte, mehr verarbeitete Zutaten"
};
5. App-Architektur
Ordnerstruktur:

src/
├── components/
│   ├── ui/                          # Basis UI-Komponenten
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── LoadingSpinner.tsx
│   ├── meals/                       # Mahlzeit-spezifische Komponenten
│   │   ├── MealList.tsx
│   │   ├── MealItem.tsx
│   │   ├── MealDetail.tsx
│   │   └── NutritionBar.tsx
│   ├── camera/                      # Kamera-Komponenten
│   │   ├── CameraModal.tsx
│   │   ├── PhotoPreview.tsx
│   │   └── PhotoButton.tsx
│   └── sync/                        # Sync-UI-Komponenten
│       ├── SyncStatus.tsx
│       └── ConflictResolver.tsx
├── services/
│   ├── database/
│   │   ├── SQLiteService.ts         # Lokale Datenbank
│   │   ├── SyncService.ts           # Synchronisation
│   │   └── MigrationService.ts      # Schema-Updates
│   ├── api/
│   │   ├── GeminiService.ts         # KI-Integration
│   │   └── SupabaseService.ts       # Cloud-Backend
│   ├── storage/
│   │   ├── PhotoService.ts          # Foto-Management
│   │   └── CacheService.ts          # Lokaler Cache
│   └── utils/
│       ├── DateUtils.ts
│       ├── NutritionUtils.ts
│       └── ValidationUtils.ts
├── stores/
│   ├── MealStore.ts                 # Zustand für Mahlzeiten
│   ├── SyncStore.ts                 # Synchronisation-Status
│   └── AppStore.ts                  # Globaler App-Zustand
├── types/
│   ├── Database.ts                  # Datenbank-Typen
│   ├── API.ts                       # API-Response-Typen
│   └── UI.ts                        # UI-Komponenten-Typen
├── hooks/
│   ├── useMeals.ts                  # Mahlzeit-Management
│   ├── useCamera.ts                 # Kamera-Funktionen
│   └── useSync.ts                   # Synchronisation
└── utils/
    ├── constants.ts
    ├── config.ts
    └── helpers.ts
6. Implementierungsphasen
Phase 1: Foundations & Database
Fokus: Solide Basis schaffen
* Expo-Projekt mit TypeScript und NativeWind setup
* Erweiterte SQLite-Datenbank implementieren
* Basis-Services für Database-Operations
* Migration-System für Schema-Updates
* Grundlegende App-Navigation
Phase 2: Core UI & Camera
Fokus: Basis-Funktionalität implementieren
* MealList mit erweiterten NativeWind-Komponenten
* Floating Action Button mit Animationen
* Camera-Modal mit Vorschau-Funktionalität
* Foto-Speicherung im lokalen FileSystem
* Basic Loading-States und Error-Handling
Phase 3: AI Integration & Analysis
Fokus: Gemini API vollständig integrieren
* Optimierten Prompt-Service implementieren
* Robuste API-Error-Handling-Strategien
* Retry-Mechanismus mit exponential backoff
* Offline-Queue für fehlgeschlagene Requests
* Erweiterte Nährwert-Darstellung in UI
Phase 4: Enhanced UX & Data Visualization
Fokus: User Experience verbessern
* Detailansicht für einzelne Mahlzeiten
* Nährwert-Visualisierung (Balken, Kreise)
* Tagesstatistiken und einfache Trends
* User-Korrektur-Interface für KI-Ergebnisse
* Mahlzeit-Typ-Erkennung und -Kategorisierung
Phase 5: Sync Preparation & Cloud-Ready
Fokus: Für Cloud-Sync vorbereiten
* Sync-Metadaten in lokaler Datenbank
* Data-Transformation-Layer implementieren
* Conflict-Resolution-Algorithmus
* Settings-Screen für Sync-Präferenzen
* Export/Import-Funktionalität als Backup
Phase 6: Supabase Integration (Optional)
Fokus: Cloud-Synchronisation aktivieren
* Supabase-Client-Setup und Authentication
* Bidirektionale Sync-Implementation
* Photo-Upload zu Supabase Storage
* Real-time Conflict-Resolution
* Multi-Device-Support
7. MVP Success Criteria
Funktionale Anforderungen:
✅ Core Functionality
* Foto aufnehmen und lokal speichern
* Gemini API erfolgreich aufrufen
* Strukturierte Nährwert-Analyse erhalten
* Daten persistent in SQLite speichern
✅ User Experience
* Intuitive Ein-Screen-App mit Liste
* Smooth Kamera-Integration
* Verständliche Nährwert-Darstellung
* Responsive UI mit NativeWind
✅ Data Quality
* Realistische Kalorienschätzungen (±20% Genauigkeit)
* Vollständige Nährwert-Breakdown
* Plausible Gesundheitsbewertungen
* Robuste Error-Handling
Performance-Anforderungen:
* App-Start unter 3 Sekunden
* Foto-zu-Analyse unter 15 Sekunden
* Smooth 60fps Scrolling in Meal-Liste
* Maximaler Memory-Footprint: 100MB
Stabilität:
* Keine Crashes bei normaler Nutzung
* Graceful Degradation bei API-Fehlern
* Offline-Foto-Speicherung funktioniert zuverlässig
* Daten-Integrität bei App-Kills gewährleistet
