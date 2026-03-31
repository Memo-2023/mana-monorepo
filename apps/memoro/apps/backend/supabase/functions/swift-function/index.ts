// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { serve } from 'https://deno.land/std@0.215.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
/**
 * Question Memo Edge Function
 *
 * Diese Funktion nimmt eine Benutzerfrage und ein Memo-Transkript entgegen,
 * sendet beides an Gemini API und erstellt eine neue Memory mit der Antwort.
 *
 * @version 1.0.0
 * @date 2025-05-23
 */ // ─── Umgebungsvariablen ──────────────────────────────────────────────
const SUPABASE_URL = 'https://npgifbrwhftlbrbaglmi.supabase.co';
const SERVICE_KEY =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wZ2lmYnJ3aGZ0bGJyYmFnbG1pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTg1MTQxNiwiZXhwIjoyMDYxNDI3NDE2fQ.-6hArOVoEgGwIwdjclLQCTOAu13BFYnp9hPxQks4JPM';
// Google Gemini Konfiguration
const GEMINI_API_KEY = Deno.env.get('QUESTION_MEMO_GEMINI') || '';
const GEMINI_MODEL = 'gemini-flash';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
// Azure OpenAI Konfiguration (Backup)
const AZURE_OPENAI_ENDPOINT = 'https://memoroseopenai.openai.azure.com';
const AZURE_OPENAI_KEY = '3082103c9b0d4270a795686ccaa89921';
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
 * Sendet Benutzerfrage + Transkript an Gemini und gibt die Antwort zurück
 */ async function askQuestionWithGemini(question, transcript, functionIdForLog = 'global') {
	const requestId = crypto.randomUUID().substring(0, 8);
	log('INFO', `[${functionIdForLog}][LLM-${requestId}] Starte Gemini-Anfrage für Frage.`);
	try {
		const prompt = `Du bist ein hilfreicher Assistent. Beantworte die folgende Frage basierend auf dem gegebenen Transkript:

Frage: ${question}

Transkript: ${transcript}

Antworte direkt und präzise auf die Frage basierend auf den Informationen im Transkript. Falls die Antwort nicht im Transkript zu finden ist, teile das höflich mit.`;
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
						maxOutputTokens: 512,
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
 */ async function askQuestionWithAzure(question, transcript, functionIdForLog = 'global') {
	const requestId = crypto.randomUUID().substring(0, 8);
	log('INFO', `[${functionIdForLog}][LLM-${requestId}] Starte Azure OpenAI-Anfrage für Frage.`);
	try {
		const prompt = `Du bist ein hilfreicher Assistent. Beantworte die folgende Frage basierend auf dem gegebenen Transkript:

Frage: ${question}

Transkript: ${transcript}

Antworte direkt und präzise auf die Frage basierend auf den Informationen im Transkript. Falls die Antwort nicht im Transkript zu finden ist, teile das höflich mit.`;
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
							content: 'Du bist ein hilfreicher Assistent.',
						},
						{
							role: 'user',
							content: prompt,
						},
					],
					max_tokens: 512,
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
 */ async function answerQuestion(question, transcript, functionIdForLog = 'global') {
	try {
		// Zuerst mit Gemini versuchen
		return await askQuestionWithGemini(question, transcript, functionIdForLog);
	} catch (error) {
		log('WARN', `[${functionIdForLog}] Gemini fehlgeschlagen, fallback auf Azure OpenAI`, error);
		try {
			// Fallback auf Azure OpenAI
			return await askQuestionWithAzure(question, transcript, functionIdForLog);
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
		const { memo_id, question } = requestData;
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
		const { data: memo, error: memoError } = await memoro_sb
			.from('memos')
			.select('*')
			.eq('id', memo_id)
			.single();
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
		// Transkript extrahieren
		const transcript =
			memo.source?.content || memo.source?.transcription || memo.source?.transcript || '';
		log('INFO', `[${functionId}] Extrahiertes Transkript (Länge: ${transcript.length})`);
		if (!transcript) {
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
		log('INFO', `[${functionId}] Sende Frage an LLM: "${question.substring(0, 50)}..."`);
		const answer = await answerQuestion(question.trim(), transcript, functionId);
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
		log('INFO', `[${functionId}] Erstelle neues Memory für Memo ${memo_id} mit der Antwort`);
		const { data: newMemory, error: newMemoryError } = await memoro_sb
			.from('memories')
			.insert({
				memo_id: memo_id,
				title: `Frage: ${question.length > 50 ? question.substring(0, 50) + '...' : question}`,
				content: answer,
				media: null,
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
