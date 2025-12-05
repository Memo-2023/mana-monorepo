<script lang="ts">
	/**
	 * CreditsWidget - Displays credit balance and stats
	 */

	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { creditsService, type CreditBalance } from '$lib/api/credits';
	import WidgetSkeleton from '../WidgetSkeleton.svelte';
	import WidgetError from '../WidgetError.svelte';

	let state = $state<'loading' | 'success' | 'error'>('loading');
	let data = $state<CreditBalance | null>(null);
	let error = $state<string | null>(null);
	let retrying = $state(false);

	async function load() {
		state = 'loading';
		retrying = true;

		try {
			const balance = await creditsService.getBalance();
			data = balance;
			state = 'success';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load credits';
			state = 'error';
		} finally {
			retrying = false;
		}
	}

	onMount(load);

	function formatCredits(amount: number): string {
		return amount.toLocaleString('de-DE');
	}
</script>

<div>
	<h3 class="mb-3 flex items-center gap-2 text-lg font-semibold">
		<span>💰</span>
		{$_('dashboard.widgets.credits.title')}
	</h3>

	{#if state === 'loading'}
		<WidgetSkeleton lines={3} />
	{:else if state === 'error'}
		<WidgetError {error} onRetry={load} {retrying} />
	{:else if data}
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<span class="text-muted-foreground">{$_('dashboard.widgets.credits.available')}</span>
				<span class="text-2xl font-bold">{formatCredits(data.balance)}</span>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-muted-foreground">{$_('dashboard.widgets.credits.free_today')}</span>
				<span class="font-medium">{data.freeCreditsRemaining}/{data.dailyFreeCredits}</span>
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
