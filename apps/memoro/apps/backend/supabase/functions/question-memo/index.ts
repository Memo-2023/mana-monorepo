// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { serve } from 'https://deno.land/std@0.215.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSystemPrompt } from './constants.ts';
import { ROOT_SYSTEM_PROMPTS } from '../_shared/system-prompt.ts';
/**
 * Question Memo Edge Function
 *
 * Diese Funktion nimmt eine Benutzerfrage und ein Memo-Transkript entgegen,
 * sendet beides an Gemini API und erstellt eine neue Memory mit der Antwort.
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
// Google Gemini Konfiguration
const GEMINI_API_KEY = Deno.env.get('QUESTION_MEMO_GEMINI_MEMORO') || '';
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
 * Formatiert Transkript mit Speaker-Informationen für besseren Kontext
 */ function formatTranscriptWithSpeakers(source) {
	// Handle combined memos with additional_recordings
	if (
		source.type === 'combined' &&
		source.additional_recordings &&
		Array.isArray(source.additional_recordings)
	) {
		const transcripts = source.additional_recordings
			.map((recording, index) => {
				let recordingTranscript = '';
				// Extract transcript from each recording
				if (recording.utterances && Array.isArray(recording.utterances)) {
					// If recording has utterances, format with speakers if available
					if (recording.speakers) {
						recordingTranscript = recording.utterances
							.map((utterance) => {
								const speakerName = recording.speakers[utterance.speakerId] || utterance.speakerId;
								return `${speakerName}: ${utterance.text}`;
							})
							.join('\n');
					} else {
						// No speaker info, just join utterances
						recordingTranscript = recording.utterances.map((u) => u.text).join(' ');
					}
				} else if (recording.transcript) {
					// Fallback to transcript field
					recordingTranscript = recording.transcript;
				} else if (recording.content) {
					// Fallback to content field
					recordingTranscript = recording.content;
				} else if (recording.transcription) {
					// Fallback to transcription field
					recordingTranscript = recording.transcription;
				}
				return recordingTranscript;
			})
			.filter(Boolean);
		// Join all transcripts with a separator
		if (transcripts.length > 0) {
			return transcripts.join('\n\n--- Nächstes Memo ---\n\n');
		}
	}
	// Handle regular memos with utterances and speakers
	if (source.utterances && source.speakers) {
		return source.utterances
			.map((utterance) => {
				const speakerName = source.speakers[utterance.speakerId] || utterance.speakerId;
				return `${speakerName}: ${utterance.text}`;
			})
			.join('\n');
	}
	// Fallback to other transcript fields
	return source.transcript || source.content || source.transcription || '';
}
/**
 * Extrahiert erweiterte Kontext-Informationen aus dem Memo-Source und Metadaten
 */ function extractContextInfo(source, metadata = {}) {
	const transcript = formatTranscriptWithSpeakers(source);
	// For combined memos, aggregate speaker count and duration from all recordings
	let speakerCount = 0;
	let totalDuration = 0;
	let language = source.primary_language || source.languages?.[0] || 'unbekannt';
	if (source.type === 'combined' && source.additional_recordings) {
		// Collect all unique speakers across all recordings
		const allSpeakers = new Set();
		source.additional_recordings.forEach((recording) => {
			if (recording.speakers) {
				Object.keys(recording.speakers).forEach((speakerId) => allSpeakers.add(speakerId));
			}
			// Sum up durations
			if (recording.duration) {
				totalDuration += recording.duration;
			}
		});
		speakerCount = allSpeakers.size;
		// Use the combined memo's duration if available, otherwise use sum
		totalDuration = source.duration || totalDuration;
	} else {
		// Regular memo
		speakerCount = source.speakers ? Object.keys(source.speakers).length : 0;
		totalDuration = source.duration || 0;
	}
	// Location aus Metadaten extrahieren
	const locationName = metadata.location?.address?.name || null;
	const locationAddress = metadata.location?.address?.formattedAddress || null;
	// Stats aus Metadaten extrahieren
	const wordCount = metadata.stats?.wordCount || null;
	const audioDuration = metadata.stats?.audioDuration || totalDuration;
	return {
		transcript,
		duration: audioDuration,
		speakerCount,
		wordCount,
		language,
		locationName,
		locationAddress,
		hasMultipleSpeakers: speakerCount > 1,
		hasLocation: !!(locationName || locationAddress),
	};
}
/**
 * Sendet Benutzerfrage + Transkript an Gemini und gibt die Antwort zurück
 */ async function askQuestionWithGemini(
	question,
	contextInfo,
	language = 'de',
	functionIdForLog = 'global'
) {
	const requestId = crypto.randomUUID().substring(0, 8);
	log('INFO', `[${functionIdForLog}][LLM-${requestId}] Starte Gemini-Anfrage für Frage.`);
	try {
		// Kontext-Informationen zusammenstellen
		const contextParts = [];
		// Location hinzufügen falls verfügbar
		if (contextInfo.hasLocation) {
			if (contextInfo.locationName) {
				contextParts.push(`Aufnahmeort: ${contextInfo.locationName}`);
			} else if (contextInfo.locationAddress) {
				contextParts.push(`Aufnahmeort: ${contextInfo.locationAddress}`);
			}
		}
		// Audio-Stats hinzufügen
		const statsInfo = [];
		if (contextInfo.hasMultipleSpeakers) {
			statsInfo.push(`${contextInfo.speakerCount} Sprecher`);
		}
		statsInfo.push(`${Math.round(contextInfo.duration)}s Dauer`);
		if (contextInfo.wordCount) {
			statsInfo.push(`${contextInfo.wordCount} Wörter`);
		}
		contextParts.push(`Audio-Info: ${statsInfo.join(', ')}`);
		const contextFooter =
			contextParts.length > 0
				? `\n\nZusätzliche Kontext-Informationen:\n${contextParts.join('\n')}`
				: '';
		const systemPrompt = getSystemPrompt(language);
		const userPrompt = `Frage: ${question}

Transkript:
${contextInfo.transcript}${contextFooter}

${contextInfo.hasMultipleSpeakers ? 'Du kannst bei Bedarf auf spezifische Sprecher verweisen.' : ''}`;
		// Prepend system prompt if available for the language
		const systemPrePrompt =
			ROOT_SYSTEM_PROMPTS.PRE_PROMPT[language] || ROOT_SYSTEM_PROMPTS.PRE_PROMPT['de'];
		// Für Gemini: Kombiniere System-Prompt mit User-Prompt
		const prompt = systemPrePrompt
			? `${systemPrePrompt}\n\n${systemPrompt}\n\n${userPrompt}`
			: `${systemPrompt}\n\n${userPrompt}`;
		log(
			'DEBUG',
			`[${functionIdForLog}][LLM-${requestId}] Vollständiger Prompt (Länge: ${prompt.length})`
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
									text: prompt,
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
			`[${functionIdForLog}][LLM-${requestId}] Gemini Antwort erhalten in ${duration}ms, Status: ${response.status}`
		);
		if (!response.ok) {
			const errorText = await response.text();
			log(
				'ERROR',
				`[${functionIdForLog}][LLM-${requestId}] Gemini API Fehler: ${response.status}`,
				errorText
			);
			throw new Error(`Gemini API Fehler: ${response.status} ${errorText}`);
		}
		const data = await response.json();
		const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
		log(
			'INFO',
			`[${functionIdForLog}][LLM-${requestId}] Erfolgreiche Gemini-Antwort (Länge: ${content.length}).`
		);
		log(
			'DEBUG',
			`[${functionIdForLog}][LLM-${requestId}] Antwort (erste 100 Zeichen): ${content.substring(0, 100)}...`
		);
		return content;
	} catch (error) {
		log('ERROR', `[${functionIdForLog}][LLM-${requestId}] Fehler beim Gemini-Request:`, error);
		throw error;
	}
}
/**
 * Sendet Benutzerfrage + Transkript an Azure OpenAI und gibt die Antwort zurück (Fallback)
 */ async function askQuestionWithAzure(
	question,
	contextInfo,
	language = 'de',
	functionIdForLog = 'global'
) {
	const requestId = crypto.randomUUID().substring(0, 8);
	log('INFO', `[${functionIdForLog}][LLM-${requestId}] Starte Azure OpenAI-Anfrage für Frage.`);
	try {
		// Kontext-Informationen zusammenstellen
		const contextParts = [];
		// Location hinzufügen falls verfügbar
		if (contextInfo.hasLocation) {
			if (contextInfo.locationName) {
				contextParts.push(`Aufnahmeort: ${contextInfo.locationName}`);
			} else if (contextInfo.locationAddress) {
				contextParts.push(`Aufnahmeort: ${contextInfo.locationAddress}`);
			}
		}
		// Audio-Stats hinzufügen
		const statsInfo = [];
		if (contextInfo.hasMultipleSpeakers) {
			statsInfo.push(`${contextInfo.speakerCount} Sprecher`);
		}
		statsInfo.push(`${Math.round(contextInfo.duration)}s Dauer`);
		if (contextInfo.wordCount) {
			statsInfo.push(`${contextInfo.wordCount} Wörter`);
		}
		contextParts.push(`Audio-Info: ${statsInfo.join(', ')}`);
		const contextFooter =
			contextParts.length > 0
				? `\n\nZusätzliche Kontext-Informationen:\n${contextParts.join('\n')}`
				: '';
		const systemPrompt = getSystemPrompt(language);
		const userPrompt = `Frage: ${question}

Transkript:
${contextInfo.transcript}${contextFooter}

${contextInfo.hasMultipleSpeakers ? 'Du kannst bei Bedarf auf spezifische Sprecher verweisen.' : ''}`;
		// Prepend system prompt if available for the language
		const systemPrePrompt =
			ROOT_SYSTEM_PROMPTS.PRE_PROMPT[language] || ROOT_SYSTEM_PROMPTS.PRE_PROMPT['de'];
		const combinedSystemPrompt = systemPrePrompt
			? `${systemPrePrompt}\n\n${systemPrompt}`
			: systemPrompt;
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
							role: 'system',
							content: combinedSystemPrompt,
						},
						{
							role: 'user',
							content: userPrompt,
						},
					],
					max_tokens: 8192,
					temperature: 0.7,
				}),
			}
		);
		const duration = Date.now() - startTime;
		log(
			'INFO',
			`[${functionIdForLog}][LLM-${requestId}] Azure OpenAI Antwort erhalten in ${duration}ms, Status: ${response.status}`
		);
		if (!response.ok) {
			const errorText = await response.text();
			log(
				'ERROR',
				`[${functionIdForLog}][LLM-${requestId}] Azure OpenAI API Fehler: ${response.status}`,
				errorText
			);
			throw new Error(`Azure OpenAI API Fehler: ${response.status} ${errorText}`);
		}
		const data = await response.json();
		const content = data.choices[0]?.message?.content?.trim() || '';
		log(
			'INFO',
			`[${functionIdForLog}][LLM-${requestId}] Erfolgreiche Azure OpenAI-Antwort (Länge: ${content.length}).`
		);
		return content;
	} catch (error) {
		log(
			'ERROR',
			`[${functionIdForLog}][LLM-${requestId}] Fehler beim Azure OpenAI-Request:`,
			error
		);
		throw error;
	}
}
/**
 * Hauptfunktion zur Beantwortung einer Frage mit Fallback-Logik
 */ async function answerQuestion(
	question,
	contextInfo,
	language = 'de',
	functionIdForLog = 'global'
) {
	try {
		// Zuerst mit Gemini versuchen
		return await askQuestionWithGemini(question, contextInfo, language, functionIdForLog);
	} catch (error) {
		log('WARN', `[${functionIdForLog}] Gemini fehlgeschlagen, fallback auf Azure OpenAI`, error);
		try {
			// Fallback auf Azure OpenAI
			return await askQuestionWithAzure(question, contextInfo, language, functionIdForLog);
		} catch (azureError) {
			log('ERROR', `[${functionIdForLog}] Beide LLM-Services fehlgeschlagen`, azureError);
			throw new Error('Beide LLM-Services sind nicht verfügbar');
		}
	}
}
serve(async (req) => {
	const functionId = crypto.randomUUID().substring(0, 8);
	log('INFO', `[${functionId}] Question-Memo-Funktion gestartet`);
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	};
	if (req.method === 'OPTIONS') {
		log('DEBUG', `[${functionId}] CORS Preflight-Anfrage bearbeitet`);
		return new Response(null, {
			headers: corsHeaders,
			status: 204,
		});
	}
	try {
		const requestData = await req.json();
		const { memo_id, question, user_id } = requestData;
		log(
			'INFO',
			`[${functionId}] Anfrage erhalten für memo_id: ${memo_id}, Frage: ${question?.substring(0, 50)}...`
		);
		if (!memo_id) {
			log('ERROR', `[${functionId}] Keine memo_id in der Anfrage gefunden`);
			return new Response(
				JSON.stringify({
					error: 'memo_id ist erforderlich',
				}),
				{
					headers: {
						...corsHeaders,
						'Content-Type': 'application/json',
					},
					status: 400,
				}
			);
		}
		if (!question || question.trim().length === 0) {
			log('ERROR', `[${functionId}] Keine Frage in der Anfrage gefunden`);
			return new Response(
				JSON.stringify({
					error: 'Frage ist erforderlich',
				}),
				{
					headers: {
						...corsHeaders,
						'Content-Type': 'application/json',
					},
					status: 400,
				}
			);
		}
		log('INFO', `[${functionId}] Rufe Memo mit ID ${memo_id} aus der Datenbank ab`);
		// Build query based on whether user_id is provided (from service) or not (from frontend)
		let memoQuery = memoro_sb.from('memos').select('*').eq('id', memo_id);
		if (user_id) {
			// When called from service, filter by user_id for security
			memoQuery = memoQuery.eq('user_id', user_id);
		}
		const { data: memo, error: memoError } = await memoQuery.single();
		if (memoError || !memo) {
			log('ERROR', `[${functionId}] Memo ${memo_id} nicht gefunden:`, memoError);
			return new Response(
				JSON.stringify({
					error: 'Memo nicht gefunden',
				}),
				{
					headers: {
						...corsHeaders,
						'Content-Type': 'application/json',
					},
					status: 404,
				}
			);
		}
		// Kontext-Informationen extrahieren (mit Speaker-Support und Metadaten)
		const contextInfo = extractContextInfo(memo.source || {}, memo.metadata || {});
		log(
			'INFO',
			`[${functionId}] Extrahierte Kontext-Info: ${contextInfo.speakerCount} Sprecher, ${Math.round(contextInfo.duration)}s, ${contextInfo.wordCount || 'unb.'} Wörter, ${contextInfo.hasLocation ? 'mit Ort' : 'ohne Ort'}, Transkript-Länge: ${contextInfo.transcript.length}`
		);
		if (!contextInfo.transcript) {
			log('ERROR', `[${functionId}] Kein Transkript im Memo ${memo_id} gefunden`);
			return new Response(
				JSON.stringify({
					error: 'Kein Transkript im Memo gefunden',
				}),
				{
					headers: {
						...corsHeaders,
						'Content-Type': 'application/json',
					},
					status: 400,
				}
			);
		}
		// Sprache aus Memo extrahieren
		const memoLanguage = memo.source?.primary_language || memo.source?.languages?.[0] || 'de';
		const baseLang = memoLanguage.split('-')[0].toLowerCase();
		log(
			'INFO',
			`[${functionId}] Sende Frage an LLM: "${question.substring(0, 50)}..." (${contextInfo.hasMultipleSpeakers ? 'Multi-Speaker' : 'Single-Speaker'} Kontext, Sprache: ${baseLang})`
		);
		const answer = await answerQuestion(question.trim(), contextInfo, baseLang, functionId);
		if (!answer) {
			log('ERROR', `[${functionId}] Keine Antwort vom LLM erhalten`);
			return new Response(
				JSON.stringify({
					error: 'Keine Antwort vom LLM erhalten',
				}),
				{
					headers: {
						...corsHeaders,
						'Content-Type': 'application/json',
					},
					status: 500,
				}
			);
		}
		// Get the highest sort_order for this memo
		log('INFO', `[${functionId}] Ermittle höchste sort_order für Memo ${memo_id}`);
		const { data: maxSortData, error: maxSortError } = await memoro_sb
			.from('memories')
			.select('sort_order')
			.eq('memo_id', memo_id)
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
		log('INFO', `[${functionId}] Nächste sort_order: ${nextSortOrder}`);
		log('INFO', `[${functionId}] Erstelle neues Memory für Memo ${memo_id} mit der Antwort`);
		const { data: newMemory, error: newMemoryError } = await memoro_sb
			.from('memories')
			.insert({
				memo_id: memo_id,
				title: `Frage: ${question.length > 50 ? question.substring(0, 50) + '...' : question}`,
				content: answer,
				media: null,
				sort_order: nextSortOrder,
				metadata: {
					type: 'question',
					question: question.trim(),
					created_by: 'question_memo_function',
				},
			})
			.select()
			.single();
		if (newMemoryError) {
			log('ERROR', `[${functionId}] Fehler beim Erstellen des Memories:`, newMemoryError);
			return new Response(
				JSON.stringify({
					error: newMemoryError.message,
				}),
				{
					headers: {
						...corsHeaders,
						'Content-Type': 'application/json',
					},
					status: 500,
				}
			);
		}
		log('INFO', `[${functionId}] Memory erfolgreich erstellt mit ID ${newMemory.id}`);
		log('INFO', `[${functionId}] Question-Memo-Verarbeitung erfolgreich abgeschlossen`);
		return new Response(
			JSON.stringify({
				success: true,
				memory_id: newMemory.id,
				answer: answer,
				question: question.trim(),
			}),
			{
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json',
				},
				status: 200,
			}
		);
	} catch (error) {
		log('ERROR', `[${functionId}] Unerwarteter Fehler bei der Question-Memo-Verarbeitung:`, error);
		const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
		return new Response(
			JSON.stringify({
				error: `Unerwarteter Fehler: ${errorMessage}`,
			}),
			{
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json',
				},
				status: 500,
			}
		);
	}
});
