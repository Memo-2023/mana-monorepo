import { Hono } from 'hono';
import type { MiddlewareHandler } from 'hono';
import { createTranscribeRoutes } from './routes/transcribe.ts';

const app = new Hono();

// ─── Service key middleware ───────────────────────────────────────────────────

function serviceKeyMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const expectedKey = process.env.SERVICE_KEY;

    if (!expectedKey) {
      console.error('[Auth] SERVICE_KEY env var is not configured');
      return c.json({ error: 'Server misconfiguration' }, 500);
    }

    const providedKey = c.req.header('X-Service-Key');

    if (!providedKey || providedKey !== expectedKey) {
      console.warn(`[Auth] Unauthorized request to ${c.req.path} — invalid or missing X-Service-Key`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    await next();
  };
}

// ─── Health check (no auth) ───────────────────────────────────────────────────

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'memoro-audio-server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── Protected routes ─────────────────────────────────────────────────────────

app.use('/api/*', serviceKeyMiddleware());

const transcribeRoutes = createTranscribeRoutes();
app.route('/api/v1/transcribe', transcribeRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────

app.notFound((c) => {
  return c.json({ error: `Not found: ${c.req.method} ${c.req.path}` }, 404);
});

// ─── Error handler ────────────────────────────────────────────────────────────

app.onError((err, c) => {
  console.error(`[Error] Unhandled error on ${c.req.method} ${c.req.path}:`, err);
  return c.json({ error: 'Internal server error' }, 500);
});

// ─── Start ────────────────────────────────────────────────────────────────────

const port = parseInt(process.env.PORT ?? '3016', 10);

console.log(`[Server] Memoro Audio Server starting on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
