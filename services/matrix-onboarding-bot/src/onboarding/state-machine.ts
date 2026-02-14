/**
 * Onboarding State Machine
 *
 * States:
 * - IDLE: Not in onboarding
 * - NAME: Asking for display name
 * - INTERESTS: Asking for interests (skippable)
 * - LANGUAGE: Asking for language preference
 * - SUMMARY: Showing summary and asking for confirmation
 * - COMPLETED: Onboarding finished
 */

export type OnboardingState = 'IDLE' | 'NAME' | 'INTERESTS' | 'LANGUAGE' | 'SUMMARY' | 'COMPLETED';

export interface OnboardingData {
	displayName?: string;
	interests?: string[];
	locale?: 'de' | 'en';
}

export interface OnboardingSession {
	state: OnboardingState;
	data: OnboardingData;
	startedAt: number;
}

export type OnboardingAction =
	| { type: 'START' }
	| { type: 'INPUT'; value: string }
	| { type: 'SKIP' }
	| { type: 'CONFIRM' }
	| { type: 'REJECT' }
	| { type: 'RESET' };

export interface StateTransitionResult {
	newState: OnboardingState;
	data: OnboardingData;
	message: string;
	messageKey: string;
	messageParams?: Record<string, string>;
	error?: string;
}

/**
 * Pure state machine - no side effects
 */
export class OnboardingStateMachine {
	/**
	 * Process an action and return the new state
	 */
	static transition(
		session: OnboardingSession,
		action: OnboardingAction,
		lang: 'de' | 'en' = 'de'
	): StateTransitionResult {
		const { state, data } = session;

		switch (state) {
			case 'IDLE':
				return this.handleIdle(action, data);

			case 'NAME':
				return this.handleName(action, data);

			case 'INTERESTS':
				return this.handleInterests(action, data);

			case 'LANGUAGE':
				return this.handleLanguage(action, data);

			case 'SUMMARY':
				return this.handleSummary(action, data, lang);

			case 'COMPLETED':
				return this.handleCompleted(action, data);

			default:
				return {
					newState: 'IDLE',
					data,
					message: '',
					messageKey: 'error',
				};
		}
	}

	private static handleIdle(action: OnboardingAction, data: OnboardingData): StateTransitionResult {
		if (action.type === 'START') {
			return {
				newState: 'NAME',
				data: {},
				message: '',
				messageKey: 'askName',
			};
		}
		return {
			newState: 'IDLE',
			data,
			message: '',
			messageKey: 'idle',
		};
	}

	private static handleName(action: OnboardingAction, data: OnboardingData): StateTransitionResult {
		if (action.type === 'INPUT' && action.value.trim()) {
			const displayName = action.value.trim();
			return {
				newState: 'INTERESTS',
				data: { ...data, displayName },
				message: '',
				messageKey: 'askInterests',
				messageParams: { name: displayName },
			};
		}

		if (action.type === 'SKIP') {
			return {
				newState: 'NAME',
				data,
				message: '',
				messageKey: 'skipNotAllowed',
			};
		}

		if (action.type === 'RESET') {
			return {
				newState: 'IDLE',
				data: {},
				message: '',
				messageKey: 'cancelled',
			};
		}

		return {
			newState: 'NAME',
			data,
			message: '',
			messageKey: 'askName',
		};
	}

	private static handleInterests(
		action: OnboardingAction,
		data: OnboardingData
	): StateTransitionResult {
		if (action.type === 'INPUT' && action.value.trim()) {
			const interests = action.value
				.split(',')
				.map((i) => i.trim())
				.filter((i) => i.length > 0);

			return {
				newState: 'LANGUAGE',
				data: { ...data, interests },
				message: '',
				messageKey: 'askLanguage',
			};
		}

		if (action.type === 'SKIP') {
			return {
				newState: 'LANGUAGE',
				data: { ...data, interests: [] },
				message: '',
				messageKey: 'askLanguage',
			};
		}

		if (action.type === 'RESET') {
			return {
				newState: 'IDLE',
				data: {},
				message: '',
				messageKey: 'cancelled',
			};
		}

		return {
			newState: 'INTERESTS',
			data,
			message: '',
			messageKey: 'askInterests',
			messageParams: { name: data.displayName || '' },
		};
	}

	private static handleLanguage(
		action: OnboardingAction,
		data: OnboardingData
	): StateTransitionResult {
		if (action.type === 'INPUT') {
			const input = action.value.trim().toLowerCase();
			if (input === 'de' || input === 'en' || input === 'deutsch' || input === 'english') {
				const locale = input === 'de' || input === 'deutsch' ? 'de' : 'en';
				return {
					newState: 'SUMMARY',
					data: { ...data, locale },
					message: '',
					messageKey: 'summary',
					messageParams: {
						name: data.displayName || '-',
						interests: data.interests?.length ? data.interests.join(', ') : '-',
						language: locale === 'de' ? 'Deutsch' : 'English',
					},
				};
			}
			return {
				newState: 'LANGUAGE',
				data,
				message: '',
				messageKey: 'invalidLanguage',
			};
		}

		if (action.type === 'SKIP') {
			// Default to 'de' if skipped
			return {
				newState: 'SUMMARY',
				data: { ...data, locale: 'de' },
				message: '',
				messageKey: 'summary',
				messageParams: {
					name: data.displayName || '-',
					interests: data.interests?.length ? data.interests.join(', ') : '-',
					language: 'Deutsch',
				},
			};
		}

		if (action.type === 'RESET') {
			return {
				newState: 'IDLE',
				data: {},
				message: '',
				messageKey: 'cancelled',
			};
		}

		return {
			newState: 'LANGUAGE',
			data,
			message: '',
			messageKey: 'askLanguage',
		};
	}

	private static handleSummary(
		action: OnboardingAction,
		data: OnboardingData,
		_lang: 'de' | 'en'
	): StateTransitionResult {
		if (action.type === 'CONFIRM' || action.type === 'INPUT') {
			const input = action.type === 'INPUT' ? action.value.trim().toLowerCase() : 'yes';
			const isYes =
				input === 'ja' ||
				input === 'yes' ||
				input === 'j' ||
				input === 'y' ||
				input === 'ok' ||
				input === 'okay';
			const isNo = input === 'nein' || input === 'no' || input === 'n';

			if (isYes) {
				return {
					newState: 'COMPLETED',
					data,
					message: '',
					messageKey: 'completed',
				};
			}

			if (isNo) {
				return {
					newState: 'IDLE',
					data: {},
					message: '',
					messageKey: 'cancelled',
				};
			}

			// Neither yes nor no - repeat the question
			return {
				newState: 'SUMMARY',
				data,
				message: '',
				messageKey: 'summary',
				messageParams: {
					name: data.displayName || '-',
					interests: data.interests?.length ? data.interests.join(', ') : '-',
					language: data.locale === 'en' ? 'English' : 'Deutsch',
				},
			};
		}

		if (action.type === 'RESET') {
			return {
				newState: 'IDLE',
				data: {},
				message: '',
				messageKey: 'cancelled',
			};
		}

		return {
			newState: 'SUMMARY',
			data,
			message: '',
			messageKey: 'summary',
			messageParams: {
				name: data.displayName || '-',
				interests: data.interests?.length ? data.interests.join(', ') : '-',
				language: data.locale === 'en' ? 'English' : 'Deutsch',
			},
		};
	}

	private static handleCompleted(
		action: OnboardingAction,
		data: OnboardingData
	): StateTransitionResult {
		if (action.type === 'START') {
			return {
				newState: 'NAME',
				data: {},
				message: '',
				messageKey: 'askName',
			};
		}

		return {
			newState: 'COMPLETED',
			data,
			message: '',
			messageKey: 'alreadyOnboarded',
		};
	}

	/**
	 * Create initial session
	 */
	static createSession(): OnboardingSession {
		return {
			state: 'IDLE',
			data: {},
			startedAt: Date.now(),
		};
	}

	/**
	 * Check if a state allows skipping
	 */
	static canSkip(state: OnboardingState): boolean {
		return state === 'INTERESTS' || state === 'LANGUAGE';
	}

	/**
	 * Check if onboarding is in progress
	 */
	static isInProgress(state: OnboardingState): boolean {
		return state !== 'IDLE' && state !== 'COMPLETED';
	}
}
