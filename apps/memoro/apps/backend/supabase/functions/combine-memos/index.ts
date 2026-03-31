// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { serve } from 'https://deno.land/std@0.215.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
/**
 * Combine Memos Edge Function
 *
 * Diese Funktion kombiniert mehrere Memos zu einem neuen Memo und verarbeitet
 * das kombinierte Transkript mit einem ausgewählten Blueprint.
 *
 * Workflow:
 * 1. Empfängt Array von Memo-IDs, Blueprint-ID und optionalen benutzerdefinierten Prompt
 * 2. Lädt alle angegebenen Memos aus der Datenbank
 * 3. Kombiniert die Transkripte zu einem Text
 * 4. Erstellt ein neues Memo mit dem kombinierten Inhalt
 * 5. Verarbeitet das kombinierte Memo mit dem angegebenen Blueprint via Gemini Flash 2.5
 * 6. Erstellt neue Memory-Einträge mit den Blueprint-Ergebnissen
 *
 * @version 1.0.0
 * @date 2025-05-23
 */ // ─── Umgebungsvariablen ──────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
if (!SUPABASE_URL) {
	throw new Error('SUPABASE_URL not configured');
}
const SERVICE_KEY = Deno.env.get('C_SUPABASE_SECRET_KEY');
if (!SERVICE_KEY) {
	throw new Error('C_SUPABASE_SECRET_KEY not configured');
}
// Google Gemini Konfiguration (Flash 2.5)
const GEMINI_API_KEY = Deno.env.get('COMBINE_MEMOS_GEMINI_MEMORO') || '';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
// Azure OpenAI Konfiguration (Backup)
const AZURE_OPENAI_ENDPOINT = 'https://memoroseopenai.openai.azure.com';
const AZURE_OPENAI_KEY = Deno.env.get('AZURE_OPENAI_KEY');
if (!AZURE_OPENAI_KEY) {
	throw new Error('AZURE_OPENAI_KEY not configured');
}
const AZURE_OPENAI_DEPLOYMENT = 'gpt-4.1-mini-se';
const AZURE_OPENAI_API_VERSION = '2025-01-01-preview';
const memoro_sb = createClient(SUPABASE_URL, SERVICE_KEY);
// ─── Hilfsfunktionen ──────────────────────────────────────────────
/**
 * Extrahiert Transkript-Daten aus verschiedenen Memo-Formaten
 * Unterstützt sowohl alte (einfache Text) als auch neue (Utterances) Formate
 */ function extractTranscriptFromMemo(memo) {
	const result = {
		text: '',
		utterances: undefined,
		speakers: undefined,
		speakerMap: undefined,
	};
	// Prüfe source und metadata
	const source = memo.source || {};
	const metadata = memo.metadata || {};
	// 1. Prüfe auf utterances (neues Format mit Speaker-Diarization)
	const utterances = source.utterances || metadata.utterances;
	if (utterances && Array.isArray(utterances) && utterances.length > 0) {
		// Konvertiere utterances zu Text mit Speaker-Informationen
		result.utterances = utterances;
		result.text = utterances
			.map((u) => {
				const speaker = u.speakerId ? `[${u.speakerId}] ` : '';
				return `${speaker}${u.text}`;
			})
			.join('\n');
		// Übernehme speakers mapping falls vorhanden
		if (source.speakers) {
			result.speakers = source.speakers;
		}
		return result;
	}
	// 2. Prüfe auf speakerMap (alternatives Format)
	if (source.speakerMap && Object.keys(source.speakerMap).length > 0) {
		result.speakerMap = source.speakerMap;
		// Konvertiere speakerMap zu chronologischem Text
		const allUtterances = [];
		Object.entries(source.speakerMap).forEach(([speakerId, utterances]) => {
			if (Array.isArray(utterances)) {
				utterances.forEach((u) => {
					allUtterances.push({
						...u,
						speakerId: speakerId,
					});
				});
			}
		});
		// Sortiere nach offset falls vorhanden
		allUtterances.sort((a, b) => (a.offset || 0) - (b.offset || 0));
		result.utterances = allUtterances;
		result.text = allUtterances.map((u) => `[${u.speakerId}] ${u.text}`).join('\n');
		return result;
	}
	// 3. Prüfe auf altes Format (einfacher Text)
	const simpleTranscript =
		source.transcript || source.transcription || source.text || metadata.transcript || '';
	if (simpleTranscript) {
		result.text = simpleTranscript;
		return result;
	}
	// 4. Fallback: transcription_parts (älteres Array-Format)
	if (source.transcription_parts && Array.isArray(source.transcription_parts)) {
		result.text = source.transcription_parts
			.map((part) => part.text || part.transcript || '')
			.filter(Boolean)
			.join(' ');
		return result;
	}
	// 5. Spezielle Behandlung für combined memos mit additional_recordings
	if (source.additional_recordings && Array.isArray(source.additional_recordings)) {
		const allUtterances = [];
		const allSpeakers = {};
		const texts = [];
		source.additional_recordings.forEach((recording) => {
			// Sammle utterances aus den recordings
			if (recording.utterances && Array.isArray(recording.utterances)) {
				allUtterances.push(...recording.utterances);
			}
			// Sammle speaker mappings
			if (recording.speakers) {
				Object.assign(allSpeakers, recording.speakers);
			}
			// Sammle auch Text als Fallback
			if (recording.transcript) {
				texts.push(recording.transcript);
			}
		});
		// Wenn wir strukturierte utterances haben, bevorzuge diese
		if (allUtterances.length > 0) {
			// Sortiere utterances chronologisch
			allUtterances.sort((a, b) => (a.offset || 0) - (b.offset || 0));
			result.utterances = allUtterances;
			result.speakers = allSpeakers;
			result.text = allUtterances
				.map((u) => {
					const speaker = u.speakerId ? `[${u.speakerId}] ` : '';
					return `${speaker}${u.text}`;
				})
				.join('\n');
			return result;
		} else {
			// Fallback zu einfachem Text
			result.text = texts.join('\n\n');
		}
	}
	return result;
}
/**
 * Formatiert Transkript für LLM-Verarbeitung mit verbesserter Speaker-Darstellung
 */ function formatTranscriptForLLM(title, date, extractedTranscript, speakers) {
	const header = `=== ${title} (${date}) ===\n`;
	// Wenn keine Speaker-Informationen vorhanden sind, gib einfachen Text zurück
	if (!extractedTranscript.utterances || extractedTranscript.utterances.length === 0) {
		return header + extractedTranscript.text + '\n\n';
	}
	// Formatiere mit Speaker-Informationen und Zeitstempeln
	let formattedText = header;
	extractedTranscript.utterances.forEach((utterance) => {
		const timestamp = utterance.offset ? ` [${formatTimestamp(utterance.offset)}]` : '';
		const speakerId = utterance.speakerId || 'Unknown';
		// Verwende Speaker-Label falls vorhanden, sonst formatiere Speaker-ID
		let speakerLabel = speakerId;
		if (speakers && speakers[speakerId]) {
			speakerLabel = speakers[speakerId];
		} else if (speakerId.startsWith('speaker')) {
			// Konvertiere "speaker1" zu "Sprecher 1"
			const speakerNum = speakerId.replace('speaker', '');
			speakerLabel = `Sprecher ${speakerNum}`;
		}
		formattedText += `${speakerLabel}${timestamp}: ${utterance.text}\n`;
	});
	return formattedText + '\n';
}
/**
 * Formatiert Millisekunden in lesbares Zeitformat (MM:SS)
 */ function formatTimestamp(ms) {
	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
// ─── Logging-Funktion ──────────────────────────────────────────────
/**
 * Erweiterte Logging-Funktion mit Zeitstempel und Log-Level
 */ function log(level, message, data) {
	const timestamp = new Date().toISOString();
	const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
	switch (level.toUpperCase()) {
		case 'INFO':
			console.log(logMessage);
			break;
		case 'DEBUG':
			console.debug(logMessage);
			break;
		case 'WARN':
			console.warn(logMessage);
			break;
		case 'ERROR':
			console.error(logMessage);
			break;
		default:
			console.log(logMessage);
			break;
	}
	if (data) {
		if (level.toUpperCase() === 'ERROR') {
			console.error(data);
		} else {
			console.log(typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
		}
	}
}
/**
 * Dekodiert ein JWT-Token und extrahiert die Payload
 */ function decodeJWT(token) {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) {
			console.error('Invalid JWT: Incorrect number of parts');
			return null;
		}
		const payload = parts[1];
		const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
		const decoded = atob(padded);
		const parsed = JSON.parse(decoded);
		return parsed;
	} catch (error) {
		console.error('Fehler beim Dekodieren des JWT:', error);
		return null;
	}
}
/**
 * Verarbeitet Blueprint-Prompts mit Gemini Flash 2.5
 */ async function processWithGemini(transcript, prompt, functionIdForLog = 'combine') {
	const requestId = crypto.randomUUID().substring(0, 8);
	log(
		'INFO',
		`[${functionIdForLog}][LLM-${requestId}] Starte Gemini-Anfrage für Blueprint-Verarbeitung.`
	);
	try {
		const fullPrompt = `${prompt}

Inhalt: ${transcript}

Bearbeite den obigen Inhalt entsprechend der Anweisung und antworte strukturiert und präzise.`;
		log(
			'DEBUG',
			`[${functionIdForLog}][LLM-${requestId}] Vollständiger Prompt (Länge: ${fullPrompt.length})`
		);
		const startTime = Date.now();
		const response = await fetch(
			`${GEMINI_ENDPOINT}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					contents: [
						{
							parts: [
								{
									text: fullPrompt,
								},
							],
						},
					],
					generationConfig: {
						temperature: 0.7,
						maxOutputTokens: 8192,
					},
				}),
			}
		);
		const duration = Date.now() - startTime;
		log(
			'INFO',
			`[${functionIdForLog}][LLM-${requestId}] Gemini-Anfrage abgeschlossen in ${duration}ms`
		);
		if (!response.ok) {
			throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
		}
		const data = await response.json();
		if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
			throw new Error('Unerwartete Gemini API Response-Struktur');
		}
		const result = data.candidates[0].content.parts[0].text;
		log(
			'INFO',
			`[${functionIdForLog}][LLM-${requestId}] Gemini-Antwort erhalten (Länge: ${result.length})`
		);
		return result;
	} catch (error) {
		log('ERROR', `[${functionIdForLog}][LLM-${requestId}] Gemini-Fehler:`, error);
		throw error;
	}
}
/**
 * Fallback zu Azure OpenAI
 */ async function processWithAzure(transcript, prompt, functionIdForLog = 'combine') {
	const requestId = crypto.randomUUID().substring(0, 8);
	log('INFO', `[${functionIdForLog}][LLM-${requestId}] Starte Azure OpenAI-Anfrage als Fallback.`);
	try {
		const fullPrompt = `${prompt}

Inhalt: ${transcript}

Bearbeite den obigen Inhalt entsprechend der Anweisung und antworte strukturiert und präzise.`;
		const startTime = Date.now();
		const response = await fetch(
			`${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'api-key': AZURE_OPENAI_KEY,
				},
				body: JSON.stringify({
					messages: [
						{
							role: 'user',
							content: fullPrompt,
						},
					],
					max_tokens: 2048,
					temperature: 0.7,
				}),
			}
		);
		const duration = Date.now() - startTime;
		log(
			'INFO',
			`[${functionIdForLog}][LLM-${requestId}] Azure OpenAI-Anfrage abgeschlossen in ${duration}ms`
		);
		if (!response.ok) {
			throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
		}
		const data = await response.json();
		const result = data.choices[0].message.content;
		log(
			'INFO',
			`[${functionIdForLog}][LLM-${requestId}] Azure OpenAI-Antwort erhalten (Länge: ${result.length})`
		);
		return result;
	} catch (error) {
		log('ERROR', `[${functionIdForLog}][LLM-${requestId}] Azure OpenAI-Fehler:`, error);
		throw error;
	}
}
// ─── Hauptfunktion ──────────────────────────────────────────────
serve(async (req) => {
	const functionId = crypto.randomUUID().substring(0, 8);
	log('INFO', `[${functionId}] Combine Memos Function gestartet`);
	try {
		// CORS Headers
		if (req.method === 'OPTIONS') {
			return new Response('ok', {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'POST',
					'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
				},
			});
		}
		if (req.method !== 'POST') {
			return new Response(
				JSON.stringify({
					error: 'Method not allowed',
				}),
				{
					status: 405,
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
		}
		// Request Body parsen
		const body = await req.json();
		const { memo_ids, blueprint_id, custom_prompt } = body;
		log('INFO', `[${functionId}] Request empfangen:`, {
			memo_ids_count: memo_ids?.length,
			blueprint_id,
			has_custom_prompt: !!custom_prompt,
		});
		// Validierung
		if (!memo_ids || !Array.isArray(memo_ids) || memo_ids.length === 0) {
			throw new Error('memo_ids ist erforderlich und muss ein nicht-leeres Array sein');
		}
		if (!blueprint_id) {
			throw new Error('blueprint_id ist erforderlich');
		}
		// Extract user_id from JWT token
		const authHeader = req.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new Error('Authorization header fehlt oder ist ungültig');
		}
		const token = authHeader.substring(7);
		const decoded = decodeJWT(token);
		if (!decoded || !decoded.sub) {
			throw new Error('JWT-Token ungültig oder user_id fehlt');
		}
		const user_id = decoded.sub;
		log('INFO', `[${functionId}] User authentifiziert: ${user_id}`);
		// Memos aus der Datenbank laden (mit vollständigen Daten)
		log('INFO', `[${functionId}] Lade ${memo_ids.length} Memos aus der Datenbank...`);
		const { data: memos, error: memosError } = await memoro_sb
			.from('memos')
			.select('id, title, source, metadata, created_at')
			.in('id', memo_ids)
			.eq('user_id', user_id);
		if (memosError) {
			throw new Error(`Fehler beim Laden der Memos: ${memosError.message}`);
		}
		if (!memos || memos.length === 0) {
			throw new Error('Keine Memos gefunden oder keine Berechtigung');
		}
		log('INFO', `[${functionId}] ${memos.length} Memos erfolgreich geladen`);
		// Spezielle Blueprint-IDs behandeln
		let blueprint;
		let prompts = [];
		if (blueprint_id === 'transcript_only') {
			log('INFO', `[${functionId}] Verwende speziellen Blueprint: Nur Transkripte kombinieren`);
			blueprint = {
				id: 'transcript_only',
				name: {
					de: 'Transkripte kombinieren',
					en: 'Combine Transcripts',
				},
				description: {
					de: 'Kombiniert nur die Transkripte ohne AI-Verarbeitung',
					en: 'Combines only transcripts without AI processing',
				},
			};
			prompts = []; // Keine Prompts für reine Transkript-Kombination
		} else {
			// Blueprint aus der Datenbank laden
			log('INFO', `[${functionId}] Lade Blueprint ${blueprint_id}...`);
			const { data: blueprintData, error: blueprintError } = await memoro_sb
				.from('blueprints')
				.select('id, name, description')
				.eq('id', blueprint_id)
				.eq('is_public', true)
				.single();
			if (blueprintError) {
				throw new Error(`Fehler beim Laden des Blueprints: ${blueprintError.message}`);
			}
			if (!blueprintData) {
				throw new Error('Blueprint nicht gefunden oder nicht öffentlich');
			}
			blueprint = blueprintData;
			log(
				'INFO',
				`[${functionId}] Blueprint erfolgreich geladen: ${blueprint.name?.de || blueprint.name?.en || 'Unnamed'}`
			);
			// Blueprint-Prompts laden
			log('INFO', `[${functionId}] Lade Prompts für Blueprint...`);
			const { data: promptLinks, error: promptLinksError } = await memoro_sb
				.from('prompt_blueprints')
				.select('prompt_id')
				.eq('blueprint_id', blueprint_id);
			if (promptLinksError) {
				throw new Error(`Fehler beim Laden der Prompt-Links: ${promptLinksError.message}`);
			}
			if (!promptLinks || promptLinks.length === 0) {
				throw new Error('Keine Prompts für diesen Blueprint gefunden');
			}
			const promptIds = promptLinks.map((link) => link.prompt_id);
			const { data: promptsData, error: promptsError } = await memoro_sb
				.from('prompts')
				.select('id, memory_title, prompt_text')
				.in('id', promptIds);
			if (promptsError) {
				throw new Error(`Fehler beim Laden der Prompts: ${promptsError.message}`);
			}
			prompts = promptsData || [];
		}
		log('INFO', `[${functionId}] ${prompts?.length || 0} Prompts für Blueprint geladen`);
		// Transkripte strukturiert kombinieren und für LLM aufbereiten
		const additionalRecordings = [];
		let combinedTranscriptForLLM = '';
		let combinedTranscriptForDisplay = '';
		for (let index = 0; index < memos.length; index++) {
			const memo = memos[index];
			const title = memo.title || `Memo ${index + 1}`;
			const date = new Date(memo.created_at).toLocaleDateString('de-DE');
			// Verwende die neue Extraktions-Funktion für alle Formate
			const extractedTranscript = extractTranscriptFromMemo(memo);
			// Bestimme den korrekten Audio-Pfad und Type
			const audioPath = memo.source?.audio_path;
			const hasAudioFile = audioPath && !audioPath.startsWith('combined-memo-');
			// Erstelle additional_recording Eintrag für separates Transkript mit Audio
			additionalRecordings.push({
				audio_path: audioPath || `combined-memo-${memo.id}`,
				type: hasAudioFile ? 'audio' : 'combined_memo',
				timestamp: memo.created_at,
				status: 'completed',
				transcript: extractedTranscript.text,
				// Bewahre alle strukturierten Daten für separate Anzeige
				utterances: extractedTranscript.utterances,
				speakers: extractedTranscript.speakers,
				speakerMap: extractedTranscript.speakerMap,
				languages: memo.source?.languages || ['de-DE'],
				primary_language: memo.source?.primary_language || 'de-DE',
				// Audio-spezifische Daten
				duration: memo.source?.duration || memo.source?.duration_seconds,
				// Erweiterte Metadaten für bessere Anzeige
				memo_metadata: {
					original_memo_id: memo.id,
					original_title: title,
					original_created_at: memo.created_at,
					original_source: memo.source,
					combine_index: index,
					// Zusätzliche Anzeige-Informationen
					display_title: title,
					display_date: date,
					has_audio: hasAudioFile,
				},
			});
			// Text für LLM-Verarbeitung mit Speaker-Context aufbereiten
			// Versuche Speaker-Labels aus Metadata zu holen
			const speakerLabels = memo.metadata?.speakerLabels || extractedTranscript.speakers;
			combinedTranscriptForLLM += formatTranscriptForLLM(
				title,
				date,
				extractedTranscript,
				speakerLabels
			);
			// Einfacheres Format für die Anzeige (ohne Header)
			if (index > 0) {
				combinedTranscriptForDisplay += '\n\n';
			}
			combinedTranscriptForDisplay += extractedTranscript.text;
		}
		log(
			'INFO',
			`[${functionId}] ${additionalRecordings.length} Additional-Recordings erstellt und ${combinedTranscriptForLLM.length} Zeichen für LLM aufbereitet`
		);
		// Neues kombiniertes Memo erstellen (nur als Container für separate Transkripte)
		const blueprintName = blueprint.name?.de || blueprint.name?.en || 'Unnamed Blueprint';
		const combinedMemoTitle = `Combined: ${memos.length} memos (${blueprintName})`;
		// Erstelle beschreibenden Intro-Text
		const originalTitles = memos.map((memo) => memo.title || 'Untitled').join(', ');
		const introText = `Dieses Memo kombiniert ${memos.length} ursprüngliche Memos: ${originalTitles}. Jedes Memo wird als separates Transkript unten angezeigt.`;
		const newMemoData = {
			user_id: user_id,
			title: combinedMemoTitle,
			intro: introText,
			source: {
				type: 'combined',
				// KEIN kombiniertes Haupttranskript mehr - nur Container-Metadaten
				additional_recordings: additionalRecordings,
				languages: ['de-DE'],
				primary_language: 'de-DE',
				// Kombinierungs-spezifische Metadaten
				combine_metadata: {
					blueprint_id: blueprint_id,
					blueprint_name: blueprintName,
					custom_prompt: custom_prompt || null,
					combined_at: new Date().toISOString(),
					combined_memo_count: memos.length,
					original_memo_ids: memo_ids,
					original_titles: originalTitles,
				},
			},
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};
		log('INFO', `[${functionId}] Erstelle neues kombiniertes Memo...`);
		const { data: newMemo, error: createMemoError } = await memoro_sb
			.from('memos')
			.insert(newMemoData)
			.select()
			.single();
		if (createMemoError) {
			throw new Error(`Fehler beim Erstellen des neuen Memos: ${createMemoError.message}`);
		}
		log('INFO', `[${functionId}] Neues Memo erstellt: ${newMemo.id}`);
		// Blueprint-Prompts verarbeiten (außer bei transcript_only)
		const currentLanguage = 'de'; // Standard Deutsch, könnte später dynamisch sein
		let processedCount = 0;
		if (blueprint_id === 'transcript_only') {
			log('INFO', `[${functionId}] Überspringe AI-Verarbeitung für transcript_only Blueprint`);
		} else {
			for (const prompt of prompts || []) {
				try {
					const promptTitle =
						prompt.memory_title?.[currentLanguage] || prompt.memory_title?.en || 'Untitled';
					const promptText = prompt.prompt_text?.[currentLanguage] || prompt.prompt_text?.en || '';
					if (!promptText) {
						log('WARN', `[${functionId}] Prompt ${prompt.id} hat keinen Text, überspringe`);
						continue;
					}
					// Custom Prompt anhängen, falls vorhanden
					const finalPrompt = custom_prompt
						? `${promptText}\n\nZusätzliche Anweisung: ${custom_prompt}`
						: promptText;
					log('INFO', `[${functionId}] Verarbeite Prompt: ${promptTitle}`);
					// Mit Gemini verarbeiten, Fallback zu Azure
					let aiResponse;
					try {
						aiResponse = await processWithGemini(combinedTranscriptForLLM, finalPrompt, functionId);
					} catch (geminiError) {
						log(
							'WARN',
							`[${functionId}] Gemini fehlgeschlagen, verwende Azure Fallback:`,
							geminiError
						);
						aiResponse = await processWithAzure(combinedTranscriptForLLM, finalPrompt, functionId);
					}
					// Get the highest sort_order for this memo
					const { data: maxSortData, error: maxSortError } = await memoro_sb
						.from('memories')
						.select('sort_order')
						.eq('memo_id', newMemo.id)
						.order('sort_order', {
							ascending: false,
						})
						.limit(1)
						.single();
					// If error or no data, use random number above 5000, otherwise increment
					const nextSortOrder =
						maxSortError || !maxSortData?.sort_order
							? Math.floor(Math.random() * 5000) + 5000 // Random between 5000-9999
							: maxSortData.sort_order + 1;
					// Memory-Eintrag erstellen
					const memoryData = {
						memo_id: newMemo.id,
						title: promptTitle,
						content: aiResponse,
						sort_order: nextSortOrder,
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
					};
					const { error: memoryError } = await memoro_sb.from('memories').insert(memoryData);
					if (memoryError) {
						log(
							'ERROR',
							`[${functionId}] Fehler beim Erstellen der Memory für Prompt ${prompt.id}:`,
							memoryError
						);
					} else {
						processedCount++;
						log('INFO', `[${functionId}] Memory erstellt für Prompt: ${promptTitle}`);
					}
				} catch (promptError) {
					log('ERROR', `[${functionId}] Fehler bei Prompt ${prompt.id}:`, promptError);
				}
			}
		}
		log(
			'INFO',
			`[${functionId}] Blueprint-Verarbeitung abgeschlossen. ${processedCount}/${prompts?.length || 0} Prompts erfolgreich verarbeitet`
		);
		// Headline und Intro für das kombinierte Memo generieren (auch bei transcript_only)
		log('INFO', `[${functionId}] Starte Headline-Generierung für kombiniertes Memo...`);
		try {
			const headlineResponse = await fetch(`${SUPABASE_URL}/functions/v1/headline`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${SERVICE_KEY}`,
				},
				body: JSON.stringify({
					memo_id: newMemo.id,
				}),
			});
			if (headlineResponse.ok) {
				const headlineData = await headlineResponse.json();
				log('INFO', `[${functionId}] Headline erfolgreich generiert: ${headlineData.headline}`);
			} else {
				const errorText = await headlineResponse.text();
				log('WARN', `[${functionId}] Headline-Generierung fehlgeschlagen:`, errorText);
			}
		} catch (headlineError) {
			log('WARN', `[${functionId}] Fehler bei Headline-Generierung:`, headlineError);
		}
		// Erfolgreiche Antwort
		return new Response(
			JSON.stringify({
				success: true,
				memo_id: newMemo.id,
				combined_memos_count: memos.length,
				processed_prompts_count: processedCount,
				total_prompts_count: prompts?.length || 0,
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
				},
			}
		);
	} catch (error) {
		log('ERROR', `[${functionId}] Fehler in Combine Memos Function:`, error);
		return new Response(
			JSON.stringify({
				error: error.message || 'Ein unbekannter Fehler ist aufgetreten',
				function_id: functionId,
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
				},
			}
		);
	}
});
