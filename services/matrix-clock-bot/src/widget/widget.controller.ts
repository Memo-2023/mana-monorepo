import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ClockService } from '../clock/clock.service';
import { SessionService } from '@manacore/bot-services';

/**
 * Widget Controller
 *
 * Serves the timer widget HTML for embedding in Matrix clients (Element).
 * The widget displays live timer status with progress bar and controls.
 *
 * Usage:
 * 1. Add widget to room via Element: /addwidget http://clock-bot:4018/widget
 * 2. Widget auto-detects user from Matrix widget parameters
 * 3. Timer status updates every second
 */
@Controller('widget')
export class WidgetController {
	private readonly logger = new Logger(WidgetController.name);

	constructor(
		private readonly clockService: ClockService,
		private readonly sessionService: SessionService
	) {}

	/**
	 * Serve the timer widget HTML page
	 *
	 * Matrix widget parameters (automatically added by Element):
	 * - $matrix_user_id: The viewing user's Matrix ID
	 * - $matrix_room_id: The room where the widget is displayed
	 * - widgetId: Unique widget identifier
	 */
	@Get()
	serveWidget(@Res() res: Response) {
		const html = this.generateWidgetHtml();
		res.set({
			'Content-Type': 'text/html; charset=utf-8',
			'X-Frame-Options': 'ALLOWALL', // Allow embedding in Matrix clients
			'Content-Security-Policy': 'frame-ancestors *;', // Allow iframe embedding
		});
		res.send(html);
	}

	/**
	 * API endpoint for widget to fetch timer status
	 *
	 * @param userId - Matrix user ID (e.g., @user:matrix.mana.how)
	 */
	@Get('api/status')
	async getTimerStatus(@Query('userId') userId: string) {
		if (!userId) {
			return { error: 'Missing userId parameter' };
		}

		try {
			const token = await this.sessionService.getToken(userId);
			if (!token) {
				return { authenticated: false, error: 'Not logged in' };
			}

			const timer = await this.clockService.getRunningTimer(token);
			if (!timer) {
				return { authenticated: true, hasTimer: false };
			}

			// Calculate remaining time for running timers
			let remainingSeconds = timer.remainingSeconds;
			if (timer.status === 'running' && timer.startedAt) {
				const startedAt = new Date(timer.startedAt).getTime();
				const elapsed = Math.floor((Date.now() - startedAt) / 1000);
				remainingSeconds = Math.max(0, timer.remainingSeconds - elapsed);
			}

			return {
				authenticated: true,
				hasTimer: true,
				timer: {
					id: timer.id,
					status: timer.status,
					remainingSeconds,
					durationSeconds: timer.durationSeconds,
					label: timer.label,
				},
			};
		} catch (error) {
			this.logger.error(`Widget API error for ${userId}:`, error);
			return { error: 'Failed to fetch timer status' };
		}
	}

	/**
	 * API endpoint for widget to control timer
	 */
	@Get('api/control')
	async controlTimer(
		@Query('userId') userId: string,
		@Query('action') action: 'start' | 'pause' | 'reset'
	) {
		if (!userId || !action) {
			return { error: 'Missing userId or action parameter' };
		}

		try {
			const token = await this.sessionService.getToken(userId);
			if (!token) {
				return { success: false, error: 'Not logged in' };
			}

			const timer = await this.clockService.getRunningTimer(token);
			if (!timer) {
				return { success: false, error: 'No active timer' };
			}

			switch (action) {
				case 'start':
					await this.clockService.startTimer(timer.id, token);
					break;
				case 'pause':
					await this.clockService.pauseTimer(timer.id, token);
					break;
				case 'reset':
					await this.clockService.resetTimer(timer.id, token);
					break;
			}

			return { success: true };
		} catch (error) {
			this.logger.error(`Widget control error for ${userId}:`, error);
			return { success: false, error: 'Control action failed' };
		}
	}

	/**
	 * Generate the widget HTML with embedded CSS and JavaScript
	 */
	private generateWidgetHtml(): string {
		return `<!DOCTYPE html>
<html lang="de">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Timer Widget</title>
	<style>
		* {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
		}

		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
			background: #1a1a2e;
			color: #eee;
			min-height: 100vh;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 16px;
		}

		.container {
			width: 100%;
			max-width: 320px;
			text-align: center;
		}

		.status-icon {
			font-size: 48px;
			margin-bottom: 16px;
		}

		.time-display {
			font-size: 48px;
			font-weight: 300;
			font-variant-numeric: tabular-nums;
			margin-bottom: 8px;
		}

		.time-total {
			font-size: 14px;
			color: #888;
			margin-bottom: 16px;
		}

		.progress-container {
			width: 100%;
			height: 8px;
			background: #333;
			border-radius: 4px;
			overflow: hidden;
			margin-bottom: 8px;
		}

		.progress-bar {
			height: 100%;
			background: linear-gradient(90deg, #4CAF50, #8BC34A);
			border-radius: 4px;
			transition: width 0.3s ease;
		}

		.progress-bar.paused {
			background: linear-gradient(90deg, #FF9800, #FFC107);
		}

		.percentage {
			font-size: 14px;
			color: #888;
			margin-bottom: 24px;
		}

		.label {
			font-size: 14px;
			color: #aaa;
			margin-bottom: 24px;
			padding: 8px 16px;
			background: #252540;
			border-radius: 16px;
			display: inline-block;
		}

		.controls {
			display: flex;
			gap: 12px;
			justify-content: center;
		}

		.btn {
			padding: 12px 24px;
			font-size: 16px;
			border: none;
			border-radius: 8px;
			cursor: pointer;
			transition: all 0.2s ease;
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.btn-primary {
			background: #4CAF50;
			color: white;
		}

		.btn-primary:hover {
			background: #45a049;
		}

		.btn-secondary {
			background: #333;
			color: #eee;
		}

		.btn-secondary:hover {
			background: #444;
		}

		.btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		.no-timer {
			text-align: center;
			color: #888;
		}

		.no-timer-icon {
			font-size: 64px;
			margin-bottom: 16px;
			opacity: 0.5;
		}

		.no-timer h2 {
			font-size: 18px;
			font-weight: 500;
			margin-bottom: 8px;
			color: #aaa;
		}

		.no-timer p {
			font-size: 14px;
		}

		.error {
			color: #f44336;
			padding: 16px;
			background: #2a1a1a;
			border-radius: 8px;
		}

		.loading {
			color: #888;
		}

		.finished {
			animation: pulse 1s ease-in-out infinite;
		}

		@keyframes pulse {
			0%, 100% { opacity: 1; }
			50% { opacity: 0.5; }
		}
	</style>
</head>
<body>
	<div class="container" id="app">
		<div class="loading">Laden...</div>
	</div>

	<script>
		// Get Matrix widget parameters from URL
		const params = new URLSearchParams(window.location.search);
		const userId = params.get('$matrix_user_id') || params.get('userId') || '';

		let currentTimer = null;
		let updateInterval = null;

		// Format seconds to MM:SS or HH:MM:SS
		function formatTime(seconds) {
			const h = Math.floor(seconds / 3600);
			const m = Math.floor((seconds % 3600) / 60);
			const s = seconds % 60;

			if (h > 0) {
				return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
			}
			return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
		}

		// Fetch timer status from API
		async function fetchStatus() {
			try {
				const response = await fetch('/widget/api/status?userId=' + encodeURIComponent(userId));
				const data = await response.json();

				if (data.error) {
					renderError(data.error);
					return;
				}

				if (!data.authenticated) {
					renderNotLoggedIn();
					return;
				}

				if (!data.hasTimer) {
					renderNoTimer();
					return;
				}

				currentTimer = data.timer;
				renderTimer(data.timer);
			} catch (error) {
				renderError('Verbindungsfehler');
			}
		}

		// Send control command
		async function sendControl(action) {
			try {
				const response = await fetch('/widget/api/control?userId=' + encodeURIComponent(userId) + '&action=' + action);
				const data = await response.json();
				if (data.success) {
					fetchStatus(); // Refresh immediately
				}
			} catch (error) {
				console.error('Control failed:', error);
			}
		}

		// Render timer display
		function renderTimer(timer) {
			const percentage = Math.round((1 - timer.remainingSeconds / timer.durationSeconds) * 100);
			const statusIcon = timer.status === 'running' ? '▶️' : timer.status === 'paused' ? '⏸️' : '✅';
			const isFinished = timer.remainingSeconds <= 0;

			document.getElementById('app').innerHTML = \`
				<div class="status-icon \${isFinished ? 'finished' : ''}">\${isFinished ? '🎉' : statusIcon}</div>
				<div class="time-display">\${formatTime(Math.max(0, timer.remainingSeconds))}</div>
				<div class="time-total">von \${formatTime(timer.durationSeconds)}</div>
				<div class="progress-container">
					<div class="progress-bar \${timer.status === 'paused' ? 'paused' : ''}" style="width: \${percentage}%"></div>
				</div>
				<div class="percentage">\${percentage}%</div>
				\${timer.label ? '<div class="label">📝 ' + timer.label + '</div>' : ''}
				<div class="controls">
					\${timer.status === 'running'
						? '<button class="btn btn-secondary" onclick="sendControl(\\'pause\\')">⏸️ Pause</button>'
						: '<button class="btn btn-primary" onclick="sendControl(\\'start\\')">▶️ Start</button>'
					}
					<button class="btn btn-secondary" onclick="sendControl('reset')">↺ Reset</button>
				</div>
			\`;
		}

		// Render no timer state
		function renderNoTimer() {
			document.getElementById('app').innerHTML = \`
				<div class="no-timer">
					<div class="no-timer-icon">⏱️</div>
					<h2>Kein aktiver Timer</h2>
					<p>Starte einen Timer mit<br><code>!timer 25m</code></p>
				</div>
			\`;
		}

		// Render not logged in state
		function renderNotLoggedIn() {
			document.getElementById('app').innerHTML = \`
				<div class="no-timer">
					<div class="no-timer-icon">🔒</div>
					<h2>Nicht angemeldet</h2>
					<p>Bitte in Element einloggen</p>
				</div>
			\`;
		}

		// Render error state
		function renderError(message) {
			document.getElementById('app').innerHTML = \`
				<div class="error">
					<strong>Fehler:</strong> \${message}
				</div>
			\`;
		}

		// Local countdown (smooth updates between API calls)
		function localCountdown() {
			if (currentTimer && currentTimer.status === 'running' && currentTimer.remainingSeconds > 0) {
				currentTimer.remainingSeconds = Math.max(0, currentTimer.remainingSeconds - 1);
				renderTimer(currentTimer);

				if (currentTimer.remainingSeconds <= 0) {
					// Timer finished - refresh from server
					fetchStatus();
				}
			}
		}

		// Initialize
		if (!userId) {
			renderError('Keine Benutzer-ID. Widget muss in Matrix eingebettet werden.');
		} else {
			fetchStatus();
			// Refresh from server every 10 seconds
			setInterval(fetchStatus, 10000);
			// Local countdown every second for smooth display
			setInterval(localCountdown, 1000);
		}
	</script>
</body>
</html>`;
	}
}
