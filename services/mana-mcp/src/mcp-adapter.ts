/**
 * Bridges `@mana/tool-registry` → MCP `McpServer`.
 *
 * For each tool in the registry, we register an MCP tool whose:
 *   - name comes verbatim from the spec
 *   - description comes verbatim from the spec
 *   - input shape is the registry's zod schema (already typed)
 *   - handler invokes the registry handler with a fully-built ToolContext
 *
 * MCP's tool-output convention is `{ content: [{ type: 'text', text }] }`,
 * so we serialize the registry handler's parsed output to JSON and wrap.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z, type ZodObject, type ZodRawShape } from 'zod';
import {
	MasterKeyClient,
	getRegistry,
	type AnyToolSpec,
	type Logger,
	type ToolContext,
} from '@mana/tool-registry';
import type { VerifiedUser } from './auth.ts';

/**
 * Shared across all sessions — the client caches MKs per userId with a
 * short TTL so a single MCP session invoking N encrypted tools fetches
 * the vault at most once per TTL window.
 */
const masterKeyClient = new MasterKeyClient({
	authUrl: process.env.MANA_AUTH_URL ?? 'http://localhost:3001',
});

/** Tools with `scope: 'admin'` are never exposed to MCP clients. */
function isExposable(spec: AnyToolSpec): boolean {
	return spec.scope === 'user-space';
}

/**
 * Extract the raw shape from a zod object schema. The MCP SDK's
 * `server.tool()` API expects `Record<string, ZodTypeAny>`, not a wrapping
 * `ZodObject`. Tools that don't use a ZodObject input (uncommon — most are
 * objects) get registered without parameters.
 */
function shapeOf(schema: AnyToolSpec['input']): ZodRawShape | null {
	if (schema instanceof z.ZodObject) {
		return (schema as ZodObject<ZodRawShape>).shape;
	}
	return null;
}

function makeLogger(prefix: string): Logger {
	const fmt = (level: string, msg: string, meta?: Record<string, unknown>): string =>
		meta && Object.keys(meta).length > 0
			? `[${level}] ${prefix} ${msg} ${JSON.stringify(meta)}`
			: `[${level}] ${prefix} ${msg}`;
	return {
		debug: (msg, meta) => console.debug(fmt('debug', msg, meta)),
		info: (msg, meta) => console.info(fmt('info', msg, meta)),
		warn: (msg, meta) => console.warn(fmt('warn', msg, meta)),
		error: (msg, meta) => console.error(fmt('error', msg, meta)),
	};
}

/**
 * Build an MCP server bound to a single user/session. Each MCP session gets
 * its own server instance — userId and JWT are captured in closures so tools
 * can never leak across sessions.
 */
export function createMcpServerForUser(user: VerifiedUser): McpServer {
	const server = new McpServer({ name: 'mana', version: '0.1.0' }, { capabilities: { tools: {} } });

	const baseCtx: Omit<ToolContext, 'logger'> = {
		userId: user.userId,
		spaceId: user.spaceId,
		jwt: user.jwt,
		invoker: 'mcp',
		getMasterKey: () => masterKeyClient.getKey(user.userId, user.jwt),
	};

	for (const spec of getRegistry()) {
		if (!isExposable(spec)) continue;

		const shape = shapeOf(spec.input);
		const ctxFor = (toolName: string): ToolContext => ({
			...baseCtx,
			logger: makeLogger(`tool=${toolName} user=${user.userId.slice(0, 8)}`),
		});

		const invoke = async (rawArgs: unknown) => {
			let parsed: unknown;
			try {
				parsed = spec.input.parse(rawArgs);
			} catch (err) {
				const msg =
					err instanceof z.ZodError
						? err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
						: String(err);
				return {
					isError: true,
					content: [{ type: 'text' as const, text: `Invalid input for ${spec.name}: ${msg}` }],
				};
			}

			try {
				const result = await spec.handler(parsed, ctxFor(spec.name));
				return {
					content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
				};
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				return {
					isError: true,
					content: [{ type: 'text' as const, text: `Tool ${spec.name} failed: ${msg}` }],
				};
			}
		};

		if (shape && Object.keys(shape).length > 0) {
			server.tool(spec.name, spec.description, shape, invoke);
		} else {
			server.tool(spec.name, spec.description, invoke);
		}
	}

	return server;
}
