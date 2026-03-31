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
 * Blueprint Edge Function
 *
 * Diese Funktion wird wie die Headline-Function getriggert und verarbeitet einen angegebenen Blueprint,
 * dessen Prompts mit dem Transcript an das LLM geschickt werden. Die Antworten werden als neue Memory-Einträge
 * gespeichert, die auf das ursprüngliche Memo referenzieren.
 *
 * @version 1.2.0
 * @date 2025-05-19
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
const GEMINI_API_KEY = Deno.env.get('CREATE_BLUEPRINT_GEMINI_MEMORO') || '';
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
			// For DEBUG, log data more verbosely if needed, otherwise keep it simple
			console.log(typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
		}
	}
}
/**
 * Sendet Prompt an Gemini Flash und gibt die Antwort zurück
 */ async function runPromptWithGemini(
	prompt,
	transcript,
	language = 'de',
	functionIdForLog = 'global'
) {
	// Always use the default system prompt from ROOT_SYSTEM_PROMPTS
	const systemPrompt = getSystemPrompt(language);
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
		log(
			'DEBUG',
			`[${functionIdForLog}][GEMINI-${requestId}] System-Prompt (${language}): ${systemPrompt}`
		);
		log(
			'DEBUG',
			`[${functionIdForLog}][GEMINI-${requestId}] User-Prompt (erste 200 Zeichen): ${fullPrompt.substring(0, 200)}...`
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
							role: 'user',
							parts: [
								{
									text: fullPrompt,
								},
							],
						},
					],
					systemInstruction: {
						parts: [
							{
								text: systemPrompt,
							},
						],
					},
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
	// Always use the default system prompt from ROOT_SYSTEM_PROMPTS
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
		log(
			'DEBUG',
			`[${functionIdForLog}][AZURE-${requestId}] System-Prompt (${language}): ${systemPrompt}`
		);
		log(
			'DEBUG',
			`[${functionIdForLog}][AZURE-${requestId}] User-Prompt (erste 200 Zeichen): ${fullPrompt.substring(0, 200)}...`
		);
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
		return await runPromptWithGemini(prompt, transcript, language, functionIdForLog);
	} catch (error) {
		log('WARN', `[${functionIdForLog}] Gemini fehlgeschlagen, fallback auf Azure OpenAI`, error);
		try {
			// Fallback auf Azure OpenAI
			return await runPromptWithAzure(prompt, transcript, language, functionIdForLog);
		} catch (azureError) {
			log('ERROR', `[${functionIdForLog}] Beide LLM-Services fehlgeschlagen`, azureError);
			return ''; // Return empty string to maintain compatibility
		}
	}
}
serve(async (req) => {
	const functionId = crypto.randomUUID().substring(0, 8);
	log('INFO', `[${functionId}] Blueprint-Funktion gestartet`);
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
	let memo_id_to_update = null;
	try {
		const requestData = await req.json();
		const { memo_id, primary_language } = requestData; // Erhalte primary_language
		memo_id_to_update = memo_id;
		log(
			'INFO',
			`[${functionId}] Anfrage erhalten für memo_id: ${memo_id}, primäre Sprache: ${primary_language || 'nicht angegeben'}`
		);
		if (!memo_id) {
			log('ERROR', `[${functionId}] Keine memo_id in der Anfrage gefunden`);
			return createErrorResponse('memo_id ist erforderlich', 400, corsHeaders);
		}
		// Set processing status
		await setMemoProcessingStatus(memoro_sb, memo_id, 'blueprint');
		log('INFO', `[${functionId}] Rufe Memo mit ID ${memo_id} aus der Datenbank ab`);
		const { data: memo, error: memoError } = await memoro_sb
			.from('memos')
			.select('*')
			.eq('id', memo_id)
			.single();
		if (memoError || !memo) {
			log('ERROR', `[${functionId}] Memo ${memo_id} nicht gefunden:`, memoError);
			await setMemoErrorStatus(memoro_sb, memo_id, 'blueprint', 'Memo nicht gefunden');
			return createErrorResponse('Memo nicht gefunden', 404, corsHeaders);
		}
		const blueprintId = memo.metadata?.blueprint_id || memo.metadata?.blueprintId;
		log('INFO', `[${functionId}] Blueprint-ID aus Memo-Metadaten: ${blueprintId}`);
		if (!blueprintId) {
			log('ERROR', `[${functionId}] Keine Blueprint-ID in Memo-Metadaten ${memo_id} gefunden`);
			log(
				'DEBUG',
				`[${functionId}] Verfügbare Metadaten-Schlüssel: ${Object.keys(memo.metadata || {}).join(', ')}`
			);
			await setMemoErrorStatus(
				memoro_sb,
				memo_id,
				'blueprint',
				'Kein Blueprint im Memo-Metadaten gefunden'
			);
			return createErrorResponse('Kein Blueprint im Memo-Metadaten gefunden', 400, corsHeaders);
		}
		log('INFO', `[${functionId}] Lade Blueprint mit ID ${blueprintId}`);
		const { data: blueprint, error: blueprintError } = await memoro_sb
			.from('blueprints')
			.select('*')
			.eq('id', blueprintId)
			.single();
		if (blueprintError || !blueprint) {
			log('ERROR', `[${functionId}] Blueprint ${blueprintId} nicht gefunden:`, blueprintError);
			await setMemoErrorStatus(
				memoro_sb,
				memo_id,
				'blueprint',
				`Blueprint ${blueprintId} nicht gefunden`
			);
			return createErrorResponse('Blueprint nicht gefunden', 404, corsHeaders);
		}
		log('INFO', `[${functionId}] Lade Prompt-Links für Blueprint ${blueprintId}`);
		const { data: promptLinks, error: promptLinksError } = await memoro_sb
			.from('prompt_blueprints')
			.select('prompt_id, sort_order')
			.eq('blueprint_id', blueprintId);
		if (promptLinksError || !Array.isArray(promptLinks) || promptLinks.length === 0) {
			log(
				'ERROR',
				`[${functionId}] Keine Prompt-Links für Blueprint ${blueprintId} gefunden:`,
				promptLinksError
			);
			await setMemoErrorStatus(
				memoro_sb,
				memo_id,
				'blueprint',
				'Keine Prompts für diesen Blueprint gefunden'
			);
			return createErrorResponse('Keine Prompts für diesen Blueprint gefunden', 404, corsHeaders);
		}
		const promptIds = promptLinks.map((l) => l.prompt_id);
		// Create a map of prompt_id to sort_order for later use
		const promptSortOrderMap = new Map(promptLinks.map((l) => [l.prompt_id, l.sort_order]));
		log('INFO', `[${functionId}] Gefundene Prompt-IDs: ${promptIds.join(', ')}`);
		// Transcript extrahieren (from utterances or legacy fields)
		const transcript = getTranscriptText(memo);
		log(
			'INFO',
			`[${functionId}] Extrahiertes Transkript (Länge: ${transcript.length}, erste 100 Zeichen): ${transcript.substring(0, 100)}...`
		);
		if (!transcript) {
			log('ERROR', `[${functionId}] Kein Transkript im Memo ${memo_id} gefunden`);
			await setMemoErrorStatus(memoro_sb, memo_id, 'blueprint', 'Kein Transkript im Memo gefunden');
			return createErrorResponse('Kein Transkript im Memo gefunden', 400, corsHeaders);
		}
		log('INFO', `[${functionId}] Lade Prompts (${promptIds.length}) aus der Datenbank`);
		const { data: prompts, error: promptsError } = await memoro_sb
			.from('prompts')
			.select('*')
			.in('id', promptIds);
		if (promptsError || !Array.isArray(prompts) || prompts.length === 0) {
			log(
				'ERROR',
				`[${functionId}] Prompts (${promptIds.join(', ')}) nicht gefunden:`,
				promptsError
			);
			await setMemoErrorStatus(memoro_sb, memo_id, 'blueprint', 'Prompts nicht gefunden');
			return createErrorResponse('Prompts nicht gefunden', 404, corsHeaders);
		}
		log('INFO', `[${functionId}] ${prompts.length} Prompts gefunden, beginne mit der Verarbeitung`);
		const results = [];
		// Basis-Sprache aus primary_language (z.B. "en-GB" -> "en") ermitteln
		let baseMemoLang = null;
		if (primary_language && typeof primary_language === 'string') {
			baseMemoLang = primary_language.split('-')[0].toLowerCase(); // Sicherstellen, dass es Kleinbuchstaben sind
			log(
				'DEBUG',
				`[${functionId}] Ermittelte Basis-Sprache: ${baseMemoLang} (aus ${primary_language})`
			);
		} else {
			baseMemoLang = 'en';
			log(
				'WARN',
				`[${functionId}] Keine primäre Sprache vom Trigger übergeben oder ungültig. Nutze Standard-Fallbacks.`
			);
		}
		const defaultPreferredLang = 'de'; // Standard bevorzugte Sprache
		const defaultFallbackLang = 'en'; // Standard Ausweichsprache
		for (const prompt of prompts) {
			const promptId = prompt.id;
			log('INFO', `[${functionId}] Verarbeite Prompt mit ID ${promptId}`);
			let promptText = '';
			if (prompt.prompt_text && typeof prompt.prompt_text === 'object') {
				promptText =
					(baseMemoLang && prompt.prompt_text[baseMemoLang]) || // 1. Memo-Primärsprache (Basis)
					prompt.prompt_text[defaultPreferredLang] || // 2. Standard 'de'
					prompt.prompt_text[defaultFallbackLang] || // 3. Standard 'en'
					Object.values(prompt.prompt_text)[0] || // 4. Erster verfügbarer Wert
					''; // 5. Leerstring
				log(
					'DEBUG',
					`[${functionId}] Gewählter Prompt-Text für Prompt ${promptId} (Sprache: ${baseMemoLang || defaultPreferredLang}): ${promptText.substring(0, 50)}...`
				);
			} else {
				log(
					'WARN',
					`[${functionId}] Kein gültiges prompt_text Objekt für Prompt ${promptId} gefunden.`
				);
			}
			// Blueprint's system_prompt should be used as a pre-prompt (prepended to promptText)
			let blueprintPrePrompt = '';
			if (blueprint.system_prompt && typeof blueprint.system_prompt === 'object') {
				// Try to get system_prompt for the current language
				blueprintPrePrompt =
					(baseMemoLang && blueprint.system_prompt[baseMemoLang]) ||
					blueprint.system_prompt[defaultPreferredLang] ||
					blueprint.system_prompt[defaultFallbackLang] ||
					Object.values(blueprint.system_prompt)[0] ||
					'';
				if (blueprintPrePrompt) {
					log(
						'DEBUG',
						`[${functionId}] Verwende Blueprint-spezifischen Pre-Prompt für Sprache ${baseMemoLang}`
					);
				}
			}
			// If no blueprint pre-prompt, use ROOT_SYSTEM_PROMPTS.PRE_PROMPT as fallback
			if (!blueprintPrePrompt) {
				blueprintPrePrompt =
					ROOT_SYSTEM_PROMPTS.PRE_PROMPT[baseMemoLang] ||
					ROOT_SYSTEM_PROMPTS.PRE_PROMPT['de'] ||
					'';
				if (blueprintPrePrompt) {
					log('DEBUG', `[${functionId}] Verwende Standard Pre-Prompt für Sprache ${baseMemoLang}`);
				}
			}
			// Prepend the pre-prompt to the promptText if available
			if (blueprintPrePrompt && promptText) {
				promptText = blueprintPrePrompt + '\n\n' + promptText;
			}
			let memoryTitle = '';
			if (prompt.memory_title && typeof prompt.memory_title === 'object') {
				memoryTitle =
					(baseMemoLang && prompt.memory_title[baseMemoLang]) || // 1. Memo-Primärsprache (Basis)
					prompt.memory_title[defaultPreferredLang] || // 2. Standard 'de'
					prompt.memory_title[defaultFallbackLang] || // 3. Standard 'en'
					Object.values(prompt.memory_title)[0] || // 4. Erster verfügbarer Wert
					''; // 5. Leerstring
				log(
					'DEBUG',
					`[${functionId}] Gewählter Memory-Titel für Prompt ${promptId} (Sprache: ${baseMemoLang || defaultPreferredLang}): ${memoryTitle}`
				);
			} else {
				log(
					'WARN',
					`[${functionId}] Kein gültiges memory_title Objekt für Prompt ${promptId} gefunden.`
				);
			}
			if (!promptText) {
				log(
					'WARN',
					`[${functionId}] Kein Prompt-Text für Prompt ${promptId} nach Sprachauswahl. Überspringe.`
				);
				results.push({
					prompt_id: promptId,
					error: 'Kein Prompt-Text verfügbar in passender Sprache',
				});
				continue;
			}
			log(
				'INFO',
				`[${functionId}] Sende Prompt "${memoryTitle || 'Ohne Titel'}" (ID: ${promptId}) an LLM mit Sprache: ${baseMemoLang}`
			);
			log(
				'DEBUG',
				`[${functionId}] Prompt-Text (erste 150 Zeichen): ${promptText.substring(0, 150)}...`
			);
			// Use default system prompt (from ROOT_SYSTEM_PROMPTS via getSystemPrompt)
			const answer = await runPromptWithTranscript(
				promptText,
				transcript,
				baseMemoLang,
				functionId
			);
			if (!answer) {
				log('WARN', `[${functionId}] Keine Antwort vom LLM für Prompt ${promptId} erhalten`);
				results.push({
					prompt_id: promptId,
					error: 'Keine Antwort vom LLM erhalten',
				});
				continue;
			}
			log(
				'INFO',
				`[${functionId}] Erstelle neues Memory für Memo ${memo_id} mit Titel "${memoryTitle || 'Blueprint-Antwort'}"`
			);
			const { data: newMemory, error: newMemoryError } = await memoro_sb
				.from('memories')
				.insert({
					memo_id: memo_id,
					title: memoryTitle || 'Blueprint-Antwort',
					content: answer,
					media: null,
					sort_order: promptSortOrderMap.get(promptId) || null,
					metadata: {
						type: 'blueprint',
						blueprint_id: blueprintId,
						prompt_id: promptId,
						created_by: 'blueprint_function',
					},
				})
				.select()
				.single();
			if (newMemoryError) {
				log(
					'ERROR',
					`[${functionId}] Fehler beim Erstellen des Memories für Prompt ${promptId}:`,
					newMemoryError
				);
				results.push({
					prompt_id: promptId,
					error: newMemoryError.message,
				});
			} else {
				log(
					'INFO',
					`[${functionId}] Memory erfolgreich erstellt mit ID ${newMemory.id} für Prompt ${promptId}`
				);
				results.push({
					prompt_id: promptId,
					memory_id: newMemory.id,
				});
			}
		}
		// Set completed status
		await setMemoCompletedStatus(memoro_sb, memo_id, 'blueprint', {
			results_count: results.length,
			prompt_count: prompts.length,
			blueprint_id: blueprintId,
		});
		// Send broadcast update to notify clients about the blueprint completion
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
								metadata: memo.metadata,
								updated_at: new Date().toISOString(),
							},
							source: 'blueprint-edge-function',
						},
					});
					log('INFO', `[${functionId}] Broadcast sent for memo ${memo_id} blueprint completion`);
					// Clean up the channel after sending
					memoro_sb.removeChannel(channel);
				}
			});
		} catch (broadcastError) {
			log('WARN', `[${functionId}] Failed to send broadcast update:`, broadcastError);
			// Don't fail the function if broadcast fails
		}
		log(
			'INFO',
			`[${functionId}] Blueprint-Verarbeitung erfolgreich abgeschlossen mit ${results.length} Ergebnissen für Memo ${memo_id}`
		);
		return new Response(
			JSON.stringify({
				success: true,
				results,
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
		log('ERROR', `[${functionId}] Unerwarteter Fehler bei der Blueprint-Verarbeitung:`, error);
		// Set error status in database
		const errorToLog = error instanceof Error ? error : new Error(String(error));
		await setMemoErrorStatus(memoro_sb, memo_id_to_update, 'blueprint', errorToLog);
		// Return error response
		return createErrorResponse(`Unerwarteter Fehler: ${errorToLog.message}`, 500, corsHeaders);
	}
});
