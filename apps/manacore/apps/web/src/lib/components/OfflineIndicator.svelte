<script lang="ts">
	import { networkStore } from '$lib/stores/network.svelte';
	import { _ } from 'svelte-i18n';

	let dismissed = $state(false);

	// Reset dismissed state when coming back online
	$effect(() => {
		if (networkStore.isOnline) {
			dismissed = false;
		}
	});

	const showBanner = $derived(!networkStore.isOnline && !dismissed);
	const showSyncBadge = $derived(
		networkStore.isOnline && networkStore.pendingCount > 0 && networkStore.syncStatus !== 'syncing'
	);
	const showSyncing = $derived(networkStore.isOnline && networkStore.syncStatus === 'syncing');
</script>

{#if showBanner}
	<div class="offline-banner" role="status" aria-live="polite">
		<div class="offline-icon">
			<svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
				<path
					d="M213.92,210.62a8,8,0,1,1-11.84,10.76l-39-42.86A83.93,83.93,0,0,0,48,128a84.37,84.37,0,0,0,.55,9.41,8,8,0,0,1-15.92,1.18A99.64,99.64,0,0,1,32,128a99.68,99.68,0,0,1,22.57-63.24L42.08,51.38A8,8,0,1,1,53.92,40.62ZM167.43,128a83.48,83.48,0,0,1-1.25,14.42,8,8,0,0,0,6.52,9.24,8.25,8.25,0,0,0,1.37.12,8,8,0,0,0,7.87-6.64A99.64,99.64,0,0,0,183.43,128a8,8,0,0,0-16,0Zm-32.53-56.88a8,8,0,0,0,5.15-15.13A100.06,100.06,0,0,0,32.63,128a8,8,0,0,0,16,0,84.07,84.07,0,0,1,86.27-83.88ZM231.43,128a8,8,0,0,0-16,0,84,84,0,0,1-14.82,47.64,8,8,0,0,0,13.22,9,100,100,0,0,0,17.6-56.64Zm-103.43,72a12,12,0,1,0,12,12A12,12,0,0,0,128,200Z"
				/>
			</svg>
		</div>
		<span class="offline-text"
			>{$_('pwa.offline', { default: 'Offline — Änderungen werden lokal gespeichert' })}</span
		>
		<button
			type="button"
			class="dismiss-btn"
			onclick={() => (dismissed = true)}
			aria-label="Schliessen"
		>
			<svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
				<path
					d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"
				/>
			</svg>
		</button>
	</div>
{/if}

{#if showSyncBadge}
	<div class="sync-badge" role="status" aria-live="polite">
		<span class="sync-dot pending"></span>
		<span class="sync-text">
			{networkStore.pendingCount}
			{$_('pwa.pendingChanges', { default: 'Änderungen warten auf Sync' })}
		</span>
	</div>
{/if}

{#if showSyncing}
	<div class="sync-badge" role="status" aria-live="polite">
		<span class="sync-dot syncing"></span>
		<span class="sync-text">{$_('pwa.syncing', { default: 'Synchronisiere...' })}</span>
	</div>
{/if}

<style>
	.offline-banner {
		position: fixed;
		top: 12px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 200;
		display: flex;
		align-items: center;
		gap: 8px;
		background: rgba(239, 68, 68, 0.92);
		color: white;
		padding: 8px 16px;
		border-radius: 10px;
		font-size: 13px;
		font-weight: 500;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
		animation: slideDown 0.3s ease-out;
		backdrop-filter: blur(8px);
	}

	@keyframes slideDown {
		from {
			transform: translateX(-50%) translateY(-20px);
			opacity: 0;
		}
		to {
			transform: translateX(-50%) translateY(0);
			opacity: 1;
		}
	}

	.offline-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.offline-text {
		white-space: nowrap;
	}

	.dismiss-btn {
		display: flex;
		align-items: center;
		background: rgba(255, 255, 255, 0.15);
		border: none;
		color: white;
		padding: 4px;
		border-radius: 4px;
		cursor: pointer;
		flex-shrink: 0;
		margin-left: 4px;
	}

	.dismiss-btn:hover {
		background: rgba(255, 255, 255, 0.25);
	}

	.sync-badge {
		position: fixed;
		top: 12px;
		right: 12px;
		z-index: 200;
		display: flex;
		align-items: center;
		gap: 6px;
		background: hsl(var(--color-card, 0 0% 10%) / 0.92);
		color: hsl(var(--color-foreground, 0 0% 90%));
		padding: 6px 12px;
		border-radius: 8px;
		font-size: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		animation: fadeIn 0.2s ease-out;
		backdrop-filter: blur(8px);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.sync-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.sync-dot.pending {
		background: #f59e0b;
	}

	.sync-dot.syncing {
		background: #6366f1;
		animation: pulse 1s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
	}

	.sync-text {
		white-space: nowrap;
	}
</style>
