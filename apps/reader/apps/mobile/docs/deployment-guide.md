# Reader App - Deployment Guide

## Voraussetzungen

1. **Google Cloud Account** mit aktivierter Text-to-Speech API
2. **Supabase Projekt** mit konfigurierter Datenbank
3. **Expo Developer Account** (für App Store Deployment)

## 1. Google Cloud Setup

### API Key erstellen
1. Google Cloud Console → "APIs & Services" → "Credentials"
2. "Create Credentials" → "API Key"
3. API Key auf Text-to-Speech API beschränken

### Stimmen konfigurieren
Die App verwendet Google Neural2 Stimmen:
- `de-DE-Neural2-A` (Deutsch, weiblich)
- `en-US-Neural2-A` (Englisch US, männlich)
- `en-GB-Neural2-A` (Englisch UK, weiblich)

## 2. Supabase Setup

### Datenbank Migrationen
```bash
# Migrations ausführen
supabase migration up

# Oder manuell in SQL Editor:
# - supabase/migrations/20240116_create_texts_table.sql
# - supabase/migrations/20240117_create_audio_storage.sql
```

### Environment Variables
In Supabase Dashboard → Settings → Edge Functions:
```
GOOGLE_TTS_API_KEY=your_google_api_key_here
```

### Edge Functions deployen
```bash
# Supabase CLI installieren
npm install -g supabase

# Edge Functions deployen
supabase functions deploy generate-audio
supabase functions deploy get-audio-url
```

### Storage Setup
- Bucket "audio" wird automatisch erstellt
- RLS Policies sind konfiguriert
- Benutzer können nur ihre eigenen Audio-Dateien zugreifen

## 3. React Native App Setup

### Environment Variables
Erstelle `.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Dependencies installieren
```bash
npm install
```

### App konfigurieren
In `app.json`:
```json
{
  "expo": {
    "name": "Reader",
    "slug": "reader",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.tilljs.reader"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

## 4. Development Testing

### Lokal testen
```bash
# Development Server starten
npm start

# iOS Simulator
npm run ios

# Android Emulator
npm run android
```

### Edge Functions testen
```bash
# Lokal
supabase functions serve

# Test Audio Generation
curl -X POST 'http://localhost:54321/functions/v1/generate-audio' \
  -H 'Authorization: Bearer YOUR_SUPABASE_JWT' \
  -H 'Content-Type: application/json' \
  -d '{
    "textId": "test-id",
    "content": "Dies ist ein Test für die Audio-Generierung.",
    "voice": "de-DE",
    "speed": 1.0
  }'
```

## 5. Production Deployment

### EAS Build Setup
```bash
# EAS CLI installieren
npm install -g @expo/eas-cli

# EAS initialisieren
eas init

# Build konfigurieren
eas build:configure
```

### Build Profile (`eas.json`)
```json
{
  "cli": {
    "version": ">= 0.52.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

### Builds erstellen
```bash
# Development Build
eas build --profile development

# Production Build
eas build --profile production
```

### App Store Submission
```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

## 6. Monitoring & Maintenance

### Supabase Dashboard
- Database Performance
- Storage Usage
- Edge Function Logs
- User Activity

### Google Cloud Monitoring
- API Usage
- Kosten überwachen
- Rate Limits prüfen

### App Analytics
- Expo Analytics
- Crashlytics Integration
- Performance Monitoring

## 7. Kosten-Optimierung

### Google Cloud TTS
- Erste 1M Zeichen/Monat kostenlos
- Neural2 Stimmen: $16/1M Zeichen
- Caching implementiert zur Kostenreduzierung

### Supabase
- Free Tier: 500MB DB, 1GB Storage
- Pro Tier: $25/Monat für erweiterte Features
- Storage: $0.021/GB/Monat

## 8. Sicherheit

### Best Practices
- API Keys niemals in Client-Code
- Row Level Security (RLS) aktiviert
- Signed URLs für Audio-Dateien
- JWT Token Validation

### Regelmäßige Updates
- Dependencies aktualisieren
- Sicherheitspatches einspielen
- API Key Rotation

## 9. Troubleshooting

### Häufige Probleme
1. **Audio-Generierung fehlschlägt**
   - Google Cloud API Key prüfen
   - Quota-Limits prüfen
   - Edge Function Logs kontrollieren

2. **Supabase Connection Issues**
   - Environment Variables prüfen
   - RLS Policies kontrollieren
   - Database Connection Pool

3. **Audio-Wiedergabe Probleme**
   - Expo AV Permissions
   - File System Access
   - Audio Format Kompatibilität

### Logs & Debugging
```bash
# Supabase Logs
supabase logs

# Edge Function Logs
supabase functions logs generate-audio

# App Logs
expo logs
```

## 10. Nächste Schritte

### Feature Roadmap
- Push Notifications
- Offline-First Synchronisation
- Cloud Backup
- Multi-User Support
- Advanced Audio Controls

### Performance Optimierung
- Image Optimization
- Bundle Size Reduction
- Lazy Loading
- Background Processing