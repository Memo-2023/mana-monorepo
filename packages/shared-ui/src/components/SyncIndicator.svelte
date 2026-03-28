<!--
  SyncIndicator — Shows sync status as a small floating pill.

  Displays:
  - Nothing when synced (no visual clutter)
  - "Offline" pill when disconnected
  - "Syncing..." pill with spinner when actively syncing
  - "X pending" pill when changes haven't synced yet
  - "Synced ✓" briefly after sync completes (fades out)

  Usage:
  ```svelte
  <SyncIndicator status="synced" pendingCount={0} />
  <SyncIndicator status="offline" pendingCount={3} />
  <SyncIndicator status="syncing" pendingCount={1} />
  ```
-->

<script lang="ts">
	type SyncStatus = 'idle' | 'synced' | 'syncing' | 'offline' | 'error';

	let {
		status = 'idle',
		pendingCount = 0,
		position = 'bottom-right',
	}: {
		status?: SyncStatus;
		pendingCount?: number;
		position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
	} = $props();

	let showSynced = $state(false);
	let prevStatus = $state<SyncStatus>('idle');

	// Show "Synced ✓" briefly when transitioning from syncing → synced
	$effect(() => {
		if (
			prevStatus === 'syncing' &&
			(status === 'synced' || status === 'idle') &&
			pendingCount === 0
		) {
			showSynced = true;
			setTimeout(() => {
				showSynced = false;
			}, 2000);
		}
		prevStatus = status;
	});

	let visible = $derived(
		status === 'offline' ||
			status === 'syncing' ||
			status === 'error' ||
			pendingCount > 0 ||
			showSynced
	);

	let positionClass = $derived(
		{
			'bottom-right': 'bottom-20 right-4',
			'bottom-left': 'bottom-20 left-4',
			'top-right': 'top-4 right-4',
			'top-left': 'top-4 left-4',
		}[position]
	);
</script>

{#if visible}
	{@const colorClass =
		status === 'offline'
			? 'bg-amber-500 text-amber-50'
			: status === 'syncing'
				? 'bg-blue-500 text-blue-50'
				: status === 'error'
					? 'bg-red-500 text-red-50'
					: showSynced
						? 'bg-green-500 text-green-50'
						: 'bg-slate-700 text-slate-100'}
	<div
		class="fixed {positionClass} z-40 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-sm transition-all duration-300 {colorClass}"
	>
		{#if status === 'offline'}
			<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728"
				/>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1l22 22" />
			</svg>
			<span>Offline{pendingCount > 0 ? ` · ${pendingCount} ausstehend` : ''}</span>
		{:else if status === 'syncing'}
			<svg class="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
				/>
			</svg>
			<span>Synchronisiere...</span>
		{:else if status === 'error'}
			<span>Sync-Fehler</span>
		{:else if showSynced}
			<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
			<span>Synchronisiert</span>
		{:else if pendingCount > 0}
			<span>{pendingCount} ausstehend</span>
		{/if}
	</div>
{/if}
