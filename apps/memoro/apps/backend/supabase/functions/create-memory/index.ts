// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { serve } from 'https://deno.land/std@0.215.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSystemPrompt } from './constants.ts';
import { getTranscriptText } from '../_shared/transcript-utils.ts';
import { ROOT_SYSTEM_PROMPTS } from '../_shared/system-prompt.ts';
/**
 * Create Memory Edge Function
 *
 * Diese Funktion erstellt eine neue Memory für ein Memo mit einem spezifischen Prompt.
 * Sie lädt das Memo, den Prompt und verwendet Azure OpenAI für die Verarbeitung.
 *
 * @version 1.0.0
 * @date 2025-05-27
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
const GEMINI_API_KEY = Deno.env.get('CREATE_MEMORY_GEMINI_MEMORO') || '';
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
// ─── Error Handler Functions ──────────────────────────────────────────────
/**
 * Erstellt eine standardisierte Fehlerantwort für Edge Functions
 */ function createErrorResponse(error, status = 500, corsHeaders = {}) {
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
 * Sendet Prompt an Gemini Flash und gibt die Antwort zurück
 */ async function runPromptWithGemini(prompt, transcript, functionIdForLog = 'global') {
	const requestId = crypto.randomUUID().substring(0, 8);
	log('INFO', `[${functionIdForLog}][GEMINI-${requestId}] Starte Gemini-Anfrage.`);
	try {
		let fullPrompt;
		if (prompt.includes('{transcript}')) {
			fullPrompt = prompt.replace('{transcript}', transcript);
			log('DEBUG', `[${functionIdForLog}][GEMINI-${requestId}] Platzhalter im Prompt ersetzt.`);
		} else {
			fullPrompt = `${prompt}\n\nText: ${transcript}`;
			log(
				'DEBUG',
				`[${functionIdForLog}][GEMINI-${requestId}] Kein Platzhalter, Transkript am Ende angehängt.`
			);
		}
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
			`[${functionIdForLog}][GEMINI-${requestId}] Gemini Antwort erhalten in ${duration}ms, Status: ${response.status}`
		);
		if (!response.ok) {
			const errorText = await response.text();
			log(
				'ERROR',
				`[${functionIdForLog}][GEMINI-${requestId}] Gemini API Fehler: ${response.status}`,
				errorText
			);
			throw new Error(`Gemini API Fehler: ${response.status} ${errorText}`);
		}
		const data = await response.json();
		const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
		log(
			'INFO',
			`[${functionIdForLog}][GEMINI-${requestId}] Erfolgreiche Gemini-Antwort (Länge: ${content.length}).`
		);
		return content;
	} catch (error) {
		log('ERROR', `[${functionIdForLog}][GEMINI-${requestId}] Fehler beim Gemini-Request:`, error);
		throw error;
	}
}
/**
 * Sendet Prompt an Azure OpenAI und gibt die Antwort zurück (Fallback)
 */ async function runPromptWithAzure(
	prompt,
	transcript,
	language = 'de',
	functionIdForLog = 'global'
) {
	const systemPrompt = getSystemPrompt(language);
	const requestId = crypto.randomUUID().substring(0, 8);
	log('INFO', `[${functionIdForLog}][AZURE-${requestId}] Starte Azure OpenAI-Anfrage.`);
	try {
		let fullPrompt;
		if (prompt.includes('{transcript}')) {
			fullPrompt = prompt.replace('{transcript}', transcript);
			log('DEBUG', `[${functionIdForLog}][AZURE-${requestId}] Platzhalter im Prompt ersetzt.`);
		} else {
			fullPrompt = `${prompt}\n\nText: ${transcript}`;
			log(
				'DEBUG',
				`[${functionIdForLog}][AZURE-${requestId}] Kein Platzhalter, Transkript am Ende angehängt.`
			);
		}
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
							content: systemPrompt,
						},
						{
							role: 'user',
							content: fullPrompt,
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
			`[${functionIdForLog}][AZURE-${requestId}] Azure OpenAI Antwort erhalten in ${duration}ms, Status: ${response.status}`
		);
		if (!response.ok) {
			const errorText = await response.text();
			log(
				'ERROR',
				`[${functionIdForLog}][AZURE-${requestId}] Azure OpenAI API Fehler: ${response.status}`,
				errorText
			);
			throw new Error(`Azure OpenAI API Fehler: ${response.status} ${errorText}`);
		}
		const data = await response.json();
		const content = data.choices[0]?.message?.content?.trim() || '';
		log(
			'INFO',
			`[${functionIdForLog}][AZURE-${requestId}] Erfolgreiche Azure OpenAI-Antwort (Länge: ${content.length}).`
		);
		return content;
	} catch (error) {
		log(
			'ERROR',
			`[${functionIdForLog}][AZURE-${requestId}] Fehler beim Azure OpenAI-Request:`,
			error
		);
		throw error;
	}
}
/**
 * Hauptfunktion zur Prompt-Verarbeitung mit Fallback-Logik
 */ async function runPromptWithTranscript(
	prompt,
	transcript,
	language = 'de',
	functionIdForLog = 'global'
) {
	try {
		// Zuerst mit Gemini versuchen
		return await runPromptWithGemini(prompt, transcript, functionIdForLog);
	} catch (error) {
		log('WARN', `[${functionIdForLog}] Gemini fehlgeschlagen, fallback auf Azure OpenAI`, error);
		try {
			// Fallback auf Azure OpenAI
			return await runPromptWithAzure(prompt, transcript, language, functionIdForLog);
		} catch (azureError) {
			log('ERROR', `[${functionIdForLog}] Beide LLM-Services fehlgeschlagen`, azureError);
			throw new Error('Beide LLM-Services sind nicht verfügbar');
		}
	}
}
serve(async (req) => {
	const functionId = crypto.randomUUID().substring(0, 8);
	log('INFO', `[${functionId}] Create-Memory-Funktion gestartet`);
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
		const { memo_id, prompt_id } = requestData;
		log(
			'INFO',
			`[${functionId}] Anfrage erhalten für memo_id: ${memo_id}, prompt_id: ${prompt_id}`
		);
		if (!memo_id || !prompt_id) {
			log(
				'ERROR',
				`[${functionId}] Fehlende Parameter: memo_id=${memo_id}, prompt_id=${prompt_id}`
			);
			return createErrorResponse('memo_id und prompt_id sind erforderlich', 400, corsHeaders);
		}
		// Memo laden
		log('INFO', `[${functionId}] Rufe Memo mit ID ${memo_id} aus der Datenbank ab`);
		const { data: memo, error: memoError } = await memoro_sb
			.from('memos')
			.select('*')
			.eq('id', memo_id)
			.single();
		if (memoError || !memo) {
			log('ERROR', `[${functionId}] Memo ${memo_id} nicht gefunden:`, memoError);
			return createErrorResponse('Memo nicht gefunden', 404, corsHeaders);
		}
		// Prompt laden
		log('INFO', `[${functionId}] Rufe Prompt mit ID ${prompt_id} aus der Datenbank ab`);
		const { data: prompt, error: promptError } = await memoro_sb
			.from('prompts')
			.select('*')
			.eq('id', prompt_id)
			.single();
		if (promptError || !prompt) {
			log('ERROR', `[${functionId}] Prompt ${prompt_id} nicht gefunden:`, promptError);
			return createErrorResponse('Prompt nicht gefunden', 404, corsHeaders);
		}
		// Transcript extrahieren (from utterances or legacy fields)
		const transcript = getTranscriptText(memo);
		log('INFO', `[${functionId}] Extrahiertes Transkript (Länge: ${transcript.length})`);
		if (!transcript) {
			log('ERROR', `[${functionId}] Kein Transkript im Memo ${memo_id} gefunden`);
			return createErrorResponse('Kein Transkript im Memo gefunden', 400, corsHeaders);
		}
		// Bestimme die Sprache des Memos
		let baseMemoLang = 'de'; // Standard: Deutsch
		const primaryLanguage = memo.source?.primary_language || memo.source?.languages?.[0];
		if (primaryLanguage && typeof primaryLanguage === 'string') {
			baseMemoLang = primaryLanguage.split('-')[0].toLowerCase();
			log(
				'DEBUG',
				`[${functionId}] Ermittelte Basis-Sprache: ${baseMemoLang} (aus ${primaryLanguage})`
			);
		} else {
			log(
				'DEBUG',
				`[${functionId}] Keine primäre Sprache gefunden. Nutze Standard: ${baseMemoLang}`
			);
		}
		const defaultPreferredLang = 'de';
		const defaultFallbackLang = 'en';
		// Prompt-Text und Memory-Titel extrahieren
		let promptText = '';
		if (prompt.prompt_text && typeof prompt.prompt_text === 'object') {
			promptText =
				(baseMemoLang && prompt.prompt_text[baseMemoLang]) ||
				prompt.prompt_text[defaultPreferredLang] ||
				prompt.prompt_text[defaultFallbackLang] ||
				Object.values(prompt.prompt_text)[0] ||
				'';
		}
		// Prepend system prompt if available for the language
		const systemPrePrompt =
			ROOT_SYSTEM_PROMPTS.PRE_PROMPT[baseMemoLang] || ROOT_SYSTEM_PROMPTS.PRE_PROMPT['de'];
		if (systemPrePrompt && promptText) {
			promptText = systemPrePrompt + '\n\n' + promptText;
		}
		let memoryTitle = '';
		if (prompt.memory_title && typeof prompt.memory_title === 'object') {
			memoryTitle =
				(baseMemoLang && prompt.memory_title[baseMemoLang]) ||
				prompt.memory_title[defaultPreferredLang] ||
				prompt.memory_title[defaultFallbackLang] ||
				Object.values(prompt.memory_title)[0] ||
				'';
		}
		if (!promptText) {
			log('ERROR', `[${functionId}] Kein Prompt-Text für Prompt ${prompt_id} gefunden`);
			return createErrorResponse('Kein Prompt-Text verfügbar', 400, corsHeaders);
		}
		log(
			'INFO',
			`[${functionId}] Sende Prompt "${memoryTitle || 'Ohne Titel'}" (ID: ${prompt_id}) an LLM mit Sprache: ${baseMemoLang}`
		);
		const answer = await runPromptWithTranscript(promptText, transcript, baseMemoLang, functionId);
		if (!answer) {
			log('ERROR', `[${functionId}] Keine Antwort vom LLM für Prompt ${prompt_id} erhalten`);
			return createErrorResponse('Keine Antwort vom LLM erhalten', 500, corsHeaders);
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
		log(
			'INFO',
			`[${functionId}] Erstelle neues Memory für Memo ${memo_id} mit Titel "${memoryTitle || 'Memory'}"`
		);
		const { data: newMemory, error: newMemoryError } = await memoro_sb
			.from('memories')
			.insert({
				memo_id: memo_id,
				title: memoryTitle || 'Memory',
				content: answer,
				media: null,
				sort_order: nextSortOrder,
				metadata: {
					type: 'manual_prompt',
					prompt_id: prompt_id,
					created_by: 'create_memory_function',
				},
			})
			.select()
			.single();
		if (newMemoryError) {
			log(
				'ERROR',
				`[${functionId}] Fehler beim Erstellen des Memories für Prompt ${prompt_id}:`,
				newMemoryError
			);
			return createErrorResponse(
				`Fehler beim Erstellen der Memory: ${newMemoryError.message}`,
				500,
				corsHeaders
			);
		}
		log(
			'INFO',
			`[${functionId}] Memory erfolgreich erstellt mit ID ${newMemory.id} für Prompt ${prompt_id}`
		);
		return new Response(
			JSON.stringify({
				success: true,
				memory_id: newMemory.id,
				title: memoryTitle,
				content: answer,
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
		log('ERROR', `[${functionId}] Unerwarteter Fehler bei der Memory-Erstellung:`, error);
		const errorToLog = error instanceof Error ? error : new Error(String(error));
		return createErrorResponse(`Unerwarteter Fehler: ${errorToLog.message}`, 500, corsHeaders);
	}
});
