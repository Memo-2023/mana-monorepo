import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Queue, Worker, Job } from 'bullmq';
import { collectDefaultMetrics, Registry, Counter, Histogram } from 'prom-client';
import { getDb, closeConnection } from './db';
import { StorageService } from './services/storage';
import { UploadService } from './services/upload';
import { ProcessService } from './services/process';
import { ExifService } from './services/exif';
import { MatrixService } from './services/matrix';
import { uploadRoutes } from './routes/upload';
import { deliveryRoutes } from './routes/delivery';
import { PROCESS_QUEUE, SUPPORTED_IMAGE_TYPES } from './constants';

const port = parseInt(process.env.PORT || '3015');

// Database
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');
const db = getDb(databaseUrl);

// Services
const storage = new StorageService();
await storage.init();

const exifService = new ExifService();
const matrixService = new MatrixService();
const processService = new ProcessService(storage, exifService);

const processQueue = new Queue(PROCESS_QUEUE, {
	connection: {
		host: process.env.REDIS_HOST || 'localhost',
		port: parseInt(process.env.REDIS_PORT || '6379'),
		password: process.env.REDIS_PASSWORD || undefined,
	},
});

const uploadService = new UploadService(db, storage, matrixService, processQueue);

// BullMQ Worker
const worker = new Worker(
	PROCESS_QUEUE,
	async (job: Job<{ mediaId: string; mimeType: string; originalKey: string }>) => {
		const { mediaId, mimeType, originalKey } = job.data;
		console.log(`Processing media ${mediaId} (${mimeType})`);

		try {
			if (SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
				const result = await processService.processImage(mediaId, originalKey, mimeType);
				await uploadService.update(mediaId, {
					status: 'ready',
					thumbnailKey: result.thumbnail,
					mediumKey: result.medium,
					largeKey: result.large,
					width: result.metadata?.width,
					height: result.metadata?.height,
					format: result.metadata?.format,
					hasAlpha: result.metadata?.hasAlpha,
					exifData: result.exif?.raw,
					dateTaken: result.exif?.dateTaken,
					cameraMake: result.exif?.cameraMake,
					cameraModel: result.exif?.cameraModel,
					focalLength: result.exif?.focalLength,
					aperture: result.exif?.aperture,
					iso: result.exif?.iso,
					exposureTime: result.exif?.exposureTime,
					gpsLatitude: result.exif?.gpsLatitude,
					gpsLongitude: result.exif?.gpsLongitude,
				});
				console.log(
					`Processed image ${mediaId}: thumbnail=${!!result.thumbnail}, medium=${!!result.medium}, large=${!!result.large}, exif=${!!result.exif}`
				);
			} else {
				await uploadService.update(mediaId, { status: 'ready' });
			}
		} catch (error) {
			console.error(`Failed to process media ${mediaId}:`, error);
			await uploadService.update(mediaId, { status: 'failed' });
			throw error;
		}
	},
	{
		connection: {
			host: process.env.REDIS_HOST || 'localhost',
			port: parseInt(process.env.REDIS_PORT || '6379'),
			password: process.env.REDIS_PASSWORD || undefined,
		},
	}
);

// Prometheus metrics
const register = new Registry();
register.setDefaultLabels({ service: 'mana-media' });
collectDefaultMetrics({ register, prefix: 'media_' });

const httpRequestsTotal = new Counter({
	name: 'media_http_requests_total',
	help: 'Total HTTP requests',
	labelNames: ['method', 'path', 'status'] as const,
	registers: [register],
});

const httpRequestDuration = new Histogram({
	name: 'media_http_request_duration_seconds',
	help: 'HTTP request duration in seconds',
	labelNames: ['method', 'path', 'status'] as const,
	buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
	registers: [register],
});

// Hono app
const app = new Hono();

// CORS
app.use(
	'*',
	cors({
		origin: process.env.CORS_ORIGINS?.split(',') || '*',
		credentials: true,
	})
);

// Metrics middleware
app.use('*', async (c, next) => {
	const start = Date.now();
	await next();
	const duration = (Date.now() - start) / 1000;
	const path = c.req.routePath || c.req.path;
	httpRequestsTotal.inc({ method: c.req.method, path, status: c.res.status });
	httpRequestDuration.observe({ method: c.req.method, path, status: c.res.status }, duration);
});

// Health
app.get('/health', (c) =>
	c.json({ status: 'ok', service: 'mana-media', timestamp: new Date().toISOString() })
);

// Metrics
app.get('/metrics', async (c) => {
	c.header('Content-Type', register.contentType);
	return c.text(await register.metrics());
});

// API routes
const api = new Hono();
api.route('/media', uploadRoutes(uploadService));
api.route('/media', deliveryRoutes(uploadService, processService, storage));
app.route('/api/v1', api);

// Graceful shutdown
process.on('SIGTERM', async () => {
	console.log('Shutting down...');
	await worker.close();
	await processQueue.close();
	await closeConnection();
	process.exit(0);
});

console.log(`Mana Media service running on port ${port}`);
console.log(`Health check: http://localhost:${port}/health`);

export default {
	port,
	fetch: app.fetch,
};
