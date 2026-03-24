<script lang="ts">
	import { onMount } from 'svelte';
	import { onSessionExpired, isSessionExpired, resetSessionExpired } from '@manacore/shared-auth';
	import { Warning, X, SignOut } from '@manacore/shared-icons';

	interface Props {
		/** Login page URL. Defaults to '/login'. */
		loginHref?: string;
		/** Locale for text. Supports 'de' and 'en'. Defaults to 'de'. */
		locale?: string;
	}

	let { loginHref = '/login', locale = 'de' }: Props = $props();

	let visible = $state(false);
	let dismissed = $state(false);

	const texts = $derived(
		locale === 'en'
			? {
					message: 'Your session has expired. Please sign in again.',
					button: 'Sign in',
					dismiss: 'Close',
				}
			: {
					message: 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
					button: 'Neu anmelden',
					dismiss: 'Schließen',
				}
	);

	function handleDismiss() {
		dismissed = true;
		visible = false;
	}

	function handleLogin() {
		resetSessionExpired();
		window.location.href = loginHref;
	}

	onMount(() => {
		// Check if already expired on mount
		if (isSessionExpired()) {
			visible = true;
		}

		// Subscribe to future expiry events
		const unsubscribe = onSessionExpired(() => {
			if (!dismissed) {
				visible = true;
			}
		});

		return unsubscribe;
	});
</script>

{#if visible && !dismissed}
	<div class="session-expired-banner" role="alert" aria-live="assertive">
		<div class="session-expired-content">
			<div class="session-expired-icon">
				<Warning size={20} weight="fill" />
			</div>
			<p class="session-expired-message">{texts.message}</p>
			<div class="session-expired-actions">
				<button class="session-expired-login" onclick={handleLogin}>
					<SignOut size={16} weight="bold" />
					{texts.button}
				</button>
				<button class="session-expired-dismiss" onclick={handleDismiss} aria-label={texts.dismiss}>
					<X size={18} weight="bold" />
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.session-expired-banner {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 9999;
		display: flex;
		justify-content: center;
		padding: 0.5rem 1rem;
		animation: slideDown 300ms ease-out;
	}

	@keyframes slideDown {
		from {
			transform: translateY(-100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.session-expired-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		max-width: 600px;
		width: 100%;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		background: #fef3c7;
		border: 1px solid #f59e0b;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	:global(.dark) .session-expired-content {
		background: #78350f;
		border-color: #b45309;
		color: #fef3c7;
	}

	.session-expired-icon {
		flex-shrink: 0;
		color: #d97706;
	}

	:global(.dark) .session-expired-icon {
		color: #fbbf24;
	}

	.session-expired-message {
		flex: 1;
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.25rem;
		color: #92400e;
	}

	:global(.dark) .session-expired-message {
		color: #fef3c7;
	}

	.session-expired-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.session-expired-login {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: white;
		background: #d97706;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background 150ms ease;
		white-space: nowrap;
	}

	.session-expired-login:hover {
		background: #b45309;
	}

	:global(.dark) .session-expired-login {
		background: #f59e0b;
		color: #78350f;
	}

	:global(.dark) .session-expired-login:hover {
		background: #fbbf24;
	}

	.session-expired-dismiss {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		padding: 0;
		color: #92400e;
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: background 150ms ease;
	}

	.session-expired-dismiss:hover {
		background: rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .session-expired-dismiss {
		color: #fef3c7;
	}

	:global(.dark) .session-expired-dismiss:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	/* Mobile: stack vertically */
	@media (max-width: 480px) {
		.session-expired-content {
			flex-wrap: wrap;
		}

		.session-expired-message {
			flex-basis: calc(100% - 3rem);
		}

		.session-expired-actions {
			margin-left: auto;
		}
	}
</style>
