import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import { tokenManager, TokenState } from '~/features/auth/services/tokenManager';
import { hasTranscript } from '~/features/memos/utils/transcriptUtils';

interface MemoRealtimeEvent {
	event: 'INSERT' | 'UPDATE' | 'DELETE';
	new?: any;
	old?: any;
	eventTs: string;
}

export type MemoEventCallback = (payload: MemoRealtimeEvent) => void;

/**
 * Centralized real-time service for memo updates
 * Manages a single Supabase subscription and distributes events to interested components
 * This prevents multiple overlapping subscriptions that cause connection spikes
 * Includes token expiration handling and automatic reconnection
 */
class MemoRealtimeService {
	private subscription: any = null;
	private listeners: Map<string, MemoEventCallback[]> = new Map();
	private isInitialized = false;
	private isInitializing = false;
	private tokenStateUnsubscribe: (() => void) | null = null;
	private reconnectAttempts = 0;
	private readonly MAX_RECONNECT_ATTEMPTS = 5;
	private readonly RECONNECT_DELAY_MS = 2000; // Start with 2 seconds, exponential backoff
	private readonly MIN_RECONNECT_INTERVAL_MS = 5000; // Minimum 5 seconds between reconnect attempts
	private supabaseClient: any = null;
	private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
	private lastReconnectAttempt: number = 0;
	private lastErrorStatus: { status: string; count: number; lastLog: number } | null = null;

	/**
	 * Initialize the service with a single subscription to memo changes
	 */
	async initialize(): Promise<void> {
		if (this.isInitialized || this.isInitializing) return;

		this.isInitializing = true;
		console.log('MemoRealtimeService: Initializing centralized service');

		try {
			// Set up token state monitoring
			this.setupTokenStateMonitoring();

			// Create initial subscription
			await this.createSubscription();

			this.isInitialized = true;
			this.reconnectAttempts = 0; // Reset on successful initialization
			console.log('MemoRealtimeService: Successfully initialized');
		} catch (error) {
			console.error('MemoRealtimeService: Error during initialization:', error);

			// Attempt reconnection if this was a connection issue
			const shouldReconnect = await this.shouldAttemptReconnect(error);
			if (shouldReconnect) {
				this.scheduleReconnect();
			}
		} finally {
			this.isInitializing = false;
		}
	}

	/**
	 * Handle memo changes and distribute to listeners
	 */
	private handleMemoChange = (event: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => {
		const memoId = payload.new?.id || payload.old?.id;

		console.log(`MemoRealtimeService: ${event} event for memo ${memoId}`);

		// Detailed logging for debugging
		console.log(`MemoRealtimeService: ${event} event details:`, {
			memoId,
			event,
			timestamp: new Date().toISOString(),
			old: {
				title: payload.old?.title,
				metadata: payload.old?.metadata,
				source: payload.old?.source,
			},
			new: {
				title: payload.new?.title,
				metadata: payload.new?.metadata,
				source: payload.new?.source,
			},
			changes:
				event === 'UPDATE'
					? {
							titleChanged: payload.old?.title !== payload.new?.title,
							metadataChanged:
								JSON.stringify(payload.old?.metadata) !== JSON.stringify(payload.new?.metadata),
							sourceChanged:
								JSON.stringify(payload.old?.source) !== JSON.stringify(payload.new?.source),
						}
					: null,
		});

		const realtimeEvent: MemoRealtimeEvent = {
			event,
			new: payload.new,
			old: payload.old,
			eventTs: payload.eventTs || new Date().toISOString(),
		};

		// Notify all general listeners
		this.notifyListeners('all-memos', realtimeEvent);

		// Notify specific memo listeners
		if (memoId) {
			this.notifyListeners(`memo-${memoId}`, realtimeEvent);
		}

		// Notify event-specific listeners
		this.notifyListeners(`event-${event.toLowerCase()}`, realtimeEvent);
	};

	/**
	 * Subscribe to all memo changes
	 */
	subscribeToAllMemos(callback: MemoEventCallback): () => void {
		return this.subscribe('all-memos', callback);
	}

	/**
	 * Subscribe to changes for a specific memo
	 */
	subscribeToMemo(memoId: string, callback: MemoEventCallback): () => void {
		return this.subscribe(`memo-${memoId}`, callback);
	}

	/**
	 * Subscribe to specific event types (insert, update, delete)
	 */
	subscribeToEvent(event: 'insert' | 'update' | 'delete', callback: MemoEventCallback): () => void {
		return this.subscribe(`event-${event}`, callback);
	}

	/**
	 * Generic subscription method
	 */
	private subscribe(eventKey: string, callback: MemoEventCallback): () => void {
		if (!this.listeners.has(eventKey)) {
			this.listeners.set(eventKey, []);
		}

		const callbacks = this.listeners.get(eventKey)!;
		callbacks.push(callback);

		console.log(`MemoRealtimeService: Added listener for ${eventKey}, total: ${callbacks.length}`);

		// Return unsubscribe function
		return () => {
			const index = callbacks.indexOf(callback);
			if (index > -1) {
				callbacks.splice(index, 1);
				console.log(
					`MemoRealtimeService: Removed listener for ${eventKey}, remaining: ${callbacks.length}`
				);
			}
		};
	}

	/**
	 * Notify all listeners for a specific event
	 */
	private notifyListeners(eventKey: string, payload: MemoRealtimeEvent): void {
		const callbacks = this.listeners.get(eventKey) || [];

		if (callbacks.length > 0) {
			console.log(`MemoRealtimeService: Notifying ${callbacks.length} listeners for ${eventKey}`, {
				event: payload.event,
				memoId: payload.new?.id || payload.old?.id,
				title: payload.new?.title,
				headlineStatus: payload.new?.metadata?.processing?.headline_and_intro?.status,
			});
			callbacks.forEach((callback) => {
				try {
					callback(payload);
				} catch (error) {
					console.error(`MemoRealtimeService: Error in listener callback for ${eventKey}:`, error);
				}
			});
		}
	}

	/**
	 * Get current status of the service
	 */
	getStatus(): {
		isInitialized: boolean;
		isInitializing: boolean;
		listenersCount: number;
		reconnectAttempts: number;
		hasActiveSubscription: boolean;
		subscriptionDetails?: any;
	} {
		const totalListeners = Array.from(this.listeners.values()).reduce(
			(sum, arr) => sum + arr.length,
			0
		);
		return {
			isInitialized: this.isInitialized,
			isInitializing: this.isInitializing,
			listenersCount: totalListeners,
			reconnectAttempts: this.reconnectAttempts,
			hasActiveSubscription: !!this.subscription,
			subscriptionDetails: this.subscription
				? {
						state: this.subscription.state,
						topic: this.subscription.topic,
					}
				: null,
		};
	}

	/**
	 * Test method to manually trigger an update and verify realtime is working
	 */
	async testRealtimeUpdate(memoId: string): Promise<void> {
		console.log('MemoRealtimeService: Starting realtime test for memo', memoId);

		if (!this.supabaseClient) {
			console.error('MemoRealtimeService: No Supabase client available for test');
			return;
		}

		try {
			// Add test listeners
			let updateReceived = false;
			let allMemosUpdateReceived = false;

			// Listen to specific memo
			const unsubscribeMemo = this.subscribeToMemo(memoId, (payload) => {
				console.log('MemoRealtimeService TEST: Received event on memo channel', {
					event: payload.event,
					memoId: payload.new?.id || payload.old?.id,
					title: payload.new?.title,
					timestamp: new Date().toISOString(),
				});
				if (payload.event === 'UPDATE') {
					updateReceived = true;
				}
			});

			// Listen to all memos
			const unsubscribeAll = this.subscribeToAllMemos((payload) => {
				const eventMemoId = payload.new?.id || payload.old?.id;
				if (eventMemoId === memoId) {
					console.log('MemoRealtimeService TEST: Received event on all-memos channel', {
						event: payload.event,
						memoId: eventMemoId,
						timestamp: new Date().toISOString(),
					});
					if (payload.event === 'UPDATE') {
						allMemosUpdateReceived = true;
					}
				}
			});

			// Wait a moment for subscription to be ready
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// First, fetch the current memo to ensure it exists
			const { data: currentMemo, error: fetchError } = await this.supabaseClient
				.from('memos')
				.select('*')
				.eq('id', memoId)
				.single();

			if (fetchError || !currentMemo) {
				console.error('MemoRealtimeService TEST: Cannot fetch memo', fetchError);
				unsubscribeMemo();
				unsubscribeAll();
				return;
			}

			console.log('MemoRealtimeService TEST: Current memo state', {
				id: currentMemo.id,
				title: currentMemo.title,
				metadata: currentMemo.metadata,
			});

			// Perform a simple update (merge with existing metadata)
			const testMarker = `realtime-test-${Date.now()}`;
			const updatedMetadata = {
				...currentMemo.metadata,
				testing: {
					realtimeTest: testMarker,
					timestamp: new Date().toISOString(),
				},
			};

			const { data: updateResult, error: updateError } = await this.supabaseClient
				.from('memos')
				.update({
					metadata: updatedMetadata,
				})
				.eq('id', memoId)
				.select();

			if (updateError) {
				console.error('MemoRealtimeService TEST: Error updating memo', updateError);
			} else {
				console.log('MemoRealtimeService TEST: Update sent successfully', {
					updateResult,
					testMarker,
				});

				// Wait up to 5 seconds for the update
				await new Promise((resolve) => setTimeout(resolve, 5000));

				console.log('MemoRealtimeService TEST: Results:', {
					updateReceived,
					allMemosUpdateReceived,
				});

				if (updateReceived || allMemosUpdateReceived) {
					console.log('MemoRealtimeService TEST: ✅ Realtime UPDATE received successfully!');
				} else {
					console.log('MemoRealtimeService TEST: ❌ No realtime UPDATE received within 5 seconds');
					console.log('MemoRealtimeService TEST: This may indicate:');
					console.log('  - RLS policies need adjustment');
					console.log('  - Realtime is not enabled for the memos table');
					console.log('  - Network/connection issues');
				}
			}

			// Clean up
			unsubscribeMemo();
			unsubscribeAll();
		} catch (error) {
			console.error('MemoRealtimeService TEST: Error during test', error);
		}
	}

	/**
	 * Set up token state monitoring for automatic reconnection
	 */
	private setupTokenStateMonitoring(): void {
		// Clean up existing listener
		if (this.tokenStateUnsubscribe) {
			this.tokenStateUnsubscribe();
		}

		// Subscribe to token state changes
		this.tokenStateUnsubscribe = tokenManager.subscribe(async (state, token) => {
			console.log('MemoRealtimeService: Token state changed to', state);

			if (state === TokenState.VALID && token) {
				// Token refreshed - update Realtime auth WITHOUT reconnecting
				// This preserves the existing subscription and prevents missing events
				await this.handleTokenRefresh(token);
			} else if (state === TokenState.EXPIRED || state === TokenState.IDLE) {
				// Token expired - connection will likely fail
				console.log('MemoRealtimeService: Token expired, subscription may become invalid');
			}
		});
	}

	/**
	 * Create the Supabase subscription with error handling
	 */
	private async createSubscription(): Promise<void> {
		const supabase = await getAuthenticatedClient();
		if (!supabase) {
			throw new Error('No authenticated client available');
		}

		this.supabaseClient = supabase;

		// Generate a unique channel name to avoid conflicts
		const channelName = `memos-central-service-${Date.now()}`;

		// Create single subscription for all memo changes
		this.subscription = supabase
			.channel(channelName)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'memos',
				},
				(payload: any) => this.handleMemoChange('INSERT', payload)
			)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'memos',
				},
				(payload: any) => this.handleMemoChange('UPDATE', payload)
			)
			.on(
				'postgres_changes',
				{
					event: 'DELETE',
					schema: 'public',
					table: 'memos',
				},
				(payload: any) => this.handleMemoChange('DELETE', payload)
			)
			.on('system', { event: '*' }, (payload: any) => this.handleSystemEvent(payload))
			.subscribe((status: any, error?: any) => {
				this.handleSubscriptionStatusChange(status, error);
			});

		console.log(`MemoRealtimeService: Created subscription with channel ${channelName}`);
	}

	/**
	 * Handle system events from Phoenix channels (connection errors, etc.)
	 */
	private handleSystemEvent = (payload: any) => {
		// Only log system events that are errors or important status changes
		const isError = payload.status === 'error' || payload.type === 'error';
		const isImportant = payload.status === 'ok' || payload.type === 'phx_reply';

		if (isError || (isImportant && this.reconnectAttempts > 0)) {
			console.log('MemoRealtimeService: System event received:', payload);
		}

		// Check for specific error types to avoid spam
		if (payload.status === 'error' && payload.message) {
			const errorMessage = payload.message;

			// Handle Realtime not enabled error
			if (
				errorMessage.includes('Unable to subscribe to changes') &&
				errorMessage.includes('Please check Realtime is enabled')
			) {
				console.error(
					'MemoRealtimeService: Realtime not enabled for memos table. Please enable via Supabase dashboard or SQL: ALTER PUBLICATION supabase_realtime ADD TABLE public.memos;'
				);
				this.isInitialized = false; // Prevent further reconnection attempts
				return;
			}

			// Handle other subscription errors
			if (errorMessage.includes('subscription') || errorMessage.includes('parameter')) {
				console.warn('MemoRealtimeService: Subscription configuration error:', errorMessage);
				return;
			}
		}

		// Check for token expiration or auth errors
		if (this.isTokenExpirationError(payload)) {
			console.log('MemoRealtimeService: Token expiration detected in system event');
			this.handleTokenExpiration();
		}
	};

	/**
	 * Handle subscription status changes
	 */
	private handleSubscriptionStatusChange = async (status: string, error?: any) => {
		// Log all status changes with details
		console.log('MemoRealtimeService: Subscription status changed:', {
			status,
			error,
			timestamp: new Date().toISOString(),
			isInitialized: this.isInitialized,
			listenersCount: this.listeners.size,
			reconnectAttempts: this.reconnectAttempts,
		});

		// Check network status first to avoid spamming logs when offline
		const { isDeviceConnected } = await import('~/features/errorHandling/utils/networkErrorUtils');
		const isOnline = await isDeviceConnected();

		// Keep track of last error status to prevent spam
		if (!this.lastErrorStatus) {
			this.lastErrorStatus = { status: '', count: 0, lastLog: 0 };
		}

		const now = Date.now();
		const isDuplicateError = this.lastErrorStatus.status === status;
		const timeSinceLastLog = now - this.lastErrorStatus.lastLog;

		// Only log if it's a new error type or enough time has passed (10 seconds)
		const shouldLog = !isDuplicateError || timeSinceLastLog > 10000;

		switch (status) {
			case 'SUBSCRIBED':
				console.log('MemoRealtimeService: Successfully subscribed to memo changes');
				this.reconnectAttempts = 0; // Reset on successful connection
				this.lastErrorStatus = { status: '', count: 0, lastLog: 0 }; // Reset error tracking
				// Cancel any pending reconnect attempts
				if (this.reconnectTimeout) {
					clearTimeout(this.reconnectTimeout);
					this.reconnectTimeout = null;
				}
				break;

			case 'CHANNEL_ERROR':
				if (isDuplicateError) {
					this.lastErrorStatus.count++;
				} else {
					this.lastErrorStatus = { status, count: 1, lastLog: now };
				}

				// Only log first occurrence or after timeout
				if (shouldLog && isOnline) {
					console.warn(
						`MemoRealtimeService: Channel error detected (${this.lastErrorStatus.count} occurrences)`
					);
					this.lastErrorStatus.lastLog = now;
				}

				// Check if this is a configuration error that we shouldn't retry
				if (error && typeof error === 'string' && error.includes('Realtime not enabled')) {
					console.error(
						'MemoRealtimeService: Realtime not enabled for memos table. Please enable in Supabase dashboard.'
					);
					this.isInitialized = false; // Prevent further reconnection attempts
					return;
				}

				// Only reconnect for channel errors if they're auth-related and we're online
				if (isOnline && this.isTokenExpirationError(error) && !this.reconnectTimeout) {
					this.handleTokenExpiration();
				}
				break;

			case 'TIMED_OUT':
				// Only log and attempt reconnect if online
				if (isOnline && shouldLog) {
					console.warn('MemoRealtimeService: Connection timed out');
					// For timeouts, attempt reconnection with backoff
					const shouldReconnect = await this.shouldAttemptReconnect(error);
					if (shouldReconnect && !this.reconnectTimeout) {
						this.scheduleReconnect();
					}
				}
				break;

			case 'CLOSED':
				// CLOSED status is normal during cleanup or when the connection is intentionally closed
				// Only log as warning if we're still supposed to be connected
				if (this.isInitialized && !this.isInitializing && shouldLog) {
					console.warn('MemoRealtimeService: Connection closed unexpectedly');
					// Add a delay before attempting reconnection to avoid rapid reconnection loops
					const shouldReconnect = await this.shouldAttemptReconnect(error);
					if (shouldReconnect && !this.reconnectTimeout) {
						this.scheduleReconnect();
					}
				} else if (shouldLog) {
					console.log('MemoRealtimeService: Connection closed (expected during cleanup)');
				}
				break;
		}
	};

	/**
	 * Check if an error indicates token expiration
	 */
	private isTokenExpirationError(error: any): boolean {
		if (!error) return false;

		const errorString = typeof error === 'string' ? error : JSON.stringify(error);
		const tokenErrorIndicators = [
			'unauthorized',
			'invalid_token',
			'token_expired',
			'jwt',
			'auth',
			'401',
			'Unauthorized',
		];

		return tokenErrorIndicators.some((indicator) =>
			errorString.toLowerCase().includes(indicator.toLowerCase())
		);
	}

	/**
	 * Handle token expiration by attempting refresh and reconnection
	 */
	private async handleTokenExpiration(): Promise<void> {
		console.log('MemoRealtimeService: Handling token expiration');

		try {
			// Try to get a fresh token
			const newToken = await tokenManager.getValidToken();

			if (newToken) {
				console.log('MemoRealtimeService: Got fresh token, updating Realtime auth');

				// Update Realtime auth with new token
				if (this.supabaseClient) {
					this.supabaseClient.realtime.setAuth(newToken);
				}

				// Reconnect the subscription
				await this.reconnectSubscription();
			} else {
				console.warn(
					'MemoRealtimeService: Could not get fresh token, connection may remain broken'
				);
			}
		} catch (error) {
			console.error('MemoRealtimeService: Error handling token expiration:', error);

			// If token refresh fails completely, this might be a logout scenario
			// Don't attempt reconnection as the user may need to re-authenticate
		}
	}

	/**
	 * Handle token refresh from TokenManager
	 */
	private async handleTokenRefresh(newToken: string): Promise<void> {
		console.log('MemoRealtimeService: Handling token refresh');

		try {
			// Update Realtime auth WITHOUT reconnecting to preserve the subscription
			if (this.supabaseClient) {
				this.supabaseClient.realtime.setAuth(newToken);
				console.log('MemoRealtimeService: Updated Realtime auth with refreshed token');

				// If we have an active subscription, just update its auth
				if (this.subscription) {
					// Supabase should handle the auth update internally
					// We don't need to reconnect, just let it use the new token
					console.log('MemoRealtimeService: Token refreshed, subscription preserved');
					return;
				}
			}

			// Only reconnect if we don't have an active subscription
			if (!this.subscription && this.isInitialized) {
				console.log('MemoRealtimeService: No active subscription, attempting to reconnect');
				await this.reconnectSubscription();
			}
		} catch (error) {
			console.error('MemoRealtimeService: Error handling token refresh:', error);
		}
	}

	/**
	 * Check if we should attempt reconnection based on the error
	 */
	private async shouldAttemptReconnect(_error?: any): Promise<boolean> {
		// Don't reconnect if we've exceeded max attempts
		if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
			console.log('MemoRealtimeService: Max reconnect attempts reached, giving up');
			return false;
		}

		// Don't reconnect if service is not initialized
		if (!this.isInitialized) {
			return false;
		}

		// Check if device is online before attempting reconnect
		const { isDeviceConnected, hasStableConnection } = await import(
			'~/features/errorHandling/utils/networkErrorUtils'
		);
		const isOnline = await isDeviceConnected();

		if (!isOnline) {
			console.debug('MemoRealtimeService: Device offline, skipping reconnect attempt');
			return false;
		}

		// For critical reconnection, prefer stable connection
		const isStable = await hasStableConnection();
		if (!isStable) {
			console.debug(
				'MemoRealtimeService: Connection not stable yet, will wait before reconnecting'
			);
			// Note: We'll use a longer delay in scheduleReconnect for unstable connections
		}

		// For now, attempt reconnection for most errors when online
		return true;
	}

	/**
	 * Schedule a reconnection attempt with exponential backoff
	 */
	private scheduleReconnect(): void {
		// Clear any existing reconnect timeout
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}

		// Check if we're attempting to reconnect too frequently
		const now = Date.now();
		const timeSinceLastAttempt = now - this.lastReconnectAttempt;

		if (timeSinceLastAttempt < this.MIN_RECONNECT_INTERVAL_MS) {
			console.log(
				`MemoRealtimeService: Skipping reconnect - too soon since last attempt (${timeSinceLastAttempt}ms ago)`
			);
			return;
		}

		const delay = this.RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts);
		const maxDelay = 30000; // Cap at 30 seconds
		const actualDelay = Math.min(delay, maxDelay);

		console.log(
			`MemoRealtimeService: Scheduling reconnect attempt ${this.reconnectAttempts + 1} in ${actualDelay}ms`
		);

		this.reconnectTimeout = setTimeout(() => {
			this.reconnectTimeout = null;
			this.lastReconnectAttempt = Date.now();
			this.attemptReconnect();
		}, actualDelay);
	}

	/**
	 * Attempt to reconnect the subscription
	 */
	private async attemptReconnect(): Promise<void> {
		if (!this.isInitialized || this.isInitializing) {
			console.log('MemoRealtimeService: Skipping reconnect - service not in correct state');
			return;
		}

		this.reconnectAttempts++;
		console.log(
			`MemoRealtimeService: Attempting reconnect ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS}`
		);

		try {
			await this.reconnectSubscription();
			console.log('MemoRealtimeService: Reconnection successful');
		} catch (error) {
			console.error('MemoRealtimeService: Reconnection failed:', error);

			const shouldReconnect = await this.shouldAttemptReconnect(error);
			if (shouldReconnect) {
				this.scheduleReconnect();
			}
		}
	}

	/**
	 * Reconnect the subscription (cleanup old and create new)
	 */
	private async reconnectSubscription(): Promise<void> {
		console.log('MemoRealtimeService: Reconnecting subscription', {
			timestamp: new Date().toISOString(),
			hasExistingSubscription: !!this.subscription,
			isInitialized: this.isInitialized,
			reconnectAttempts: this.reconnectAttempts,
		});

		// Properly cleanup existing subscription
		if (this.subscription) {
			try {
				console.log('MemoRealtimeService: Unsubscribing from old channel');
				// Remove all channel listeners first to prevent memory leaks
				await this.subscription.unsubscribe();

				// Wait for cleanup to complete
				await new Promise((resolve) => setTimeout(resolve, 100));
				console.log('MemoRealtimeService: Old channel unsubscribed successfully');
			} catch (error) {
				console.warn('MemoRealtimeService: Error unsubscribing old connection:', error);
			}
			this.subscription = null;
		}

		// Create new subscription
		console.log('MemoRealtimeService: Creating new subscription');
		await this.createSubscription();
	}

	/**
	 * Enhanced subscription for DirectMemoTitle-style usage
	 * Provides initial data fetch + real-time updates with custom processing
	 */
	async subscribeToMemoWithInitialData(
		memoId: string,
		callback: (memo: any, isInitial?: boolean) => void,
		options?: {
			includeInitialFetch?: boolean;
			processData?: (memo: any) => any;
		}
	): Promise<() => void> {
		const { includeInitialFetch = true, processData } = options || {};

		// First, get initial data if requested
		if (includeInitialFetch) {
			try {
				// Ensure we have a valid Supabase client
				if (!this.supabaseClient) {
					console.log(
						'MemoRealtimeService: No Supabase client available yet, attempting to get authenticated client'
					);
					this.supabaseClient = await getAuthenticatedClient();
				}

				// Check again after attempting to get client
				if (!this.supabaseClient) {
					console.warn(
						'MemoRealtimeService: Unable to get authenticated client for initial data fetch'
					);
					// Continue with subscription only, without initial fetch
				} else {
					// Add a small delay to handle read-after-write consistency
					await new Promise((resolve) => setTimeout(resolve, 1000));

					console.log('MemoRealtimeService: Fetching initial data for memo:', memoId);
					const { data: memo, error } = await this.supabaseClient
						.from('memos')
						.select('*')
						.eq('id', memoId)
						.single();

					if (!error && memo) {
						console.log('MemoRealtimeService: Initial data fetched:', {
							id: memo.id,
							title: memo.title,
							transcriptionStatus: memo.metadata?.processing?.transcription?.status,
							headlineStatus: memo.metadata?.processing?.headline_and_intro?.status,
							updatedAt: memo.updated_at,
						});
						const processedMemo = processData ? processData(memo) : memo;
						callback(processedMemo, true);
					} else if (error) {
						// Handle the specific case of memo not found (PGRST116)
						if (error.code === 'PGRST116') {
							console.log(`MemoRealtimeService: Memo ${memoId} not found (may have been deleted)`);
							// Don't log as error since this is expected when memos are deleted
						} else {
							console.error('MemoRealtimeService: Error fetching initial memo data:', error);
						}
					}
				}
			} catch (error) {
				console.error('MemoRealtimeService: Error fetching initial memo data:', error);
			}
		}

		// Then subscribe to updates
		const unsubscribe = this.subscribeToMemo(memoId, (payload) => {
			const memo = payload.new || payload.old;
			if (memo) {
				const processedMemo = processData ? processData(memo) : memo;
				callback(processedMemo, false);
			}
		});

		return unsubscribe;
	}

	/**
	 * Get current memo data without subscription
	 * Useful for initial state setup
	 */
	async getCurrentMemoData(memoId: string): Promise<any | null> {
		if (!this.supabaseClient) {
			console.warn('MemoRealtimeService: No authenticated client available');
			return null;
		}

		try {
			const { data: memo, error } = await this.supabaseClient
				.from('memos')
				.select('*')
				.eq('id', memoId)
				.single();

			if (error) {
				console.error('MemoRealtimeService: Error fetching memo data:', error);
				return null;
			}

			return memo;
		} catch (error) {
			console.error('MemoRealtimeService: Error in getCurrentMemoData:', error);
			return null;
		}
	}

	/**
	 * Subscribe to memo updates with enhanced filtering and processing
	 * Supports DirectMemoTitle's complex logic patterns
	 */
	subscribeToMemoWithCustomLogic(
		memoId: string,
		options: {
			onUpdate: (memo: any, changeType: 'title' | 'processing' | 'status' | 'general') => void;
			titleCalculator?: (memo: any) => string;
			trackProcessingStates?: boolean;
			reactToRecordingStatus?: boolean;
		}
	): () => void {
		const { onUpdate, titleCalculator, trackProcessingStates = true } = options;

		return this.subscribeToMemo(memoId, (payload) => {
			const memo = payload.new;
			if (!memo) return;

			// Determine what type of change occurred
			let changeType: 'title' | 'processing' | 'status' | 'general' = 'general';

			if (payload.old) {
				const oldMemo = payload.old;

				// Check for title changes
				if (memo.title !== oldMemo.title) {
					changeType = 'title';
				}
				// Check for processing status changes
				else if (
					trackProcessingStates &&
					memo.metadata?.processing !== oldMemo.metadata?.processing
				) {
					changeType = 'processing';
				}
				// Check for general status changes
				else if (memo.metadata?.recordingStatus !== oldMemo.metadata?.recordingStatus) {
					changeType = 'status';
				}
			}

			// Apply custom title calculation if provided
			if (titleCalculator) {
				memo.calculatedTitle = titleCalculator(memo);
			}

			onUpdate(memo, changeType);
		});
	}

	/**
	 * DirectMemoTitle-specific subscription helper
	 * Encapsulates all the complex logic from DirectMemoTitle
	 */
	subscribeToMemoTitle(
		memoId: string,
		options: {
			onTitleChange: (title: string, isInitial?: boolean) => void;
			initialTitle?: string;
			reactToRecordingStatus?: boolean;
			translateFunction?: (key: string) => string;
		}
	): () => void {
		const { onTitleChange, initialTitle, translateFunction: t } = options;

		// Function to determine display title (migrated from DirectMemoTitle)
		const getDisplayTitle = (memo: any): string => {
			console.log(`MemoRealtimeService: getDisplayTitle for ${memoId}`, {
				title: memo.title,
				headlineStatus: memo.metadata?.processing?.headline_and_intro?.status,
				headlineDetails: memo.metadata?.processing?.headline_and_intro?.details,
				hasTranscript: hasTranscript(memo),
			});

			// Priority 1: Check if we have a real, meaningful title
			const hasRealTitle =
				memo.title &&
				memo.title !== 'Unbenanntes Memo' &&
				memo.title !== 'Neue Aufnahme' &&
				memo.title.trim() !== '';

			if (hasRealTitle) {
				console.log(`MemoRealtimeService: Using real title: "${memo.title}"`);
				return memo.title;
			}

			// Priority 2: Check for completed headline generation
			if (memo.metadata?.processing?.headline_and_intro?.status === 'completed') {
				// If headline is completed and we have a title, use it
				if (memo.title && memo.title.trim() !== '') {
					console.log(`MemoRealtimeService: Headline completed, using title: "${memo.title}"`);
					return memo.title;
				}
				// Check if we have a headline in metadata as fallback
				const headlineFromMetadata =
					memo.metadata?.processing?.headline_and_intro?.details?.headline;
				if (headlineFromMetadata && headlineFromMetadata.trim() !== '') {
					console.log(
						`MemoRealtimeService: Using headline from metadata: "${headlineFromMetadata}"`
					);
					return headlineFromMetadata;
				}
				// If headline is completed but no title anywhere, this is an error state - keep showing processing
				console.log(`MemoRealtimeService: Headline completed but no title found - error state`);
				return t ? t('memo.status.headline_generating') : 'Generating Headline';
			}

			// Priority 3: Check for recording status (uploading)
			if (memo.metadata?.recordingStatus === 'uploading') {
				return t ? t('memo.status.uploading_recording') : 'Uploading Recording';
			}

			// Priority 4: Check processing statuses
			const transcriptionStatus = memo.metadata?.processing?.transcription?.status;
			const headlineStatus = memo.metadata?.processing?.headline_and_intro?.status;

			// Check for ongoing transcription
			if (transcriptionStatus === 'processing') {
				return t ? t('memo.status.memo_transcribing') : 'Transcribing Memo';
			}

			// Check for ongoing headline generation
			if (headlineStatus === 'processing') {
				return t ? t('memo.status.headline_generating') : 'Generating Headline';
			}

			// Check for completed transcription but no headline yet
			if (
				transcriptionStatus === 'completed' &&
				(!headlineStatus || headlineStatus === 'pending')
			) {
				return t ? t('memo.status.headline_generating') : 'Generating Headline';
			}

			// Check if we have transcript but no title
			if (memo.source?.transcript && !hasRealTitle) {
				return t ? t('memo.status.headline_generating') : 'Generating Headline';
			}

			// Check if we have audio_path but no transcript
			if (memo.source?.audio_path && !memo.source?.transcript) {
				return t ? t('memo.status.memo_transcribing') : 'Transcribing Memo';
			}

			// Check if we have audio_path but no processing metadata
			if (memo.source?.audio_path && !memo.metadata?.processing) {
				return t ? t('memo.status.uploading_recording') : 'Uploading Recording';
			}

			// Default fallback - never show "memo_ready" unless we truly have no processing info
			if (memo.metadata?.processing) {
				return t ? t('memo.status.memo_transcribing') : 'Transcribing Memo';
			}

			return memo.title || initialTitle || 'New Recording';
		};

		// Use the enhanced subscription with initial data
		// Return unsubscribe function immediately, subscription happens asynchronously
		let unsubscribe: (() => void) | null = null;

		this.subscribeToMemoWithInitialData(
			memoId,
			(memo, isInitial) => {
				const title = getDisplayTitle(memo);
				console.log(
					`MemoRealtimeService: Title for memo ${memoId}: "${title}" (initial: ${isInitial})`
				);
				onTitleChange(title, isInitial);
			},
			{
				includeInitialFetch: true,
				processData: (memo) => memo, // No additional processing needed
			}
		).then((unsub) => {
			unsubscribe = unsub;
		});

		// Return a function that will call the actual unsubscribe when available
		return () => {
			if (unsubscribe) {
				unsubscribe();
			}
		};
	}

	/**
	 * Subscribe to a broadcast channel for receiving updates
	 * This is useful for receiving updates from service_role operations that bypass RLS
	 */
	subscribeToBroadcastChannel(channelName: string, callback: (payload: any) => void): () => void {
		if (!this.supabaseClient) {
			console.warn(
				'MemoRealtimeService: No authenticated client available for broadcast subscription'
			);
			return () => {};
		}

		console.log(`MemoRealtimeService: Subscribing to broadcast channel: ${channelName}`);

		const channel = this.supabaseClient.channel(channelName);

		channel
			.on('broadcast', { event: '*' }, (payload: any) => {
				console.log(`MemoRealtimeService: Broadcast received on ${channelName}:`, payload);
				callback(payload);
			})
			.subscribe((status: string) => {
				console.log(`MemoRealtimeService: Broadcast channel ${channelName} status:`, status);
			});

		// Return unsubscribe function
		return () => {
			console.log(`MemoRealtimeService: Unsubscribing from broadcast channel: ${channelName}`);
			channel.unsubscribe();
		};
	}

	/**
	 * Cleanup the service and all subscriptions
	 */
	cleanup(): void {
		console.log('MemoRealtimeService: Starting comprehensive cleanup');

		// 1. Set cleanup flag immediately to prevent any new operations
		this.isInitialized = false;
		this.isInitializing = false;

		// 2. Clean up token monitoring first to prevent further reconnection attempts
		if (this.tokenStateUnsubscribe) {
			this.tokenStateUnsubscribe();
			this.tokenStateUnsubscribe = null;
		}

		// 3. Clear any pending reconnect timeout
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}

		// 4. Unsubscribe from channel properly
		if (this.subscription) {
			try {
				this.subscription.unsubscribe();
			} catch (error) {
				console.warn('MemoRealtimeService: Error during unsubscribe:', error);
			}
			this.subscription = null;
		}

		// 5. Clear all listeners to prevent memory leaks
		this.listeners.forEach((callbacks, key) => {
			console.log(`MemoRealtimeService: Clearing ${callbacks.length} listeners for ${key}`);
		});
		this.listeners.clear();

		// 6. Clear client reference to prevent memory leak
		this.supabaseClient = null;

		// 7. Reset all state
		this.reconnectAttempts = 0;
		this.lastReconnectAttempt = 0;
		this.lastErrorStatus = null;

		console.log('MemoRealtimeService: Cleanup completed');
	}
}

// Create singleton instance
export const memoRealtimeService = new MemoRealtimeService();

// Export test method for debugging
export const testRealtimeUpdate = (memoId: string) =>
	memoRealtimeService.testRealtimeUpdate(memoId);

export default memoRealtimeService;
