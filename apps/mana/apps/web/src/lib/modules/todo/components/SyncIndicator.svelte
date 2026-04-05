<script lang="ts">
	import { CloudCheck, CloudSlash, ArrowsClockwise } from '@mana/shared-icons';

	interface Props {
		status?: 'synced' | 'syncing' | 'offline' | 'error';
	}

	let { status = 'synced' }: Props = $props();
</script>

<div
	class="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs"
	title={status === 'synced'
		? 'Synchronisiert'
		: status === 'syncing'
			? 'Synchronisiere...'
			: status === 'offline'
				? 'Offline — Änderungen werden lokal gespeichert'
				: 'Sync-Fehler'}
>
	{#if status === 'synced'}
		<CloudCheck size={14} class="text-green-500" />
		<span class="text-muted-foreground">Sync</span>
	{:else if status === 'syncing'}
		<ArrowsClockwise size={14} class="animate-spin text-primary" />
		<span class="text-primary">Sync...</span>
	{:else if status === 'offline'}
		<CloudSlash size={14} class="text-amber-500" />
		<span class="text-amber-500">Offline</span>
	{:else}
		<CloudSlash size={14} class="text-red-500" />
		<span class="text-red-500">Fehler</span>
	{/if}
</div>
