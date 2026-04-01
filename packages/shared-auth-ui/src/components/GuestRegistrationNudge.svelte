<script lang="ts">
	import { onMount } from 'svelte';
	import { UserPlus, X, ArrowRight } from '@manacore/shared-icons';
	import { startGuestSession, shouldShowGuestNudge, dismissGuestNudge } from '../utils/guestNudge';

	interface Props {
		/** App identifier for scoped localStorage */
		appId: string;
		/** Callback when register is clicked */
		onRegister: () => void;
		/** Locale for translations (default: 'de') */
		locale?: 'de' | 'en';
		/** Minutes to wait before showing (default: 5) */
		delayMinutes?: number;
	}

	let { appId, onRegister, locale = 'de', delayMinutes = 5 }: Props = $props();

	let visible = $state(false);

	const texts = $derived(
		locale === 'en'
			? {
					message: 'Like what you see? Save your data across devices.',
					button: 'Create account',
					dismiss: 'Close',
				}
			: {
					message: 'Gefällt es dir? Sichere deine Daten geräteübergreifend.',
					button: 'Konto erstellen',
					dismiss: 'Schließen',
				}
	);

	function handleDismiss() {
		dismissGuestNudge(appId);
		visible = false;
	}

	function handleRegister() {
		dismissGuestNudge(appId);
		onRegister();
	}

	onMount(() => {
		startGuestSession(appId);

		// Check periodically if delay has elapsed
		const interval = setInterval(() => {
			if (shouldShowGuestNudge(appId, delayMinutes)) {
				visible = true;
				clearInterval(interval);
			}
		}, 30_000); // check every 30s

		// Also check immediately (returning user)
		if (shouldShowGuestNudge(appId, delayMinutes)) {
			visible = true;
			clearInterval(interval);
		}

		return () => clearInterval(interval);
	});
</script>

{#if visible}
	<div class="nudge-banner" role="status" aria-live="polite">
		<div class="nudge-content">
			<p class="nudge-message">{texts.message}</p>
			<div class="nudge-actions">
				<button class="nudge-register" onclick={handleRegister}>
					<UserPlus size={16} weight="bold" />
					{texts.button}
					<ArrowRight size={14} />
				</button>
				<button class="nudge-dismiss" onclick={handleDismiss} aria-label={texts.dismiss}>
					<X size={16} weight="bold" />
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.nudge-banner {
		position: fixed;
		bottom: 1.5rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 9998;
		padding: 0 1rem;
		width: 100%;
		max-width: 480px;
		animation: slideUp 300ms ease-out;
	}

	@keyframes slideUp {
		from {
			transform: translateX(-50%) translateY(100%);
			opacity: 0;
		}
		to {
			transform: translateX(-50%) translateY(0);
			opacity: 1;
		}
	}

	.nudge-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		border-radius: 1rem;
		background: rgba(255, 255, 255, 0.95);
		border: 1px solid rgba(0, 0, 0, 0.08);
		backdrop-filter: blur(12px);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.12),
			0 0 0 1px rgba(0, 0, 0, 0.04) inset;
	}

	:global(.dark) .nudge-content {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.12);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.3),
			0 0 0 1px rgba(255, 255, 255, 0.06) inset;
	}

	.nudge-message {
		flex: 1;
		margin: 0;
		font-size: 0.8125rem;
		line-height: 1.4;
		color: rgba(0, 0, 0, 0.7);
	}

	:global(.dark) .nudge-message {
		color: rgba(255, 255, 255, 0.75);
	}

	.nudge-actions {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-shrink: 0;
	}

	.nudge-register {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: white;
		background: #7c3aed;
		border: none;
		border-radius: 0.625rem;
		cursor: pointer;
		transition: background 150ms ease;
		white-space: nowrap;
	}

	.nudge-register:hover {
		background: #6d28d9;
	}

	.nudge-dismiss {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		padding: 0;
		color: rgba(0, 0, 0, 0.4);
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: background 150ms ease;
	}

	.nudge-dismiss:hover {
		background: rgba(0, 0, 0, 0.06);
		color: rgba(0, 0, 0, 0.7);
	}

	:global(.dark) .nudge-dismiss {
		color: rgba(255, 255, 255, 0.4);
	}

	:global(.dark) .nudge-dismiss:hover {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.8);
	}

	@media (prefers-reduced-motion: reduce) {
		.nudge-banner {
			animation: none;
		}
		* {
			transition-duration: 0.01ms !important;
		}
	}

	@media (max-width: 480px) {
		.nudge-banner {
			bottom: 1rem;
		}

		.nudge-content {
			flex-wrap: wrap;
		}

		.nudge-message {
			flex-basis: calc(100% - 2.5rem);
		}

		.nudge-actions {
			width: 100%;
			justify-content: flex-end;
		}
	}
</style>
