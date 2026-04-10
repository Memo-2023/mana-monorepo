/* eslint-disable no-console */
/**
 * Generate character dossiers for the Who module.
 *
 * One-shot research task: for every character in CHARACTERS, ask a strong
 * cloud LLM (default: google/gemini-2.5-pro via mana-llm) to research the
 * person and emit a structured CharacterDossier as JSON. The dossier
 * captures voice, values, era, role, achievements, anecdotes, and the
 * forbidden-early-words list — everything the small runtime model needs
 * to roleplay convincingly without making things up.
 *
 * Run:
 *   bun run apps/api/scripts/generate-who-dossiers.ts            # missing only
 *   bun run apps/api/scripts/generate-who-dossiers.ts --force    # overwrite all
 *   bun run apps/api/scripts/generate-who-dossiers.ts --id 33    # one character
 *   bun run apps/api/scripts/generate-who-dossiers.ts --model anthropic/claude-3.5-sonnet
 *
 * Output: apps/api/src/modules/who/data/dossiers/{id}.json — one file per
 * character, gitted, manually editable. The runtime loader picks them up
 * automatically.
 *
 * Calls Google's Gemini API directly via its OpenAI-compatible endpoint
 * (https://generativelanguage.googleapis.com/v1beta/openai/chat/completions)
 * rather than going through mana-llm — keeps the one-shot research task
 * decoupled from the shared LLM gateway. Requires GOOGLE_API_KEY (or
 * GOOGLE_GENAI_API_KEY) to be exported. The repo stores it in .env.secrets.
 *
 * This is intentionally idempotent and crash-resumable: each character is
 * written immediately after a successful response, so a partial run can be
 * resumed by re-invoking without --force.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHARACTERS } from '../src/modules/who/data/characters';
import {
	CharacterDossierSchema,
	type CharacterDossier,
} from '../src/modules/who/data/dossier-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DOSSIER_DIR = join(__dirname, '../src/modules/who/data/dossiers');

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
const MANA_LLM_URL = process.env.MANA_LLM_URL || 'http://localhost:3025';

// Parse CLI flags
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
// Provider switch: by default use Google Gemini (cloud, strong quality).
// --via-mana-llm flips to the local LLM gateway, useful as a fallback when
// the cloud free-tier quota is exhausted.
const VIA_MANA_LLM = args.includes('--via-mana-llm');
const ID_ARG = (() => {
	const i = args.indexOf('--id');
	if (i === -1) return null;
	const n = Number(args[i + 1]);
	return Number.isFinite(n) ? n : null;
})();
const MODEL = (() => {
	const i = args.indexOf('--model');
	const fallback = VIA_MANA_LLM ? 'ollama/gemma3:27b' : 'gemini-2.5-pro';
	if (i === -1) return fallback;
	return args[i + 1] ?? fallback;
})();

// ─── Prompt construction ────────────────────────────────────
//
// The model gets the character's name and category as the only seed.
// Everything else — facts, voice, hints — it must research and emit as
// validated JSON. We give it the exact JSON schema we want (paraphrased
// in prose, since gemini-2.5-pro follows prose schema descriptions
// better than raw JSON Schema in some cases).

function buildResearchPrompt(name: string, category: string): string {
	return `Du erstellst ein Dossier über die historische Person "${name}" (Kategorie: ${category}) für ein KI-Ratespiel. Ein KLEINES Sprachmodell (gemma3:4b) wird dieses Dossier später nutzen, um die Person im Dialog zu verkörpern, ohne ihren Namen zu verraten. Deine Recherche muss daher faktentreu, konkret und handlungsleitend sein.

WICHTIG: Antworte AUSSCHLIESSLICH mit gültigem JSON. Kein Markdown, keine Erklärung, kein Code-Fence. Nur das JSON-Objekt. Alle Texte müssen in Deutsch (de) UND Englisch (en) vorhanden sein.

Schema:
{
  "voice": { "de": string, "en": string },
    // 2-3 Sätze: Sprechstil, Tonfall, sprachliche Eigenheiten der Person.
    // KEINE identitätsverratenden Fakten (kein Name, Beruf, Ort, Werk).
    // Beispiel für Konfuzius: "Spricht in kurzen, bedeutungsvollen Sätzen.
    // Antwortet auf Fragen oft mit Gegenfragen. Ruhig, geduldig, lehrhaft."

  "values": { "de": [string, ...], "en": [string, ...] },
    // 3-5 Stichworte zu Werten/Charakter (z.B. "Neugier", "Ehre", "Mitgefühl")

  "era": { "de": string, "en": string },
    // Vage Zeitangabe, z.B. "spätes 2. Jahrtausend v. Chr." oder "Renaissance"

  "region": { "de": string, "en": string },
    // Vage geografische Angabe, z.B. "Niltal" oder "Norditalien"

  "role": { "de": string, "en": string },
    // Beruf/Stand in 2-4 Worten, z.B. "Herrscherin", "Naturphilosoph"

  "achievements": { "de": [string, ...], "en": [string, ...] },
    // 5-8 KONKRETE, historisch verifizierte Errungenschaften/Werke.
    // Jeweils 1-2 Sätze. Diese werden später als Anekdoten freigegeben.

  "anecdotes": { "de": [string, ...], "en": [string, ...] },
    // 5-8 charakteristische, KURZE Anekdoten oder Episoden (1-2 Sätze).
    // Müssen historisch belegt sein — KEINE Halluzinationen.

  "relationships": { "de": [string, ...], "en": [string, ...] },
    // 3-5 wichtige Personen + Verhältnis. 1 Satz pro Eintrag.
    // z.B. "Thutmosis III. — mein Stiefsohn und Nachfolger"

  "forbiddenEarly": [string, ...],
    // 8-15 Wörter/Begriffe, die in den ersten Spielzügen NICHT fallen
    // dürfen, weil sie die Person sofort verraten würden. Sprachneutral.
    // ENTHÄLT IMMER: alle Bestandteile des eigenen Namens (Vor-, Nach-,
    // Bei-Name), sowie die offensichtlichsten Schlagwörter (wichtigster
    // Ort, wichtigstes Werk, wichtigster Titel, ggf. Ehepartner).
    // Beispiel für Hatschepsut: ["Hatschepsut", "Pharaonin", "Pharao",
    // "Ägypten", "Niltal", "Deir el-Bahari", "Amun", "Thutmosis"]

  "commonWrongGuesses": [
    {
      "guess": string,
      "correction": { "de": string, "en": string }
    },
    ...
  ],
    // 3-6 typische Fehlraten + wie der Charakter sie höflich korrigiert,
    // OHNE den eigenen Namen zu nennen. Die "guess" ist der Name, den
    // ein User raten könnte. Die "correction" ist im Charakter formuliert.
    // Beispiel für Hatschepsut + guess "Kleopatra": "Nein, ich lebte
    // viele Jahrhunderte vor jener letzten Königin. Mein Reich war
    // jünger und mein Stil ein anderer."

  "hints": {
    "vague":  { "de": string, "en": string },
    "medium": { "de": string, "en": string },
    "strong": { "de": string, "en": string }
  }
    // Drei Hinweise mit aufsteigender Schwierigkeit:
    // - vague:  Sehr indirekt, nur Stimmung/Epoche. Darf KEINE Wörter
    //           aus forbiddenEarly enthalten.
    // - medium: Tätigkeitsfeld + grobe Zeit. Wenige forbiddenEarly-Wörter ok.
    // - strong: Konkreter Hinweis, fast verraten. Alles erlaubt außer dem Namen.
}

EXTREM WICHTIG — Struktur der Listen-Felder:
Jedes Feld vom Typ "Liste von Strings" (values, achievements, anecdotes, relationships) MUSS exakt diese Form haben:
{
  "de": ["erster Eintrag auf Deutsch", "zweiter Eintrag auf Deutsch", "..."],
  "en": ["first entry in English", "second entry in English", "..."]
}
NICHT als flache Liste \`["..."]\`. NICHT als Liste mit Sprachpaaren. IMMER ein Objekt mit zwei Schlüsseln "de" und "en", deren Werte jeweils Arrays von Strings sind.

Recherche-Anforderungen:
1. Alle Fakten müssen historisch korrekt und verifizierbar sein. Lieber weglassen als raten.
2. Anekdoten müssen die Person CHARAKTERISIEREN, nicht nur Daten auflisten.
3. Achte besonders auf forbiddenEarly — vergisst du hier ein offensichtliches Wort, ist das Spiel kaputt.
4. Schreibe DE und EN unabhängig voneinander, nicht maschinell übersetzt.
5. Antworte NUR mit dem JSON-Objekt. Beginne deine Antwort mit "{".`;
}

// ─── LLM call ───────────────────────────────────────────────

async function callLLM(prompt: string): Promise<unknown> {
	const url = VIA_MANA_LLM ? `${MANA_LLM_URL}/v1/chat/completions` : GEMINI_URL;
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };

	if (!VIA_MANA_LLM) {
		if (!GOOGLE_API_KEY) {
			throw new Error(
				'GOOGLE_API_KEY is not set. Export it before running:\n' +
					'  export GOOGLE_API_KEY=$(grep ^GOOGLE_API_KEY .env.secrets | cut -d= -f2)'
			);
		}
		headers.Authorization = `Bearer ${GOOGLE_API_KEY}`;
	}

	const res = await fetch(url, {
		method: 'POST',
		headers,
		body: JSON.stringify({
			model: MODEL,
			messages: [
				{
					role: 'system',
					content:
						'Du bist ein historischer Recherche-Assistent. Du antwortest ausschließlich mit gültigem JSON, niemals mit Markdown oder Erklärungen.',
				},
				{ role: 'user', content: prompt },
			],
			temperature: 0.3,
			// 8k is enough headroom for the full bilingual dossier (DE+EN
			// doubles every text field). Anything less risks truncation
			// mid-string and a JSON parse error.
			max_tokens: 8000,
			response_format: { type: 'json_object' },
		}),
	});

	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(`LLM HTTP ${res.status}: ${text.slice(0, 200)}`);
	}

	const data = (await res.json()) as {
		choices?: Array<{ message?: { content?: string } }>;
	};
	const raw = data.choices?.[0]?.message?.content ?? '';
	if (!raw.trim()) {
		throw new Error('LLM returned empty content');
	}

	// Strip accidental markdown fences if the model adds them despite the prompt
	const cleaned = raw
		.replace(/^```(?:json)?\s*/i, '')
		.replace(/\s*```\s*$/i, '')
		.trim();

	try {
		return JSON.parse(cleaned);
	} catch (err) {
		throw new Error(
			`LLM output is not valid JSON: ${err instanceof Error ? err.message : String(err)}\n--- raw output (first 500 chars) ---\n${cleaned.slice(0, 500)}`
		);
	}
}

// ─── Per-character workflow ─────────────────────────────────

async function generateOne(character: (typeof CHARACTERS)[number]): Promise<void> {
	const outPath = join(DOSSIER_DIR, `${character.id}.json`);

	if (!FORCE && existsSync(outPath)) {
		console.log(`  ⊘ skip ${character.id} ${character.name} (exists, use --force to regen)`);
		return;
	}

	console.log(`  ⟳ generating ${character.id} ${character.name}…`);
	const prompt = buildResearchPrompt(character.name, character.category);

	let parsedJson: unknown;
	try {
		parsedJson = await callLLM(prompt);
	} catch (err) {
		console.error(`  ✗ ${character.id} ${character.name}: LLM call failed`);
		console.error(`    ${err instanceof Error ? err.message : String(err)}`);
		return;
	}

	// Inject id + name (the model doesn't know the canonical id, and we
	// want the dossier to self-identify so the loader can sanity-check)
	const withIds = {
		id: character.id,
		name: character.name,
		...(parsedJson as object),
	};

	let dossier: CharacterDossier;
	try {
		dossier = CharacterDossierSchema.parse(withIds);
	} catch (err) {
		console.error(`  ✗ ${character.id} ${character.name}: schema validation failed`);
		console.error(`    ${err instanceof Error ? err.message : String(err)}`);
		// Save the raw output for manual inspection
		const rawPath = join(DOSSIER_DIR, `${character.id}.raw.json`);
		writeFileSync(rawPath, JSON.stringify(withIds, null, 2));
		console.error(`    raw output saved to ${rawPath}`);
		return;
	}

	// Soft sanity check: forbiddenEarly should contain at least one part
	// of the character's name. Models occasionally forget this and the
	// resulting puzzle is broken.
	const nameParts = character.name
		.toLowerCase()
		.split(/\s+/)
		.filter((p) => p.length >= 4);
	const forbiddenLower = dossier.forbiddenEarly.map((s) => s.toLowerCase());
	const hasNamePart = nameParts.some((p) => forbiddenLower.some((f) => f.includes(p)));
	if (!hasNamePart) {
		console.warn(
			`  ⚠ ${character.id} ${character.name}: forbiddenEarly does not contain any name part — manual review recommended`
		);
	}

	writeFileSync(outPath, JSON.stringify(dossier, null, 2) + '\n');
	console.log(`  ✓ ${character.id} ${character.name}`);
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
	if (!existsSync(DOSSIER_DIR)) {
		mkdirSync(DOSSIER_DIR, { recursive: true });
	}

	const targets = ID_ARG ? CHARACTERS.filter((c) => c.id === ID_ARG) : CHARACTERS;
	if (targets.length === 0) {
		console.error(`No characters matched (id=${ID_ARG}).`);
		process.exit(1);
	}

	console.log(`Generating ${targets.length} dossier(s) using model: ${MODEL}`);
	console.log(
		`Provider: ${VIA_MANA_LLM ? `mana-llm (${MANA_LLM_URL})` : `Google Gemini (${GEMINI_URL})`}`
	);
	console.log(`Output dir: ${DOSSIER_DIR}`);
	console.log(FORCE ? 'Mode: --force (overwrite existing)' : 'Mode: skip existing');
	console.log('');

	// Pace requests at ~7 seconds per call to stay under Gemini Flash's
	// free-tier RPM limit (~10 RPM). Skipped for the first item and for
	// single-id runs since neither risks hitting the limit.
	for (let i = 0; i < targets.length; i++) {
		const character = targets[i]!;
		if (i > 0) {
			await new Promise((resolve) => setTimeout(resolve, 7000));
		}
		await generateOne(character);
	}

	console.log('\nDone.');
}

main().catch((err) => {
	console.error('Fatal:', err);
	process.exit(1);
});
