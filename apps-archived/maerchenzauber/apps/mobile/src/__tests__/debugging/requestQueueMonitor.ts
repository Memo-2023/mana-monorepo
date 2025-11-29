/**
 * Request Queue Monitor
 * Debug utility for monitoring queued requests during token refresh
 */

import { tokenManager } from '../../services/tokenManager';

export interface QueuedRequestInfo {
	id: string;
	url: string;
	method: string;
	timestamp: number;
	queueTime: number;
	status: 'queued' | 'processing' | 'completed' | 'failed' | 'timeout';
	error?: string;
	responseTime?: number;
}

export interface QueueSnapshot {
	timestamp: number;
	queueSize: number;
	totalRequests: number;
	averageWaitTime: number;
	oldestRequestAge: number;
}

export class RequestQueueMonitor {
	private isRunning = false;
	private originalFetch: typeof globalThis.fetch;
	private requestHistory: QueuedRequestInfo[] = [];
	private queueSnapshots: QueueSnapshot[] = [];
	private monitoringInterval: NodeJS.Timeout | null = null;
	private requestCounter = 0;

	constructor() {
		this.originalFetch = globalThis.fetch;
	}

	/**
	 * Start monitoring request queue
	 */
	start(): void {
		if (this.isRunning) {
			return;
		}

		console.log('📡 RequestQueueMonitor: Starting monitoring...');
		this.isRunning = true;
		this.requestHistory = [];
		this.queueSnapshots = [];
		this.requestCounter = 0;

		// Intercept fetch calls to monitor requests
		this.interceptFetch();

		// Take periodic snapshots
		this.monitoringInterval = setInterval(() => {
			this.takeQueueSnapshot();
		}, 500); // Every 500ms
	}

	/**
	 * Stop monitoring request queue
	 */
	stop(): void {
		if (!this.isRunning) {
			return;
		}

		console.log('📡 RequestQueueMonitor: Stopping monitoring...');
		this.isRunning = false;

		// Restore original fetch
		globalThis.fetch = this.originalFetch;

		if (this.monitoringInterval) {
			clearInterval(this.monitoringInterval);
			this.monitoringInterval = null;
		}
	}

	/**
	 * Intercept fetch calls to monitor requests
	 */
	private interceptFetch(): void {
		const monitor = this;

		globalThis.fetch = async function (
			input: RequestInfo | URL,
			init?: RequestInit
		): Promise<Response> {
			const url =
				typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

			const method = init?.method || 'GET';

			// Skip monitoring internal auth requests
			if (url.includes('/auth/refresh') || url.includes('/auth/signin')) {
				return monitor.originalFetch(input, init);
			}

			const requestInfo: QueuedRequestInfo = {
				id: `req_${++monitor.requestCounter}`,
				url,
				method,
				timestamp: Date.now(),
				queueTime: 0,
				status: 'queued',
			};

			monitor.requestHistory.push(requestInfo);

			try {
				// Check if request will be queued (token is being refreshed)
				const queueStatus = tokenManager.getQueueStatus();
				if (queueStatus.state === 'refreshing') {
					requestInfo.status = 'queued';
					console.log(
						`📡 RequestQueueMonitor: Request queued - ${requestInfo.id} (${method} ${url})`
					);
				}

				const startTime = Date.now();
				requestInfo.status = 'processing';

				const response = await monitor.originalFetch(input, init);

				const responseTime = Date.now() - startTime;
				requestInfo.queueTime = startTime - requestInfo.timestamp;
				requestInfo.responseTime = responseTime;
				requestInfo.status = response.ok ? 'completed' : 'failed';

				if (!response.ok) {
					requestInfo.error = `HTTP ${response.status} ${response.statusText}`;
				}

				console.log(
					`📡 RequestQueueMonitor: Request ${requestInfo.status} - ${requestInfo.id} (queue: ${requestInfo.queueTime}ms, response: ${responseTime}ms)`
				);

				return response;
			} catch (error) {
				const responseTime = Date.now() - requestInfo.timestamp;
				requestInfo.responseTime = responseTime;
				requestInfo.status =
					error instanceof Error && error.message.includes('timeout') ? 'timeout' : 'failed';
				requestInfo.error = error instanceof Error ? error.message : 'Unknown error';

				console.log(
					`📡 RequestQueueMonitor: Request ${requestInfo.status} - ${requestInfo.id} (${requestInfo.error})`
				);

				throw error;
			}
		};
	}

	/**
	 * Take a snapshot of the current queue state
	 */
	private takeQueueSnapshot(): void {
		const queueStatus = tokenManager.getQueueStatus();
		const now = Date.now();

		// Calculate average wait time for recent requests
		const recentRequests = this.requestHistory
			.filter((req) => now - req.timestamp < 30000) // Last 30 seconds
			.filter((req) => req.queueTime > 0);

		const averageWaitTime =
			recentRequests.length > 0
				? recentRequests.reduce((sum, req) => sum + req.queueTime, 0) / recentRequests.length
				: 0;

		// Find oldest queued request
		const queuedRequests = this.requestHistory.filter(
			(req) => req.status === 'queued' || req.status === 'processing'
		);

		const oldestRequestAge =
			queuedRequests.length > 0 ? Math.max(...queuedRequests.map((req) => now - req.timestamp)) : 0;

		const snapshot: QueueSnapshot = {
			timestamp: now,
			queueSize: queueStatus.size,
			totalRequests: this.requestHistory.length,
			averageWaitTime,
			oldestRequestAge,
		};

		this.queueSnapshots.push(snapshot);

		// Keep only last 200 snapshots
		if (this.queueSnapshots.length > 200) {
			this.queueSnapshots = this.queueSnapshots.slice(-200);
		}

		// Keep only last 1000 requests
		if (this.requestHistory.length > 1000) {
			this.requestHistory = this.requestHistory.slice(-1000);
		}
	}

	/**
	 * Get current queue status
	 */
	getCurrentStatus(): {
		queueSize: number;
		activeRequests: number;
		completedRequests: number;
		failedRequests: number;
		averageResponseTime: number;
	} {
		const queueStatus = tokenManager.getQueueStatus();
		const activeRequests = this.requestHistory.filter(
			(req) => req.status === 'queued' || req.status === 'processing'
		).length;

		const completedRequests = this.requestHistory.filter(
			(req) => req.status === 'completed'
		).length;

		const failedRequests = this.requestHistory.filter(
			(req) => req.status === 'failed' || req.status === 'timeout'
		).length;

		const responseTimes = this.requestHistory
			.filter((req) => req.responseTime !== undefined)
			.map((req) => req.responseTime!);

		const averageResponseTime =
			responseTimes.length > 0
				? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
				: 0;

		return {
			queueSize: queueStatus.size,
			activeRequests,
			completedRequests,
			failedRequests,
			averageResponseTime,
		};
	}

	/**
	 * Get request history
	 */
	getRequestHistory(): QueuedRequestInfo[] {
		return [...this.requestHistory];
	}

	/**
	 * Get requests within a time range
	 */
	getRequestsInRange(startTime: number, endTime: number): QueuedRequestInfo[] {
		return this.requestHistory.filter(
			(req) => req.timestamp >= startTime && req.timestamp <= endTime
		);
	}

	/**
	 * Get recent requests
	 */
	getRecentRequests(count: number = 20): QueuedRequestInfo[] {
		return this.requestHistory.slice(-count);
	}

	/**
	 * Get queue snapshots
	 */
	getQueueSnapshots(): QueueSnapshot[] {
		return [...this.queueSnapshots];
	}

	/**
	 * Get recent queue snapshots
	 */
	getRecentSnapshots(count: number = 20): QueueSnapshot[] {
		return this.queueSnapshots.slice(-count);
	}

	/**
	 * Find requests by status
	 */
	getRequestsByStatus(status: QueuedRequestInfo['status']): QueuedRequestInfo[] {
		return this.requestHistory.filter((req) => req.status === status);
	}

	/**
	 * Find long-running requests
	 */
	getLongRunningRequests(thresholdMs: number = 5000): QueuedRequestInfo[] {
		const now = Date.now();
		return this.requestHistory.filter(
			(req) =>
				(req.status === 'queued' || req.status === 'processing') &&
				now - req.timestamp > thresholdMs
		);
	}

	/**
	 * Analyze queue performance
	 */
	analyzePerformance(): {
		requestStats: {
			total: number;
			completed: number;
			failed: number;
			timeout: number;
			successRate: number;
		};
		timingStats: {
			averageQueueTime: number;
			averageResponseTime: number;
			maxQueueTime: number;
			maxResponseTime: number;
		};
		queueStats: {
			maxQueueSize: number;
			averageQueueSize: number;
			timeSpentQueuing: number;
		};
	} {
		const completed = this.getRequestsByStatus('completed').length;
		const failed = this.getRequestsByStatus('failed').length;
		const timeout = this.getRequestsByStatus('timeout').length;
		const total = this.requestHistory.length;

		const successRate = total > 0 ? (completed / total) * 100 : 0;

		// Calculate timing stats
		const queueTimes = this.requestHistory
			.filter((req) => req.queueTime > 0)
			.map((req) => req.queueTime);

		const responseTimes = this.requestHistory
			.filter((req) => req.responseTime !== undefined)
			.map((req) => req.responseTime!);

		const averageQueueTime =
			queueTimes.length > 0
				? queueTimes.reduce((sum, time) => sum + time, 0) / queueTimes.length
				: 0;

		const averageResponseTime =
			responseTimes.length > 0
				? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
				: 0;

		const maxQueueTime = queueTimes.length > 0 ? Math.max(...queueTimes) : 0;
		const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

		// Calculate queue stats
		const queueSizes = this.queueSnapshots.map((s) => s.queueSize);
		const maxQueueSize = queueSizes.length > 0 ? Math.max(...queueSizes) : 0;
		const averageQueueSize =
			queueSizes.length > 0
				? queueSizes.reduce((sum, size) => sum + size, 0) / queueSizes.length
				: 0;

		// Calculate time spent with queue > 0
		const timeSpentQueuing = this.queueSnapshots.filter((s) => s.queueSize > 0).length * 500; // 500ms per snapshot

		return {
			requestStats: {
				total,
				completed,
				failed,
				timeout,
				successRate,
			},
			timingStats: {
				averageQueueTime,
				averageResponseTime,
				maxQueueTime,
				maxResponseTime,
			},
			queueStats: {
				maxQueueSize,
				averageQueueSize,
				timeSpentQueuing,
			},
		};
	}

	/**
	 * Print detailed report
	 */
	printReport(): void {
		console.log('\n📡 Request Queue Monitor Report');
		console.log('=====================================');

		const status = this.getCurrentStatus();
		console.log(`\nCurrent Status:`);
		console.log(`  Queue Size: ${status.queueSize}`);
		console.log(`  Active Requests: ${status.activeRequests}`);
		console.log(`  Completed Requests: ${status.completedRequests}`);
		console.log(`  Failed Requests: ${status.failedRequests}`);
		console.log(`  Average Response Time: ${Math.round(status.averageResponseTime)}ms`);

		const recentRequests = this.getRecentRequests(10);
		console.log('\n📋 Recent Requests:');
		recentRequests.forEach((req, index) => {
			const time = new Date(req.timestamp).toLocaleTimeString();
			const queueInfo = req.queueTime > 0 ? ` (queued ${req.queueTime}ms)` : '';
			const responseInfo = req.responseTime ? ` - ${req.responseTime}ms` : '';
			console.log(
				`  ${index + 1}. ${time} - ${req.status} ${req.method} ${req.url}${queueInfo}${responseInfo}`
			);
			if (req.error) {
				console.log(`     Error: ${req.error}`);
			}
		});

		const longRunning = this.getLongRunningRequests();
		if (longRunning.length > 0) {
			console.log('\n⚠️  Long-Running Requests:');
			longRunning.forEach((req, index) => {
				const age = Date.now() - req.timestamp;
				console.log(
					`  ${index + 1}. ${req.method} ${req.url} - ${req.status} (${Math.round(age / 1000)}s)`
				);
			});
		}

		const analysis = this.analyzePerformance();
		console.log('\n📊 Performance Analysis:');
		console.log(`  Success Rate: ${analysis.requestStats.successRate.toFixed(1)}%`);
		console.log(`  Average Queue Time: ${Math.round(analysis.timingStats.averageQueueTime)}ms`);
		console.log(`  Max Queue Time: ${Math.round(analysis.timingStats.maxQueueTime)}ms`);
		console.log(
			`  Average Response Time: ${Math.round(analysis.timingStats.averageResponseTime)}ms`
		);
		console.log(`  Max Response Time: ${Math.round(analysis.timingStats.maxResponseTime)}ms`);
		console.log(`  Max Queue Size: ${analysis.queueStats.maxQueueSize}`);
		console.log(`  Average Queue Size: ${analysis.queueStats.averageQueueSize.toFixed(1)}`);
		console.log(
			`  Time Spent Queuing: ${Math.round(analysis.queueStats.timeSpentQueuing / 1000)}s`
		);

		console.log('\n=====================================\n');
	}

	/**
	 * Export monitoring data
	 */
	exportData(): {
		requests: QueuedRequestInfo[];
		snapshots: QueueSnapshot[];
		analysis: ReturnType<typeof this.analyzePerformance>;
		metadata: {
			exportTime: number;
			monitoringDuration: number;
			totalRequests: number;
			totalSnapshots: number;
		};
	} {
		const analysis = this.analyzePerformance();
		const firstRequest = this.requestHistory[0];
		const lastRequest = this.requestHistory[this.requestHistory.length - 1];

		const monitoringDuration =
			firstRequest && lastRequest ? lastRequest.timestamp - firstRequest.timestamp : 0;

		return {
			requests: this.getRequestHistory(),
			snapshots: this.getQueueSnapshots(),
			analysis,
			metadata: {
				exportTime: Date.now(),
				monitoringDuration,
				totalRequests: this.requestHistory.length,
				totalSnapshots: this.queueSnapshots.length,
			},
		};
	}

	/**
	 * Clear all monitoring data
	 */
	clear(): void {
		this.requestHistory = [];
		this.queueSnapshots = [];
		this.requestCounter = 0;
		console.log('📡 RequestQueueMonitor: Data cleared');
	}

	/**
	 * Wait for queue to be empty
	 */
	async waitForEmptyQueue(timeout: number = 10000): Promise<boolean> {
		const startTime = Date.now();

		return new Promise((resolve) => {
			const checkQueue = () => {
				const queueStatus = tokenManager.getQueueStatus();

				if (queueStatus.size === 0) {
					resolve(true);
					return;
				}

				if (Date.now() - startTime > timeout) {
					resolve(false);
					return;
				}

				setTimeout(checkQueue, 100);
			};

			checkQueue();
		});
	}

	/**
	 * Wait for a specific number of completed requests
	 */
	async waitForCompletedRequests(count: number, timeout: number = 10000): Promise<boolean> {
		const startTime = Date.now();

		return new Promise((resolve) => {
			const checkCompleted = () => {
				const completed = this.getRequestsByStatus('completed').length;

				if (completed >= count) {
					resolve(true);
					return;
				}

				if (Date.now() - startTime > timeout) {
					resolve(false);
					return;
				}

				setTimeout(checkCompleted, 100);
			};

			checkCompleted();
		});
	}
}

// Export singleton instance
export const requestQueueMonitor = new RequestQueueMonitor();
