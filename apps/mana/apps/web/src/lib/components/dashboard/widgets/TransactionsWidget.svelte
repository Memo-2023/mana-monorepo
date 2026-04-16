<script lang="ts">
	/**
	 * TransactionsWidget - Recent credit transactions
	 */

	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { creditsService, type CreditTransaction } from '$lib/api/credits';
	import WidgetSkeleton from '../WidgetSkeleton.svelte';
	import WidgetError from '../WidgetError.svelte';

	let loadState = $state<'loading' | 'success' | 'error'>('loading');
	let data = $state<CreditTransaction[]>([]);
	let error = $state<string | null>(null);
	let retrying = $state(false);

	async function load() {
		loadState = 'loading';
		retrying = true;

		try {
			const transactions = await creditsService.getTransactions(5);
			data = transactions;
			loadState = 'success';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load transactions';
			loadState = 'error';
		} finally {
			retrying = false;
		}
	}

	onMount(load);

	function formatCredits(amount: number): string {
		return amount.toLocaleString('de-DE');
	}

	function getTransactionIcon(type: string): string {
		switch (type) {
			case 'purchase':
				return '💳';
			case 'usage':
				return '⚡';
			case 'bonus':
				return '🎁';
			case 'refund':
				return '↩️';
			default:
				return '📝';
		}
	}
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span>📊</span>
			{$_('dashboard.widgets.transactions.title')}
		</h3>
		<a href="/?app=credits&tab=transactions" class="text-sm text-primary hover:underline">
			{$_('common.view_all')} →
		</a>
	</div>

	{#if loadState === 'loading'}
		<WidgetSkeleton lines={4} />
	{:else if loadState === 'error'}
		<WidgetError {error} onRetry={load} {retrying} />
	{:else if data.length === 0}
		<p class="py-4 text-center text-sm text-muted-foreground">
			{$_('dashboard.widgets.transactions.empty')}
		</p>
	{:else}
		<div class="space-y-3">
			{#each data as tx}
				<div class="flex items-center justify-between border-b border-border py-2 last:border-0">
					<div class="flex items-center gap-3">
						<span class="text-xl">{getTransactionIcon(tx.type)}</span>
						<div>
							<p class="text-sm font-medium">{tx.description || tx.type}</p>
							<p class="text-xs text-muted-foreground">
								{new Date(tx.createdAt).toLocaleDateString('de-DE')}
							</p>
						</div>
					</div>
					<span
						class="font-semibold {tx.amount > 0
							? 'text-green-600 dark:text-green-400'
							: 'text-red-600 dark:text-red-400'}"
					>
						{tx.amount > 0 ? '+' : ''}{formatCredits(tx.amount)}
					</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
