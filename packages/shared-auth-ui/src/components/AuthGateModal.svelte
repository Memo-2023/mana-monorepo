<script lang="ts">
	import { CloudArrowUp, ArrowsClockwise, Lock, Sparkle, Info, X } from '@mana/shared-icons';
	import type { AuthGateTranslations, AuthGateAction } from '../types';

	const defaultTranslationsDE: Record<AuthGateAction, { title: string; description: string }> = {
		save: {
			title: 'Anmelden um zu speichern',
			description:
				'Im Demo-Modus kannst du die App erkunden. Melde dich an, um deine Daten zu speichern.',
		},
		sync: {
			title: 'Anmelden für Cloud-Sync',
			description:
				'Mit einem Account werden deine Daten automatisch synchronisiert und bleiben erhalten.',
		},
		feature: {
			title: 'Anmelden erforderlich',
			description: 'Diese Funktion erfordert ein Konto. Melde dich an, um sie zu nutzen.',
		},
		ai: {
			title: 'KI-Antworten erhalten',
			description:
				'Um KI-Antworten zu erhalten, ist eine Anmeldung erforderlich. Dies ermöglicht uns, die Kosten für die KI-Verarbeitung zu verwalten.',
		},
	};

	const defaultTranslationsEN: Record<AuthGateAction, { title: string; description: string }> = {
		save: {
			title: 'Sign in to save',
			description: 'In demo mode you can explore the app. Sign in to save your data permanently.',
		},
		sync: {
			title: 'Sign in for Cloud Sync',
			description: 'With an account your data will be automatically synced and preserved.',
		},
		feature: {
			title: 'Sign in required',
			description: 'This feature requires an account. Sign in to use it.',
		},
		ai: {
			title: 'Get AI responses',
			description:
				'To receive AI responses, sign in is required. This allows us to manage AI processing costs.',
		},
	};

	const defaultButtonsDE: AuthGateTranslations = {
		loginButton: 'Anmelden',
		registerButton: 'Kostenloses Konto erstellen',
		laterButton: 'Später',
		migrationInfo: (count) =>
			`Du hast ${count} ${count === 1 ? 'Unterhaltung' : 'Unterhaltungen'} in deiner Session. Diese werden nach der Anmeldung in deinen Account übertragen.`,
	};

	const defaultButtonsEN: AuthGateTranslations = {
		loginButton: 'Sign In',
		registerButton: 'Create Free Account',
		laterButton: 'Later',
		migrationInfo: (count) =>
			`You have ${count} ${count === 1 ? 'conversation' : 'conversations'} in your session. These will be transferred to your account after signing in.`,
	};

	interface Props {
		/** Whether the modal is visible */
		visible: boolean;
		/** Callback when modal is closed */
		onClose: () => void;
		/** Callback when login is clicked */
		onLogin: () => void;
		/** Callback when register is clicked */
		onRegister: () => void;
		/** The action type that triggered this modal */
		action?: AuthGateAction;
		/** Custom feature name (for action='feature') */
		featureName?: string;
		/** Number of items to migrate (shows migration info) */
		migrationCount?: number;
		/** Locale for translations (default: 'de') */
		locale?: 'de' | 'en';
		/** Custom translations */
		translations?: Partial<AuthGateTranslations>;
		/** Custom title (overrides action-based title) */
		customTitle?: string;
		/** Custom description (overrides action-based description) */
		customDescription?: string;
		/** Custom info text at bottom */
		infoText?: string;
	}

	let {
		visible,
		onClose,
		onLogin,
		onRegister,
		action = 'save',
		featureName = '',
		migrationCount = 0,
		locale = 'de',
		translations = {},
		customTitle,
		customDescription,
		infoText,
	}: Props = $props();

	// Merge translations
	const defaultMessages = $derived(locale === 'de' ? defaultTranslationsDE : defaultTranslationsEN);
	const defaultButtons = $derived(locale === 'de' ? defaultButtonsDE : defaultButtonsEN);
	const t = $derived({ ...defaultButtons, ...translations });

	// Get current message based on action
	const currentMessage = $derived(() => {
		const msg = defaultMessages[action];
		let title = customTitle || msg.title;
		let description = customDescription || msg.description;

		// Handle feature action with custom name
		if (action === 'feature' && featureName) {
			title = locale === 'de' ? `Anmelden für ${featureName}` : `Sign in for ${featureName}`;
			description =
				locale === 'de'
					? `Diese Funktion erfordert ein Konto. Melde dich an, um ${featureName} zu nutzen.`
					: `This feature requires an account. Sign in to use ${featureName}.`;
		}

		return { title, description };
	});

	// Migration info text
	const migrationText = $derived(() => {
		if (migrationCount <= 0) return '';
		if (translations.migrationInfo) {
			return translations.migrationInfo(migrationCount);
		}
		return t.migrationInfo(migrationCount);
	});

	// Icon for action type
	const actionIcon = $derived.by(() => {
		switch (action) {
			case 'save':
				return CloudArrowUp;
			case 'sync':
				return ArrowsClockwise;
			case 'ai':
				return Sparkle;
			default:
				return Lock;
		}
	});

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && visible) {
			onClose();
		}
	}

	function trapFocus(node: HTMLElement) {
		const focusableSelectors =
			'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

		function handleKeydown(e: KeyboardEvent) {
			if (e.key !== 'Tab') return;

			const focusable = Array.from(node.querySelectorAll(focusableSelectors)) as HTMLElement[];
			if (focusable.length === 0) return;

			const first = focusable[0];
			const last = focusable[focusable.length - 1];

			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}

		node.addEventListener('keydown', handleKeydown);
		// Auto-focus the primary (login) button
		const focusable = node.querySelectorAll(focusableSelectors) as NodeListOf<HTMLElement>;
		// Skip the close button (index 0), focus the login button (index 1)
		if (focusable.length > 1) {
			focusable[1].focus();
		} else if (focusable.length > 0) {
			focusable[0].focus();
		}

		return {
			destroy() {
				node.removeEventListener('keydown', handleKeydown);
			},
		};
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if visible}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
		onclick={handleBackdropClick}
		onkeydown={(e) => {
			if (e.key === 'Escape') handleBackdropClick();
		}}
		role="presentation"
		tabindex="-1"
	>
		<div
			class="bg-card border-border relative mx-4 w-full max-w-md rounded-xl border p-6 shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="auth-gate-title"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			use:trapFocus
		>
			<!-- Close button -->
			<button
				type="button"
				class="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md"
				onclick={onClose}
				aria-label="Close"
			>
				<X size={20} />
			</button>

			<!-- Icon -->
			<div
				class="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
			>
				<svelte:component this={actionIcon} size={32} class="text-primary" />
			</div>

			<!-- Title -->
			<h2 id="auth-gate-title" class="mb-2 text-center text-xl font-semibold text-foreground">
				{currentMessage().title}
			</h2>

			<!-- Description -->
			<p class="text-muted-foreground mb-4 text-center text-sm">
				{currentMessage().description}
			</p>

			<!-- Migration Info -->
			{#if migrationText()}
				<div
					class="flex gap-3 p-3 mb-4 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary"
				>
					<Info size={20} class="flex-shrink-0 mt-0.5" />
					<span>{migrationText()}</span>
				</div>
			{/if}

			<!-- Buttons -->
			<div class="flex flex-col gap-3">
				<button
					type="button"
					onclick={onLogin}
					class="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-lg px-4 py-3 font-medium transition-colors"
				>
					{t.loginButton}
				</button>
				<button
					type="button"
					onclick={onRegister}
					class="bg-secondary text-secondary-foreground hover:bg-secondary/80 w-full rounded-lg px-4 py-3 font-medium transition-colors"
				>
					{t.registerButton}
				</button>
				<button
					type="button"
					onclick={onClose}
					class="text-muted-foreground hover:text-foreground w-full py-2 text-sm transition-colors"
				>
					{t.laterButton}
				</button>
			</div>

			<!-- Info text -->
			{#if infoText}
				<p class="text-muted-foreground mt-4 text-center text-xs">
					{infoText}
				</p>
			{/if}
		</div>
	</div>
{/if}
