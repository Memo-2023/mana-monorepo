/**
 * System-prompt builder for the function-calling planner.
 *
 * Radically smaller than the pre-migration text-JSON prompt: no tool
 * listing (the LLM gets schemas via the native ``tools`` request
 * field), no format example (the SDK enforces structured tool_calls),
 * no "please return JSON" plea. We just tell the LLM what its job is,
 * how to behave in a reasoning loop, and hand over control.
 *
 * The rendered prompt is ~400 tokens compared to the previous
 * ~6000–8000 — big savings on cost and, more importantly, on the
 * signal-to-noise ratio the model has to filter.
 */

import type { Mission } from '../missions/types';
import type { ResolvedInput } from './types';

export interface SystemPromptInput {
	readonly mission: Mission;
	readonly resolvedInputs: readonly ResolvedInput[];
	/** When set, included verbatim as the agent's persona frame. */
	readonly agentSystemPrompt?: string | null;
	/** When set, appended as the agent's persistent memory. */
	readonly agentMemory?: string | null;
}

export interface SystemPromptOutput {
	readonly systemPrompt: string;
	readonly userPrompt: string;
}

export function buildSystemPrompt(input: SystemPromptInput): SystemPromptOutput {
	const systemPrompt = buildSystemFrame(input);
	const userPrompt = buildUserFrame(input);
	return { systemPrompt, userPrompt };
}

function buildSystemFrame(input: SystemPromptInput): string {
	const agentBlock = renderAgentContext(input);
	return [
		'Du arbeitest im Auftrag des Nutzers an einer langlebigen Mission.',
		'',
		'Dein Vorgehen:',
		'1. Lies zuerst (Read-Tools liefern dir sofort Ergebnisse) — verstehe den Zustand, bevor du schreibst.',
		'2. Führe anschließend die notwendigen Schreib-Tools aus, um das konkrete Ziel umzusetzen.',
		'3. Wiederhole bis zu 5 Planungsrunden: nach jedem Tool-Aufruf bekommst du das Ergebnis zurück und kannst daraus den nächsten Schritt ableiten.',
		'4. Stoppe, wenn das Ziel erreicht ist oder kein sinnvoller nächster Schritt bleibt.',
		'5. Berücksichtige Feedback aus früheren Iterationen — wiederhole keinen Schritt, der zuvor fehlgeschlagen ist, ohne ihn zu ändern.',
		'',
		'Wichtig:',
		'- Nutze ausschließlich die Tools, die dir als Function-Calls bereitgestellt werden. Nennungen in Prosa werden ignoriert.',
		'- Wenn mehrere unabhängige Aktionen anstehen (z. B. "erstelle 8 Fragen"), gib sie in einem einzigen Turn als parallele Tool-Calls aus — das spart Runden.',
		'- Wenn ein Tool einen Fehler zurückgibt, reagiere darauf (anderes Tool probieren oder stoppen) — ignoriere Fehler nicht.',
		agentBlock,
	]
		.filter(Boolean)
		.join('\n');
}

function renderAgentContext(input: SystemPromptInput): string {
	const parts: string[] = [];
	if (input.agentSystemPrompt?.trim()) {
		parts.push('\n<agent_persona>');
		parts.push(input.agentSystemPrompt.trim());
		parts.push('</agent_persona>');
	}
	if (input.agentMemory?.trim()) {
		parts.push('\n<agent_memory>');
		parts.push(input.agentMemory.trim());
		parts.push('</agent_memory>');
	}
	return parts.join('\n');
}

function buildUserFrame(input: SystemPromptInput): string {
	const { mission, resolvedInputs } = input;

	const inputsBlock =
		resolvedInputs.length === 0
			? '_(keine verlinkten Inputs)_'
			: resolvedInputs
					.map((r) => `### ${r.module}/${r.table}: ${r.title ?? r.id}\n${r.content}`)
					.join('\n\n');

	const iterationHistory =
		mission.iterations.length === 0
			? '_(erste Iteration)_'
			: mission.iterations
					.slice(-3)
					.map((it) => {
						const steps = it.plan.map((s) => `  - [${s.status}] ${s.summary}`).join('\n');
						const feedback = it.userFeedback ? `\n  Nutzer-Feedback: ${it.userFeedback}` : '';
						const summary = it.summary ? `\n  Summary: ${it.summary}` : '';
						return `**${it.startedAt}** (${it.overallStatus}):${summary}\n${steps}${feedback}`;
					})
					.join('\n\n');

	return [
		`# Mission: ${mission.title}`,
		'',
		'## Konzept',
		mission.conceptMarkdown || '_(leer)_',
		'',
		'## Konkretes Ziel',
		mission.objective || '_(nicht gesetzt)_',
		'',
		'## Verlinkte Inputs',
		inputsBlock,
		'',
		'## Letzte Iterationen (max. 3)',
		iterationHistory,
		'',
		'---',
		'',
		'Beginne jetzt mit der nächsten Iteration. Rufe die nötigen Tools auf.',
	].join('\n');
}
