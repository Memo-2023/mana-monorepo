<script lang="ts">
	import { onMount } from 'svelte';
	import { Card, PageHeader } from '@manacore/shared-ui';
	import { creditsService, type CreditBalance, type CreditTransaction } from '$lib/api/credits';
	import { authStore } from '$lib/stores/authStore.svelte';

	let { data } = $props();

	let creditBalance = $state<CreditBalance | null>(null);
	let recentTransactions = $state<CreditTransaction[]>([]);
	let loadingCredits = $state(true);

	onMount(async () => {
		if (authStore.isAuthenticated) {
			try {
				const [balance, transactions] = await Promise.all([
					creditsService.getBalance(),
					creditsService.getTransactions(5),
				]);
				creditBalance = balance;
				recentTransactions = transactions;
			} catch (e) {
				console.error('Failed to load credits:', e);
			} finally {
				loadingCredits = false;
			}
		} else {
			loadingCredits = false;
		}
	});

	const stats = $derived([
		{
			name: 'Verfügbare Credits',
			value: creditBalance?.balance ?? '...',
			icon: '💰',
			href: '/credits',
		},
		{
			name: 'Gratis-Credits heute',
			value: creditBalance ? `${creditBalance.freeCreditsRemaining}/${creditBalance.dailyFreeCredits}` : '...',
			icon: '🎁',
			href: '/credits',
		},
		{
			name: 'Gesamt verbraucht',
			value: creditBalance?.totalSpent ?? '...',
			icon: '📊',
			href: '/credits?tab=transactions',
		},
	]);

	function formatCredits(amount: number): string {
		return amount.toLocaleString('de-DE');
	}

	function getTransactionIcon(type: string): string {
		switch (type) {
			case 'purchase': return '💳';
			case 'usage': return '⚡';
			case 'bonus': return '🎁';
			default: return '📝';
		}
	}
</script>

<div>
	<PageHeader
		title="Dashboard"
		description="Willkommen zurück, {authStore.user?.email || 'User'}"
		size="lg"
	/>

	<!-- Stats Cards -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each stats as stat}
			<a href={stat.href} class="block">
				<Card>
					<div class="flex items-center">
						<div class="text-4xl">{stat.icon}</div>
						<div class="ml-4 flex-1">
							<p class="text-sm font-medium text-muted-foreground">{stat.name}</p>
							<p class="mt-1 text-2xl font-semibold">
								{#if loadingCredits}
									<span class="inline-block w-16 h-6 bg-muted animate-pulse rounded"></span>
								{:else}
									{typeof stat.value === 'number' ? formatCredits(stat.value) : stat.value}
								{/if}
							</p>
						</div>
					</div>
				</Card>
			</a>
		{/each}
	</div>

	<div class="mt-8 grid gap-6 lg:grid-cols-2">
		<!-- Quick Actions -->
		<Card>
			<h2 class="mb-4 text-lg font-semibold">Schnellzugriff</h2>
			<div class="space-y-2">
				<a
					href="/credits"
					class="block rounded-lg p-3 hover:bg-surface-hover transition-colors"
				>
					<div class="flex items-center">
						<span class="text-2xl">💰</span>
						<div class="ml-3">
							<p class="font-medium">Credits verwalten</p>
							<p class="text-sm text-muted-foreground">Kontostand und Transaktionen</p>
						</div>
					</div>
				</a>
				<a
					href="/feedback"
					class="block rounded-lg p-3 hover:bg-surface-hover transition-colors"
				>
					<div class="flex items-center">
						<span class="text-2xl">💬</span>
						<div class="ml-3">
							<p class="font-medium">Feedback geben</p>
							<p class="text-sm text-muted-foreground">Vorschläge und Bug-Reports</p>
						</div>
					</div>
				</a>
				<a
					href="/profile"
					class="block rounded-lg p-3 hover:bg-surface-hover transition-colors"
				>
					<div class="flex items-center">
						<span class="text-2xl">👤</span>
						<div class="ml-3">
							<p class="font-medium">Profil bearbeiten</p>
							<p class="text-sm text-muted-foreground">Deine Einstellungen</p>
						</div>
					</div>
				</a>
			</div>
		</Card>

		<!-- Recent Transactions -->
		<Card>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold">Letzte Transaktionen</h2>
				<a href="/credits?tab=transactions" class="text-sm text-primary hover:underline">
					Alle →
				</a>
			</div>
			{#if loadingCredits}
				<div class="space-y-3">
					{#each [1, 2, 3] as _}
						<div class="flex items-center gap-3">
							<div class="w-8 h-8 bg-muted animate-pulse rounded"></div>
							<div class="flex-1">
								<div class="w-24 h-4 bg-muted animate-pulse rounded"></div>
								<div class="w-16 h-3 bg-muted animate-pulse rounded mt-1"></div>
							</div>
						</div>
					{/each}
				</div>
			{:else if recentTransactions.length === 0}
				<p class="text-sm text-muted-foreground">Noch keine Transaktionen vorhanden.</p>
			{:else}
				<div class="space-y-3">
					{#each recentTransactions as tx}
						<div class="flex items-center justify-between py-2 border-b border-border last:border-0">
							<div class="flex items-center gap-3">
								<span class="text-xl">{getTransactionIcon(tx.type)}</span>
								<div>
									<p class="font-medium text-sm">{tx.description || tx.type}</p>
									<p class="text-xs text-muted-foreground">
										{new Date(tx.createdAt).toLocaleDateString('de-DE')}
									</p>
								</div>
							</div>
							<span class="font-semibold {tx.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
								{tx.amount > 0 ? '+' : ''}{formatCredits(tx.amount)}
							</span>
						</div>
					{/each}
				</div>
			{/if}
		</Card>
	</div>
</div>
