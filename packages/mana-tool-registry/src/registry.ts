/**
 * In-memory tool registry.
 *
 * Tools are registered at consumer-process startup (see `modules/index.ts`
 * barrel). Registration is idempotent by name — a duplicate throws, because
 * two specs with the same name would be a silent correctness bug.
 */

import type { z } from 'zod';
import type { AnyToolSpec, ModuleId, ToolSpec } from './types.ts';

const registry = new Map<string, AnyToolSpec>();

export function registerTool<I extends z.ZodTypeAny, O extends z.ZodTypeAny>(
	spec: ToolSpec<I, O>
): void {
	if (registry.has(spec.name)) {
		throw new Error(
			`tool-registry: duplicate tool name "${spec.name}". ` +
				`Each tool must have a unique canonical name across all modules.`
		);
	}
	registry.set(spec.name, spec as unknown as AnyToolSpec);
}

export function getTool(name: string): AnyToolSpec | undefined {
	return registry.get(name);
}

export function getRegistry(): readonly AnyToolSpec[] {
	return [...registry.values()];
}

export function getToolsByModule(module: ModuleId): readonly AnyToolSpec[] {
	return getRegistry().filter((t) => t.module === module);
}

/** Test-only — the registry is a module-level singleton otherwise. */
export function __resetRegistryForTests(): void {
	registry.clear();
}
