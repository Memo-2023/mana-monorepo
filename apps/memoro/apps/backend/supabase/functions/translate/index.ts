// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { serve } from 'https://deno.land/std@0.215.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getTranscriptText, getRecordingTranscript } from '../_shared/transcript-utils.ts';
// Inline error handling utilities to avoid deployment issues
// Atomic status update utilities using RPC to prevent race conditions
async function setMemoErrorStatus(supabaseClient, memoId, processName, error) {
	if (!memoId) return;
	const errorMessage = error instanceof Error ? error.message : String(error);
	const timestamp = new Date().toISOString();
	try {
		await supabaseClient.rpc('set_memo_process_error', {
			p_memo_id: memoId,
			p_process_name: processName,
			p_timestamp: timestamp,
			p_reason: errorMessage,
			p_details: null,
		});
	} catch (dbError) {
		console.error(`Error setting error status for memo ${memoId}:`, dbError);
	}
}
async function setMemoProcessingStatus(supabaseClient, memoId, processName) {
	const timestamp = new Date().toISOString();
	try {
		await supabaseClient.rpc('set_memo_process_status', {
			p_memo_id: memoId,
			p_process_name: processName,
			p_status: 'processing',
			p_timestamp: timestamp,
		});
	} catch (dbError) {
		console.error(`Error setting processing status for memo ${memoId}:`, dbError);
	}
}
async function setMemoCompletedStatus(supabaseClient, memoId, processName, details) {
	const timestamp = new Date().toISOString();
	try {
		await supabaseClient.rpc('set_memo_process_status_with_details', {
			p_memo_id: memoId,
			p_process_name: processName,
			p_status: 'completed',
			p_timestamp: timestamp,
			p_details: details,
		});
	} catch (dbError) {
		console.error(`Error setting completed status for memo ${memoId}:`, dbError);
	}
}
function createErrorResponse(error, status = 500, corsHeaders = {}) {
	const errorMessage = error instanceof Error ? error.message : String(error);
	return new Response(
		JSON.stringify({
			error: errorMessage,
			timestamp: new Date().toISOString(),
		}),
		{
			headers: {
				...corsHeaders,
				'Content-Type': 'application/json',
			},
			status,
		}
	);
}
/**
 * Translate Edge Function
 *
 * Diese Funktion übersetzt alle Felder eines Memo-Eintrags in eine Zielsprache.
 * Übersetzt werden: transcript, headline, intro und alle memory entries (blueprints).
 * Die übersetzten Inhalte ersetzen die ursprünglichen Inhalte im selben Memo.
 *
 * @version 1.0.0
 * @date 2025-05-26
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
const GEMINI_API_KEY = Deno.env.get('TRANSLATE_MEMO_GEMINI_MEMORO') || '';
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
function log(level, message, data) {
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
// ─── Sprach-Mapping ──────────────────────────────────────────────
const LANGUAGE_NAMES = {
	de: 'German',
	en: 'English',
	es: 'Spanish',
	fr: 'French',
	it: 'Italian',
	pt: 'Portuguese',
	nl: 'Dutch',
	pl: 'Polish',
	ru: 'Russian',
	ja: 'Japanese',
	ko: 'Korean',
	zh: 'Chinese',
	ar: 'Arabic',
	hi: 'Hindi',
	tr: 'Turkish',
	sv: 'Swedish',
	da: 'Danish',
	no: 'Norwegian',
	fi: 'Finnish',
	cs: 'Czech',
	sk: 'Slovak',
	hu: 'Hungarian',
	ro: 'Romanian',
	bg: 'Bulgarian',
	hr: 'Croatian',
	sr: 'Serbian',
	sl: 'Slovenian',
	et: 'Estonian',
	lv: 'Latvian',
	lt: 'Lithuanian',
	mt: 'Maltese',
	ga: 'Irish',
	el: 'Greek',
	uk: 'Ukrainian',
	bn: 'Bengali',
	ur: 'Urdu',
	fa: 'Persian',
	vi: 'Vietnamese',
	id: 'Indonesian',
};
function getLanguageName(languageCode) {
	return LANGUAGE_NAMES[languageCode.toLowerCase()] || languageCode;
}
// ─── Übersetzungsfunktionen ──────────────────────────────────────────────
/**
 * Übersetzt Text mit Google Gemini Flash
 */ async function translateWithGemini(text, targetLanguage, functionIdForLog = 'global') {
	const requestId = crypto.randomUUID().substring(0, 8);
	log('INFO', `[${functionIdForLog}][Gemini-${requestId}] Starte Übersetzung.`);
	try {
		const targetLanguageName = getLanguageName(targetLanguage);
		const prompt = `Translate the following text to ${targetLanguageName}. Keep the original formatting, structure, and meaning. Only return the translated text without any explanations or additions:\n\n${text}`;
		log(
			'DEBUG',
			`[${functionIdForLog}][Gemini-${requestId}] Prompt erstellt für Zielsprache: ${targetLanguageName}`
		);
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
						temperature: 0.3,
						maxOutputTokens: Math.min(8192, Math.max(512, text.length * 2)),
					},
				}),
			}
		);
		if (!response.ok) {
			const errorText = await response.text();
			log(
				'ERROR',
				`[${functionIdForLog}][Gemini-${requestId}] Gemini API Fehler: ${response.status}`,
				errorText
			);
			throw new Error(`Gemini API Fehler: ${response.status} ${errorText}`);
		}
		const data = await response.json();
		const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
		if (!content) {
			log('ERROR', `[${functionIdForLog}][Gemini-${requestId}] Leere Antwort von Gemini`);
			return null;
		}
		log(
			'INFO',
			`[${functionIdForLog}][Gemini-${requestId}] Übersetzung erfolgreich (${content.length} Zeichen)`
		);
		return content;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
		log(
			'ERROR',
			`[${functionIdForLog}][Gemini-${requestId}] Fehler bei der Gemini-Übersetzung:`,
			errorMessage
		);
		return null;
	}
}
/**
 * Übersetzt Text mit Azure OpenAI
 */ async function translateWithAzure(text, targetLanguage, functionIdForLog = 'global') {
	const requestId = crypto.randomUUID().substring(0, 8);
	log('INFO', `[${functionIdForLog}][Azure-${requestId}] Starte Azure OpenAI Übersetzung.`);
	try {
		const targetLanguageName = getLanguageName(targetLanguage);
		const prompt = `Translate the following text to ${targetLanguageName}. Keep the original formatting, structure, and meaning. Only return the translated text without any explanations or additions:\n\n${text}`;
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
							content:
								'You are a professional translator. Translate the given text accurately while preserving formatting and meaning.',
						},
						{
							role: 'user',
							content: prompt,
						},
					],
					max_tokens: Math.min(8192, Math.max(512, text.length * 2)),
					temperature: 0.3,
				}),
			}
		);
		if (!response.ok) {
			const errorText = await response.text();
			log(
				'ERROR',
				`[${functionIdForLog}][Azure-${requestId}] Azure OpenAI API Fehler: ${response.status}`,
				errorText
			);
			throw new Error(`Azure OpenAI API Fehler: ${response.status} ${errorText}`);
		}
		const data = await response.json();
		const content = data.choices[0]?.message?.content?.trim() || text; // Fallback auf Originaltext
		log(
			'INFO',
			`[${functionIdForLog}][Azure-${requestId}] Azure-Übersetzung erfolgreich (${content.length} Zeichen)`
		);
		return content;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
		log(
			'ERROR',
			`[${functionIdForLog}][Azure-${requestId}] Fehler bei der Azure-Übersetzung:`,
			errorMessage
		);
		return text; // Fallback auf Originaltext
	}
}
/**
 * Hauptfunktion zur Übersetzung - versucht zuerst Gemini, dann Azure
 */ async function translateText(text, targetLanguage, functionIdForLog = 'global') {
	if (!text || text.trim().length === 0) {
		return text;
	}
	try {
		// Zuerst mit Gemini versuchen
		const geminiResult = await translateWithGemini(text, targetLanguage, functionIdForLog);
		if (geminiResult) {
			log('DEBUG', `[${functionIdForLog}] Übersetzung mit Gemini Flash erfolgreich`);
			return geminiResult;
		}
		// Fallback auf Azure OpenAI
		log('DEBUG', `[${functionIdForLog}] Fallback auf Azure OpenAI für Übersetzung`);
		return await translateWithAzure(text, targetLanguage, functionIdForLog);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
		log('ERROR', `[${functionIdForLog}] Fehler bei der Übersetzung:`, errorMessage);
		return text; // Fallback auf Originaltext
	}
}
// ─── Hauptfunktion ──────────────────────────────────────────────
serve(async (req) => {
	const functionId = crypto.randomUUID().substring(0, 8);
	log('INFO', `[${functionId}] Translate-Funktion gestartet`);
	// CORS-Header für Entwicklung
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	};
	// OPTIONS-Anfrage für CORS
	if (req.method === 'OPTIONS') {
		log('DEBUG', `[${functionId}] CORS Preflight-Anfrage bearbeitet`);
		return new Response(null, {
			headers: corsHeaders,
			status: 204,
		});
	}
	let memo_id_to_update = null;
	try {
		// Anfrage-Daten extrahieren
		const requestData = await req.json();
		const { memo_id, target_language } = requestData;
		memo_id_to_update = memo_id;
		log(
			'INFO',
			`[${functionId}] Anfrage erhalten für memo_id: ${memo_id}, Zielsprache: ${target_language}`
		);
		if (!memo_id) {
			return createErrorResponse('memo_id ist erforderlich', 400, corsHeaders);
		}
		if (!target_language) {
			return createErrorResponse('target_language ist erforderlich', 400, corsHeaders);
		}
		// Set processing status
		await setMemoProcessingStatus(memoro_sb, memo_id, 'translate');
		// Memo aus der Datenbank abrufen
		const { data: memo, error: memoError } = await memoro_sb
			.from('memos')
			.select('*')
			.eq('id', memo_id)
			.single();
		if (memoError || !memo) {
			log('ERROR', `[${functionId}] Fehler beim Abrufen des Memos:`, memoError);
			await setMemoErrorStatus(
				memoro_sb,
				memo_id,
				'translate',
				`Memo nicht gefunden: ${memoError?.message || 'Unbekannter Fehler'}`
			);
			return createErrorResponse(
				`Memo nicht gefunden: ${memoError?.message || 'Unbekannter Fehler'}`,
				404,
				corsHeaders
			);
		}
		log('INFO', `[${functionId}] Memo erfolgreich abgerufen, beginne mit Übersetzung`);
		// 1. Transcript übersetzen (from utterances or legacy fields)
		let translatedTranscript = '';
		let transcript = getTranscriptText(memo);
		// Handle combined memos with additional_recordings structure
		if (!transcript && memo.source?.type === 'combined' && memo.source?.additional_recordings) {
			transcript = memo.source.additional_recordings
				.map((recording) => getRecordingTranscript(recording))
				.filter(Boolean)
				.join('\n\n');
		}
		if (transcript) {
			log('INFO', `[${functionId}] Übersetze Transcript (${transcript.length} Zeichen)`);
			translatedTranscript = await translateText(transcript, target_language, functionId);
		}
		// 2. Headline übersetzen
		let translatedHeadline = '';
		if (memo.title) {
			log('INFO', `[${functionId}] Übersetze Headline: "${memo.title}"`);
			translatedHeadline = await translateText(memo.title, target_language, functionId);
		}
		// 3. Intro übersetzen
		let translatedIntro = '';
		if (memo.intro) {
			log('INFO', `[${functionId}] Übersetze Intro (${memo.intro.length} Zeichen)`);
			translatedIntro = await translateText(memo.intro, target_language, functionId);
		}
		// 4. Neue übersetztes Memo erstellen
		log(
			'INFO',
			`[${functionId}] Erstelle neues übersetztes Memo basierend auf Original ${memo_id}`
		);
		// Bereite source für das neue Memo vor
		let newSource = {
			...memo.source,
		};
		if (translatedTranscript) {
			if (memo.source?.content) {
				newSource.content = translatedTranscript;
			} else if (memo.source?.transcription) {
				newSource.transcription = translatedTranscript;
			} else if (memo.source?.transcript) {
				newSource.transcript = translatedTranscript;
			} else if (memo.source?.type === 'combined' && memo.source?.additional_recordings) {
				// Für combined memos, übersetze jeden transcript in den additional_recordings
				const translatedRecordings = await Promise.all(
					memo.source.additional_recordings.map(async (recording) => {
						if (recording.transcript) {
							const translated = await translateText(
								recording.transcript,
								target_language,
								functionId
							);
							return {
								...recording,
								transcript: translated,
							};
						}
						return recording;
					})
				);
				newSource.additional_recordings = translatedRecordings;
			}
		}
		// Bereite Metadata für das neue Memo vor (mit Referenz zum Original)
		const newMetadata = {
			...memo.metadata,
			translation: {
				source_memo_id: memo_id,
				source_language:
					memo.source?.primary_language || memo.metadata?.primary_language || 'unknown',
				target_language: target_language,
				translated_at: new Date().toISOString(),
				translation_method: 'ai',
				translator_model: GEMINI_MODEL,
			},
		};
		// Erstelle das neue übersetztes Memo
		const { data: newMemo, error: createError } = await memoro_sb
			.from('memos')
			.insert({
				title: translatedHeadline || memo.title,
				intro: translatedIntro || memo.intro,
				user_id: memo.user_id,
				space_id: memo.space_id,
				source: newSource,
				metadata: newMetadata,
				is_pinned: false,
				is_archived: false,
				is_public: memo.is_public,
			})
			.select()
			.single();
		if (createError) {
			log('ERROR', `[${functionId}] Fehler beim Erstellen des übersetzten Memos:`, createError);
			await setMemoErrorStatus(memoro_sb, memo_id, 'translate', createError);
			throw createError;
		}
		log('INFO', `[${functionId}] Neues übersetztes Memo erstellt mit ID: ${newMemo.id}`);
		const newMemoId = newMemo.id;
		// 4.1. Aktualisiere das Original-Memo mit Referenz zur Übersetzung
		try {
			// Lade aktuelles Original-Memo für Broadcast
			const { data: originalMemo, error: fetchError } = await memoro_sb
				.from('memos')
				.select('*')
				.eq('id', memo_id)
				.single();
			if (!fetchError && originalMemo) {
				const currentMetadata = originalMemo.metadata || {};
				const existingTranslations = currentMetadata.translations || [];
				// Füge neue Übersetzung zur Liste hinzu (verhindere Duplikate)
				const updatedTranslations = existingTranslations.filter(
					(t) => t.target_language !== target_language
				);
				updatedTranslations.push({
					memo_id: newMemoId,
					target_language: target_language,
					translated_at: new Date().toISOString(),
					translator_model: GEMINI_MODEL,
				});
				const updatedMetadata = {
					...currentMetadata,
					translations: updatedTranslations,
				};
				const { error: updateError } = await memoro_sb
					.from('memos')
					.update({
						metadata: updatedMetadata,
					})
					.eq('id', memo_id);
				if (updateError) {
					log(
						'WARN',
						`[${functionId}] Fehler beim Aktualisieren der Original-Memo-Metadaten:`,
						updateError
					);
				} else {
					log(
						'INFO',
						`[${functionId}] Original-Memo erfolgreich mit Übersetzungsreferenz aktualisiert`
					);

					// Send broadcast update to notify clients about the translation reference
					try {
						const channel = memoro_sb.channel(`memo-updates-${memo_id}`);

						channel.subscribe(async (status) => {
							if (status === 'SUBSCRIBED') {
								await channel.send({
									type: 'broadcast',
									event: 'memo-updated',
									payload: {
										id: memo_id,
										old: originalMemo,
										new: {
											...originalMemo,
											metadata: updatedMetadata,
										},
										user_id: memo.user_id,
									},
								});
								log(
									'INFO',
									`[${functionId}] Broadcast sent for memo ${memo_id} translation reference update`
								);
								// Clean up the channel after sending
								memoro_sb.removeChannel(channel);
							}
						});
					} catch (broadcastError) {
						log('WARN', `[${functionId}] Failed to send broadcast update:`, broadcastError);
						// Don't fail the function if broadcast fails
					}
				}
			}
		} catch (referenceError) {
			log('WARN', `[${functionId}] Fehler beim Erstellen der Rückreferenz:`, referenceError);
			// Nicht kritisch - Übersetzung ist bereits erstellt
		}
		// 5. Alle Memories (Blueprint-Antworten) für das neue Memo erstellen
		const { data: memories, error: memoriesError } = await memoro_sb
			.from('memories')
			.select('*')
			.eq('memo_id', memo_id);
		let translatedMemoriesCount = 0;
		if (memoriesError) {
			log('WARN', `[${functionId}] Fehler beim Abrufen der Memories:`, memoriesError);
		} else if (memories && memories.length > 0) {
			log(
				'INFO',
				`[${functionId}] Erstelle ${memories.length} übersetzte Memory-Einträge für neues Memo`
			);
			for (const memory of memories) {
				if (memory.content) {
					const translatedContent = await translateText(
						memory.content,
						target_language,
						functionId
					);
					const translatedTitle = memory.title
						? await translateText(memory.title, target_language, functionId)
						: memory.title;
					// Erstelle neues Memory für das übersetzte Memo
					const { error: memoryCreateError } = await memoro_sb.from('memories').insert({
						memo_id: newMemoId,
						title: translatedTitle,
						content: translatedContent,
						media: memory.media,
						sort_order: memory.sort_order,
						metadata: {
							...memory.metadata,
							translated_from_memory_id: memory.id,
							translation: {
								target_language: target_language,
								translated_at: new Date().toISOString(),
							},
						},
					});
					if (memoryCreateError) {
						log(
							'WARN',
							`[${functionId}] Fehler beim Erstellen des übersetzten Memory:`,
							memoryCreateError
						);
					} else {
						log(
							'DEBUG',
							`[${functionId}] Übersetztes Memory erfolgreich erstellt für Original Memory ${memory.id}`
						);
						translatedMemoriesCount++;
					}
				}
			}
		}
		// Set completed status
		await setMemoCompletedStatus(memoro_sb, memo_id, 'translate', {
			target_language,
			new_memo_id: newMemoId,
			translated_fields: {
				transcript: !!translatedTranscript,
				headline: !!translatedHeadline,
				intro: !!translatedIntro,
				memories_count: translatedMemoriesCount,
			},
		});
		log(
			'INFO',
			`[${functionId}] Übersetzung erfolgreich abgeschlossen für Memo ${memo_id}, neues Memo erstellt: ${newMemoId}`
		);
		// Erfolgreiche Antwort
		return new Response(
			JSON.stringify({
				success: true,
				original_memo_id: memo_id,
				new_memo_id: newMemoId,
				translated_fields: {
					transcript: !!translatedTranscript,
					headline: !!translatedHeadline,
					intro: !!translatedIntro,
					memories_count: translatedMemoriesCount,
				},
				target_language,
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
		log('ERROR', `[${functionId}] Unerwarteter Fehler in der Translate-Funktion:`, error);
		// Set error status in database
		const errorToLog = error instanceof Error ? error : new Error(String(error));
		await setMemoErrorStatus(memoro_sb, memo_id_to_update, 'translate', errorToLog);
		// Return error response
		return createErrorResponse(`Unerwarteter Fehler: ${errorToLog.message}`, 500, corsHeaders);
	}
});
