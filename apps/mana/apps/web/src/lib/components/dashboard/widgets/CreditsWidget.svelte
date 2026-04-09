<script lang="ts">
	/**
	 * CreditsWidget - Displays credit balance and stats
	 */

	import { _ } from 'svelte-i18n';
	import { creditsService, type CreditBalance } from '$lib/api/credits';
	import { useAutoRefresh } from '$lib/utils/autoRefresh';
	import WidgetSkeleton from '../WidgetSkeleton.svelte';
	import WidgetError from '../WidgetError.svelte';

	let loadState = $state<'loading' | 'success' | 'error'>('loading');
	let data = $state<CreditBalance | null>(null);
	let error = $state<string | null>(null);
	let retrying = $state(false);

	async function load() {
		if (!data) loadState = 'loading';
		retrying = true;

		try {
			const balance = await creditsService.getBalance();
			data = balance;
			loadState = 'success';
		} catch (e) {
			if (!data) {
				error = e instanceof Error ? e.message : 'Failed to load credits';
				loadState = 'error';
			}
		} finally {
			retrying = false;
		}
	}

	useAutoRefresh(load, 60000);

	function formatCredits(amount: number): string {
		return amount.toLocaleString('de-DE');
	}
</script>

<div>
	<h3 class="mb-3 flex items-center gap-2 text-lg font-semibold">
		<span>💰</span>
		{$_('dashboard.widgets.credits.title')}
	</h3>

	{#if loadState === 'loading'}
		<WidgetSkeleton lines={3} />
	{:else if loadState === 'error'}
		<WidgetError {error} onRetry={load} {retrying} />
	{:else if data}
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<span class="text-muted-foreground">{$_('dashboard.widgets.credits.available')}</span>
				<span class="text-2xl font-bold">{formatCredits(data.balance)}</span>
			</div>
			<a
				href="/credits"
				class="mt-4 block w-full rounded-lg bg-primary/10 py-2 text-center text-sm font-medium text-primary hover:bg-primary/20"
			>
				{$_('dashboard.widgets.credits.manage')}
			</a>
		</div>
	{/if}
</div>
