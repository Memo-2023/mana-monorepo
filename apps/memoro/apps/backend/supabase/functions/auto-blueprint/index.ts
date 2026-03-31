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
 * Auto-Blueprint Edge Function
 *
 * Diese Funktion wird getriggert, wenn kein spezifischer Blueprint ausgewählt ist.
 * Sie lädt alle verfügbaren Prompts und verwendet Gemini 2.0 Flash, um die 5
 * relevantesten Prompts für das gegebene Transcript auszuwählen und zu verarbeiten.
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
// Gemini 2.0 Flash API Configuration
const GEMINI_API_KEY = Deno.env.get('CREATE_AUTOBLUEPRINT_GEMINI_MEMORO') || '';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
// Azure OpenAI für finale Prompt-Verarbeitung
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
 * Setzt den Status eines Prozesses auf 'processing'
 */ async function setMemoProcessingStatus(supabaseClient, memoId, processName) {
	const timestamp = new Date().toISOString();
	try {
		const { data: currentMemo, error: fetchError } = await supabaseClient
			.from('memos')
			.select('metadata')
			.eq('id', memoId)
			.single();
		if (fetchError) {
			console.error(
				`[${processName}] Fehler beim Abrufen der aktuellen Metadaten für Memo ${memoId}:`,
				fetchError
			);
		}
		const currentMetadata = currentMemo?.metadata || {};
		const newMetadata = {
			...currentMetadata,
			processing: {
				...(currentMetadata.processing || {}),
				[processName]: {
					status: 'processing',
					timestamp,
				},
			},
		};
		const { error: updateError } = await supabaseClient
			.from('memos')
			.update({
				metadata: newMetadata,
			})
			.eq('id', memoId);
		if (updateError) {
			console.error(
				`[${processName}] Fehler beim Setzen des Processing-Status für Memo ${memoId}:`,
				updateError
			);
		} else {
			console.log(`[${processName}] Processing-Status für Memo ${memoId} erfolgreich gesetzt.`);
		}
	} catch (dbError) {
		console.error(
			`[${processName}] Unerwarteter Fehler beim Setzen des Processing-Status für Memo ${memoId}:`,
			dbError
		);
	}
}
/**
 * Setzt den Status eines Prozesses auf 'completed'
 */ async function setMemoCompletedStatus(supabaseClient, memoId, processName, details) {
	const timestamp = new Date().toISOString();
	try {
		const { data: currentMemo, error: fetchError } = await supabaseClient
			.from('memos')
			.select('metadata')
			.eq('id', memoId)
			.single();
		if (fetchError) {
			console.error(
				`[${processName}] Fehler beim Abrufen der aktuellen Metadaten für Memo ${memoId}:`,
				fetchError
			);
		}
		const currentMetadata = currentMemo?.metadata || {};
		const newMetadata = {
			...currentMetadata,
			processing: {
				...(currentMetadata.processing || {}),
				[processName]: {
					status: 'completed',
					timestamp,
					...(details && {
						details,
					}),
				},
			},
		};
		const { error: updateError } = await supabaseClient
			.from('memos')
			.update({
				metadata: newMetadata,
			})
			.eq('id', memoId);
		if (updateError) {
			console.error(
				`[${processName}] Fehler beim Setzen des Completed-Status für Memo ${memoId}:`,
				updateError
			);
		} else {
			console.log(`[${processName}] Completed-Status für Memo ${memoId} erfolgreich gesetzt.`);
		}
	} catch (dbError) {
		console.error(
			`[${processName}] Unerwarteter Fehler beim Setzen des Completed-Status für Memo ${memoId}:`,
			dbError
		);
	}
}
/**
 * Aktualisiert die Metadaten eines Memos, um einen Fehlerstatus zu setzen.
 */ async function setMemoErrorStatus(supabaseClient, memoId, processName, error, details) {
	if (!memoId) {
		console.error(`[${processName}] Kann Fehlerstatus nicht setzen: Keine memoId angegeben.`);
		return;
	}
	const errorMessage = error instanceof Error ? error.message : String(error);
	const timestamp = new Date().toISOString();
	console.error(`[${processName}] Fehler bei Memo ${memoId}: ${errorMessage}`);
	try {
		const { data: currentMemo, error: fetchError } = await supabaseClient
			.from('memos')
			.select('metadata')
			.eq('id', memoId)
			.single();
		if (fetchError) {
			console.error(
				`[${processName}] Fehler beim Abrufen der aktuellen Metadaten für Memo ${memoId}:`,
				fetchError
			);
		}
		const currentMetadata = currentMemo?.metadata || {};
		const newMetadata = {
			...currentMetadata,
			processing: {
				...(currentMetadata.processing || {}),
				[processName]: {
					status: 'error',
					reason: errorMessage,
					timestamp,
					...(details && {
						details,
					}),
				},
			},
		};
		const { error: updateError } = await supabaseClient
			.from('memos')
			.update({
				metadata: newMetadata,
			})
			.eq('id', memoId);
		if (updateError) {
			console.error(
				`[${processName}] Kritischer Fehler: Konnte Fehlerstatus für Memo ${memoId} nicht in DB schreiben:`,
				updateError
			);
		} else {
			console.log(`[${processName}] Fehlerstatus für Memo ${memoId} erfolgreich in DB gesetzt.`);
		}
	} catch (dbError) {
		console.error(
			`[${processName}] Unerwarteter Fehler beim Setzen des DB-Fehlerstatus für Memo ${memoId}:`,
			dbError
		);
	}
}
/**
 * Erstellt eine standardisierte Fehlerantwort für Edge Functions
 */ function createSuccessResponse(data, corsHeaders = {}) {
	return new Response(
		JSON.stringify({
			success: true,
			...data,
		}),
		{
			headers: {
				...corsHeaders,
				'Content-Type': 'application/json',
			},
			status: 200,
		}
	);
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
 * Sendet Anfrage an Gemini 2.0 Flash zur Auswahl der relevantesten Prompts
 * @param transcript - Das Transkript
 * @param promptDescriptions - Array von Prompt-Beschreibungen mit IDs
 * @param language - Sprache für die Antwort
 * @returns Array der ausgewählten Prompt-IDs
 */ async function selectRelevantstPrompts(
	transcript,
	promptDescriptions,
	language,
	functionIdForLog = 'global',
	targetCount = 5
) {
	const requestId = crypto.randomUUID().substring(0, 8);
	log(
		'INFO',
		`[${functionIdForLog}][GEMINI-${requestId}] Starte Gemini-Anfrage zur Prompt-Auswahl.`
	);
	try {
		// Erstelle die Prompt-Liste für Gemini mit Index-Referenzen
		const promptListText = promptDescriptions
			.map((p, index) => `${index + 1}. Titel: "${p.title}", Beschreibung: "${p.description}"`)
			.join('\n');
		const selectionPrompt =
			language === 'de'
				? `Analysiere das folgende Transcript und wähle die ${targetCount} relevantesten Prompts aus der Liste aus. 

Transcript:
${transcript}

Verfügbare Prompts:
${promptListText}

Bitte antworte nur mit den Nummern der ${targetCount} ausgewählten Prompts, getrennt durch Kommas (z.B. "1,3,5"). Wähle die Prompts aus, die am besten zum Inhalt und Kontext des Transcripts passen.`
				: `Analyze the following transcript and select the ${targetCount} most relevant prompts from the list.

Transcript:
${transcript}

Available Prompts:
${promptListText}

Please respond only with the numbers of the ${targetCount} selected prompts, separated by commas (e.g. "1,3,5"). Choose the prompts that best match the content and context of the transcript.`;
		log(
			'DEBUG',
			`[${functionIdForLog}][GEMINI-${requestId}] Sende Prompt-Auswahl-Anfrage (${promptDescriptions.length} Prompts verfügbar).`
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
									text: selectionPrompt,
								},
							],
						},
					],
					generationConfig: {
						maxOutputTokens: 8192,
						temperature: 0.3,
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
		log('DEBUG', `[${functionIdForLog}][GEMINI-${requestId}] Gemini Antwort: ${content}`);
		// Parse die Antwort - erwarte kommaseparierte Index-Nummern
		const selectedIndices = content
			.split(',')
			.map((index) => parseInt(index.trim(), 10))
			.filter((index) => !isNaN(index) && index >= 1 && index <= promptDescriptions.length);
		log(
			'INFO',
			`[${functionIdForLog}][GEMINI-${requestId}] ${selectedIndices.length} Prompt-Indizes ausgewählt: ${selectedIndices.join(', ')}`
		);
		// Konvertiere Indizes zu IDs (Index ist 1-basiert, Array ist 0-basiert)
		const validIds = selectedIndices.map((index) => promptDescriptions[index - 1].id);
		log(
			'INFO',
			`[${functionIdForLog}][GEMINI-${requestId}] Entsprechende Prompt-IDs: ${validIds.join(', ')}`
		);
		return validIds.slice(0, targetCount); // Maximal targetCount Prompts
	} catch (error) {
		log('ERROR', `[${functionIdForLog}][GEMINI-${requestId}] Fehler bei Gemini-Anfrage:`, error);
		// Fallback: Nimm die ersten targetCount Prompts
		return promptDescriptions.slice(0, targetCount).map((p) => p.id);
	}
}
/**
 * Sendet Prompt an Azure OpenAI und gibt die Antwort zurück
 */ async function runPromptWithTranscript(
	prompt,
	transcript,
	language = 'de',
	functionIdForLog = 'global'
) {
	const systemPrompt = getSystemPrompt(language);
	const requestId = crypto.randomUUID().substring(0, 8);
	log('INFO', `[${functionIdForLog}][LLM-${requestId}] Starte LLM-Anfrage.`);
	try {
		let fullPrompt;
		if (prompt.includes('{transcript}')) {
			fullPrompt = prompt.replace('{transcript}', transcript);
			log('DEBUG', `[${functionIdForLog}][LLM-${requestId}] Platzhalter im Prompt ersetzt.`);
		} else {
			fullPrompt = `${prompt}\n\nText: ${transcript}`;
			log(
				'DEBUG',
				`[${functionIdForLog}][LLM-${requestId}] Kein Platzhalter, Transkript am Ende angehängt.`
			);
		}
		log(
			'DEBUG',
			`[${functionIdForLog}][LLM-${requestId}] System-Prompt (${language}): ${systemPrompt}`
		);
		log(
			'DEBUG',
			`[${functionIdForLog}][LLM-${requestId}] User-Prompt (erste 200 Zeichen): ${fullPrompt.substring(0, 200)}...`
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
			`[${functionIdForLog}][LLM-${requestId}] Erfolgreiche LLM-Antwort (Länge: ${content.length}).`
		);
		return content;
	} catch (error) {
		log('ERROR', `[${functionIdForLog}][LLM-${requestId}] Fehler beim LLM-Request:`, error);
		return '';
	}
}
serve(async (req) => {
	const functionId = crypto.randomUUID().substring(0, 8);
	log('INFO', `[${functionId}] Auto-Blueprint-Funktion gestartet`);
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
		const { memo_id, primary_language } = requestData;
		memo_id_to_update = memo_id;
		log(
			'INFO',
			`[${functionId}] Anfrage erhalten für memo_id: ${memo_id}, primäre Sprache: ${primary_language || 'nicht angegeben'}`
		);
		if (!memo_id) {
			log('ERROR', `[${functionId}] Keine memo_id in der Anfrage gefunden`);
			return createErrorResponse('memo_id ist erforderlich', 400, corsHeaders);
		}
		// Kurz warten um Race Condition mit blueprint_id Setzung zu vermeiden
		log(
			'INFO',
			`[${functionId}] Warte 2 Sekunden um potentielle blueprint_id Setzung abzuwarten...`
		);
		await new Promise((resolve) => setTimeout(resolve, 2000));
		log('INFO', `[${functionId}] Rufe Memo mit ID ${memo_id} aus der Datenbank ab`);
		const { data: memo, error: memoError } = await memoro_sb
			.from('memos')
			.select('*')
			.eq('id', memo_id)
			.single();
		// Prüfe nochmal ob inzwischen blueprint_id gesetzt wurde
		if (memo?.metadata?.blueprint_id) {
			log(
				'INFO',
				`[${functionId}] Blueprint ID ${memo.metadata.blueprint_id} wurde inzwischen gesetzt, überspringe Auto-Blueprint`
			);
			return createSuccessResponse(
				{
					message: 'Blueprint ID wurde gesetzt, Auto-Blueprint übersprungen',
					blueprintId: memo.metadata.blueprint_id,
				},
				corsHeaders
			);
		}
		// Set processing status erst nach blueprint_id Check
		await setMemoProcessingStatus(memoro_sb, memo_id, 'auto_blueprint');
		if (memoError || !memo) {
			log('ERROR', `[${functionId}] Memo ${memo_id} nicht gefunden:`, memoError);
			await setMemoErrorStatus(memoro_sb, memo_id, 'auto_blueprint', 'Memo nicht gefunden');
			return createErrorResponse('Memo nicht gefunden', 404, corsHeaders);
		}
		// Transcript extrahieren (from utterances or legacy fields)
		const transcript = getTranscriptText(memo);
		log(
			'INFO',
			`[${functionId}] Extrahiertes Transkript (Länge: ${transcript.length}, erste 100 Zeichen): ${transcript.substring(0, 100)}...`
		);
		if (!transcript) {
			log('ERROR', `[${functionId}] Kein Transkript im Memo ${memo_id} gefunden`);
			await setMemoErrorStatus(
				memoro_sb,
				memo_id,
				'auto_blueprint',
				'Kein Transkript im Memo gefunden'
			);
			return createErrorResponse('Kein Transkript im Memo gefunden', 400, corsHeaders);
		}
		// Alle verfügbaren Prompts laden
		log('INFO', `[${functionId}] Lade alle verfügbaren Prompts aus der Datenbank`);
		const { data: allPrompts, error: promptsError } = await memoro_sb
			.from('prompts')
			.select('*')
			.eq('is_public', true);
		if (promptsError || !Array.isArray(allPrompts) || allPrompts.length === 0) {
			log('ERROR', `[${functionId}] Keine öffentlichen Prompts gefunden:`, promptsError);
			await setMemoErrorStatus(
				memoro_sb,
				memo_id,
				'auto_blueprint',
				'Keine verfügbaren Prompts gefunden'
			);
			return createErrorResponse('Keine verfügbaren Prompts gefunden', 404, corsHeaders);
		}
		log('INFO', `[${functionId}] ${allPrompts.length} öffentliche Prompts gefunden`);
		// Basis-Sprache aus primary_language ermitteln
		let baseMemoLang = 'de'; // Standard: Deutsch
		if (primary_language && typeof primary_language === 'string') {
			baseMemoLang = primary_language.split('-')[0].toLowerCase();
			log(
				'DEBUG',
				`[${functionId}] Ermittelte Basis-Sprache: ${baseMemoLang} (aus ${primary_language})`
			);
		} else {
			log(
				'DEBUG',
				`[${functionId}] Keine primäre Sprache übergeben. Nutze Standard: ${baseMemoLang}`
			);
		}
		const defaultPreferredLang = 'de';
		const defaultFallbackLang = 'en';
		// Prompt-Beschreibungen für Gemini-Auswahl zusammenstellen
		const promptDescriptions = allPrompts.map((prompt) => {
			let description = '';
			if (prompt.description && typeof prompt.description === 'object') {
				description =
					(baseMemoLang && prompt.description[baseMemoLang]) ||
					prompt.description[defaultPreferredLang] ||
					prompt.description[defaultFallbackLang] ||
					Object.values(prompt.description)[0] ||
					'Keine Beschreibung verfügbar';
			} else {
				description = 'Keine Beschreibung verfügbar';
			}
			let title = '';
			if (prompt.memory_title && typeof prompt.memory_title === 'object') {
				title =
					(baseMemoLang && prompt.memory_title[baseMemoLang]) ||
					prompt.memory_title[defaultPreferredLang] ||
					prompt.memory_title[defaultFallbackLang] ||
					Object.values(prompt.memory_title)[0] ||
					'Ohne Titel';
			} else {
				title = 'Ohne Titel';
			}
			return {
				id: prompt.id,
				description: description,
				title: title,
			};
		});
		// Bestimme die optimale Anzahl Prompts basierend auf Transkript-Länge
		const wordCount = transcript.split(/\s+/).filter((word) => word.length > 0).length;
		let targetPromptCount;
		if (wordCount <= 100) {
			targetPromptCount = Math.floor(Math.random() * 2) + 1; // 1-2 Prompts
		} else if (wordCount <= 300) {
			targetPromptCount = Math.floor(Math.random() * 2) + 2; // 2-3 Prompts
		} else if (wordCount <= 500) {
			targetPromptCount = Math.floor(Math.random() * 2) + 3; // 3-4 Prompts
		} else if (wordCount <= 1000) {
			targetPromptCount = Math.floor(Math.random() * 2) + 4; // 4-5 Prompts
		} else {
			targetPromptCount = Math.floor(Math.random() * 2) + 5; // 5-6 Prompts
		}
		log(
			'INFO',
			`[${functionId}] Transkript hat ${wordCount} Wörter → ${targetPromptCount} Prompts werden ausgewählt`
		);
		log(
			'INFO',
			`[${functionId}] Verwende Gemini zur Auswahl der ${targetPromptCount} relevantesten Prompts`
		);
		const selectedPromptIds = await selectRelevantstPrompts(
			transcript,
			promptDescriptions,
			baseMemoLang,
			functionId,
			targetPromptCount
		);
		if (selectedPromptIds.length === 0) {
			log('ERROR', `[${functionId}] Keine Prompts von Gemini ausgewählt`);
			await setMemoErrorStatus(
				memoro_sb,
				memo_id,
				'auto_blueprint',
				'Keine relevanten Prompts gefunden'
			);
			return createErrorResponse('Keine relevanten Prompts gefunden', 400, corsHeaders);
		}
		// Ausgewählte Prompts laden
		const selectedPrompts = allPrompts.filter((p) => selectedPromptIds.includes(p.id));
		log(
			'INFO',
			`[${functionId}] ${selectedPrompts.length} Prompts ausgewählt, beginne mit der Verarbeitung`
		);
		const results = [];
		for (const prompt of selectedPrompts) {
			const promptId = prompt.id;
			log('INFO', `[${functionId}] Verarbeite Prompt mit ID ${promptId}`);
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
			// Get the highest sort_order for this memo
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
			log(
				'INFO',
				`[${functionId}] Erstelle neues Memory für Memo ${memo_id} mit Titel "${memoryTitle || 'Auto-Blueprint-Antwort'}" mit sort_order ${nextSortOrder}`
			);
			const { data: newMemory, error: newMemoryError } = await memoro_sb
				.from('memories')
				.insert({
					memo_id: memo_id,
					title: memoryTitle || 'Auto-Blueprint-Antwort',
					content: answer,
					media: null,
					sort_order: nextSortOrder,
					metadata: {
						type: 'auto_blueprint',
						prompt_id: promptId,
						created_by: 'auto_blueprint_function',
						selection_method: 'gemini_ai',
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
		await setMemoCompletedStatus(memoro_sb, memo_id, 'auto_blueprint', {
			results_count: results.length,
			selected_prompts_count: selectedPrompts.length,
			total_prompts_available: allPrompts.length,
			selection_method: 'gemini_ai',
		});
		log(
			'INFO',
			`[${functionId}] Auto-Blueprint-Verarbeitung erfolgreich abgeschlossen mit ${results.length} Ergebnissen für Memo ${memo_id}`
		);
		return new Response(
			JSON.stringify({
				success: true,
				results,
				meta: {
					selected_prompts: selectedPromptIds,
					total_available: allPrompts.length,
				},
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
		log('ERROR', `[${functionId}] Unerwarteter Fehler bei der Auto-Blueprint-Verarbeitung:`, error);
		// Set error status in database
		const errorToLog = error instanceof Error ? error : new Error(String(error));
		await setMemoErrorStatus(memoro_sb, memo_id_to_update, 'auto_blueprint', errorToLog);
		// Return error response
		return createErrorResponse(`Unerwarteter Fehler: ${errorToLog.message}`, 500, corsHeaders);
	}
});
