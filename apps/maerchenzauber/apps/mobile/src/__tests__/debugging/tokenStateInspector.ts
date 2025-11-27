/**
 * Token State Inspector
 * Debug utility for monitoring token states, transitions, and related data
 */

import { tokenManager, TokenState } from '../../services/tokenManager';
import { authService } from '../../services/authService';
import { safeStorage } from '../../utils/safeStorage';
import { testUtils } from '../utils/authTestUtils';

export interface TokenStateSnapshot {
	timestamp: number;
	state: TokenState;
	token?: string;
	tokenPayload?: any;
	queueSize: number;
	refreshAttempts: number;
	storageTokens: {
		appToken?: string;
		refreshToken?: string;
		userEmail?: string;
	};
}

export interface TokenStateTransition {
	from: TokenState;
	to: TokenState;
	timestamp: number;
	duration?: number;
	context?: string;
}

export class TokenStateInspector {
	private isRunning = false;
	private snapshots: TokenStateSnapshot[] = [];
	private transitions: TokenStateTransition[] = [];
	private lastState: TokenState | null = null;
	private lastStateTimestamp = 0;
	private unsubscribe: (() => void) | null = null;
	private inspectionInterval: NodeJS.Timeout | null = null;

	/**
	 * Start monitoring token state
	 */
	start(): void {
		if (this.isRunning) {
			return;
		}

		console.log('🔍 TokenStateInspector: Starting monitoring...');
		this.isRunning = true;
		this.snapshots = [];
		this.transitions = [];
		this.lastState = null;
		this.lastStateTimestamp = 0;

		// Subscribe to token manager state changes
		this.unsubscribe = tokenManager.subscribe((state: TokenState, token?: string) => {
			this.recordStateChange(state, token);
		});

		// Take periodic snapshots
		this.inspectionInterval = setInterval(() => {
			this.takeSnapshot();
		}, 1000); // Every second

		// Take initial snapshot
		this.takeSnapshot();
	}

	/**
	 * Stop monitoring token state
	 */
	stop(): void {
		if (!this.isRunning) {
			return;
		}

		console.log('🔍 TokenStateInspector: Stopping monitoring...');
		this.isRunning = false;

		if (this.unsubscribe) {
			this.unsubscribe();
			this.unsubscribe = null;
		}

		if (this.inspectionInterval) {
			clearInterval(this.inspectionInterval);
			this.inspectionInterval = null;
		}
	}

	/**
	 * Take a snapshot of current token state
	 */
	private async takeSnapshot(): Promise<void> {
		try {
			const currentState = tokenManager.getState();
			const queueStatus = tokenManager.getQueueStatus();
			const currentToken = await authService.getAppToken();

			const storageTokens = {
				appToken: await safeStorage.getItem<string>('@auth/appToken'),
				refreshToken: await safeStorage.getItem<string>('@auth/refreshToken'),
				userEmail: await safeStorage.getItem<string>('@auth/userEmail'),
			};

			let tokenPayload: any = undefined;
			if (currentToken) {
				tokenPayload = testUtils.decodeToken(currentToken);
			}

			const snapshot: TokenStateSnapshot = {
				timestamp: Date.now(),
				state: currentState,
				token: currentToken || undefined,
				tokenPayload,
				queueSize: queueStatus.size,
				refreshAttempts: queueStatus.refreshAttempts,
				storageTokens,
			};

			this.snapshots.push(snapshot);

			// Keep only last 100 snapshots
			if (this.snapshots.length > 100) {
				this.snapshots = this.snapshots.slice(-100);
			}
		} catch (error) {
			console.error('🔍 TokenStateInspector: Error taking snapshot:', error);
		}
	}

	/**
	 * Record a state change
	 */
	private recordStateChange(newState: TokenState, token?: string, context?: string): void {
		const now = Date.now();

		if (this.lastState !== null && this.lastState !== newState) {
			const transition: TokenStateTransition = {
				from: this.lastState,
				to: newState,
				timestamp: now,
				duration: now - this.lastStateTimestamp,
				context,
			};

			this.transitions.push(transition);

			// Keep only last 50 transitions
			if (this.transitions.length > 50) {
				this.transitions = this.transitions.slice(-50);
			}

			console.log(
				`🔍 TokenStateInspector: State transition: ${this.lastState} → ${newState} (${transition.duration}ms)`
			);
		}

		this.lastState = newState;
		this.lastStateTimestamp = now;

		// Take snapshot on state change
		this.takeSnapshot();
	}

	/**
	 * Get current state information
	 */
	getCurrentState(): {
		state: TokenState;
		queueStatus: ReturnType<typeof tokenManager.getQueueStatus>;
		isRunning: boolean;
	} {
		return {
			state: tokenManager.getState(),
			queueStatus: tokenManager.getQueueStatus(),
			isRunning: this.isRunning,
		};
	}

	/**
	 * Get all snapshots
	 */
	getSnapshots(): TokenStateSnapshot[] {
		return [...this.snapshots];
	}

	/**
	 * Get snapshots within a time range
	 */
	getSnapshotsInRange(startTime: number, endTime: number): TokenStateSnapshot[] {
		return this.snapshots.filter(
			(snapshot) => snapshot.timestamp >= startTime && snapshot.timestamp <= endTime
		);
	}

	/**
	 * Get recent snapshots
	 */
	getRecentSnapshots(count: number = 10): TokenStateSnapshot[] {
		return this.snapshots.slice(-count);
	}

	/**
	 * Get all state transitions
	 */
	getTransitions(): TokenStateTransition[] {
		return [...this.transitions];
	}

	/**
	 * Get transitions within a time range
	 */
	getTransitionsInRange(startTime: number, endTime: number): TokenStateTransition[] {
		return this.transitions.filter(
			(transition) => transition.timestamp >= startTime && transition.timestamp <= endTime
		);
	}

	/**
	 * Get recent transitions
	 */
	getRecentTransitions(count: number = 10): TokenStateTransition[] {
		return this.transitions.slice(-count);
	}

	/**
	 * Analyze token state patterns
	 */
	analyzePatterns(): {
		averageTransitionTime: number;
		mostCommonTransitions: Array<{ transition: string; count: number }>;
		stateDistribution: Record<TokenState, number>;
		refreshPatterns: {
			totalRefreshAttempts: number;
			averageRefreshTime: number;
			refreshSuccessRate: number;
		};
	} {
		// Calculate average transition time
		const transitionTimes = this.transitions
			.filter((t) => t.duration !== undefined)
			.map((t) => t.duration!);

		const averageTransitionTime =
			transitionTimes.length > 0
				? transitionTimes.reduce((sum, time) => sum + time, 0) / transitionTimes.length
				: 0;

		// Count transition types
		const transitionCounts: Record<string, number> = {};
		this.transitions.forEach((t) => {
			const key = `${t.from} → ${t.to}`;
			transitionCounts[key] = (transitionCounts[key] || 0) + 1;
		});

		const mostCommonTransitions = Object.entries(transitionCounts)
			.map(([transition, count]) => ({ transition, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 5);

		// Calculate state distribution
		const stateCounts: Record<TokenState, number> = {
			[TokenState.IDLE]: 0,
			[TokenState.REFRESHING]: 0,
			[TokenState.EXPIRED]: 0,
			[TokenState.VALID]: 0,
		};

		this.snapshots.forEach((s) => {
			stateCounts[s.state]++;
		});

		// Analyze refresh patterns
		const refreshTransitions = this.transitions.filter(
			(t) => t.from !== TokenState.REFRESHING && t.to === TokenState.REFRESHING
		);
		const successfulRefreshes = this.transitions.filter(
			(t) => t.from === TokenState.REFRESHING && t.to === TokenState.VALID
		);
		const failedRefreshes = this.transitions.filter(
			(t) => t.from === TokenState.REFRESHING && t.to === TokenState.EXPIRED
		);

		const refreshTimes = this.transitions
			.filter((t) => t.from === TokenState.REFRESHING && t.duration !== undefined)
			.map((t) => t.duration!);

		const averageRefreshTime =
			refreshTimes.length > 0
				? refreshTimes.reduce((sum, time) => sum + time, 0) / refreshTimes.length
				: 0;

		const totalRefreshes = successfulRefreshes.length + failedRefreshes.length;
		const refreshSuccessRate = totalRefreshes > 0 ? successfulRefreshes.length / totalRefreshes : 0;

		return {
			averageTransitionTime,
			mostCommonTransitions,
			stateDistribution: stateCounts,
			refreshPatterns: {
				totalRefreshAttempts: refreshTransitions.length,
				averageRefreshTime,
				refreshSuccessRate,
			},
		};
	}

	/**
	 * Print detailed report
	 */
	printReport(): void {
		console.log('\n📊 Token State Inspector Report');
		console.log('=====================================');

		const currentState = this.getCurrentState();
		console.log(`\nCurrent State: ${currentState.state}`);
		console.log(`Queue Size: ${currentState.queueStatus.size}`);
		console.log(`Refresh Attempts: ${currentState.queueStatus.refreshAttempts}`);
		console.log(`Inspector Running: ${currentState.isRunning}`);

		const recentSnapshots = this.getRecentSnapshots(5);
		console.log('\n📸 Recent Snapshots:');
		recentSnapshots.forEach((snapshot, index) => {
			const time = new Date(snapshot.timestamp).toLocaleTimeString();
			console.log(`  ${index + 1}. ${time} - ${snapshot.state} (Queue: ${snapshot.queueSize})`);
			if (snapshot.tokenPayload) {
				const exp = new Date(snapshot.tokenPayload.exp * 1000).toLocaleTimeString();
				console.log(`     Token expires: ${exp}`);
			}
		});

		const recentTransitions = this.getRecentTransitions(5);
		console.log('\n🔄 Recent Transitions:');
		recentTransitions.forEach((transition, index) => {
			const time = new Date(transition.timestamp).toLocaleTimeString();
			const duration = transition.duration ? `(${transition.duration}ms)` : '';
			console.log(`  ${index + 1}. ${time} - ${transition.from} → ${transition.to} ${duration}`);
		});

		const analysis = this.analyzePatterns();
		console.log('\n📈 Analysis:');
		console.log(`  Average Transition Time: ${Math.round(analysis.averageTransitionTime)}ms`);
		console.log(
			`  Refresh Success Rate: ${(analysis.refreshPatterns.refreshSuccessRate * 100).toFixed(1)}%`
		);
		console.log(
			`  Average Refresh Time: ${Math.round(analysis.refreshPatterns.averageRefreshTime)}ms`
		);

		console.log('\n🔥 Most Common Transitions:');
		analysis.mostCommonTransitions.forEach((item, index) => {
			console.log(`  ${index + 1}. ${item.transition} (${item.count} times)`);
		});

		console.log('\n📊 State Distribution:');
		Object.entries(analysis.stateDistribution).forEach(([state, count]) => {
			const percentage =
				this.snapshots.length > 0 ? ((count / this.snapshots.length) * 100).toFixed(1) : '0';
			console.log(`  ${state}: ${count} times (${percentage}%)`);
		});

		console.log('\n=====================================\n');
	}

	/**
	 * Export data for external analysis
	 */
	exportData(): {
		snapshots: TokenStateSnapshot[];
		transitions: TokenStateTransition[];
		analysis: ReturnType<typeof this.analyzePatterns>;
		metadata: {
			exportTime: number;
			totalSnapshots: number;
			totalTransitions: number;
			monitoringDuration: number;
		};
	} {
		const analysis = this.analyzePatterns();
		const firstSnapshot = this.snapshots[0];
		const lastSnapshot = this.snapshots[this.snapshots.length - 1];

		const monitoringDuration =
			firstSnapshot && lastSnapshot ? lastSnapshot.timestamp - firstSnapshot.timestamp : 0;

		return {
			snapshots: this.getSnapshots(),
			transitions: this.getTransitions(),
			analysis,
			metadata: {
				exportTime: Date.now(),
				totalSnapshots: this.snapshots.length,
				totalTransitions: this.transitions.length,
				monitoringDuration,
			},
		};
	}

	/**
	 * Clear all collected data
	 */
	clear(): void {
		this.snapshots = [];
		this.transitions = [];
		this.lastState = null;
		this.lastStateTimestamp = 0;
		console.log('🔍 TokenStateInspector: Data cleared');
	}

	/**
	 * Wait for a specific state
	 */
	async waitForState(targetState: TokenState, timeout: number = 5000): Promise<boolean> {
		const startTime = Date.now();

		return new Promise((resolve) => {
			const checkState = () => {
				const currentState = tokenManager.getState();

				if (currentState === targetState) {
					resolve(true);
					return;
				}

				if (Date.now() - startTime > timeout) {
					resolve(false);
					return;
				}

				setTimeout(checkState, 100);
			};

			checkState();
		});
	}

	/**
	 * Wait for a specific transition
	 */
	async waitForTransition(
		fromState: TokenState,
		toState: TokenState,
		timeout: number = 5000
	): Promise<boolean> {
		const startTime = Date.now();

		return new Promise((resolve) => {
			const checkTransition = () => {
				const recentTransition = this.transitions
					.slice(-10) // Check last 10 transitions
					.find((t) => t.from === fromState && t.to === toState && t.timestamp > startTime);

				if (recentTransition) {
					resolve(true);
					return;
				}

				if (Date.now() - startTime > timeout) {
					resolve(false);
					return;
				}

				setTimeout(checkTransition, 100);
			};

			checkTransition();
		});
	}
}

// Export singleton instance
export const tokenStateInspector = new TokenStateInspector();
