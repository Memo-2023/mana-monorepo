# Telegram NutriPhi Bot

Telegram Bot für NutriPhi - KI-gestützte Ernährungsanalyse per Foto oder Text.

## Tech Stack

- **Framework**: NestJS 10
- **Telegram**: nestjs-telegraf + Telegraf
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: Google Gemini 2.0 Flash

## Commands

```bash
# Development
pnpm start:dev        # Start with hot reload

# Build
pnpm build            # Production build

# Type check
pnpm type-check       # Check TypeScript types

# Database
pnpm db:generate      # Generate migrations
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Drizzle Studio
```

## Telegram Commands

| Command | Beschreibung |
|---------|--------------|
| `/start` | Willkommensnachricht |
| `/hilfe` | Hilfe anzeigen |
| `/heute` | Heutige Mahlzeiten & Fortschritt |
| `/woche` | Wochenstatistik |
| `/ziele` | Ziele anzeigen |
| `/ziele [kcal] [P] [K] [F]` | Ziele setzen |
| `/favorit [Name]` | Letzte Mahlzeit speichern |
| `/favoriten` | Gespeicherte Mahlzeiten anzeigen |
| `/essen [Nr]` | Favorit als Mahlzeit eintragen |
| `/delfav [Nr]` | Favorit löschen |
| `/loeschen` | Letzte Mahlzeit löschen |
| **Foto senden** | Automatische Analyse |
| **Text senden** | Automatische Analyse |

## User Flow

```
1. /start                        → Willkommen
2. 📷 Foto einer Mahlzeit senden → Nährwertanalyse
3. /favorit Morgenmüsli          → Als Favorit speichern
4. /heute                        → Tagesübersicht
5. /ziele 2000 100 200 70        → Ziele setzen
6. /woche                        → Wochenstatistik
```

## Environment Variables

```env
# Server
PORT=3303

# Telegram
TELEGRAM_BOT_TOKEN=xxx              # Bot Token von @BotFather
TELEGRAM_ALLOWED_USERS=             # Optional: Komma-separierte User IDs

# Database
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/nutriphi_bot

# AI
GEMINI_API_KEY=xxx                  # Google AI Studio API Key
```

## Projekt-Struktur

```
services/telegram-nutriphi-bot/
├── src/
│   ├── main.ts                   # Entry point
│   ├── app.module.ts             # Root module
│   ├── health.controller.ts      # Health endpoint
│   ├── config/
│   │   └── configuration.ts      # Config
│   ├── database/
│   │   ├── database.module.ts    # Drizzle connection
│   │   └── schema.ts             # DB schema
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── bot.update.ts         # Command handlers
│   ├── analysis/
│   │   ├── analysis.module.ts
│   │   └── gemini.service.ts     # Gemini AI Integration
│   ├── meals/
│   │   ├── meals.module.ts
│   │   └── meals.service.ts      # Mahlzeiten CRUD
│   ├── goals/
│   │   ├── goals.module.ts
│   │   └── goals.service.ts      # Nutzerziele
│   └── stats/
│       ├── stats.module.ts
│       └── stats.service.ts      # Statistiken
├── drizzle/                      # Migrations
├── drizzle.config.ts
├── package.json
└── .env.example
```

## Lokale Entwicklung

### 1. Bot bei Telegram erstellen

1. Öffne @BotFather in Telegram
2. Sende `/newbot`
3. Wähle einen Namen (z.B. "NutriPhi Bot")
4. Wähle einen Username (z.B. "nutriphi_tracker_bot")
5. Kopiere den Token

### 2. Gemini API Key holen

1. Gehe zu https://aistudio.google.com/apikey
2. Erstelle einen API Key
3. Kopiere den Key

### 3. Umgebung vorbereiten

```bash
# Docker Services starten (PostgreSQL)
pnpm docker:up

# Datenbank erstellen
psql -h localhost -U manacore -d postgres -c "CREATE DATABASE nutriphi_bot;"

# In das Verzeichnis wechseln
cd services/telegram-nutriphi-bot

# .env erstellen
cp .env.example .env
# Token und API Key eintragen

# Schema pushen
pnpm db:push
```

### 4. Bot starten

```bash
pnpm start:dev
```

## Features

- **Foto-Analyse**: Mahlzeit fotografieren → Gemini analysiert → Nährwerte
- **Text-Analyse**: Mahlzeit beschreiben → Gemini schätzt → Nährwerte
- **Tages-Tracking**: Alle Mahlzeiten speichern, Tagesübersicht
- **Wochenstatistik**: 7-Tage-Übersicht mit Durchschnittswerten
- **Ziele**: Kalorienziel und Makros setzen
- **Favoriten**: Häufige Mahlzeiten speichern und wiederverwenden
- **Fortschrittsanzeige**: Visuelle Balken für Zielerreichung

## Datenbank-Schema

```
user_goals
├── id (UUID)
├── telegram_user_id (BIGINT, unique)
├── daily_calories (INT, default 2000)
├── daily_protein (INT, default 50)
├── daily_carbs (INT, default 250)
├── daily_fat (INT, default 65)
├── daily_fiber (INT, default 30)
├── created_at, updated_at

meals
├── id (UUID)
├── telegram_user_id (BIGINT)
├── date (DATE)
├── meal_type (TEXT: breakfast/lunch/dinner/snack)
├── input_type (TEXT: photo/text)
├── description (TEXT)
├── calories (INT)
├── protein, carbohydrates, fat, fiber, sugar (REAL)
├── confidence (REAL, 0-1)
├── raw_response (JSONB)
├── created_at

favorite_meals
├── id (UUID)
├── telegram_user_id (BIGINT)
├── name (TEXT)
├── description (TEXT)
├── nutrition (JSONB)
├── usage_count (INT)
├── created_at
```

## Health Check

```bash
curl http://localhost:3303/health
```

## Gemini Integration

Der Bot verwendet Gemini 2.0 Flash für:

1. **Foto-Analyse**
   - Erkennt alle sichtbaren Lebensmittel
   - Schätzt Portionsgrößen
   - Berechnet Nährwerte pro Lebensmittel
   - Summiert Gesamtnährwerte

2. **Text-Analyse**
   - Interpretiert Mahlzeitbeschreibungen
   - Schätzt realistische Portionsgrößen
   - Berechnet Nährwerte

**Response-Format:**
```json
{
  "foods": [
    {"name": "Spaghetti", "quantity": "200g", "calories": 314, "confidence": 0.9},
    {"name": "Bolognese-Sauce", "quantity": "150g", "calories": 180, "confidence": 0.85}
  ],
  "totalNutrition": {
    "calories": 494,
    "protein": 22,
    "carbohydrates": 65,
    "fat": 15,
    "fiber": 4,
    "sugar": 8
  },
  "description": "Spaghetti Bolognese",
  "confidence": 0.87
}
```

## Beispiel-Ausgaben

**Foto-Analyse:**
```
🍽️ Spaghetti Bolognese mit Parmesan

Erkannt:
• Spaghetti (200g)
• Bolognese-Sauce (150g)
• Parmesan (20g)

Nährwerte:
Kalorien: 580 kcal
Protein: 28g
Kohlenhydrate: 68g
Fett: 20g
Ballaststoffe: 5g
Zucker: 8g

Genauigkeit: 87%

Als Favorit speichern: /favorit [Name]
```

**Tagesübersicht (/heute):**
```
📊 Heute (28.01.2026)

1. Frühstück (08:15)
   Haferflocken mit Banane und Milch
   420 kcal

2. Mittagessen (12:30)
   Spaghetti Bolognese
   580 kcal

─────────────────
Gesamt: 1000 kcal

Fortschritt:
Kalorien: ████████░░ 50%
Protein: ██████░░░░ 60%
Kohlenhydr.: ███████░░░ 70%
Fett: █████░░░░░ 50%

Verbleibend: 1000 kcal
```

## Roadmap

- [ ] Mahlzeit-Typ manuell wählen
- [ ] Foto-Beschreibung als Caption
- [ ] Mehrere Fotos pro Mahlzeit
- [ ] Export als CSV/JSON
- [ ] Erinnerungen für Mahlzeiten
- [ ] Wassertracking
