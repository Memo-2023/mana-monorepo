<script lang="ts">
	import { onMount } from 'svelte';
	import { Sparkle, ArrowUp, ArrowDown, Clock } from '@manacore/shared-icons';
	import { authStore } from '$lib/stores/auth.svelte';
	import { tokensStore } from '$lib/stores/tokens.svelte';

	let activeTimeframe = $state<'day' | 'week' | 'month' | 'year'>('month');

	onMount(async () => {
		if (authStore.user?.id) {
			await tokensStore.loadAll(authStore.user.id);
		}
	});

	async function changeTimeframe(tf: 'day' | 'week' | 'month' | 'year') {
		activeTimeframe = tf;
		tokensStore.setTimeframe(tf);
		if (authStore.user?.id) {
			await tokensStore.loadStats(authStore.user.id);
		}
	}

	const timeframeLabels = {
		day: 'Heute',
		week: 'Woche',
		month: 'Monat',
		year: 'Jahr',
	};

	function formatAmount(amount: number): string {
		return Math.abs(amount).toLocaleString();
	}

	function formatTransactionType(type: string): string {
		const labels: Record<string, string> = {
			usage: 'Nutzung',
			purchase: 'Kauf',
			monthly_reset: 'Monatliches Guthaben',
			admin_grant: 'Admin-Gutschrift',
			refund: 'Rückerstattung',
		};
		return labels[type] || type;
	}
</script>

<svelte:head>
	<title>Token-Management | Context</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<h1 class="text-2xl font-bold text-foreground">Token-Management</h1>

	<!-- Balance Card -->
	<div class="card p-6">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm text-muted-foreground">Aktuelles Guthaben</p>
				<div class="flex items-center gap-3 mt-1">
					<Sparkle size={28} class="text-primary" />
					<span class="text-4xl font-bold text-foreground tabular-nums">
						{tokensStore.balance.toLocaleString()}
					</span>
				</div>
				<p class="text-xs text-muted-foreground mt-1">Tokens</p>
			</div>
			<a href="/mana" class="btn btn-primary">Tokens kaufen</a>
		</div>
	</div>

	<!-- Usage Stats -->
	<div class="card p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold text-foreground">Nutzung</h2>
			<div class="flex gap-1">
				{#each ['day', 'week', 'month', 'year'] as const as tf}
					<button
						class="px-3 py-1 text-xs rounded-lg transition-colors"
						class:bg-primary={activeTimeframe === tf}
						class:text-primary-foreground={activeTimeframe === tf}
						class:text-muted-foreground={activeTimeframe !== tf}
						class:hover:bg-muted={activeTimeframe !== tf}
						onclick={() => changeTimeframe(tf)}
					>
						{timeframeLabels[tf]}
					</button>
				{/each}
			</div>
		</div>

		{#if tokensStore.loading}
			<div class="text-center py-8 text-muted-foreground">Lade Statistiken...</div>
		{:else if tokensStore.stats}
			<div class="space-y-4">
				<div class="text-center py-4">
					<span class="text-3xl font-bold text-foreground">
						{tokensStore.stats.totalUsed.toLocaleString()}
					</span>
					<p class="text-sm text-muted-foreground mt-1">Tokens verbraucht</p>
				</div>

				{#if Object.keys(tokensStore.stats.byModel).length > 0}
					<div>
						<h3 class="text-sm font-medium text-foreground mb-2">Nach Modell</h3>
						<div class="space-y-2">
							{#each Object.entries(tokensStore.stats.byModel) as [model, count]}
								<div class="flex items-center justify-between">
									<span class="text-sm text-muted-foreground">{model}</span>
									<span class="text-sm font-medium text-foreground tabular-nums">
										{(count as number).toLocaleString()}
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<p class="text-center text-muted-foreground py-4">Keine Daten vorhanden</p>
		{/if}
	</div>

	<!-- Transaction History -->
	<div class="card p-6">
		<h2 class="text-lg font-semibold text-foreground mb-4">Transaktionshistorie</h2>

		{#if tokensStore.transactions.length > 0}
			<div class="divide-y divide-border">
				{#each tokensStore.transactions as tx}
					<div class="py-3 flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="p-1.5 rounded-full {tx.amount > 0 ? 'bg-green-500/10' : 'bg-red-500/10'}">
								{#if tx.amount > 0}
									<ArrowDown size={14} class="text-green-500" />
								{:else}
									<ArrowUp size={14} class="text-red-500" />
								{/if}
							</div>
							<div>
								<p class="text-sm font-medium text-foreground">
									{formatTransactionType(tx.transaction_type)}
								</p>
								<div class="flex items-center gap-2 text-xs text-muted-foreground">
									{#if tx.model_used}
										<span>{tx.model_used}</span>
									{/if}
									<span
										>{new Date(tx.created_at).toLocaleDateString('de-DE', {
											day: '2-digit',
											month: '2-digit',
											year: '2-digit',
											hour: '2-digit',
											minute: '2-digit',
										})}</span
									>
								</div>
								{#if tx.prompt_tokens || tx.completion_tokens}
									<p class="text-xs text-muted-foreground mt-0.5">
										Input: {tx.prompt_tokens?.toLocaleString()} + Output: {tx.completion_tokens?.toLocaleString()}
										= {tx.total_tokens?.toLocaleString()}
									</p>
								{/if}
							</div>
						</div>
						<span
							class="text-sm font-semibold tabular-nums {tx.amount > 0
								? 'text-green-500'
								: 'text-red-500'}"
						>
							{tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
						</span>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-center text-muted-foreground py-8">Noch keine Transaktionen</p>
		{/if}
	</div>
</div>
