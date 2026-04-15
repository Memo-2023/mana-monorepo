/**
 * Planner contract — input/output shape consumed by the prompt builder
 * and parser. Identical between browser and server runtimes.
 */

import type { Mission } from '../missions/types';

export interface ResolvedInput {
	readonly id: string;
	readonly module: string;
	readonly table: string;
	readonly title?: string;
	readonly content: string;
}

export interface AvailableTool {
	readonly name: string;
	readonly module: string;
	readonly description: string;
	readonly parameters: ReadonlyArray<{
		readonly name: string;
		readonly type: string;
		readonly required: boolean;
		readonly description: string;
		readonly enum?: readonly string[];
	}>;
}

export interface AiPlanInput {
	readonly mission: Mission;
	readonly resolvedInputs: readonly ResolvedInput[];
	readonly availableTools: readonly AvailableTool[];
}

export interface PlannedStep {
	readonly summary: string;
	readonly toolName: string;
	readonly params: Record<string, unknown>;
	readonly rationale: string;
}

export interface AiPlanOutput {
	readonly steps: readonly PlannedStep[];
	readonly summary: string;
	/**
	 * Optional capture of the prompt + raw response, populated by the
	 * planner implementation when AI Debug is enabled. The runner reads
	 * this and persists it locally — never synced.
	 */
	readonly debug?: {
		readonly systemPrompt: string;
		readonly userPrompt: string;
		readonly rawResponse: string;
		readonly latencyMs: number;
		readonly backendId?: string;
		readonly model?: string;
	};
}
