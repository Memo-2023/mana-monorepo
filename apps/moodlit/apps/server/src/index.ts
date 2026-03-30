import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loadConfig } from './config';
import { errorHandler } from './middleware/error-handler';
import { healthRoutes } from './routes/health';
import { presetRoutes } from './routes/presets';

const config = loadConfig();
const app = new Hono();

app.onError(errorHandler);
app.use('*', cors({ origin: config.cors.origins, credentials: true }));

app.route('/health', healthRoutes);
app.route('/api/v1/presets', presetRoutes);

export default { port: config.port, fetch: app.fetch };
