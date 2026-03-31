<script lang="ts">
	import { getManaApp, type AppIconId } from '@manacore/shared-branding';
	import { X, Info, Warning, SignIn, UserPlus, Question, ArrowRight } from '@manacore/shared-icons';
	import { markGuestWelcomeSeen } from '../utils/guestWelcome';
	import type { GuestWelcomeTranslations } from '../types';

	const defaultTranslationsDE: GuestWelcomeTranslations = {
		title: 'Willkommen',
		guestModeTitle: 'Als Gast kannst du:',
		whatYouCanDo: 'Was du als Gast tun kannst',
		dataWarningTitle: 'Hinweis',
		dataWarningText:
			'Daten werden nur in diesem Browser-Tab gespeichert und gehen beim Schließen verloren.',
		loginButton: 'Anmelden',
		registerButton: 'Kostenloses Konto erstellen',
		helpButton: 'Hilfe & Erste Schritte',
		continueAsGuest: 'Weiter als Gast',
	};

	const defaultTranslationsEN: GuestWelcomeTranslations = {
		title: 'Welcome',
		guestModeTitle: 'As a guest you can:',
		whatYouCanDo: 'What you can do as a guest',
		dataWarningTitle: 'Note',
		dataWarningText: 'Data is only stored in this browser tab and will be lost when you close it.',
		loginButton: 'Sign In',
		registerButton: 'Create Free Account',
		helpButton: 'Help & Getting Started',
		continueAsGuest: 'Continue as Guest',
	};

	/** Default features per app (German) */
	const defaultFeaturesDE: Record<string, string[]> = {
		contacts: [
			'Kontakte erstellen und bearbeiten',
			'Tags und Gruppen verwenden',
			'Alle Features ausprobieren',
		],
		chat: ['Mit der KI chatten', 'Verschiedene Modelle ausprobieren', 'Nachrichten formatieren'],
		todo: [
			'Aufgaben erstellen und organisieren',
			'Projekte und Labels nutzen',
			'Subtasks und Deadlines setzen',
		],
		calendar: [
			'Termine erstellen und bearbeiten',
			'Verschiedene Ansichten nutzen',
			'Erinnerungen setzen',
		],
		clock: ['Weltzeituhr anzeigen', 'Timer und Stoppuhr nutzen', 'Wecker einrichten'],
		zitare: ['Inspirierende Zitate entdecken', 'Favoriten markieren', 'Zitate teilen'],
		picture: [
			'Bilder mit KI generieren',
			'Verschiedene Stile ausprobieren',
			'Bilder herunterladen',
		],
		manadeck: ['Karteikarten erstellen', 'Decks organisieren', 'Lernmodus testen'],
	};

	/** Default features per app (English) */
	const defaultFeaturesEN: Record<string, string[]> = {
		contacts: ['Create and edit contacts', 'Use tags and groups', 'Try all features'],
		chat: ['Chat with the AI', 'Try different models', 'Format messages'],
		todo: ['Create and organize tasks', 'Use projects and labels', 'Set subtasks and deadlines'],
		calendar: ['Create and edit events', 'Use different views', 'Set reminders'],
		clock: ['View world clocks', 'Use timer and stopwatch', 'Set alarms'],
		zitare: ['Discover inspiring quotes', 'Mark favorites', 'Share quotes'],
		picture: ['Generate images with AI', 'Try different styles', 'Download images'],
		manadeck: ['Create flashcards', 'Organize decks', 'Test learning mode'],
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

	// App description based on locale
	const appDescription = $derived(
		appInfo ? (locale === 'de' ? appInfo.longDescription.de : appInfo.longDescription.en) : ''
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
</script>

<svelte:window onkeydown={handleKeydown} />

{#if visible && appInfo}
	<!-- Modal Backdrop -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="modal-backdrop"
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Enter' && handleBackdropClick(e as unknown as MouseEvent)}
		role="dialog"
		aria-modal="true"
		aria-labelledby="welcome-title"
		tabindex="-1"
	>
		<!-- Modal Content -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="modal-content"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<!-- Close Button -->
			<button type="button" class="close-button" onclick={handleContinueAsGuest} aria-label="Close">
				<X size={20} weight="bold" />
			</button>

			<!-- App Icon -->
			<div class="icon-container" style:--app-color={appInfo.color}>
				<img src={appInfo.icon} alt={appInfo.name} class="app-icon" />
			</div>

			<!-- App Name & Description -->
			<h2 id="welcome-title" class="app-name">{appInfo.name}</h2>
			<p class="app-description">{appDescription}</p>

			<!-- Divider -->
			<div class="divider"></div>

			<!-- Guest Features -->
			<div class="features-section">
				<div class="section-header">
					<Info size={18} class="section-icon info-icon" />
					<span class="section-title">{t.guestModeTitle}</span>
				</div>
				<ul class="features-list">
					{#each featureList as feature}
						<li class="feature-item">
							<span class="feature-bullet">•</span>
							<span>{feature}</span>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Data Warning -->
			<div class="warning-section">
				<Warning size={18} class="section-icon warning-icon" />
				<p class="warning-text">{t.dataWarningText}</p>
			</div>

			<!-- Action Buttons -->
			<div class="buttons-section">
				<button
					type="button"
					class="btn btn-primary"
					style:--btn-color={appInfo.color}
					onclick={handleLogin}
				>
					<SignIn size={20} />
					<span>{t.loginButton}</span>
				</button>

				<button
					type="button"
					class="btn btn-secondary"
					style:--btn-color={appInfo.color}
					onclick={handleRegister}
				>
					<UserPlus size={20} />
					<span>{t.registerButton}</span>
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
		width: 80px;
		height: 80px;
		margin: 0 auto 1rem;
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
		width: 48px;
		height: 48px;
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

	.app-description {
		margin: 0 0 1.25rem;
		font-size: 0.9rem;
		line-height: 1.5;
		text-align: center;
		color: rgba(0, 0, 0, 0.6);
	}

	:global(.dark) .app-description {
		color: rgba(255, 255, 255, 0.6);
	}

	.divider {
		height: 1px;
		margin: 1rem 0;
		background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.1), transparent);
	}

	:global(.dark) .divider {
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
	}

	.features-section {
		margin-bottom: 1rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.section-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: rgba(0, 0, 0, 0.8);
	}

	:global(.dark) .section-title {
		color: rgba(255, 255, 255, 0.8);
	}

	.section-icon {
		flex-shrink: 0;
	}

	:global(.info-icon) {
		color: #3b82f6;
	}

	:global(.warning-icon) {
		color: #f59e0b;
	}

	.features-list {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.feature-item {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.35rem 0;
		font-size: 0.875rem;
		color: rgba(0, 0, 0, 0.7);
	}

	:global(.dark) .feature-item {
		color: rgba(255, 255, 255, 0.7);
	}

	.feature-bullet {
		color: rgba(0, 0, 0, 0.3);
	}

	:global(.dark) .feature-bullet {
		color: rgba(255, 255, 255, 0.4);
	}

	.warning-section {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.875rem;
		margin-bottom: 1.25rem;
		border-radius: 0.875rem;
		background: rgba(245, 158, 11, 0.1);
		border: 1px solid rgba(245, 158, 11, 0.25);
	}

	.warning-text {
		margin: 0;
		font-size: 0.8rem;
		line-height: 1.5;
		color: rgba(0, 0, 0, 0.75);
	}

	:global(.dark) .warning-text {
		color: rgba(255, 255, 255, 0.75);
	}

	.buttons-section {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.875rem 1rem;
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
			width: 70px;
			height: 70px;
		}

		.app-icon {
			width: 42px;
			height: 42px;
		}

		.app-name {
			font-size: 1.25rem;
		}
	}
</style>
