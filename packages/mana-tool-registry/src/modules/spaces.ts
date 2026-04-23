/**
 * Spaces — read-only tools for the caller's space membership.
 *
 * Spaces are stored in mana-auth's better-auth `organizations` table.
 * Better-auth exposes a list endpoint at `/api/auth/organization/list`
 * which respects the JWT we forward — no special service-key needed.
 *
 * We expose only `list` and `current` here; mutations (create, invite,
 * delete) go through the regular Spaces UI in the web app, not via
 * agents.
 */

import { z } from 'zod';
import { registerTool } from '../registry.ts';
import type { ToolContext, ToolSpec } from '../types.ts';

const AUTH_URL = () => process.env.MANA_AUTH_URL ?? 'http://localhost:3001';

const spaceSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string().nullable().optional(),
	type: z.enum(['personal', 'brand', 'club', 'family', 'team', 'practice']).optional(),
	role: z.string().optional(),
});

type Space = z.infer<typeof spaceSchema>;

// ─── spaces.list ──────────────────────────────────────────────────

const listInput = z.object({});
const listOutput = z.object({
	spaces: z.array(spaceSchema),
	activeSpaceId: z.string(),
});

async function fetchSpaces(ctx: ToolContext): Promise<Space[]> {
	const res = await fetch(`${AUTH_URL()}/api/auth/organization/list`, {
		headers: { authorization: `Bearer ${ctx.jwt}` },
	});
	if (!res.ok) {
		throw new Error(`mana-auth /organization/list failed: ${res.status} ${res.statusText}`);
	}
	const raw = (await res.json()) as Array<{
		id: string;
		name: string;
		slug?: string | null;
		metadata?: { type?: Space['type'] } | string | null;
		role?: string;
	}>;

	return raw.map((row) => {
		// better-auth stores metadata as JSON string in some configs
		let type: Space['type'] | undefined;
		if (typeof row.metadata === 'string') {
			try {
				const parsed = JSON.parse(row.metadata) as { type?: Space['type'] };
				type = parsed.type;
			} catch {
				type = undefined;
			}
		} else if (row.metadata && typeof row.metadata === 'object') {
			type = row.metadata.type;
		}
		return {
			id: row.id,
			name: row.name,
			slug: row.slug ?? null,
			type,
			role: row.role,
		};
	});
}

export const spacesList: ToolSpec<typeof listInput, typeof listOutput> = {
	name: 'spaces.list',
	module: 'spaces',
	scope: 'user-space',
	policyHint: 'read',
	description:
		'List all Spaces the caller is a member of. The active Space (where data writes land by default) is returned in `activeSpaceId`.',
	input: listInput,
	output: listOutput,
	async handler(_input, ctx) {
		const spaces = await fetchSpaces(ctx);
		return { spaces, activeSpaceId: ctx.spaceId };
	},
};

// ─── Registration barrel ──────────────────────────────────────────

export function registerSpacesTools(): void {
	registerTool(spacesList);
}
