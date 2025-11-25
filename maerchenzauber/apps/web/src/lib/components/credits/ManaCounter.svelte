<script lang="ts">
	import { onMount } from 'svelte';
	import { dataService } from '$lib/api';

	let balance = $state<number | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function fetchBalance() {
		try {
			loading = true;
			error = null;
			const result = await dataService.getCreditBalance();
			balance = result.balance;
		} catch (e) {
			console.error('[ManaCounter] Failed to fetch balance:', e);
			error = 'Fehler beim Laden';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchBalance();

		// Refresh every 60 seconds
		const interval = setInterval(fetchBalance, 60000);
		return () => clearInterval(interval);
	});

	// Format number with thousands separator
	function formatBalance(num: number): string {
		return new Intl.NumberFormat('de-DE').format(num);
	}
</script>

<a
	href="/subscription"
	class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-2 text-sm font-medium text-amber-700 transition-all hover:from-amber-200 hover:to-yellow-200 dark:from-amber-900/30 dark:to-yellow-900/30 dark:text-amber-400 dark:hover:from-amber-900/50 dark:hover:to-yellow-900/50"
	title="Mana-Guthaben"
>
	<!-- Mana Icon (Sparkle) -->
	<svg class="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
		<path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
	</svg>

	<!-- Balance Display -->
	{#if loading}
		<span class="h-4 w-12 animate-pulse rounded bg-amber-200 dark:bg-amber-800"></span>
	{:else if error}
		<span class="text-red-500">!</span>
	{:else if balance !== null}
		<span class="tabular-nums">{formatBalance(balance)}</span>
	{:else}
		<span>-</span>
	{/if}
</a>
