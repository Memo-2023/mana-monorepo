import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';

async function bootstrap() {
	// Debug: Log environment variables at startup - using console.error for Cloud Run visibility
	console.error('[STARTUP DEBUG] Environment variables check:');
	console.error('[STARTUP DEBUG] AUDIO_MICROSERVICE_URL:', process.env.AUDIO_MICROSERVICE_URL);
	console.error(
		'[STARTUP DEBUG] All env vars with AUDIO:',
		Object.keys(process.env).filter((key) => key.includes('AUDIO'))
	);
	console.error('[STARTUP DEBUG] NODE_ENV:', process.env.NODE_ENV);
	console.error('[STARTUP DEBUG] Current working directory:', process.cwd());
	console.error('[STARTUP DEBUG] __dirname:', __dirname);

	const app = await NestFactory.create(AppModule);
	app.enableCors();

	// Apply global exception filter for standardized error responses
	app.useGlobalFilters(new HttpExceptionFilter());

	// Increase request body size limit to handle rich speaker diarization data
	// NestJS default is 100KB, our speaker data can be ~150KB+
	const bodyLimit = '10mb'; // More reasonable limit

	app.use(
		require('express').json({
			limit: bodyLimit,
			verify: (req, res, buf, encoding) => {
				console.log(`[Body Parser] Received ${buf.length} bytes on ${req.url}`);
				if (buf.length > 1024 * 1024) {
					// Log if >1MB
					console.log(
						`[Body Parser] Large payload detected: ${(buf.length / 1024 / 1024).toFixed(2)}MB`
					);
				}
			},
		})
	);

	app.use(
		require('express').urlencoded({
			extended: true,
			limit: bodyLimit,
			verify: (req, res, buf, encoding) => {
				console.log(`[Body Parser URL] Received ${buf.length} bytes on ${req.url}`);
			},
		})
	);

	console.log(`[NestJS] Body parser configured with limit: ${bodyLimit}`);

	// Use PORT environment variable provided by Cloud Run, default to 3001
	// Using 3001 instead of 3000 to avoid conflicts with the main middleware service in development
	const port = process.env.PORT || 3001;
	await app.listen(port);
	console.log(`Memoro microservice listening on port ${port}`);
}
bootstrap();
