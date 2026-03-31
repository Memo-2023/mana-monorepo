/**
 * Headline and intro generation service for Memoro server.
 *
 * Ported from the NestJS HeadlineService.
 */

import { createServiceClient } from '../lib/supabase';
import { generateText } from '../lib/ai';
import { updateMemoProcessingStatus } from './memo';

// ── Language prompts ───────────────────────────────────────────────────────────

const HEADLINE_PROMPTS: Record<string, string> = {
	de: `Du bist ein KI-Assistent, der prägnante Überschriften und Zusammenfassungen für Sprachaufnahmen erstellt.

Analysiere das folgende Transkript und erstelle:
1. Eine kurze, prägnante Überschrift (max. 60 Zeichen)
2. Eine kurze Zusammenfassung (2-3 Sätze)

Antworte NUR in diesem Format (auf Deutsch):
HEADLINE: <Überschrift>
INTRO: <Zusammenfassung>`,

	en: `You are an AI assistant that creates concise headlines and summaries for voice recordings.

Analyze the following transcript and create:
1. A short, concise headline (max. 60 characters)
2. A brief summary (2-3 sentences)

Reply ONLY in this format (in English):
HEADLINE: <headline>
INTRO: <summary>`,

	fr: `Vous êtes un assistant IA qui crée des titres et des résumés concis pour les enregistrements vocaux.

Analysez la transcription suivante et créez :
1. Un titre court et concis (max. 60 caractères)
2. Un bref résumé (2-3 phrases)

Répondez UNIQUEMENT dans ce format (en français) :
HEADLINE: <titre>
INTRO: <résumé>`,

	es: `Eres un asistente de IA que crea titulares y resúmenes concisos para grabaciones de voz.

Analiza la siguiente transcripción y crea:
1. Un titular corto y conciso (máx. 60 caracteres)
2. Un breve resumen (2-3 oraciones)

Responde SOLO en este formato (en español):
HEADLINE: <titular>
INTRO: <resumen>`,

	it: `Sei un assistente IA che crea titoli e riassunti concisi per le registrazioni vocali.

Analizza la seguente trascrizione e crea:
1. Un titolo breve e conciso (max. 60 caratteri)
2. Un breve riassunto (2-3 frasi)

Rispondi SOLO in questo formato (in italiano):
HEADLINE: <titolo>
INTRO: <riassunto>`,

	nl: `Je bent een AI-assistent die beknopte koppen en samenvattingen maakt voor spraakopnames.

Analyseer de volgende transcriptie en maak:
1. Een korte, bondige kop (max. 60 tekens)
2. Een korte samenvatting (2-3 zinnen)

Antwoord ALLEEN in dit formaat (in het Nederlands):
HEADLINE: <kop>
INTRO: <samenvatting>`,

	pt: `Você é um assistente de IA que cria títulos e resumos concisos para gravações de voz.

Analise a seguinte transcrição e crie:
1. Um título curto e conciso (máx. 60 caracteres)
2. Um breve resumo (2-3 frases)

Responda APENAS neste formato (em português):
HEADLINE: <título>
INTRO: <resumo>`,

	ru: `Вы — ИИ-ассистент, создающий краткие заголовки и резюме для голосовых записей.

Проанализируйте следующую расшифровку и создайте:
1. Короткий, ёмкий заголовок (макс. 60 символов)
2. Краткое резюме (2-3 предложения)

Отвечайте ТОЛЬКО в этом формате (на русском):
HEADLINE: <заголовок>
INTRO: <резюме>`,

	ja: `あなたは音声録音の簡潔な見出しと要約を作成するAIアシスタントです。

以下のトランスクリプトを分析して作成してください：
1. 短くて簡潔な見出し（最大60文字）
2. 簡単な要約（2〜3文）

ONLY このフォーマットで返答してください（日本語で）：
HEADLINE: <見出し>
INTRO: <要約>`,

	ko: `당신은 음성 녹음을 위한 간결한 헤드라인과 요약을 만드는 AI 어시스턴트입니다.

다음 트랜스크립트를 분석하여 만드세요:
1. 짧고 간결한 헤드라인 (최대 60자)
2. 간단한 요약 (2-3문장)

ONLY 이 형식으로 답하세요 (한국어로):
HEADLINE: <헤드라인>
INTRO: <요약>`,

	zh: `您是一名AI助手，为语音录音创建简洁的标题和摘要。

分析以下转录并创建：
1. 简短、简洁的标题（最多60个字符）
2. 简短摘要（2-3句话）

请仅以此格式回答（用中文）：
HEADLINE: <标题>
INTRO: <摘要>`,

	tr: `Ses kayıtları için kısa başlıklar ve özetler oluşturan bir yapay zeka asistanısınız.

Aşağıdaki transkripsiyonu analiz edin ve oluşturun:
1. Kısa ve öz bir başlık (maks. 60 karakter)
2. Kısa bir özet (2-3 cümle)

SADECE bu formatta yanıtlayın (Türkçe olarak):
HEADLINE: <başlık>
INTRO: <özet>`,

	pl: `Jesteś asystentem AI tworzącym zwięzłe nagłówki i podsumowania nagrań głosowych.

Przeanalizuj poniższy transkrypt i utwórz:
1. Krótki, zwięzły nagłówek (maks. 60 znaków)
2. Krótkie podsumowanie (2-3 zdania)

Odpowiedz TYLKO w tym formacie (po polsku):
HEADLINE: <nagłówek>
INTRO: <podsumowanie>`,
};

const FALLBACK_PROMPT = HEADLINE_PROMPTS['de'] ?? '';

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildPrompt(transcript: string, language: string): string {
	const base = language.split('-')[0]?.toLowerCase() ?? 'de';
	const systemPrompt = HEADLINE_PROMPTS[base] ?? HEADLINE_PROMPTS['en'] ?? FALLBACK_PROMPT;
	return `${systemPrompt}\n\n${transcript}`;
}

function parseResponse(content: string): { headline: string; intro: string } {
	const headlineMatch = content.match(/HEADLINE:\s*(.+?)(?=\nINTRO:|$)/s);
	const introMatch = content.match(/INTRO:\s*(.+?)$/s);
	return {
		headline: headlineMatch?.[1]?.trim() ?? 'Neue Aufnahme',
		intro: introMatch?.[1]?.trim() ?? 'Keine Zusammenfassung verfügbar.',
	};
}

function extractTranscript(memo: Record<string, unknown>): string {
	const source = memo.source as Record<string, unknown> | undefined;

	// Preferred: sorted utterances
	const utterances = source?.utterances as Array<{ offset?: number; text?: string }> | undefined;
	if (utterances && utterances.length > 0) {
		return [...utterances]
			.sort((a, b) => (a.offset ?? 0) - (b.offset ?? 0))
			.map((u) => u.text)
			.filter(Boolean)
			.join(' ');
	}

	// Direct transcript fields
	if (typeof memo.transcript === 'string' && memo.transcript) return memo.transcript;
	if (typeof source?.transcript === 'string' && source.transcript) return source.transcript;
	if (typeof source?.content === 'string' && source.content) return source.content;

	// Combined recordings
	const additionalRecordings = source?.additional_recordings as Array<{
		utterances?: Array<{ offset?: number; text?: string }>;
		transcript?: string;
	}> | undefined;
	if (source?.type === 'combined' && additionalRecordings) {
		return additionalRecordings
			.map((rec) => {
				if (rec.utterances && rec.utterances.length > 0) {
					return [...rec.utterances]
						.sort((a, b) => (a.offset ?? 0) - (b.offset ?? 0))
						.map((u) => u.text)
						.filter(Boolean)
						.join(' ');
				}
				return rec.transcript ?? '';
			})
			.filter(Boolean)
			.join('\n\n');
	}

	return '';
}

function detectLanguage(memo: Record<string, unknown>): string {
	const source = memo.source as Record<string, unknown> | undefined;
	const metadata = memo.metadata as Record<string, unknown> | undefined;

	if (typeof source?.primary_language === 'string') return source.primary_language;
	const langs = source?.languages as string[] | undefined;
	if (langs && langs.length > 0) return langs[0] ?? 'de';
	if (typeof metadata?.primary_language === 'string') return metadata.primary_language;
	return 'de';
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Generate headline and intro for a given transcript.
 */
export async function generateHeadlineAndIntro(
	transcript: string,
	language = 'de'
): Promise<{ headline: string; intro: string }> {
	const prompt = buildPrompt(transcript, language);

	try {
		const content = await generateText(prompt, { temperature: 0.7, maxTokens: 512 });
		const result = parseResponse(content);
		console.debug(`[headline] Generated: "${result.headline}" (lang=${language})`);
		return result;
	} catch (error) {
		console.error(
			`[headline] Generation failed: ${error instanceof Error ? error.message : error}`
		);
		return { headline: 'Neue Aufnahme', intro: 'Keine Zusammenfassung verfügbar.' };
	}
}

/**
 * Full pipeline: load memo → generate headline → update memo → broadcast.
 */
export async function processHeadlineForMemo(
	memoId: string
): Promise<{ headline: string; intro: string }> {
	const supabase = createServiceClient();

	await updateMemoProcessingStatus(memoId, 'headline_and_intro', 'processing');

	try {
		const { data: memo, error: memoError } = await supabase
			.from('memos')
			.select('*')
			.eq('id', memoId)
			.single();

		if (memoError || !memo) {
			throw new Error(`Memo not found: ${memoError?.message ?? 'unknown'}`);
		}

		const memoRecord = memo as Record<string, unknown>;
		const transcript = extractTranscript(memoRecord);

		if (!transcript) {
			await updateMemoProcessingStatus(memoId, 'headline_and_intro', 'failed', {
				error: 'No transcript found in memo',
			});
			throw new Error('No transcript found in memo');
		}

		const language = detectLanguage(memoRecord);
		const { headline, intro } = await generateHeadlineAndIntro(transcript, language);

		const { error: updateError } = await supabase
			.from('memos')
			.update({
				title: headline,
				intro,
				updated_at: new Date().toISOString(),
			})
			.eq('id', memoId);

		if (updateError) {
			throw new Error(`Memo update failed: ${updateError.message}`);
		}

		// Broadcast via Supabase Realtime (fire and forget)
		sendBroadcast(supabase, memoId, headline, intro).catch((err) =>
			console.warn(`[headline] Broadcast failed for memo ${memoId}: ${err}`)
		);

		await updateMemoProcessingStatus(memoId, 'headline_and_intro', 'completed', {
			headline,
			language,
		});

		console.log(`[headline] Processed memo ${memoId}: "${headline}"`);
		return { headline, intro };
	} catch (error) {
		const msg = error instanceof Error ? error.message : String(error);
		await updateMemoProcessingStatus(memoId, 'headline_and_intro', 'failed', { error: msg });
		throw error;
	}
}

async function sendBroadcast(
	supabase: ReturnType<typeof createServiceClient>,
	memoId: string,
	headline: string,
	intro: string
): Promise<void> {
	const channel = supabase.channel(`memo-updates-${memoId}`);
	await new Promise<void>((resolve, reject) => {
		const timeout = setTimeout(() => reject(new Error('Broadcast timeout')), 10_000);
		channel.subscribe(async (status: string) => {
			if (status === 'SUBSCRIBED') {
				clearTimeout(timeout);
				await channel.send({
					type: 'broadcast',
					event: 'memo-updated',
					payload: {
						type: 'memo-updated',
						memoId,
						changes: { title: headline, intro, updated_at: new Date().toISOString() },
						source: 'headline-ai-service',
					},
				});
				supabase.removeChannel(channel);
				resolve();
			}
		});
	});
}
