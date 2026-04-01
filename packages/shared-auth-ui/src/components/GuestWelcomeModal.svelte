<script lang="ts">
	import { getManaApp, type AppIconId } from '@manacore/shared-branding';
	import {
		X,
		Info,
		SignIn,
		UserPlus,
		Question,
		ArrowRight,
		Lightning,
		ShieldCheck,
		Sparkle,
		ArrowSquareOut,
	} from '@manacore/shared-icons';
	import { markGuestWelcomeSeen } from '../utils/guestWelcome';
	import type { GuestWelcomeTranslations } from '../types';

	const defaultTranslationsDE: GuestWelcomeTranslations = {
		title: 'Willkommen',
		guestModeTitle: 'Sofort loslegen:',
		whatYouCanDo: 'Was du als Gast tun kannst',
		dataWarningTitle: 'Hinweis',
		dataWarningText:
			'Daten werden nur lokal in diesem Browser gespeichert. Melde dich an, um sie geräteübergreifend zu synchronisieren.',
		loginButton: 'Anmelden',
		registerButton: 'Konto erstellen',
		helpButton: 'Hilfe & Erste Schritte',
		continueAsGuest: 'Weiter als Gast',
	};

	const defaultTranslationsEN: GuestWelcomeTranslations = {
		title: 'Welcome',
		guestModeTitle: 'Get started instantly:',
		whatYouCanDo: 'What you can do as a guest',
		dataWarningTitle: 'Note',
		dataWarningText: 'Data is stored locally in this browser only. Sign in to sync across devices.',
		loginButton: 'Sign In',
		registerButton: 'Sign Up',
		helpButton: 'Help & Getting Started',
		continueAsGuest: 'Continue as Guest',
	};

	/** Default features per app (German) */
	const defaultFeaturesDE: Record<string, string[]> = {
		contacts: ['Alle Kontakte an einem Ort', 'Keine Anmeldung nötig', 'Deine Daten gehören dir'],
		chat: ['Dein persönlicher KI-Assistent', 'Keine Anmeldung nötig', 'Deine Daten gehören dir'],
		todo: ['Organisiere deinen Alltag', 'Keine Anmeldung nötig', 'Deine Daten gehören dir'],
		calendar: ['Dein Kalender, deine Regeln', 'Keine Anmeldung nötig', 'Deine Daten gehören dir'],
		clock: ['Zeit im Griff, überall', 'Keine Anmeldung nötig', 'Deine Daten gehören dir'],
		zitare: ['Tägliche Inspiration für dich', 'Keine Anmeldung nötig', 'Deine Daten gehören dir'],
		picture: ['Kreativität trifft KI', 'Keine Anmeldung nötig', 'Deine Daten gehören dir'],
		cards: ['Lernen leicht gemacht', 'Keine Anmeldung nötig', 'Deine Daten gehören dir'],
	};

	/** Default features per app (English) */
	const defaultFeaturesEN: Record<string, string[]> = {
		contacts: ['All your contacts in one place', 'No sign-up needed', 'Your data belongs to you'],
		chat: ['Your personal AI assistant', 'No sign-up needed', 'Your data belongs to you'],
		todo: ['Organize your day', 'No sign-up needed', 'Your data belongs to you'],
		calendar: ['Your calendar, your rules', 'No sign-up needed', 'Your data belongs to you'],
		clock: ['Time at your fingertips', 'No sign-up needed', 'Your data belongs to you'],
		zitare: ['Daily inspiration for you', 'No sign-up needed', 'Your data belongs to you'],
		picture: ['Where creativity meets AI', 'No sign-up needed', 'Your data belongs to you'],
		cards: ['Learning made easy', 'No sign-up needed', 'Your data belongs to you'],
	};

	interface Props {
		/** The app ID to show welcome for */
		appId: AppIconId;
		/** Whether the modal is visible */
		visible: boolean;
		/** Callback when modal is closed */
		onClose: () => void;
		/** Callback when login is clicked */
		onLogin: () => void;
		/** Callback when register is clicked */
		onRegister: () => void;
		/** Optional callback when help is clicked */
		onHelp?: () => void;
		/** Alternative: direct href for help link */
		helpHref?: string;
		/** Locale for translations (default: 'de') */
		locale?: 'de' | 'en';
		/** Custom feature list (overrides default) */
		features?: string[];
		/** Custom translations (partial) */
		translations?: Partial<GuestWelcomeTranslations>;
	}

	let {
		appId,
		visible,
		onClose,
		onLogin,
		onRegister,
		onHelp,
		helpHref,
		locale = 'de',
		features,
		translations = {},
	}: Props = $props();

	// Get app info from branding
	const appInfo = $derived(getManaApp(appId));

	// Merge default translations with custom ones
	const defaultTranslations = $derived(
		locale === 'de' ? defaultTranslationsDE : defaultTranslationsEN
	);
	const t = $derived({ ...defaultTranslations, ...translations });

	// Get features (custom > default by app > generic)
	const defaultFeatures = $derived(locale === 'de' ? defaultFeaturesDE : defaultFeaturesEN);
	const featureList = $derived(
		features ||
			t.features ||
			defaultFeatures[appId] || [
				locale === 'de' ? 'Alle Features ausprobieren' : 'Try all features',
				locale === 'de' ? 'Daten lokal speichern' : 'Store data locally',
			]
	);

	function handleContinueAsGuest() {
		markGuestWelcomeSeen(appId);
		onClose();
	}

	function handleLogin() {
		markGuestWelcomeSeen(appId);
		onLogin();
	}

	function handleRegister() {
		markGuestWelcomeSeen(appId);
		onRegister();
	}

	function handleHelp() {
		if (onHelp) {
			onHelp();
		} else if (helpHref && typeof window !== 'undefined') {
			window.location.href = helpHref;
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleContinueAsGuest();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && visible) {
			handleContinueAsGuest();
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
		// Auto-focus the primary (login) button - skip close button (index 0)
		const focusable = node.querySelectorAll(focusableSelectors) as NodeListOf<HTMLElement>;
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

{#if visible && appInfo}
	<!-- Modal Backdrop -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="modal-backdrop"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="welcome-title"
		aria-describedby="welcome-features"
		tabindex="-1"
	>
		<!-- Modal Content -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="modal-content"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			use:trapFocus
		>
			<!-- Close Button -->
			<button type="button" class="close-button" onclick={handleContinueAsGuest} aria-label="Close">
				<X size={20} weight="bold" />
			</button>

			<!-- App Icon -->
			<div class="icon-container" style:--app-color={appInfo.color}>
				<img src={appInfo.icon} alt={appInfo.name} class="app-icon" />
			</div>

			<!-- App Name -->
			<h2 id="welcome-title" class="app-name">{appInfo.name}</h2>

			<!-- Guest Features -->
			<div id="welcome-features" class="features-section">
				<ul class="features-list">
					{#each featureList as feature, i}
						<li class="feature-item">
							{#if i === 0}
								<Sparkle size={16} weight="fill" class="feature-icon" />
							{:else if i === 1}
								<Lightning size={16} weight="fill" class="feature-icon" />
							{:else}
								<ShieldCheck size={16} weight="fill" class="feature-icon" />
							{/if}
							<span>{feature}</span>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Action Buttons -->
			<div class="buttons-section">
				<button
					type="button"
					class="btn btn-primary"
					style:--btn-color={appInfo.color}
					onclick={handleRegister}
				>
					<UserPlus size={20} />
					<span>{t.registerButton}</span>
				</button>

				<button
					type="button"
					class="btn btn-secondary"
					style:--btn-color={appInfo.color}
					onclick={handleLogin}
				>
					<SignIn size={20} />
					<span>{t.loginButton}</span>
				</button>

				{#if onHelp || helpHref}
					<button type="button" class="btn btn-tertiary" onclick={handleHelp}>
						<Question size={18} />
						<span>{t.helpButton}</span>
					</button>
				{/if}

				<button type="button" class="btn btn-ghost" onclick={handleContinueAsGuest}>
					<span>{t.continueAsGuest}</span>
					<ArrowRight size={18} />
				</button>

				<!-- Data hint + learn more -->
				<div class="footer-hints">
					<p class="data-hint">
						<Info size={14} class="data-hint-icon" />
						<span>{t.dataWarningText}</span>
					</p>
					<a
						href="https://manacore-landing.pages.dev"
						target="_blank"
						rel="noopener noreferrer"
						class="learn-more-link"
					>
						<span>{locale === 'de' ? 'Mehr über Mana erfahren' : 'Learn more about Mana'}</span>
						<ArrowSquareOut size={12} />
					</a>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		padding: 1rem;
		z-index: 9999;
		animation: fadeIn 0.2s ease-out;
	}

	.modal-content {
		position: relative;
		width: 100%;
		max-width: 400px;
		max-height: 90vh;
		overflow-y: auto;
		background: linear-gradient(
			145deg,
			rgba(255, 255, 255, 0.95) 0%,
			rgba(255, 255, 255, 0.9) 100%
		);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 1.5rem;
		padding: 2rem 1.5rem;
		backdrop-filter: blur(20px);
		box-shadow:
			0 25px 50px -12px rgba(0, 0, 0, 0.15),
			0 0 0 1px rgba(0, 0, 0, 0.05) inset;
		animation: slideUp 0.3s ease-out;
	}

	:global(.dark) .modal-content {
		background: linear-gradient(
			145deg,
			rgba(255, 255, 255, 0.08) 0%,
			rgba(255, 255, 255, 0.04) 100%
		);
		border-color: rgba(255, 255, 255, 0.12);
		box-shadow:
			0 25px 50px -12px rgba(0, 0, 0, 0.4),
			0 0 0 1px rgba(255, 255, 255, 0.05) inset;
	}

	.close-button {
		position: absolute;
		top: 1rem;
		right: 1rem;
		width: 2.25rem;
		height: 2.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		border-radius: 0.75rem;
		background: rgba(0, 0, 0, 0.05);
		color: rgba(0, 0, 0, 0.5);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.close-button:hover {
		background: rgba(0, 0, 0, 0.1);
		color: rgba(0, 0, 0, 0.8);
		transform: scale(1.05);
	}

	:global(.dark) .close-button {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.6);
	}

	:global(.dark) .close-button:hover {
		background: rgba(255, 255, 255, 0.15);
		color: rgba(255, 255, 255, 0.9);
	}

	.icon-container {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		margin: 0 auto 0.75rem;
		border-radius: 1.25rem;
		background: linear-gradient(
			145deg,
			color-mix(in srgb, var(--app-color) 20%, transparent),
			color-mix(in srgb, var(--app-color) 10%, transparent)
		);
		border: 2px solid color-mix(in srgb, var(--app-color) 40%, transparent);
		box-shadow:
			0 8px 24px color-mix(in srgb, var(--app-color) 25%, transparent),
			0 0 0 1px color-mix(in srgb, var(--app-color) 15%, transparent) inset;
	}

	.app-icon {
		width: 36px;
		height: 36px;
		object-fit: contain;
	}

	.app-name {
		margin: 0 0 0.5rem;
		font-size: 1.5rem;
		font-weight: 700;
		text-align: center;
		color: rgba(0, 0, 0, 0.9);
	}

	:global(.dark) .app-name {
		color: rgba(255, 255, 255, 0.95);
	}

	.features-section {
		margin-bottom: 1rem;
	}

	.features-list {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.feature-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0;
		font-size: 0.875rem;
		color: rgba(0, 0, 0, 0.7);
	}

	:global(.dark) .feature-item {
		color: rgba(255, 255, 255, 0.7);
	}

	:global(.feature-icon) {
		flex-shrink: 0;
		color: rgba(0, 0, 0, 0.4);
	}

	:global(.dark .feature-icon) {
		color: rgba(255, 255, 255, 0.45);
	}

	.buttons-section {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.footer-hints {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}

	.learn-more-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: rgba(0, 0, 0, 0.4);
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.learn-more-link:hover {
		color: rgba(0, 0, 0, 0.7);
	}

	:global(.dark) .learn-more-link {
		color: rgba(255, 255, 255, 0.4);
	}

	:global(.dark) .learn-more-link:hover {
		color: rgba(255, 255, 255, 0.7);
	}

	.data-hint {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		gap: 0.375rem;
		margin: 0.25rem 0 0;
		font-size: 0.75rem;
		line-height: 1.4;
		color: rgba(0, 0, 0, 0.4);
		text-align: center;
	}

	:global(.dark) .data-hint {
		color: rgba(255, 255, 255, 0.4);
	}

	:global(.data-hint-icon) {
		flex-shrink: 0;
		margin-top: 0.1rem;
		color: rgba(0, 0, 0, 0.3);
	}

	:global(.dark .data-hint-icon) {
		color: rgba(255, 255, 255, 0.3);
	}

	.btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.75rem 1rem;
		border: none;
		border-radius: 0.875rem;
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-primary {
		background: linear-gradient(
			145deg,
			color-mix(in srgb, var(--btn-color) 90%, white),
			var(--btn-color)
		);
		color: white;
		box-shadow: 0 4px 12px color-mix(in srgb, var(--btn-color) 35%, transparent);
	}

	.btn-primary:hover {
		transform: translateY(-1px);
		box-shadow: 0 6px 16px color-mix(in srgb, var(--btn-color) 45%, transparent);
	}

	.btn-secondary {
		background: color-mix(in srgb, var(--btn-color) 15%, transparent);
		color: var(--btn-color);
		border: 1px solid color-mix(in srgb, var(--btn-color) 30%, transparent);
	}

	.btn-secondary:hover {
		background: color-mix(in srgb, var(--btn-color) 25%, transparent);
	}

	.btn-tertiary {
		background: rgba(0, 0, 0, 0.05);
		color: rgba(0, 0, 0, 0.7);
		border: 1px solid rgba(0, 0, 0, 0.1);
	}

	.btn-tertiary:hover {
		background: rgba(0, 0, 0, 0.08);
		color: rgba(0, 0, 0, 0.9);
	}

	:global(.dark) .btn-tertiary {
		background: rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.8);
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .btn-tertiary:hover {
		background: rgba(255, 255, 255, 0.12);
		color: rgba(255, 255, 255, 0.95);
	}

	.btn-ghost {
		background: transparent;
		color: rgba(0, 0, 0, 0.5);
		padding: 0.625rem 1rem;
	}

	.btn-ghost:hover {
		color: rgba(0, 0, 0, 0.8);
	}

	:global(.dark) .btn-ghost {
		color: rgba(255, 255, 255, 0.5);
	}

	:global(.dark) .btn-ghost:hover {
		color: rgba(255, 255, 255, 0.8);
	}

	/* Animations */
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.modal-backdrop,
		.modal-content {
			animation: none;
		}

		.btn,
		.close-button {
			transition: none;
		}
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.modal-content {
			padding: 1.5rem 1.25rem;
			border-radius: 1.25rem;
		}

		.icon-container {
			width: 48px;
			height: 48px;
		}

		.app-icon {
			width: 32px;
			height: 32px;
		}

		.app-name {
			font-size: 1.25rem;
		}
	}
</style>
