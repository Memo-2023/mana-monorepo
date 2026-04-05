<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';

	let showPrompt = $state(false);
	let registration = $state<ServiceWorkerRegistration | null>(null);

	onMount(() => {
		if (!('serviceWorker' in navigator)) return;

		function onNewSW(reg: ServiceWorkerRegistration) {
			registration = reg;
			showPrompt = true;
		}

		navigator.serviceWorker.ready.then((reg) => {
			// Already waiting worker present
			if (reg.waiting) {
				onNewSW(reg);
				return;
			}

			// Watch for new installs
			reg.addEventListener('updatefound', () => {
				const newWorker = reg.installing;
				if (!newWorker) return;

				newWorker.addEventListener('statechange', () => {
					if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
						onNewSW(reg);
					}
				});
			});
		});
	});

	let reloading = false;

	function handleUpdate() {
		if (!registration?.waiting || reloading) return;

		registration.waiting.postMessage({ type: 'SKIP_WAITING' });

		// Reload once the new SW takes over (once only)
		navigator.serviceWorker.addEventListener(
			'controllerchange',
			() => {
				if (reloading) return;
				reloading = true;
				window.location.reload();
			},
			{ once: true }
		);
	}

	function handleDismiss() {
		showPrompt = false;
	}
</script>

{#if showPrompt}
	<div class="update-banner" role="alert">
		<div class="update-content">
			<svg class="update-icon" width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
				<path
					d="M224,128a96,96,0,1,1-96-96A96.11,96.11,0,0,1,224,128Zm-40-8H136V80a8,8,0,0,0-16,0v48a8,8,0,0,0,8,8h48a8,8,0,0,0,0-16Z"
				/>
			</svg>
			<span class="update-text">
				{$_('pwa.updateAvailable', { default: 'Neue Version verfügbar' })}
			</span>
		</div>
		<div class="update-actions">
			<button type="button" class="update-btn" onclick={handleUpdate}>
				{$_('pwa.updateNow', { default: 'Aktualisieren' })}
			</button>
			<button type="button" class="dismiss-btn" onclick={handleDismiss}>
				{$_('pwa.later', { default: 'Später' })}
			</button>
		</div>
	</div>
{/if}

<style>
	.update-banner {
		position: fixed;
		bottom: 12px;
		right: 12px;
		z-index: 200;
		display: flex;
		align-items: center;
		gap: 12px;
		background: hsl(var(--color-card, 0 0% 10%) / 0.95);
		color: hsl(var(--color-foreground, 0 0% 90%));
		padding: 12px 16px;
		border-radius: 12px;
		font-size: 13px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
		animation: slideUp 0.3s ease-out;
		backdrop-filter: blur(12px);
		border: 1px solid hsl(var(--color-foreground, 0 0% 90%) / 0.1);
		max-width: 360px;
	}

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.update-content {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.update-icon {
		flex-shrink: 0;
		color: #6366f1;
	}

	.update-text {
		white-space: nowrap;
	}

	@media (max-width: 640px) {
		.update-banner {
			bottom: calc(5rem + env(safe-area-inset-bottom, 0px));
			left: 12px;
			right: 12px;
			max-width: none;
		}

		.update-text {
			white-space: normal;
			font-size: 12px;
		}
	}

	.update-actions {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}

	.update-btn {
		background: #6366f1;
		border: none;
		color: white;
		padding: 5px 12px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}

	.update-btn:hover {
		background: #5558e6;
	}

	.dismiss-btn {
		background: hsl(var(--color-foreground, 0 0% 90%) / 0.08);
		border: none;
		color: hsl(var(--color-foreground, 0 0% 90%) / 0.6);
		padding: 5px 10px;
		border-radius: 6px;
		font-size: 12px;
		cursor: pointer;
		white-space: nowrap;
	}

	.dismiss-btn:hover {
		background: hsl(var(--color-foreground, 0 0% 90%) / 0.15);
		color: hsl(var(--color-foreground, 0 0% 90%) / 0.8);
	}
</style>
