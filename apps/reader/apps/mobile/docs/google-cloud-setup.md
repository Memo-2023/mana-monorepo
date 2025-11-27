# Google Cloud Text-to-Speech Setup

## 1. Google Cloud Projekt erstellen

1. Besuche die [Google Cloud Console](https://console.cloud.google.com/)
2. Erstelle ein neues Projekt oder wähle ein existierendes aus
3. Notiere dir die **Project ID**

## 2. Text-to-Speech API aktivieren

1. Gehe zu "APIs & Services" → "Library"
2. Suche nach "Cloud Text-to-Speech API"
3. Klicke auf "Enable"

## 3. Service Account erstellen

1. Gehe zu "IAM & Admin" → "Service Accounts"
2. Klicke auf "Create Service Account"
3. Name: `reader-tts-service`
4. Rolle: `Cloud Text-to-Speech Client`
5. Klicke auf "Create and Continue"

## 4. API Key erstellen (Alternative)

Für einfache Implementierung können wir einen API Key verwenden:

1. Gehe zu "APIs & Services" → "Credentials"
2. Klicke auf "Create Credentials" → "API Key"
3. Kopiere den API Key
4. Klicke auf "Restrict Key" für Sicherheit
5. Unter "API restrictions" wähle "Cloud Text-to-Speech API"

## 5. Supabase Environment Variables

Füge folgende Variablen in deine Supabase Edge Functions ein:

```bash
# In der Supabase Dashboard unter Settings → Edge Functions → Environment Variables
GOOGLE_TTS_API_KEY=dein_api_key_hier
```

## 6. Verfügbare Google Cloud TTS Voices

### Deutsch (de-DE)

#### Neural2 Voices (Empfohlen - beste Balance zwischen Qualität und Kosten)

- `de-DE-Neural2-A` (weiblich)
- `de-DE-Neural2-B` (männlich)
- `de-DE-Neural2-C` (weiblich)
- `de-DE-Neural2-D` (männlich)
- `de-DE-Neural2-E` (weiblich)
- `de-DE-Neural2-F` (männlich)

#### WaveNet Voices (Hochqualitativ)

- `de-DE-Wavenet-A` (weiblich)
- `de-DE-Wavenet-B` (männlich)
- `de-DE-Wavenet-C` (weiblich)
- `de-DE-Wavenet-D` (männlich)
- `de-DE-Wavenet-E` (weiblich)
- `de-DE-Wavenet-F` (männlich)

#### Studio Voices (Broadcast-Qualität)

- `de-DE-Studio-B` (männlich)
- `de-DE-Studio-C` (weiblich)

#### Standard Voices (Basis-Qualität, günstigste Option)

- `de-DE-Standard-A` (weiblich)
- `de-DE-Standard-B` (männlich)
- `de-DE-Standard-C` (weiblich)
- `de-DE-Standard-D` (männlich)
- `de-DE-Standard-E` (weiblich)
- `de-DE-Standard-F` (männlich)

### Englisch (US)

- `en-US-Neural2-A` (männlich)
- `en-US-Neural2-C` (weiblich)
- `en-US-Neural2-D` (männlich)
- `en-US-Neural2-E` (weiblich)

### Englisch (UK)

- `en-GB-Neural2-A` (weiblich)
- `en-GB-Neural2-B` (männlich)
- `en-GB-Neural2-C` (weiblich)
- `en-GB-Neural2-D` (männlich)

## 7. Kostenschätzung

- **Standard Voices**: $4.00 pro 1 Million Zeichen
- **Neural2 Voices**: $16.00 pro 1 Million Zeichen
- **Erstes 1 Million Zeichen pro Monat**: Kostenlos

### Beispielrechnung für 10.000 Zeichen:

- Standard: $0.04
- Neural2: $0.16

## 8. Quotas und Limits

- **Requests pro Minute**: 1,000
- **Requests pro Tag**: 100,000
- **Zeichen pro Request**: 5,000

## 9. Test der API

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "input": {"text": "Hallo Welt, das ist ein Test."},
    "voice": {"languageCode": "de-DE", "name": "de-DE-Neural2-A"},
    "audioConfig": {"audioEncoding": "MP3"}
  }' \
  "https://texttospeech.googleapis.com/v1/text:synthesize?key=YOUR_API_KEY"
```

## 10. Nächste Schritte

1. API Key in Supabase Environment Variables eintragen
2. Edge Functions deployen
3. Audio-Generierung in der App testen
4. Monitoring und Logging einrichten

## Sicherheitshinweise

- API Key niemals in Client-Code einbetten
- Nur über Supabase Edge Functions verwenden
- Regelmäßige Rotation der API Keys
- Monitoring der API-Nutzung einrichten
