import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loadConfig } from './config';
import { errorHandler } from './middleware/error-handler';
import { jwtAuth } from './middleware/jwt-auth';
import { TranscribeService } from './services/transcribe';
import { healthRoutes } from './routes/health';
import { createTranscribeRoutes } from './routes/transcribe';

const config = loadConfig();
const transcribeService = new TranscribeService(config);

const app = new Hono();

app.onError(errorHandler);
app.use('*', cors({ origin: config.cors.origins, credentials: true }));

// Public
app.route('/health', healthRoutes);

// Protected
app.use('/api/v1/*', jwtAuth(config.manaAuthUrl));
app.route('/api/v1/transcribe', createTranscribeRoutes(transcribeService));

export default {
	port: config.port,
	fetch: app.fetch,
};
