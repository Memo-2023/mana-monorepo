# Voice Integration für matrix-mana-bot

## Übersicht

Integration des mana-voice-bot Service (Port 3050) in den matrix-mana-bot Gateway, um vollständige Voice-to-Voice Interaktion zu ermöglichen.

## Architektur

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Matrix Client (Element)                          │
│                                                                          │
│  ┌────────────────┐   ┌────────────────┐   ┌────────────────┐          │
│  │  Text Message  │   │  Voice Note    │   │  Audio Reply   │          │
│  │  "!heute"      │   │  🎤 "Was..."   │   │  🔊 Response   │          │
│  └───────┬────────┘   └───────┬────────┘   └───────▲────────┘          │
└──────────┼────────────────────┼────────────────────┼────────────────────┘
           │                    │                    │
           ▼                    ▼                    │
┌──────────────────────────────────────────────────────────────────────────┐
│                        matrix-mana-bot (Port 3310)                        │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                         MatrixService                                │ │
│  │  handleTextMessage()  │  handleAudioMessage()  │  sendAudioReply() │ │
│  └───────────┬───────────────────┬───────────────────────▲─────────────┘ │
│              │                   │                       │               │
│              ▼                   ▼                       │               │
│  ┌───────────────────────────────────────────────────────┐               │
│  │              VoiceService (NEU)                       │               │
│  │  • transcribeAudio() → mana-stt (3020)               │               │
│  │  • synthesizeSpeech() → mana-voice-bot (3050)        │               │
│  │  • User preferences (voice, speed)                   │               │
│  └───────────────────────────────────────────────────────┘               │
│              │                                                           │
│              ▼                                                           │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │                     CommandRouter                                  │   │
│  │  route(ctx) → AI | Todo | Calendar | Clock | Orchestration        │   │
│  └───────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

## User Flow

### Flow 1: Voice Input → Text + Audio Output

```
User                           Bot                          Services
  │                             │                              │
  │  🎤 Voice Note              │                              │
  │  "Was steht heute an?"      │                              │
  │ ───────────────────────────>│                              │
  │                             │                              │
  │                             │  Download Audio              │
  │                             │ ────────────────────────────>│ Matrix
  │                             │<──────────────────────────── │
  │                             │                              │
  │                             │  POST /transcribe            │
  │                             │ ────────────────────────────>│ mana-stt
  │                             │  "Was steht heute an?"       │
  │                             │<──────────────────────────── │
  │                             │                              │
  │                             │  route("Was steht heute an?")│
  │                             │ ──────────────────────────>  │ CommandRouter
  │                             │  📋 Termine + Aufgaben       │
  │                             │<────────────────────────────>│
  │                             │                              │
  │  📝 Text Response           │                              │
  │  "Heute hast du..."         │                              │
  │<─────────────────────────── │                              │
  │                             │                              │
  │                             │  POST /tts                   │
  │                             │ ────────────────────────────>│ mana-voice-bot
  │                             │  [audio/mpeg]                │
  │                             │<──────────────────────────── │
  │                             │                              │
  │                             │  Upload Audio                │
  │                             │ ────────────────────────────>│ Matrix
  │                             │  mxc://...                   │
  │                             │<──────────────────────────── │
  │                             │                              │
  │  🔊 Audio Response          │                              │
  │  "Heute hast du..."         │                              │
  │<─────────────────────────── │                              │
```

### Flow 2: Text Input mit Voice Response (Optional)

```
User                           Bot
  │                             │
  │  "!heute"                   │
  │ ───────────────────────────>│
  │                             │
  │  📝 Text: "Heute hast..."   │
  │<─────────────────────────── │
  │                             │
  │  (Voice Response optional)  │
  │  🔊 Audio wenn aktiviert    │
  │<─────────────────────────── │
```

## Neue Befehle

### Voice-Einstellungen

| Befehl                     | Beschreibung                          |
| -------------------------- | ------------------------------------- |
| `!voice`                   | Zeigt aktuelle Voice-Einstellungen    |
| `!voice an` / `!voice aus` | Aktiviert/deaktiviert Audio-Antworten |
| `!stimme [name]`           | Wählt TTS-Stimme                      |
| `!stimmen`                 | Zeigt verfügbare Stimmen              |
| `!speed [0.5-2.0]`         | Sprechgeschwindigkeit                 |

### Beispiel-Session

```
User: 🎤 "Mana, was habe ich heute vor?"

Bot:  📝 **Dein Tag heute (15. Februar):**

      **Termine:**
      • 10:00 - Team Meeting
      • 14:30 - Zahnarzt

      **Aufgaben:**
      1. Einkaufen gehen !p1
      2. Report fertigstellen @heute

Bot:  🔊 [Audio: "Heute hast du zwei Termine: Um zehn Uhr Team Meeting
          und um halb drei Zahnarzt. Außerdem stehen zwei Aufgaben an:
          Einkaufen gehen mit hoher Priorität und Report fertigstellen."]
```

## UX-Prinzipien

### 1. Text + Audio (Dual Response)

Bei Voice-Input immer **beides** senden:

- **Text zuerst** → Sofortiges visuelles Feedback, scrollbar, kopierbar
- **Audio danach** → Natürliche Sprachausgabe

Vorteile:

- User kann sofort lesen während Audio lädt
- Referenz bleibt im Chat-Verlauf
- Accessibility für verschiedene Situationen

### 2. Intelligente Audio-Länge

| Antwort-Typ            | Audio                   | Begründung          |
| ---------------------- | ----------------------- | ------------------- |
| Kurz (< 200 Zeichen)   | Ja                      | Schnell, natürlich  |
| Mittel (< 500 Zeichen) | Ja                      | Noch angenehm       |
| Lang (> 500 Zeichen)   | Zusammenfassung         | Voller Text zu lang |
| Listen (> 5 Items)     | Top 3 + "und X weitere" | Fokus auf Wichtiges |
| Fehler                 | Kurze Erklärung         | Klar und hilfreich  |

### 3. Kontext-Sensitive Antworten

```typescript
// Kurze Bestätigung
"Aufgabe hinzugefügt: Einkaufen gehen"
→ 🔊 "Erledigt, Einkaufen gehen wurde hinzugefügt."

// Liste mit vielen Items
"Du hast 12 Aufgaben..."
→ 🔊 "Du hast zwölf Aufgaben, davon drei mit hoher Priorität.
       Die wichtigsten sind: Erstens, Report fertigstellen.
       Zweitens, Meeting vorbereiten. Drittens, E-Mails beantworten."

// AI-Antwort
[Lange Erklärung...]
→ 🔊 [Gekürzte Version, max 30 Sekunden]
```

### 4. Natürliche Deutsche Sprache

Voice-Antworten werden für Sprache optimiert:

```typescript
// Text-Format
'10:00 - Team Meeting';
'14:30 - Zahnarzt';

// Voice-Format
'Um zehn Uhr Team Meeting und um halb drei Zahnarzt';

// Text-Format
'!p1 @heute #arbeit';

// Voice-Format
'mit hoher Priorität, fällig heute, im Projekt Arbeit';
```

### 5. Feedback-Sounds

Kurze Audio-Cues für Aktionen:

| Aktion           | Sound                  |
| ---------------- | ---------------------- |
| Aufgabe erledigt | ✅ Kurzer "Done"-Sound |
| Timer gestartet  | 🔔 Start-Ton           |
| Timer abgelaufen | 🔔 Alarm-Ton           |
| Fehler           | ❌ Sanfter Error-Ton   |

## User Preferences

### Persistente Einstellungen pro User

```typescript
interface VoicePreferences {
	// Voice Response
	voiceEnabled: boolean; // Default: true bei Voice-Input
	alwaysVoice: boolean; // Default: false (nur bei Voice-Input)

	// TTS Settings
	voice: string; // Default: "de-DE-ConradNeural"
	speed: number; // Default: 1.0

	// Behavior
	readLongTexts: boolean; // Default: false (Zusammenfassung)
	maxAudioLength: number; // Default: 30 (Sekunden)
	feedbackSounds: boolean; // Default: true
}
```

### Speicherung

- In-Memory für aktuelle Session
- Optional: Persistierung in User-Settings-Datei

## Implementierungs-Plan

### Phase 1: Grundlegende Voice-Input

**Ziel:** Voice Notes werden transkribiert und als Text verarbeitet

1. `VoiceModule` erstellen
2. `VoiceService` mit STT-Integration
3. `handleAudioMessage()` in MatrixService überschreiben
4. Transkribierte Nachricht durch CommandRouter leiten

**Aufwand:** ~2-3 Stunden

### Phase 2: Voice-Output

**Ziel:** Antworten werden als Audio zurückgesendet

1. TTS-Integration in VoiceService
2. Audio-Upload zu Matrix
3. `sendAudioReply()` Methode
4. Dual-Response (Text + Audio)

**Aufwand:** ~2-3 Stunden

### Phase 3: Smart Formatting

**Ziel:** Antworten werden für Sprache optimiert

1. `VoiceFormatter` Service
2. Zahlen → Wörter ("10:00" → "zehn Uhr")
3. Listen-Zusammenfassung
4. Markdown-Entfernung für TTS

**Aufwand:** ~2 Stunden

### Phase 4: User Preferences

**Ziel:** User können Voice-Einstellungen anpassen

1. Preference-Speicherung
2. `!voice`, `!stimme`, `!stimmen` Befehle
3. Automatische Aktivierung bei Voice-Input

**Aufwand:** ~1-2 Stunden

### Phase 5: Polish & Testing

**Ziel:** Optimierte User Experience

1. Latenz-Optimierung (parallel Processing)
2. Error Handling
3. Edge Cases (leere Audio, etc.)
4. Testing mit verschiedenen Stimmen

**Aufwand:** ~2 Stunden

## Technische Details

### Neue Dateien

```
services/matrix-mana-bot/src/
├── voice/
│   ├── voice.module.ts
│   ├── voice.service.ts        # STT + TTS Orchestration
│   ├── voice-formatter.ts      # Text → Speech-optimized
│   └── voice-preferences.ts    # User Settings
```

### Environment Variables

```env
# Voice Bot (bestehend)
VOICE_BOT_URL=http://localhost:3050

# STT (bestehend)
STT_URL=http://localhost:3020

# Voice Settings
VOICE_ENABLED=true
DEFAULT_VOICE=de-DE-ConradNeural
DEFAULT_SPEED=1.0
MAX_AUDIO_LENGTH=30
```

### Dependencies

Keine neuen Dependencies nötig - alles via HTTP APIs:

- mana-stt (Port 3020) - bereits vorhanden
- mana-voice-bot (Port 3050) - gerade erstellt

## Audio-Nachricht Format

### Matrix Audio Message

```typescript
// Upload Audio zu Matrix
const mxcUrl = await this.client.uploadContent(audioBuffer, 'audio/mpeg', 'response.mp3');

// Send Audio Message
await this.client.sendMessage(roomId, {
	msgtype: 'm.audio',
	body: 'Voice Response',
	url: mxcUrl,
	info: {
		mimetype: 'audio/mpeg',
		size: audioBuffer.length,
		duration: durationMs, // Optional
	},
	// Reply to original message
	'm.relates_to': {
		'm.in_reply_to': {
			event_id: originalEventId,
		},
	},
});
```

## Performance-Optimierungen

### Parallel Processing

```typescript
async handleVoiceMessage(roomId: string, event: MatrixRoomEvent) {
  // 1. Download + Transcribe
  const audioBuffer = await this.downloadMedia(event.content.url);
  const transcript = await this.voiceService.transcribe(audioBuffer);

  // 2. Process Command (get text response)
  const textResponse = await this.commandRouter.route({
    roomId,
    userId: event.sender,
    message: transcript,
    event,
  });

  // 3. Send Text immediately
  await this.sendReply(roomId, event, textResponse);

  // 4. Generate Audio in parallel (don't await for user)
  this.generateAndSendAudio(roomId, event, textResponse)
    .catch(err => this.logger.error('Audio generation failed:', err));
}
```

### Caching

- Voice-Preferences pro User cachen
- Häufige kurze Antworten cachen ("Erledigt", "Hinzugefügt", etc.)

## Fallback-Verhalten

| Situation            | Verhalten                         |
| -------------------- | --------------------------------- |
| STT nicht erreichbar | Fehlermeldung, nur Text           |
| TTS nicht erreichbar | Nur Text-Antwort, kein Audio      |
| Leeres Audio         | "Ich konnte dich nicht verstehen" |
| Zu langes Audio      | Transkribieren + Warnung          |
| Unbekannte Sprache   | Auf Deutsch antworten             |

## Beispiel-Interaktionen

### Morgen-Routine

```
User: 🎤 "Guten Morgen Mana, was steht heute an?"

Bot:  📝 ☀️ **Guten Morgen!**

      **Deine Termine:**
      • 09:00 Daily Standup
      • 11:00 Code Review
      • 15:00 Sprint Planning

      **Wichtige Aufgaben:**
      1. Bug-Fix für Login !p1 @heute
      2. Dokumentation aktualisieren

      **Dein Tag sieht machbar aus!** 💪

Bot:  🔊 "Guten Morgen! Heute hast du drei Termine: Um neun das Daily,
          um elf Code Review und um drei Sprint Planning.
          Außerdem zwei wichtige Aufgaben: Der Bug-Fix für den Login
          hat hohe Priorität und die Dokumentation sollte aktualisiert werden.
          Dein Tag sieht machbar aus!"
```

### Quick Task

```
User: 🎤 "Neue Aufgabe: Milch kaufen"

Bot:  📝 ✅ Aufgabe hinzugefügt:
      **Milch kaufen** (Inbox)

Bot:  🔊 "Erledigt, Milch kaufen wurde hinzugefügt."
```

### Timer

```
User: 🎤 "Timer 25 Minuten für Pomodoro"

Bot:  📝 ⏱️ Timer gestartet: **25 Minuten** (Pomodoro)
      Endet um 14:55

Bot:  🔊 [Start-Sound] + "Timer für 25 Minuten gestartet."

--- 25 Minuten später ---

Bot:  📝 🔔 **Timer abgelaufen!** Pomodoro (25 min)

Bot:  🔊 [Alarm-Sound] + "Dein Pomodoro Timer ist abgelaufen."
```

## Erfolgs-Metriken

- **Latenz:** Voice-Input → Text-Response < 3s
- **Latenz:** Text-Response → Audio-Response < 2s
- **Transkription:** > 95% Genauigkeit für Deutsche Sprache
- **Audio-Qualität:** Natürlich klingende Stimme

## Offene Fragen

1. **Wakeword?**
   - Optional: "Hey Mana" am Anfang der Voice Note?
   - Oder: Jede Voice Note wird verarbeitet?

2. **Audio-Format?**
   - MP3 (klein, universell) ✓
   - WAV (schneller zu generieren)
   - Opus (noch kleiner, nicht überall unterstützt)

3. **Stimmen-Auswahl?**
   - Alle 11 deutschen Stimmen anbieten?
   - Oder nur 3-4 beste?

4. **Multi-User Room?**
   - Voice-Antwort nur an den fragenden User?
   - Oder für alle im Room?
