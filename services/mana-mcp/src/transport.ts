/**
 * Streamable HTTP transport handler.
 *
 * Pattern lifted from apps/api/src/mcp/server.ts (the Mana-internal MCP
 * endpoint), but with per-request auth — every session is created against
 * a verified user, and sessions are scoped to that user for their lifetime.
 *
 * Lifecycle:
 *   POST /mcp  (no session id)  → initialize, returns Mcp-Session-Id header
 *   POST /mcp  (with session id) → JSON-RPC message in
 *   GET  /mcp  (with session id) → SSE stream out
 *   DELETE /mcp (with session id) → close
 */

import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createMcpServerForUser } from './mcp-adapter.ts';
import type { VerifiedUser } from './auth.ts';

interface SessionEntry {
	transport: WebStandardStreamableHTTPServerTransport;
	userId: string;
}

const sessions = new Map<string, SessionEntry>();

export async function handleMcpRequest(req: Request, user: VerifiedUser): Promise<Response> {
	const sessionId = req.headers.get('mcp-session-id');

	// Existing session — must belong to the same user.
	if (sessionId && sessions.has(sessionId)) {
		const entry = sessions.get(sessionId)!;
		if (entry.userId !== user.userId) {
			return new Response(JSON.stringify({ error: 'Session belongs to a different user' }), {
				status: 403,
				headers: { 'content-type': 'application/json' },
			});
		}
		return entry.transport.handleRequest(req);
	}

	// New session: only POST without session id is a valid initialization.
	if (req.method === 'POST' && !sessionId) {
		const transport = new WebStandardStreamableHTTPServerTransport({
			sessionIdGenerator: () => crypto.randomUUID(),
			onsessioninitialized: (id) => {
				sessions.set(id, { transport, userId: user.userId });
			},
			onsessionclosed: (id) => {
				sessions.delete(id);
			},
		});

		const server = createMcpServerForUser(user);
		await server.connect(transport);

		return transport.handleRequest(req);
	}

	if (sessionId && !sessions.has(sessionId)) {
		return new Response(JSON.stringify({ error: 'Session not found' }), {
			status: 404,
			headers: { 'content-type': 'application/json' },
		});
	}

	return new Response(JSON.stringify({ error: 'Bad request' }), {
		status: 400,
		headers: { 'content-type': 'application/json' },
	});
}

/** Test-only — sessions accumulate across requests otherwise. */
export function __resetSessionsForTests(): void {
	sessions.clear();
}
