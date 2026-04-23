/**
 * Catalog loader + zod-validated schema. Centralised so seed.ts and
 * cleanup.ts (and any future runner) all see the same shape.
 *
 * The JSON itself lives at `catalog.json` and is the human-edited source.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { z } from 'zod';

const cadenceSchema = z.enum(['daily', 'weekdays', 'hourly']);

const personaSchema = z.object({
	name: z.string().min(1),
	email: z
		.string()
		.email()
		.refine((e) => e.endsWith('@mana.test'), {
			message: 'persona emails must end in @mana.test (non-existent TLD, no real bounces)',
		}),
	archetype: z.string().min(1),
	systemPrompt: z.string().min(20),
	moduleMix: z.record(z.string(), z.number().nonnegative()),
	tickCadence: cadenceSchema.default('daily'),
});

export type PersonaSpec = z.infer<typeof personaSchema>;

const catalogSchema = z.object({
	$schema: z.string().optional(),
	description: z.string().optional(),
	personas: z.array(personaSchema).min(1),
});

export function loadCatalog(): { personas: PersonaSpec[] } {
	const here = dirname(fileURLToPath(import.meta.url));
	const raw = readFileSync(join(here, 'catalog.json'), 'utf-8');
	const parsed = JSON.parse(raw) as unknown;
	const validated = catalogSchema.parse(parsed);
	return { personas: validated.personas };
}
