// Debug test file to verify logging in Cloud Run
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function debugTest() {
	// Force all debug logs to use console.error for visibility
	console.error('[DEBUG TEST 1] Starting debug test - console.error');
	console.log('[DEBUG TEST 2] Starting debug test - console.log');
	console.warn('[DEBUG TEST 3] Starting debug test - console.warn');

	// Log process info
	console.error('[DEBUG TEST] Process info:', {
		nodeVersion: process.version,
		platform: process.platform,
		pid: process.pid,
		cwd: process.cwd(),
		execPath: process.execPath,
	});

	// Log all environment variables (be careful with sensitive data)
	console.error('[DEBUG TEST] Environment variables count:', Object.keys(process.env).length);
	console.error('[DEBUG TEST] NODE_ENV:', process.env.NODE_ENV);
	console.error('[DEBUG TEST] PORT:', process.env.PORT);
	console.error('[DEBUG TEST] AUDIO_MICROSERVICE_URL:', process.env.AUDIO_MICROSERVICE_URL);

	// Check if dist files exist
	const fs = require('fs');
	const path = require('path');
	const mainPath = path.join(__dirname, 'main.js');
	console.error('[DEBUG TEST] Current file location:', __filename);
	console.error('[DEBUG TEST] Main.js exists:', fs.existsSync(mainPath));

	// Create the app to test NestJS logging
	try {
		const app = await NestFactory.create(AppModule, {
			logger: ['error', 'warn', 'log', 'debug', 'verbose'],
		});

		console.error('[DEBUG TEST] NestJS app created successfully');

		// Don't actually start the server, just test creation
		await app.close();
		console.error('[DEBUG TEST] Test completed successfully');
	} catch (error) {
		console.error('[DEBUG TEST] Error creating app:', error);
	}

	process.exit(0);
}

debugTest();
