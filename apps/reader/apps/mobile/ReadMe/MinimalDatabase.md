# Absolut Minimalste Text-to-Speech Datenbank

## Philosophie

Eine einzige Tabelle für alles. JSONB macht's möglich. Keine Joins, keine Komplexität, nur pure Funktionalität.

## Die Eine Tabelle

```sql
-- Die einzige Tabelle die du brauchst
CREATE TABLE texts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Der eigentliche Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,

  -- ALLES andere in einem JSONB Feld
  data JSONB DEFAULT '{}' NOT NULL,

  -- Nur die absolut nötigen Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ein Index für Performance
CREATE INDEX idx_texts_user ON texts(user_id);
CREATE INDEX idx_texts_data ON texts USING GIN (data);

-- RLS aktivieren
ALTER TABLE texts ENABLE ROW LEVEL SECURITY;

-- Jeder sieht nur seine eigenen Texte
CREATE POLICY "Own texts only" ON texts
  FOR ALL USING (auth.uid() = user_id);

-- Update Timestamp Trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_texts_updated_at
  BEFORE UPDATE ON texts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

## Was kommt ins `data` JSONB Feld?

```javascript
// Beispiel eines vollständigen Text-Objekts
{
  id: "uuid-hier",
  user_id: "user-uuid",
  title: "Mein Buch",
  content: "Der eigentliche Text...",
  data: {
    // Vorlese-Einstellungen
    tts: {
      speed: 1.0,
      voice: "de-DE",
      lastPosition: 1234,  // Zeichen-Position
      lastPlayed: "2024-01-15T10:30:00Z"
    },

    // Audio-Cache (NEU!)
    audio: {
      hasLocalCache: false,
      chunks: [
        {
          id: "chunk-1",
          start: 0,
          end: 1000,  // Zeichen-Position
          filename: "text-uuid-chunk-1.mp3",
          size: 245760,  // Bytes
          duration: 120,  // Sekunden
          createdAt: "2024-01-15T10:00:00Z"
        }
      ],
      totalSize: 2457600,  // Total in Bytes
      lastGenerated: "2024-01-15T10:00:00Z",
      settings: {  // Settings bei Generierung
        voice: "de-DE",
        speed: 1.0
      }
    },

    // Organisation (optional)
    tags: ["roman", "favorit"],
    color: "#FF5733",

    // Statistiken (optional)
    stats: {
      playCount: 5,
      totalTime: 3600,  // Sekunden
      completed: false
    },

    // Was auch immer du später brauchst
    notes: "Für die Zugfahrt",
    source: "kindle-import"
  },
  created_at: "2024-01-01T10:00:00Z",
  updated_at: "2024-01-15T10:30:00Z"
}
```

## Basis-Operationen

### Text erstellen

```javascript
const { data, error } = await supabase.from('texts').insert({
	title: 'Mein Text',
	content: 'Inhalt hier...',
	data: {
		tts: { speed: 1.0, voice: 'de-DE' },
		tags: ['neu'],
	},
});
```

### Alle Texte holen

```javascript
const { data: texts } = await supabase
	.from('texts')
	.select('*')
	.order('updated_at', { ascending: false });
```

### Nach Tags filtern

```javascript
const { data: filtered } = await supabase
	.from('texts')
	.select('*')
	.contains('data', { tags: ['favorit'] });
```

### Leseposition updaten

```javascript
const { error } = await supabase
	.from('texts')
	.update({
		data: {
			...currentData,
			tts: {
				...currentData.tts,
				lastPosition: 5678,
				lastPlayed: new Date().toISOString(),
			},
		},
	})
	.eq('id', textId);
```

### Statistiken hochzählen

```sql
-- Als Postgres Funktion für atomare Updates
CREATE OR REPLACE FUNCTION increment_play_count(text_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE texts
  SET data = jsonb_set(
    jsonb_set(
      data,
      '{stats,playCount}',
      to_jsonb(COALESCE((data->'stats'->>'playCount')::int, 0) + 1)
    ),
    '{tts,lastPlayed}',
    to_jsonb(NOW())
  )
  WHERE id = text_id;
END;
$$ LANGUAGE plpgsql;

-- Aufruf
SELECT increment_play_count('text-uuid-hier');
```

## Supabase Quickstart

```bash
# 1. Supabase CLI installieren
npm install -g supabase

# 2. Projekt initialisieren
supabase init

# 3. Migration erstellen
supabase migration new create_texts_table

# 4. SQL von oben in die Migration kopieren

# 5. Migration ausführen
supabase db push
```

## React Native Integration

```javascript
// hooks/useTexts.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useTexts = () => {
	const [texts, setTexts] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchTexts();
	}, []);

	const fetchTexts = async () => {
		const { data } = await supabase
			.from('texts')
			.select('*')
			.order('updated_at', { ascending: false });

		setTexts(data || []);
		setLoading(false);
	};

	const createText = async (title, content) => {
		const { data, error } = await supabase
			.from('texts')
			.insert({
				title,
				content,
				data: { tts: { speed: 1.0, voice: 'de-DE' } },
			})
			.select()
			.single();

		if (data) {
			setTexts([data, ...texts]);
		}
		return { data, error };
	};

	const updatePosition = async (textId, position) => {
		const text = texts.find((t) => t.id === textId);
		if (!text) return;

		await supabase
			.from('texts')
			.update({
				data: {
					...text.data,
					tts: {
						...text.data.tts,
						lastPosition: position,
						lastPlayed: new Date().toISOString(),
					},
				},
			})
			.eq('id', textId);
	};

	return { texts, loading, createText, updatePosition, refetch: fetchTexts };
};
```

## Audio-Cache Management

```javascript
// hooks/useAudioCache.js
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { supabase } from '../lib/supabase';

const AUDIO_DIR = `${FileSystem.documentDirectory}audio/`;

export const useAudioCache = () => {
	// Verzeichnis erstellen beim Start
	useEffect(() => {
		FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true }).catch(() => {}); // Ignorieren wenn bereits existiert
	}, []);

	// Text in Chunks aufteilen (z.B. alle 1000 Zeichen)
	const chunkText = (text, chunkSize = 1000) => {
		const chunks = [];
		for (let i = 0; i < text.length; i += chunkSize) {
			chunks.push({
				id: `chunk-${chunks.length}`,
				start: i,
				end: Math.min(i + chunkSize, text.length),
				content: text.slice(i, i + chunkSize),
			});
		}
		return chunks;
	};

	// Audio für einen Chunk generieren und speichern
	const generateAudioChunk = async (textId, chunk, settings) => {
		const filename = `${textId}-${chunk.id}.mp3`;
		const filePath = `${AUDIO_DIR}${filename}`;

		// Option 1: Mit einer TTS API (z.B. Google Cloud TTS)
		// const audioData = await callTTSAPI(chunk.content, settings);
		// await FileSystem.writeAsStringAsync(filePath, audioData, {
		//   encoding: FileSystem.EncodingType.Base64
		// });

		// Option 2: Workaround mit expo-speech (keine direkte MP3 Generierung)
		// Hinweis: expo-speech kann nicht direkt als Datei speichern
		// Alternative: Web-API oder Cloud-Service nutzen

		const fileInfo = await FileSystem.getInfoAsync(filePath);

		return {
			id: chunk.id,
			start: chunk.start,
			end: chunk.end,
			filename,
			size: fileInfo.size || 0,
			duration: Math.ceil(chunk.content.length / 150) * 60, // Geschätzt
			createdAt: new Date().toISOString(),
		};
	};

	// Alle Chunks für einen Text generieren
	const generateAudioForText = async (textId, content, settings = {}) => {
		const chunks = chunkText(content);
		const audioChunks = [];

		for (const chunk of chunks) {
			const audioChunk = await generateAudioChunk(textId, chunk, settings);
			audioChunks.push(audioChunk);
		}

		// Metadaten in Supabase updaten
		await updateAudioMetadata(textId, audioChunks, settings);

		return audioChunks;
	};

	// Audio-Metadaten in Supabase speichern
	const updateAudioMetadata = async (textId, chunks, settings) => {
		const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);

		const { data: currentText } = await supabase
			.from('texts')
			.select('data')
			.eq('id', textId)
			.single();

		await supabase
			.from('texts')
			.update({
				data: {
					...currentText.data,
					audio: {
						hasLocalCache: true,
						chunks,
						totalSize,
						lastGenerated: new Date().toISOString(),
						settings,
					},
				},
			})
			.eq('id', textId);
	};

	// Audio abspielen
	const playAudioFromCache = async (textId, startPosition = 0) => {
		const { data: text } = await supabase.from('texts').select('data').eq('id', textId).single();

		if (!text?.data?.audio?.hasLocalCache) {
			throw new Error('Kein Audio-Cache vorhanden');
		}

		// Richtigen Chunk finden
		const chunk = text.data.audio.chunks.find(
			(c) => startPosition >= c.start && startPosition < c.end
		);

		if (!chunk) return;

		const filePath = `${AUDIO_DIR}${chunk.filename}`;
		const { sound } = await Audio.Sound.createAsync({ uri: filePath });

		// Position innerhalb des Chunks berechnen
		const chunkPosition = startPosition - chunk.start;
		const positionMillis = (chunkPosition / chunk.end) * chunk.duration * 1000;

		await sound.setPositionAsync(positionMillis);
		await sound.playAsync();

		return sound;
	};

	// Cache löschen
	const clearAudioCache = async (textId) => {
		const { data: text } = await supabase.from('texts').select('data').eq('id', textId).single();

		if (text?.data?.audio?.chunks) {
			for (const chunk of text.data.audio.chunks) {
				try {
					await FileSystem.deleteAsync(`${AUDIO_DIR}${chunk.filename}`);
				} catch (e) {
					console.log('Fehler beim Löschen:', e);
				}
			}
		}

		// Metadaten updaten
		await supabase
			.from('texts')
			.update({
				data: {
					...text.data,
					audio: {
						hasLocalCache: false,
						chunks: [],
						totalSize: 0,
					},
				},
			})
			.eq('id', textId);
	};

	// Cache-Größe berechnen
	const getCacheSize = async () => {
		const files = await FileSystem.readDirectoryAsync(AUDIO_DIR);
		let totalSize = 0;

		for (const file of files) {
			const info = await FileSystem.getInfoAsync(`${AUDIO_DIR}${file}`);
			totalSize += info.size || 0;
		}

		return totalSize;
	};

	return {
		generateAudioForText,
		playAudioFromCache,
		clearAudioCache,
		getCacheSize,
	};
};
```

## Beispiel-Screen für Audio-Management

```javascript
// screens/TextDetailScreen.js
import React, { useState } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import { useAudioCache } from '../hooks/useAudioCache';

export const TextDetailScreen = ({ route }) => {
	const { text } = route.params;
	const { generateAudioForText, playAudioFromCache, clearAudioCache } = useAudioCache();
	const [generating, setGenerating] = useState(false);

	const hasCache = text.data?.audio?.hasLocalCache;

	const handleGenerateAudio = async () => {
		setGenerating(true);
		try {
			await generateAudioForText(text.id, text.content, {
				voice: text.data?.tts?.voice || 'de-DE',
				speed: text.data?.tts?.speed || 1.0,
			});
			// Text-Objekt neu laden
		} catch (error) {
			console.error('Fehler beim Generieren:', error);
		} finally {
			setGenerating(false);
		}
	};

	const handlePlay = async () => {
		try {
			const position = text.data?.tts?.lastPosition || 0;
			await playAudioFromCache(text.id, position);
		} catch (error) {
			// Fallback zu expo-speech
			Speech.speak(text.content.slice(position), {
				language: text.data?.tts?.voice || 'de-DE',
				rate: text.data?.tts?.speed || 1.0,
			});
		}
	};

	return (
		<View>
			<Text>{text.title}</Text>

			{!hasCache && (
				<Button
					title="Audio generieren & speichern"
					onPress={handleGenerateAudio}
					disabled={generating}
				/>
			)}

			{generating && <ActivityIndicator />}

			{hasCache && (
				<>
					<Text>Audio gespeichert: {(text.data.audio.totalSize / 1024 / 1024).toFixed(2)} MB</Text>
					<Button title="Offline abspielen" onPress={handlePlay} />
					<Button title="Cache löschen" onPress={() => clearAudioCache(text.id)} />
				</>
			)}
		</View>
	);
};
```

## Vorteile dieser Struktur

✅ **Eine Tabelle** = Keine Joins, keine Komplexität  
✅ **JSONB** = Unendlich erweiterbar ohne Migrations  
✅ **Performance** = PostgreSQL's JSONB ist super schnell  
✅ **Einfach** = Jeder versteht es sofort  
✅ **Flexibel** = Neue Features sind nur ein JSON-Feld entfernt

## Erweiterungsbeispiele

```javascript
// Später: Lesezeichen hinzufügen
data.bookmarks = [{ position: 1234, note: 'Wichtige Stelle', created: '2024-01-15' }];

// Später: Sharing hinzufügen
data.sharing = {
	isPublic: false,
	shareToken: 'abc123',
	sharedWith: ['email@example.com'],
};

// Später: AI-Features
data.ai = {
	summary: 'KI-generierte Zusammenfassung',
	keywords: ['Thema1', 'Thema2'],
	difficulty: 'medium',
};
```

## Das war's! 🎉

Mit dieser einen Tabelle kannst du:

- Texte speichern ✓
- Vorlesen mit gespeicherter Position ✓
- Tags/Kategorien verwalten ✓
- Statistiken tracken ✓
- Beliebig erweitern ✓

Keine zweite Tabelle nötig. Kein Over-Engineering. Einfach machen.
