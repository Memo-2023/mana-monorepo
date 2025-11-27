# Chat App

Eine moderne mobile Chat-Anwendung zur Interaktion mit verschiedenen KI-Sprachmodellen.

## Funktionen

- 💬 Chat mit verschiedenen KI-Modellen (GPT-4, GPT-3.5, Claude 3)
- 🔄 Verschiedene Konversationsmodi (frei, geführt, vorlagenbasiert)
- 👤 Benutzerauthentifizierung (Registrierung, Anmeldung, Passwort-Reset)
- 📱 Cross-Platform (iOS, Android, Web) mit Expo
- 🎨 Modernes UI mit NativeWind (Tailwind CSS)

## Technologie-Stack

- **Frontend:** React Native mit Expo SDK 52
- **Routing:** Expo Router v4
- **Styling:** NativeWind (Tailwind CSS)
- **Backend:** Supabase (Auth, PostgreSQL)
- **API:** Azure OpenAI API

## Einrichtung

1. Repository klonen

   ```
   git clone <repository-url>
   cd chat
   ```

2. Abhängigkeiten installieren

   ```
   npm install
   ```

3. Umgebungsvariablen konfigurieren

   ```
   cp .env.example .env
   ```

   Dann `.env` mit deinen Supabase- und Azure OpenAI-Zugangsdaten bearbeiten.

4. Entwicklungsserver starten
   ```
   npm run start
   ```

## Projektstruktur

- `/app` - Hauptanwendungslogik (Expo Router)
- `/components` - Wiederverwendbare UI-Komponenten
- `/services` - Business-Logik und API-Dienste
- `/utils` - Hilfsfunktionen
- `/context` - React Context Provider

## Nutzung

Nach dem Start kannst du:

- Dich registrieren oder anmelden
- Ein KI-Modell auswählen
- Eine neue Konversation starten
- Zwischen verschiedenen Konversationsmodi wechseln

## Lizenz

MIT
