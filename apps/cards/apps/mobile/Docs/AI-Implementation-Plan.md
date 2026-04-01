> super danke lass uns jezt die ai features
> planen. es sollen diese dinge möglich werden,
> mit der open ai api: neue karten erstellen mit

1.  spracheingabe (STT) 2. testeingabe 3.
    bildupload - ausserdem sollen die karten per
    STT vorgelesen werden können. schreibe dazu
    einen plan für die implementierung

⏺ Update Todos
⎿ ☐ AI Features Planning: Spracherkennung  
 (STT) für Kartenerstellung
☐ AI Features Planning: Texteingabe mit
OpenAI für Kartenerstellung
☐ AI Features Planning: Bildupload mit
Vision API für Kartenerstellung
☐ AI Features Planning: Text-to-Speech
(TTS) für Kartenvorlesung
☐ AI Features Planning: Technische
Architektur und API Integration

⏺ 🤖 AI Features Implementation Plan - Manadeck

Übersicht der AI-Features

🎯 Ziel-Features:

1. Kartenerstellung via Spracheingabe (STT →
   OpenAI → Karteninhalt)
2. Kartenerstellung via Texteingabe (Text →
   OpenAI → strukturierte Karten)
3. Kartenerstellung via Bildupload (Bild →
   Vision API → Karteninhalt)
4. Kartenvorlesung via TTS (Kartentext →
   Speech → Audio)

---

📋 Phase 7: AI Integration Roadmap

Phase 7.1: Foundation & Setup (1 Woche)

7.1.1 Dependencies & Environment Setup

// Neue Dependencies
"@react-native-async-storage/async-storage":
"^1.21.0",
"expo-speech": "~12.1.0", // TTS
"expo-av": "~14.0.0", // Audio
recording/playback
"react-native-audio-recorder-player":
"^3.6.6", // Advanced audio
"openai": "^4.24.0", // OpenAI
API
"expo-image-picker": "~15.0.0", //
Bildauswahl
"expo-file-system": "~17.0.0" //
Dateisystem

7.1.2 Environment Variables

EXPO_PUBLIC_OPENAI_API_KEY=sk-...
EXPO_PUBLIC_OPENAI_MODEL=gpt-4o
EXPO_PUBLIC_OPENAI_VISION_MODEL=gpt-4o-vision-
preview

7.1.3 API Service Layer

// utils/openaiService.ts
export class OpenAIService {
static async generateCardsFromText(prompt:
string): Promise<CardContent[]>
static async
generateCardsFromSpeech(audioData: string):
Promise<CardContent[]>
static async
generateCardsFromImage(imageBase64: string):
Promise<CardContent[]>
static async enhanceCardContent(content:
string): Promise<string>
}

---

Phase 7.2: Speech-to-Text Integration (1-2
Wochen)

7.2.1 Audio Recording Component

// components/ai/AudioRecorder.tsx
interface AudioRecorderProps {
onRecordingComplete: (audioUri: string) =>
void;
onTranscriptionComplete: (text: string) =>
void;
}

export const AudioRecorder:
React.FC<AudioRecorderProps> = ({
onRecordingComplete,
onTranscriptionComplete
}) => {
// Aufnahme-Button mit
Wellenform-Visualisierung
// Live-Transkription während Aufnahme
// Aufnahme-Controls (Pause, Stopp,
Wiedergabe)
}

7.2.2 Speech-to-Text Service

// utils/speechService.ts
export class SpeechService {
static async transcribeAudio(audioUri:
string): Promise<{
text: string;
confidence: number;
language: string;
}>

    static async transcribeRealtime(audioStream:

any): Promise<void>
}

7.2.3 Integration in Card Creation

- Neuer "Voice Input" Modus in Card Creation
  Screen
- Real-time Transkription mit
  Korrekturmöglichkeit
- Automatische Strukturierung durch OpenAI

---

Phase 7.3: Text-to-Cards AI Processing (1
Woche)

7.3.1 AI Card Generator Service

// utils/cardGenerator.ts
export class CardGenerator {
static async generateFromText(input: string,
options: {
cardTypes: ('flashcard' | 'quiz' |
'text')[];
difficulty: 'easy' | 'medium' | 'hard';
count: number;
language: 'de' | 'en';
}): Promise<GeneratedCard[]>

    static async generateFromTopics(topics:

string[]): Promise<GeneratedCard[]>
static async enhanceExistingCard(card:
Card): Promise<Card>
}

interface GeneratedCard {
type: CardType;
content: CardContent;
metadata: {
confidence: number;
source: string;
tags: string[];
};
}

7.3.2 Smart Card Creation UI

// components/ai/SmartCardCreator.tsx
export const SmartCardCreator: React.FC = ()
=> {
// Multi-Input Interface:
// - Text Area für freie Eingabe
// - Topic Tags für strukturierte Eingabe
// - AI-Einstellungen (Schwierigkeit,
Kartentypen)
// - Vorschau der generierten Karten
// - Bulk-Edit Funktionen
}

---

Phase 7.4: Vision API Integration (1-2 Wochen)

7.4.1 Image Processing Service

// utils/visionService.ts
export class VisionService {
static async analyzeImage(imageUri: string):
Promise<{
text: string; // OCR-Text
objects: string[]; // Erkannte
Objekte
concepts: string[]; // Konzepte/Themen
language: string; // Erkannte
Sprache
}>

    static async generateCardsFromImage(
      imageUri: string,
      context?: string
    ): Promise<GeneratedCard[]>

}

7.4.2 Image Upload Component

// components/ai/ImageCardCreator.tsx
export const ImageCardCreator: React.FC = ()
=> {
// Kamera/Galerie Integration
// Image Preview mit Crop-Funktionalität
// OCR-Text-Extraktion mit Editing
// Context-Input für bessere AI-Generation
// Generated Cards Preview
}

7.4.3 Use Cases

- Lehrbücher fotografieren → Automatische
  Flashcard-Generierung
- Whiteboards/Notizen → Strukturierte Karten
- Diagramme/Grafiken → Erklärende Text-Karten
- Handschrift-Erkennung → Digitale Karten

---

Phase 7.5: Text-to-Speech Integration (1
Woche)

7.5.1 TTS Service

// utils/ttsService.ts
export class TTSService {
static async speakText(text: string,
options: {
language: string;
rate: number;
pitch: number;
voice?: string;
}): Promise<void>

    static async generateAudioFile(text:

string): Promise<string> // Return audio URI
static getAvailableVoices():
Promise<Voice[]>
}

7.5.2 Audio Playback in Cards

// components/study/AudioCard.tsx
export const AudioCard: React.FC<{ card: Card
}> = ({ card }) => {
// Play/Pause Button für Karteninhalt
// Geschwindigkeitsregelung
// Auto-Play Optionen
// Audio-Caching für Offline-Nutzung
}

7.5.3 Study Session Audio Features

- Automatische Vorlesung während Study
  Sessions
- Hände-frei Lernen für Unterwegs
- Aussprache-Training für Fremdsprachen
- Audio-Speed-Control für verschiedene
  Lerngeschwindigkeiten

---

Phase 7.6: AI-Enhanced Study Experience (1-2
Wochen)

7.6.1 Smart Study Recommendations

// store/aiStore.ts
export const useAIStore =
create<AIState>((set, get) => ({
recommendations: [],

    generateStudyPlan: async (userId: string) =>

{
// AI-basierte Lernplan-Generierung
// Berücksichtigt Fortschritt, Schwächen,
Präferenzen
},

    suggestCardImprovements: async (cardId:

string) => {
// Vorschläge zur Kartenverbesserung
// Basierend auf Lernperformance
},

    generateRelatedCards: async (card: Card) =>

{
// Ähnliche/verwandte Karten vorschlagen
}
}));

7.6.2 Intelligent Content Enhancement

- Automatische Hinweise zu schwierigen Karten
- Kontext-Erweiterungen für besseres
  Verständnis
- Adaptive Schwierigkeit basierend auf
  Performance
- Personalisierte Erklärungen je nach Lernstil

---

🏗️ Technische Architektur

Backend Extensions

7.A.1 Neue Datenbank-Tabellen

-- AI-generierte Karten tracking
CREATE TABLE ai_generated_cards (
id UUID PRIMARY KEY DEFAULT
gen_random_uuid(),
card_id UUID REFERENCES cards(id),
generation_method TEXT, -- 'speech', 'text',
'image'
source_data JSONB, -- Original input
data
confidence_score DECIMAL,
created_at TIMESTAMP DEFAULT NOW()
);

-- Audio-Dateien für TTS
CREATE TABLE card_audio_files (
id UUID PRIMARY KEY DEFAULT
gen_random_uuid(),
card_id UUID REFERENCES cards(id),
audio_url TEXT,
language TEXT,
voice_settings JSONB,
created_at TIMESTAMP DEFAULT NOW()
);

-- AI-Verbesserungsvorschläge
CREATE TABLE ai_suggestions (
id UUID PRIMARY KEY DEFAULT
gen_random_uuid(),
card_id UUID REFERENCES cards(id),
suggestion_type TEXT,
suggestion_data JSONB,
applied BOOLEAN DEFAULT FALSE,
created_at TIMESTAMP DEFAULT NOW()
);

7.A.2 Supabase Functions

-- Edge Function für OpenAI Integration
CREATE OR REPLACE FUNCTION
generate_cards_from_content(
content TEXT,
generation_type TEXT,
user_id UUID
) RETURNS JSON;

-- Edge Function für Audio-Processing
CREATE OR REPLACE FUNCTION
process_audio_upload(
audio_data BYTEA,
user_id UUID
) RETURNS JSON;

Security & Performance

7.B.1 API Rate Limiting

// utils/rateLimiter.ts
export class RateLimiter {
static checkAPILimit(userId: string,
endpoint: string): Promise<boolean>
static trackUsage(userId: string, endpoint:
string, cost: number): Promise<void>
}

7.B.2 Caching Strategy

- Audio Files: Supabase Storage mit CDN
- AI Responses: Redis/Memory Cache
- Image Processing: Optimierte Komprimierung
- Offline Support: SQLite für generierte
  Inhalte

---

💰 Kostenoptimierung

7.C.1 Token/API Management

// utils/costOptimizer.ts
export class CostOptimizer {
static estimateTokens(text: string): number
static compressPrompt(prompt: string):
string
static batchRequests(requests: any[]):
Promise<any[]>
static cacheCommonResponses(key: string,
response: any): void
}

7.C.2 Smart Usage Strategies

- Prompt Engineering für effiziente
  Token-Nutzung
- Batch Processing für multiple Karten
- Caching häufiger Anfragen
- Fallback Models für einfache Aufgaben
- User Limits für API-Kosten-Kontrolle

---

🎮 User Experience Features

7.D.1 AI Assistant Interface

// components/ai/AIAssistant.tsx
export const AIAssistant: React.FC = () => {
// Chat-Interface für AI-Interaktion
// Voice Commands
// Smart Suggestions Overlay
// Progress-aware Recommendations
}

7.D.2 Personalization Engine

- Lernstil-Erkennung basierend auf
  Nutzungsmustern
- Adaptive Kartenformate je nach Präferenz
- Personalisierte Schwierigkeit für
  AI-generierte Inhalte
- Custom Prompts für wiederkehrende
  Kartenerstellung

---

📈 Success Metrics & Analytics

KPIs für AI Features:

- Card Generation Success Rate (Qualität der
  generierten Karten)
- User Adoption Rate (% der Nutzer die
  AI-Features verwenden)
- Time Savings (Vergleich manuelle vs.
  AI-Kartenerstellung)
- Learning Effectiveness (Performance bei AI
  vs. manuellen Karten)
- API Cost per User (Kostenoptimierung)

---

🚀 Implementation Timeline

| Phase | Duration | Key Deliverables
|
|-------|----------|--------------------------
---------|
| 7.1 | 1 Woche | Setup, Dependencies, API
Services |
| 7.2 | 2 Wochen | Speech-to-Text
Integration |
| 7.3 | 1 Woche | Text-to-Cards AI
Processing |
| 7.4 | 2 Wochen | Vision API Integration
|
| 7.5 | 1 Woche | Text-to-Speech
Integration |
| 7.6 | 2 Wochen | Enhanced Study Experience
|

Total: ~9 Wochen für vollständige
AI-Integration
