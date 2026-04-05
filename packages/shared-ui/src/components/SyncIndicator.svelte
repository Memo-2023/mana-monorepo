<!--
  SyncIndicator — Shows online/offline status as a floating pill.
  Appears when browser goes offline. Shows "Wieder online" briefly on reconnect.
  Usage: Just add <SyncIndicator /> to any layout. No props needed.
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Check } from '@mana/shared-icons';

	let isOnline = $state(true);
	let showReconnected = $state(false);
	let visible = $state(false);

	function handleOnline() {
		isOnline = true;
		showReconnected = true;
		visible = true;
		setTimeout(() => {
			showReconnected = false;
			visible = false;
		}, 3000);
	}

	function handleOffline() {
		isOnline = false;
		visible = true;
	}

	onMount(() => {
		isOnline = navigator.onLine;
		visible = !isOnline;
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		}
	});
</script>

{#if visible}
	{@const colorClass = isOnline ? 'bg-green-600 text-green-50' : 'bg-amber-600 text-amber-50'}
	<div
		class="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-sm transition-all duration-300 {colorClass}"
	>
		{#if !isOnline}
			<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728"
				/>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1l22 22" />
			</svg>
			<span>Offline</span>
		{:else if showReconnected}
			<Check size={20} />
			<span>Wieder online</span>
		{/if}
	</div>
{/if}
