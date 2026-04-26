/**
 * Comic module — server endpoints.
 *
 * Current scope (M4):
 *   - POST /storyboard — one-shot panel-sequence suggestion from a text
 *     input (journal entry, note, library review, writing draft,
 *     calendar event description). The client decrypts the source
 *     locally, sends the plaintext + style, and we round-trip to
 *     mana-llm with a JSON-schema system prompt, returning
 *     `{ panels: Array<{ prompt, caption?, dialogue? }> }`. Panel
 *     rendering itself still happens through /picture/generate-with-
 *     reference — this endpoint is pure text → plan.
 *
 * Future (M5+):
 *   - Upload endpoint for comic-specific anchor / backdrop images if
 *     M6 character-cast scope happens; the 'comic' upload slot is
 *     already allowed by verifyMediaOwnership (set in M1).
 *
 * Why not reuse /api/v1/writing/generations?
 *   That endpoint is a free-text prose endpoint (no JSON parsing) and
 *   is wired for one-shot writing drafts. Comic storyboarding wants a
 *   structured Panel[] envelope the client can iterate over cheaply —
 *   different prompt shape, different parser, different observability
 *   tag. Keeping them apart avoids prompt-contamination between the
 *   two use-cases and keeps each module's logs grep-able.
 */

import { Hono } from 'hono';
import { llmJson, LlmError } from '../../lib/llm';
import { MANA_LLM } from '@mana/shared-ai';
import { logger, type AuthVariables } from '@mana/shared-hono';

const STORYBOARD_MODEL = MANA_LLM.STRUCTURED;

type ComicStyle = 'comic' | 'manga' | 'cartoon' | 'graphic-novel' | 'webtoon';

const STYLE_HINTS: Record<ComicStyle, string> = {
	comic: 'US comic book, bold linework, cell-shading, dramatic framing',
	manga: 'Japanese manga, black-and-white with screen tones, dynamic perspective',
	cartoon: 'soft pastel cartoon, rounded shapes, Saturday-morning animation',
	'graphic-novel': 'graphic novel, painterly watercolor, muted atmospheric palette',
	webtoon: 'webtoon, vertical framing, bright saturated colors, soft cel-shading',
};

const VALID_STYLES = Object.keys(STYLE_HINTS) as readonly ComicStyle[];
const MAX_SOURCE_TEXT_CHARS = 8_000;
const MIN_PANEL_COUNT = 2;
const MAX_PANEL_COUNT = 8;

interface StoryboardRequest {
	style: ComicStyle;
	sourceText: string;
	/** Optional — if omitted we ask for 4 panels (plan default). */
	panelCount?: number;
	/** Optional story-level briefing the author wrote at create-time.
	 *  Gets prepended to the source-text so Claude knows the tonal
	 *  register ("make it funny" / "stay serious"). */
	storyContext?: string | null;
	/** Where this text came from — logged only, not sent to the LLM.
	 *  Useful for observability ("which module drives most storyboards"). */
	sourceModule?: string;
}

interface StoryboardPanel {
	prompt: string;
	caption?: string;
	dialogue?: string;
}

interface StoryboardResponse {
	panels: StoryboardPanel[];
	model: string;
	durationMs: number;
}

function isValidStyle(v: unknown): v is ComicStyle {
	return typeof v === 'string' && (VALID_STYLES as readonly string[]).includes(v);
}

function buildSystemPrompt(style: ComicStyle): string {
	const hint = STYLE_HINTS[style];
	return [
		`You are a comic-story editor. Given a short piece of text (journal entry, note, review, or event description), break it into a sequence of visual comic panels.`,
		`Style: ${hint}.`,
		`Return ONLY a JSON object with this exact shape:`,
		`{"panels": [{"prompt": string, "caption"?: string, "dialogue"?: string}, ...]}`,
		`Rules:`,
		`- "prompt" is the visual scene description (what the artist draws). One or two short English sentences. Focus on composition, action, mood, setting. Do NOT describe style — the style prefix is added downstream.`,
		`- "caption" (optional) is a short narration line rendered at the top or bottom of the panel, max 80 chars. Use sparingly — only when scene-setting or transitions need it.`,
		`- "dialogue" (optional) is what the protagonist says inside a speech bubble, max 80 chars. Use when the scene has a spoken moment.`,
		`- Do not number panels. Do not add meta commentary. Do not explain your choices.`,
		`- The protagonist of every panel is the same person (the story's author).`,
	].join('\n');
}

function buildUserPrompt(
	sourceText: string,
	panelCount: number,
	storyContext: string | null | undefined
): string {
	const trimmed = sourceText.trim().slice(0, MAX_SOURCE_TEXT_CHARS);
	const contextBlock = storyContext?.trim()
		? `Story briefing from the author:\n${storyContext.trim()}\n\n---\n\n`
		: '';
	return [
		contextBlock,
		`Source text:\n${trimmed}\n\n---\n\n`,
		`Generate exactly ${panelCount} panels that tell this as a comic. Output the JSON object described in the system message.`,
	].join('');
}

const routes = new Hono<{ Variables: AuthVariables }>();

routes.post('/storyboard', async (c) => {
	const userId = c.get('userId');
	const body = (await c.req.json()) as Partial<StoryboardRequest>;

	if (!isValidStyle(body.style)) {
		return c.json({ error: `Invalid style, expected one of: ${VALID_STYLES.join(', ')}` }, 400);
	}
	if (!body.sourceText || typeof body.sourceText !== 'string') {
		return c.json({ error: 'sourceText required' }, 400);
	}
	if (body.sourceText.trim().length === 0) {
		return c.json({ error: 'sourceText must not be blank' }, 400);
	}

	const panelCount = Math.max(
		MIN_PANEL_COUNT,
		Math.min(MAX_PANEL_COUNT, Number(body.panelCount) || 4)
	);

	const startedAt = Date.now();
	try {
		const parsed = await llmJson<{ panels?: unknown }>({
			model: STORYBOARD_MODEL,
			system: buildSystemPrompt(body.style),
			user: buildUserPrompt(body.sourceText, panelCount, body.storyContext),
			temperature: 0.7,
			maxTokens: 2000,
		});

		const rawPanels = Array.isArray(parsed?.panels) ? parsed.panels : [];
		// Defense-in-depth: coerce + strip unknown shapes, clamp to
		// requested count. If the model returns more panels than asked
		// for we keep the first N; less is fine (fewer credits later).
		const panels: StoryboardPanel[] = rawPanels
			.map((raw): StoryboardPanel | null => {
				if (!raw || typeof raw !== 'object') return null;
				const entry = raw as Record<string, unknown>;
				const prompt = typeof entry.prompt === 'string' ? entry.prompt.trim() : '';
				if (!prompt) return null;
				const caption =
					typeof entry.caption === 'string' && entry.caption.trim().length > 0
						? entry.caption.trim().slice(0, 200)
						: undefined;
				const dialogue =
					typeof entry.dialogue === 'string' && entry.dialogue.trim().length > 0
						? entry.dialogue.trim().slice(0, 200)
						: undefined;
				return { prompt: prompt.slice(0, 800), caption, dialogue };
			})
			.filter((p): p is StoryboardPanel => p !== null)
			.slice(0, panelCount);

		const durationMs = Date.now() - startedAt;

		if (panels.length === 0) {
			logger.warn('comic.storyboard_empty', {
				userId,
				style: body.style,
				sourceModule: body.sourceModule,
				model: STORYBOARD_MODEL,
				durationMs,
			});
			return c.json(
				{
					error: 'Model returned no usable panels',
					detail: 'Try again, shorten the input, or pick a different style',
					durationMs,
				},
				502
			);
		}

		logger.info('comic.storyboard_ok', {
			userId,
			style: body.style,
			sourceModule: body.sourceModule,
			panelCount: panels.length,
			model: STORYBOARD_MODEL,
			durationMs,
		});

		const response: StoryboardResponse = {
			panels,
			model: STORYBOARD_MODEL,
			durationMs,
		};
		return c.json(response);
	} catch (err) {
		const durationMs = Date.now() - startedAt;
		const message = err instanceof Error ? err.message : String(err);
		logger.error('comic.storyboard_failed', {
			userId,
			style: body.style,
			sourceModule: body.sourceModule,
			model: STORYBOARD_MODEL,
			error: message,
			status: err instanceof LlmError ? err.status : undefined,
			durationMs,
		});
		return c.json({ error: 'Storyboard generation failed', detail: message, durationMs }, 500);
	}
});

export { routes as comicRoutes };
