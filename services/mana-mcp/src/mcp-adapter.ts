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
	evaluatePolicy,
	getRegistry,
	type AnyToolSpec,
	type Logger,
	type ToolContext,
	type UserPolicySettings,
} from '@mana/tool-registry';
import type { VerifiedUser } from './auth.ts';
import type { Config } from './config.ts';
import { appendInvocation, getRecentInvocations } from './invocation-log.ts';
import { policyDecisionsTotal, toolDuration, toolInvocationsTotal } from './metrics.ts';

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
 * Per-user policy settings. Today hard-coded to "no destructive tools, default
 * rate-limit". Next PR moves this to the user's profile via mana-auth so the
 * settings UI can toggle destructive opt-ins per tool.
 */
function settingsFor(_user: VerifiedUser): UserPolicySettings {
	return { allowDestructive: [] };
}

/**
 * Build an MCP server bound to a single user/session. Each MCP session gets
 * its own server instance — userId and JWT are captured in closures so tools
 * can never leak across sessions.
 */
export function createMcpServerForUser(user: VerifiedUser, config: Config): McpServer {
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
				toolInvocationsTotal.inc({ tool: spec.name, outcome: 'input-invalid' });
				return {
					isError: true,
					content: [{ type: 'text' as const, text: `Invalid input for ${spec.name}: ${msg}` }],
				};
			}

			// ─── Policy gate ─────────────────────────────────────────────
			// Evaluate unless explicitly disabled. In log-only mode the
			// decision is recorded but never blocks; in enforce mode a
			// deny aborts the call with the reminder payload attached.
			if (config.policyMode !== 'off') {
				const decision = evaluatePolicy({
					spec,
					ctx: ctxFor(spec.name),
					rawInput: parsed,
					userSettings: settingsFor(user),
					recentInvocations: getRecentInvocations(user.userId),
				});

				if (!decision.allow) {
					policyDecisionsTotal.inc({
						decision: 'deny',
						reason: decision.reason ?? 'unknown',
						mode: config.policyMode,
					});
					const label = config.policyMode === 'enforce' ? 'DENY' : 'WOULD-DENY';
					console.warn(
						`[mana-mcp policy] ${label} tool=${spec.name} user=${user.userId.slice(0, 8)} reason=${decision.reason}`
					);
					if (config.policyMode === 'enforce') {
						const body = decision.reminder
							? `${decision.reason ?? 'policy-deny'}: ${decision.reminder}`
							: (decision.reason ?? 'policy-deny');
						return {
							isError: true,
							content: [{ type: 'text' as const, text: `Tool ${spec.name} not allowed: ${body}` }],
						};
					}
				} else if (decision.reminder) {
					policyDecisionsTotal.inc({
						decision: 'flagged',
						reason: 'injection-marker',
						mode: config.policyMode,
					});
					console.info(`[mana-mcp policy] FLAG tool=${spec.name} user=${user.userId.slice(0, 8)}`);
				} else {
					policyDecisionsTotal.inc({
						decision: 'allow',
						reason: 'clean',
						mode: config.policyMode,
					});
				}
			}

			// Record the invocation before we run the handler so a long-running
			// handler's duration doesn't open a rate-limit gap.
			appendInvocation(user.userId, spec.name);

			const endTimer = toolDuration.startTimer({ tool: spec.name, outcome: 'success' });
			try {
				const result = await spec.handler(parsed, ctxFor(spec.name));
				toolInvocationsTotal.inc({ tool: spec.name, outcome: 'success' });
				endTimer({ tool: spec.name, outcome: 'success' });
				return {
					content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
				};
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				toolInvocationsTotal.inc({ tool: spec.name, outcome: 'handler-error' });
				endTimer({ tool: spec.name, outcome: 'handler-error' });
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
