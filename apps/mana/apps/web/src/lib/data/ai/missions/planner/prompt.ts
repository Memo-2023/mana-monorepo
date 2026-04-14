/**
 * Prompt builder for the Mission Planner.
 *
 * Produces a system + user message pair the LLM backend can consume. The
 * grammar we ask the model to return is deliberately small (JSON in a
 * fenced block, one shape) — the parser is strict, and we'd rather the
 * LLM mess up in a detectable way than produce half-valid output.
 *
 * Keeps everything the Planner sees inside the prompt, nothing ambient —
 * makes the task reproducible and unit-testable without a live LLM.
 */

import type { AiPlanInput } from './types';

export interface PlannerMessages {
	readonly system: string;
	readonly user: string;
}

export function buildPlannerPrompt(input: AiPlanInput): PlannerMessages {
	return {
		system: buildSystemPrompt(input),
		user: buildUserPrompt(input),
	};
}

function buildSystemPrompt(input: AiPlanInput): string {
	const toolBlock = input.availableTools
		.map((t) => {
			const params = t.parameters
				.map((p) => {
					const req = p.required ? ' (required)' : '';
					const enumeration = p.enum ? ` [${p.enum.join('|')}]` : '';
					return `    - ${p.name}: ${p.type}${enumeration}${req} — ${p.description}`;
				})
				.join('\n');
			return `  • ${t.name} (${t.module}) — ${t.description}\n${params || '    (no parameters)'}`;
		})
		.join('\n');

	return `Du bist eine KI, die im Auftrag des Nutzers an einer langlebigen Mission arbeitet.

Dein Job: aus dem aktuellen Mission-Kontext einen kurzen, konkreten Plan ableiten — 1 bis 5 Schritte, jeder ein Tool-Aufruf auf Nutzerdaten. Jeder Schritt MUSS eine Begründung haben (rationale), die der Nutzer in der Review-UI sieht.

Wichtige Regeln:
1. Nutze NUR Tools aus der Liste unten. Unbekannte Tools → Plan invalide.
2. Jeder Step wird als Proposal gestaged — der Nutzer approved oder rejected. Du schreibst nie direkt.
3. Berücksichtige das Feedback aus vorherigen Iterationen (unten im User-Prompt). Wenn ein Vorschlag rejected wurde, wiederhole ihn nicht ohne Änderung.
4. Antworte AUSSCHLIESSLICH mit einem JSON-Block in folgendem Format, keine Prosa davor/danach:

\`\`\`json
{
  "summary": "Ein Satz was du in dieser Iteration tust.",
  "steps": [
    {
      "summary": "Kurzer Schritt-Titel",
      "toolName": "create_task",
      "params": { "title": "…" },
      "rationale": "Warum genau jetzt, auf Basis welchen Inputs."
    }
  ]
}
\`\`\`

Verfügbare Tools:
${toolBlock || '  (keine Tools verfügbar — gib leeren steps zurück)'}`;
}

function buildUserPrompt(input: AiPlanInput): string {
	const { mission, resolvedInputs } = input;

	const inputsBlock =
		resolvedInputs.length === 0
			? '_(keine verlinkten Inputs)_'
			: resolvedInputs
					.map((r) => {
						const header = `### ${r.module}/${r.table}: ${r.title ?? r.id}`;
						return `${header}\n${r.content}`;
					})
					.join('\n\n');

	const iterationHistory =
		mission.iterations.length === 0
			? '_(erste Iteration)_'
			: mission.iterations
					.slice(-3) // only the last 3 to keep the prompt tight
					.map((it) => {
						const steps = it.plan.map((s) => `  - [${s.status}] ${s.summary}`).join('\n');
						const feedback = it.userFeedback ? `\n  Nutzer-Feedback: ${it.userFeedback}` : '';
						const summary = it.summary ? `\n  Summary: ${it.summary}` : '';
						return `**${it.startedAt}** (${it.overallStatus}):${summary}\n${steps}${feedback}`;
					})
					.join('\n\n');

	return `# Mission: ${mission.title}

## Konzept
${mission.conceptMarkdown || '_(leer)_'}

## Konkretes Ziel
${mission.objective}

## Verlinkte Inputs
${inputsBlock}

## Letzte Iterationen (max. 3)
${iterationHistory}

---

Erzeuge jetzt einen Plan für die nächste Iteration.`;
}
