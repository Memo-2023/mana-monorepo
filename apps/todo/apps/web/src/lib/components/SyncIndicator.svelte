<!--
  SyncIndicator — Shows sync status as a small pill in the layout.

  - Guest (no sync): "Lokal" with info icon
  - Synced: green dot
  - Syncing: animated spinner
  - Offline: orange dot + "Offline"
  - Pending: count of pending changes
-->
<script lang="ts">
	import { todoStore } from '$lib/data/local-store';
	import { authStore } from '$lib/stores/auth.svelte';
	import { onMount, onDestroy } from 'svelte';
	import type { SyncStatus } from '@manacore/local-store';

	let status = $state<SyncStatus>('idle');
	let pendingCount = $state(0);
	let isGuest = $derived(!authStore.isAuthenticated);

	let unsubscribe: (() => void) | undefined;
	let pendingInterval: ReturnType<typeof setInterval> | undefined;

	onMount(() => {
		const engine = todoStore.syncEngine;
		if (engine) {
			status = engine.status;
			unsubscribe = engine.onStatusChange((s) => {
				status = s;
			});

			const updatePending = async () => {
				pendingCount = await engine.getPendingCount();
			};
			updatePending();
			pendingInterval = setInterval(updatePending, 3000);
		}
	});

	onDestroy(() => {
		unsubscribe?.();
		if (pendingInterval) clearInterval(pendingInterval);
	});

	let label = $derived.by(() => {
		if (isGuest) return 'Lokal';
		switch (status) {
			case 'syncing':
				return 'Sync...';
			case 'synced':
				return pendingCount > 0 ? `${pendingCount} ausstehend` : '';
			case 'offline':
				return 'Offline';
			case 'error':
				return 'Sync-Fehler';
			default:
				return '';
		}
	});

	let dotClass = $derived.by(() => {
		if (isGuest) return 'dot-local';
		switch (status) {
			case 'syncing':
				return 'dot-syncing';
			case 'synced':
				return pendingCount > 0 ? 'dot-pending' : 'dot-synced';
			case 'offline':
				return 'dot-offline';
			case 'error':
				return 'dot-error';
			default:
				return 'dot-idle';
		}
	});
</script>

{#if label || !isGuest}
	<div
		class="sync-indicator"
		title={isGuest ? 'Daten werden nur in diesem Browser gespeichert' : `Sync: ${status}`}
	>
		<span class="dot {dotClass}"></span>
		{#if label}
			<span class="label">{label}</span>
		{/if}
	</div>
{/if}

<style>
	.sync-indicator {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		border-radius: 999px;
		font-size: 0.7rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.6);
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.08);
		user-select: none;
		cursor: default;
	}

	:global(.light) .sync-indicator,
	:global(:root:not(.dark)) .sync-indicator {
		color: rgba(0, 0, 0, 0.5);
		background: rgba(0, 0, 0, 0.04);
		border-color: rgba(0, 0, 0, 0.08);
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.dot-synced {
		background: #22c55e;
		box-shadow: 0 0 4px rgba(34, 197, 94, 0.5);
	}

	.dot-syncing {
		background: #3b82f6;
		animation: pulse 1s ease-in-out infinite;
	}

	.dot-pending {
		background: #f59e0b;
	}

	.dot-offline {
		background: #f97316;
	}

	.dot-error {
		background: #ef4444;
	}

	.dot-local {
		background: #8b5cf6;
	}

	.dot-idle {
		background: rgba(255, 255, 255, 0.3);
	}

	.label {
		white-space: nowrap;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.5;
			transform: scale(0.8);
		}
	}
</style>
