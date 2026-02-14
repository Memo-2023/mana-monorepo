import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	OnboardingStateMachine,
	OnboardingSession,
	OnboardingAction,
	OnboardingData,
	OnboardingState,
} from './state-machine';

export interface UserProfile {
	displayName?: string;
	interests?: string[];
	locale: 'de' | 'en';
	onboardingCompleted: boolean;
}

interface ManaAuthSettingsResponse {
	globalSettings: {
		locale: string;
		displayName?: string;
		interests?: string[];
		onboardingCompleted?: boolean;
		nav: unknown;
		theme: unknown;
	};
}

@Injectable()
export class OnboardingService {
	private readonly logger = new Logger(OnboardingService.name);
	private readonly authUrl: string;

	// In-memory session storage (per Matrix user)
	// Key: Matrix user ID (e.g., @user:matrix.org)
	private sessions: Map<string, OnboardingSession> = new Map();

	constructor(private configService: ConfigService) {
		this.authUrl = this.configService.get<string>('manaAuth.url') || 'http://localhost:3001';
	}

	/**
	 * Get or create onboarding session for a user
	 */
	getSession(matrixUserId: string): OnboardingSession {
		let session = this.sessions.get(matrixUserId);
		if (!session) {
			session = OnboardingStateMachine.createSession();
			this.sessions.set(matrixUserId, session);
		}
		return session;
	}

	/**
	 * Process an action and update the session
	 */
	processAction(
		matrixUserId: string,
		action: OnboardingAction,
		lang: 'de' | 'en' = 'de'
	): { session: OnboardingSession; messageKey: string; messageParams?: Record<string, string> } {
		const session = this.getSession(matrixUserId);
		const result = OnboardingStateMachine.transition(session, action, lang);

		// Update session
		const updatedSession: OnboardingSession = {
			state: result.newState,
			data: result.data,
			startedAt: session.startedAt,
		};
		this.sessions.set(matrixUserId, updatedSession);

		return {
			session: updatedSession,
			messageKey: result.messageKey,
			messageParams: result.messageParams,
		};
	}

	/**
	 * Check if user is in onboarding
	 */
	isInOnboarding(matrixUserId: string): boolean {
		const session = this.sessions.get(matrixUserId);
		if (!session) return false;
		return OnboardingStateMachine.isInProgress(session.state);
	}

	/**
	 * Get current state
	 */
	getState(matrixUserId: string): OnboardingState {
		const session = this.getSession(matrixUserId);
		return session.state;
	}

	/**
	 * Reset session
	 */
	resetSession(matrixUserId: string): void {
		this.sessions.delete(matrixUserId);
	}

	/**
	 * Check if current state can be skipped
	 */
	canSkip(matrixUserId: string): boolean {
		const session = this.getSession(matrixUserId);
		return OnboardingStateMachine.canSkip(session.state);
	}

	// ============================================================================
	// mana-core-auth API Integration
	// ============================================================================

	/**
	 * Save onboarding data to mana-core-auth
	 */
	async saveProfile(token: string, data: OnboardingData): Promise<boolean> {
		try {
			const response = await fetch(`${this.authUrl}/api/v1/settings/global`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					displayName: data.displayName,
					interests: data.interests,
					locale: data.locale,
					onboardingCompleted: true,
				}),
			});

			if (!response.ok) {
				this.logger.error(`Failed to save profile: ${response.status} ${response.statusText}`);
				return false;
			}

			this.logger.debug('Profile saved successfully');
			return true;
		} catch (error) {
			this.logger.error('Failed to save profile', error);
			return false;
		}
	}

	/**
	 * Get user profile from mana-core-auth
	 */
	async getProfile(token: string): Promise<UserProfile | null> {
		try {
			const response = await fetch(`${this.authUrl}/api/v1/settings`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				this.logger.error(`Failed to get profile: ${response.status}`);
				return null;
			}

			const data: ManaAuthSettingsResponse = await response.json();
			const settings = data.globalSettings;

			return {
				displayName: settings.displayName,
				interests: settings.interests,
				locale: (settings.locale as 'de' | 'en') || 'de',
				onboardingCompleted: settings.onboardingCompleted || false,
			};
		} catch (error) {
			this.logger.error('Failed to get profile', error);
			return null;
		}
	}

	/**
	 * Update a single profile field
	 */
	async updateProfileField(
		token: string,
		field: 'displayName' | 'interests' | 'locale',
		value: string | string[]
	): Promise<boolean> {
		try {
			const body: Record<string, unknown> = {};

			if (field === 'displayName') {
				body.displayName = value as string;
			} else if (field === 'interests') {
				body.interests = Array.isArray(value)
					? value
					: (value as string).split(',').map((i) => i.trim());
			} else if (field === 'locale') {
				const locale = (value as string).toLowerCase();
				if (locale !== 'de' && locale !== 'en') {
					return false;
				}
				body.locale = locale;
			}

			const response = await fetch(`${this.authUrl}/api/v1/settings/global`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				this.logger.error(`Failed to update profile field: ${response.status}`);
				return false;
			}

			return true;
		} catch (error) {
			this.logger.error('Failed to update profile field', error);
			return false;
		}
	}

	/**
	 * Check if user has completed onboarding
	 */
	async hasCompletedOnboarding(token: string): Promise<boolean> {
		const profile = await this.getProfile(token);
		return profile?.onboardingCompleted || false;
	}
}
