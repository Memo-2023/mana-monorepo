// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { serve } from 'https://deno.land/std@0.215.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SYSTEM_PROMPTS } from './constants.ts';
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
// Umgebungsvariablen
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
if (!SUPABASE_URL) {
	throw new Error('SUPABASE_URL not configured');
}
const SERVICE_KEY = Deno.env.get('C_SUPABASE_SECRET_KEY');
if (!SERVICE_KEY) {
	throw new Error('C_SUPABASE_SECRET_KEY not configured');
}
// Google Gemini Konfiguration
const GEMINI_API_KEY = Deno.env.get('CREATE_HEADLINE_GEMINI_MEMORO') || '';
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
// Supabase-Client
const memoro_sb = createClient(SUPABASE_URL, SERVICE_KEY);
// ===== PROMPT HELPER FUNCTIONS =====
/**
 * Hilfsfunktion zum Abrufen des richtigen Prompts basierend auf der Sprache
 *
 * @param type - Der Typ des Prompts (z.B. 'headline')
 * @param language - Der Sprachcode (z.B. 'de', 'en')
 * @returns Der Prompt in der angegebenen Sprache oder der deutsche Prompt als Fallback
 */ function getSystemPrompt(type, language) {
	// Extrahiere den Basis-Sprachcode (z.B. 'de-DE' -> 'de')
	const baseLanguage = language.split('-')[0].toLowerCase();
	// Prüfe, ob der Prompt-Typ existiert
	if (!SYSTEM_PROMPTS[type]) {
		console.warn(`Prompt-Typ '${type}' nicht gefunden. Verwende 'headline' als Fallback.`);
		return SYSTEM_PROMPTS.headline.de; // Fallback auf deutschen Headline-Prompt
	}
	// Prüfe, ob die Sprache existiert
	if (!SYSTEM_PROMPTS[type][baseLanguage]) {
		console.warn(
			`Sprache '${baseLanguage}' für Prompt-Typ '${type}' nicht gefunden. Verwende 'de' als Fallback.`
		);
		return SYSTEM_PROMPTS[type].de; // Fallback auf Deutsch
	}
	return SYSTEM_PROMPTS[type][baseLanguage];
}
// ===== PROMPT FUNCTIONS =====
/**
 * Generiert einen Headline-Prompt für die angegebene Sprache
 *
 * @param language - Der Sprachcode (z.B. 'de', 'en')
 * @param text - Der zu analysierende Text
 * @returns Der vollständige Prompt für die Headline-Generierung
 */ function getHeadlinePrompt(language, text) {
	// Hole den System-Prompt für die angegebene Sprache
	const systemPrompt = getSystemPrompt('headline', language);
	// Kombiniere den System-Prompt mit dem Text
	return `${systemPrompt}\n\n${text}`;
}
/**
 * Extrahiert die Headline und das Intro aus der Antwort des LLM
 *
 * @param content - Die Antwort des LLM
 * @returns Ein Objekt mit Headline und Intro oder Standardwerte bei Fehlern
 */ function extractHeadlineAndIntro(content) {
	// Extrahiere Headline und Intro aus der Antwort
	const headlineMatch = content.match(/HEADLINE:\s*(.+?)(?=\nINTRO:|$)/s);
	const introMatch = content.match(/INTRO:\s*(.+?)$/s);
	// Fallback-Werte, falls keine Übereinstimmung gefunden wurde
	const headline = headlineMatch?.[1]?.trim() || 'Neue Aufnahme';
	const intro = introMatch?.[1]?.trim() || 'Keine Zusammenfassung verfügbar.';
	return {
		headline,
		intro,
	};
}
// ===== HEADLINE GENERATION FUNCTIONS =====
/**
 * Generiert eine Überschrift und ein Intro für einen Text mithilfe von Google Gemini Flash
 *
 * @param text - Der Text, für den eine Überschrift und ein Intro generiert werden soll
 * @returns Ein Objekt mit der generierten Überschrift und dem Intro oder null bei Fehlern
 */ async function generateHeadlineWithGemini(text, language = 'de') {
	try {
		// Hole den passenden Prompt basierend auf der erkannten Sprache
		const prompt = getHeadlinePrompt(language, text);
		// Log prompt for debugging
		console.log('Gemini prompt:', {
			language,
			textLength: text.length,
			promptLength: prompt.length,
			promptPreview: prompt.substring(0, 300) + (prompt.length > 300 ? '...' : ''),
		});
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
						maxOutputTokens: 300,
					},
				}),
			}
		);
		if (!response.ok) {
			const errorText = await response.text();
			console.error('Gemini API Fehler:', errorText);
			throw new Error(`Gemini API Fehler: ${response.status} ${errorText}`);
		}
		const data = await response.json();
		const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
		// Log AI response for debugging
		console.log('Gemini API Response:', {
			status: response.status,
			contentLength: content.length,
			content: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
			fullResponse: JSON.stringify(data, null, 2),
		});
		// Extrahiere Headline und Intro aus der Antwort
		const result = extractHeadlineAndIntro(content);
		if (!result.headline || !result.intro) {
			console.error('Gemini-Antwort hat nicht das erwartete Format:', content);
			return null;
		}
		console.log('Gemini parsed result:', result);
		return result;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
		console.error('Fehler bei der Gemini Headline/Intro-Generierung:', errorMessage);
		return null;
	}
}
/**
 * Generiert eine Überschrift und ein Intro für einen Text mithilfe von Azure OpenAI
 *
 * @param text - Der Text, für den eine Überschrift und ein Intro generiert werden soll
 * @returns Ein Objekt mit der generierten Überschrift und dem Intro oder Fallback-Werte bei Fehlern
 */ async function generateHeadlineWithAzure(text, language = 'de') {
	try {
		// Hole den passenden Prompt basierend auf der erkannten Sprache
		const prompt = getHeadlinePrompt(language, text);
		// Log prompt for debugging
		console.log('Azure OpenAI prompt:', {
			language,
			textLength: text.length,
			promptLength: prompt.length,
			promptPreview: prompt.substring(0, 300) + (prompt.length > 300 ? '...' : ''),
		});
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
							content: prompt,
						},
					],
					max_tokens: 300,
					temperature: 0.7,
				}),
			}
		);
		if (!response.ok) {
			const errorText = await response.text();
			console.error('Azure OpenAI API Fehler:', errorText);
			throw new Error(`Azure OpenAI API Fehler: ${response.status} ${errorText}`);
		}
		const data = await response.json();
		const content = data.choices[0]?.message?.content?.trim() || '';
		// Log AI response for debugging
		console.log('Azure OpenAI API Response:', {
			status: response.status,
			contentLength: content.length,
			content: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
			fullResponse: JSON.stringify(data, null, 2),
		});
		// Extrahiere Headline und Intro aus der Antwort
		const result = extractHeadlineAndIntro(content);
		console.log('Azure OpenAI parsed result:', result);
		return result;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
		console.error('Fehler bei der Azure Headline/Intro-Generierung:', errorMessage);
		return {
			headline: 'Neue Aufnahme',
			intro: 'Keine Zusammenfassung verfügbar.', // Fallback-Intro
		};
	}
}
/**
 * Hauptfunktion zur Generierung von Headline und Intro
 * Versucht zuerst Gemini Flash und fällt bei Fehler auf Azure OpenAI zurück
 *
 * @param text - Der Text, für den eine Überschrift und ein Intro generiert werden soll
 * @returns Ein Objekt mit der generierten Überschrift und dem Intro
 */ async function generateHeadlineAndIntro(text, language = 'de') {
	try {
		// Zuerst mit Gemini versuchen
		const geminiResult = await generateHeadlineWithGemini(text, language);
		// Wenn Gemini erfolgreich war, Ergebnis zurückgeben
		if (geminiResult) {
			console.debug('Headline mit Gemini Flash generiert');
			return geminiResult;
		}
		// Sonst auf Azure OpenAI zurückfallen
		console.debug('Fallback auf Azure OpenAI für Headline-Generierung');
		return await generateHeadlineWithAzure(text, language);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
		console.error('Fehler bei der Headline/Intro-Generierung:', errorMessage);
		return {
			headline: 'Neue Aufnahme',
			intro: 'Keine Zusammenfassung verfügbar.', // Fallback-Intro
		};
	}
}
// Hauptfunktion - ohne JWT-Verifizierung für Datenbank-Trigger
serve(async (req) => {
	// CORS-Header für Entwicklung
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	};
	// OPTIONS-Anfrage für CORS
	if (req.method === 'OPTIONS') {
		return new Response(null, {
			headers: corsHeaders,
			status: 204,
		});
	}
	let memo_id_to_update = null;
	try {
		// Anfrage-Daten extrahieren
		const requestData = await req.json();
		const { memo_id } = requestData;
		memo_id_to_update = memo_id;
		if (!memo_id) {
			return createErrorResponse('memo_id ist erforderlich', 400, corsHeaders);
		}
		// Set processing status
		await setMemoProcessingStatus(memoro_sb, memo_id, 'headline_and_intro');
		// Memo aus der Datenbank abrufen
		const { data: memo, error: memoError } = await memoro_sb
			.from('memos')
			.select('*')
			.eq('id', memo_id)
			.single();
		if (memoError || !memo) {
			console.error('Fehler beim Abrufen des Memos:', memoError);
			await setMemoErrorStatus(
				memoro_sb,
				memo_id,
				'headline_and_intro',
				`Memo nicht gefunden: ${memoError?.message || 'Unbekannter Fehler'}`
			);
			return createErrorResponse(
				`Memo nicht gefunden: ${memoError?.message || 'Unbekannter Fehler'}`,
				404,
				corsHeaders
			);
		}
		let transcript = '';
		// Generate transcript from utterances if available
		if (
			memo.source?.utterances &&
			Array.isArray(memo.source.utterances) &&
			memo.source.utterances.length > 0
		) {
			// Sort utterances by offset if available and concatenate texts
			const sortedUtterances = [...memo.source.utterances].sort((a, b) => {
				const offsetA = a.offset || 0;
				const offsetB = b.offset || 0;
				return offsetA - offsetB;
			});
			transcript = sortedUtterances
				.map((utterance) => utterance.text)
				.filter((text) => text && text.trim() !== '')
				.join(' ');
		} else if (memo.transcript) {
			transcript = memo.transcript;
		} else if (memo.source?.transcript) {
			transcript = memo.source.transcript;
		} else if (memo.source?.content) {
			transcript = memo.source.content;
		} else if (memo.source?.type === 'combined' && memo.source?.additional_recordings) {
			transcript = memo.source.additional_recordings
				.map((recording) => {
					// Try to get transcript from utterances first
					if (recording.utterances && Array.isArray(recording.utterances)) {
						const sortedUtterances = [...recording.utterances].sort((a, b) => {
							const offsetA = a.offset || 0;
							const offsetB = b.offset || 0;
							return offsetA - offsetB;
						});
						return sortedUtterances
							.map((utterance) => utterance.text)
							.filter((text) => text && text.trim() !== '')
							.join(' ');
					}
					// Fallback to transcript field
					return recording.transcript || '';
				})
				.filter(Boolean)
				.join('\n\n');
		}
		// Ermittle die Sprache des Transkripts
		let language = 'de'; // Standard: Deutsch
		if (memo.source?.primary_language) {
			language = memo.source.primary_language;
			console.debug(`Primäre Sprache aus Memo-Quelle erkannt: ${language}`);
		} else if (
			memo.source?.languages &&
			Array.isArray(memo.source.languages) &&
			memo.source.languages.length > 0
		) {
			language = memo.source.languages[0];
			console.debug(`Sprache aus Memo-Sprachen-Array erkannt: ${language}`);
		} else if (memo.metadata?.primary_language) {
			language = memo.metadata.primary_language;
			console.debug(`Primäre Sprache aus Memo-Metadaten erkannt: ${language}`);
		}
		console.log(`Verwende Sprache für Headline-Generierung: ${language}`);
		if (!transcript) {
			console.error('Kein Transkript im Memo gefunden');
			await setMemoErrorStatus(
				memoro_sb,
				memo_id,
				'headline_and_intro',
				'Kein Transkript im Memo gefunden'
			);
			return createErrorResponse('Kein Transkript im Memo gefunden', 400, corsHeaders);
		}
		// Headline und Intro generieren
		const { headline, intro } = await generateHeadlineAndIntro(transcript, language);
		// First get the current memo state for the 'old' value in the broadcast
		const oldMemo = {
			...memo,
		};
		// Update memo normally
		const { error: updateError } = await memoro_sb
			.from('memos')
			.update({
				title: headline,
				intro: intro,
				updated_at: new Date().toISOString(),
			})
			.eq('id', memo_id);
		if (updateError) {
			console.error('Fehler beim Aktualisieren des Memos:', updateError);
			await setMemoErrorStatus(memoro_sb, memo_id, 'headline_and_intro', updateError);
			throw updateError;
		}
		// Log the update for debugging
		console.log('Headline generated and memo updated:', {
			memo_id,
			old_title: oldMemo.title,
			new_title: headline,
			user_id: memo.user_id,
		});
		// Send broadcast update to notify clients about the title change
		try {
			const channel = memoro_sb.channel(`memo-updates-${memo_id}`);
			// Subscribe first to ensure the channel is ready
			channel.subscribe(async (status) => {
				if (status === 'SUBSCRIBED') {
					await channel.send({
						type: 'broadcast',
						event: 'memo-updated',
						payload: {
							type: 'memo-updated',
							memoId: memo_id,
							changes: {
								title: headline,
								intro: intro,
								updated_at: new Date().toISOString(),
							},
							source: 'headline-edge-function',
						},
					});
					console.log(`Broadcast sent for memo ${memo_id} title update`);
					// Clean up the channel after sending
					memoro_sb.removeChannel(channel);
				}
			});
		} catch (broadcastError) {
			console.warn('Failed to send broadcast update:', broadcastError);
			// Don't fail the function if broadcast fails
		}
		// Set completed status
		await setMemoCompletedStatus(memoro_sb, memo_id, 'headline_and_intro', {
			headline,
			intro,
			language,
		});
		// Erfolgreiche Antwort
		return new Response(
			JSON.stringify({
				success: true,
				headline: headline,
				intro: intro,
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
		console.error('Unerwarteter Fehler in der Headline-Funktion:', error);
		// Set error status in database
		const errorToLog = error instanceof Error ? error : new Error(String(error));
		await setMemoErrorStatus(memoro_sb, memo_id_to_update, 'headline_and_intro', errorToLog);
		// Return error response
		return createErrorResponse(`Unerwarteter Fehler: ${errorToLog.message}`, 500, corsHeaders);
	}
});
