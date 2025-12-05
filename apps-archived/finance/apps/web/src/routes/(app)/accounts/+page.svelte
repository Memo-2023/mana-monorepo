<script lang="ts">
	import { onMount } from 'svelte';
	import { accountsStore } from '$lib/stores';
	import { formatCurrency, ACCOUNT_TYPE_LABELS } from '@finance/shared';

	let showArchived = $state(false);

	onMount(async () => {
		await accountsStore.fetchAccounts();
	});

	const displayedAccounts = $derived(
		showArchived ? accountsStore.accounts : accountsStore.activeAccounts
	);

	const accountsByType = $derived(() => {
		const grouped: Record<string, typeof accountsStore.accounts> = {};
		for (const account of displayedAccounts) {
			if (!grouped[account.type]) {
				grouped[account.type] = [];
			}
			grouped[account.type].push(account);
		}
		return grouped;
	});
</script>

<svelte:head>
	<title>Konten | Finance</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Konten</h1>
		<div class="flex gap-2">
			<label class="flex items-center gap-2">
				<input type="checkbox" bind:checked={showArchived} class="rounded" />
				<span class="text-sm">Archivierte anzeigen</span>
			</label>
			<a
				href="/accounts/new"
				class="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
			>
				+ Neues Konto
			</a>
		</div>
	</div>

	<!-- Totals by Currency -->
	<div class="grid gap-4 md:grid-cols-3">
		{#each Object.entries(accountsStore.totalByCurrency) as [currency, total]}
			<div class="rounded-lg border border-border bg-card p-4">
				<h3 class="text-sm font-medium text-muted-foreground">Gesamtsaldo ({currency})</h3>
				<p class="mt-1 text-2xl font-bold {total >= 0 ? 'text-green-500' : 'text-red-500'}">
					{formatCurrency(total, currency)}
				</p>
			</div>
		{/each}
	</div>

	<!-- Accounts List -->
	{#if accountsStore.isLoading}
		<div class="flex items-center justify-center py-12">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
		</div>
	{:else if accountsStore.error}
		<div class="rounded-lg bg-destructive/10 p-4 text-destructive">{accountsStore.error}</div>
	{:else if displayedAccounts.length === 0}
		<div class="rounded-lg border border-border bg-card p-12 text-center">
			<p class="text-muted-foreground">Noch keine Konten vorhanden.</p>
			<a
				href="/accounts/new"
				class="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
			>
				Erstes Konto erstellen
			</a>
		</div>
	{:else}
		{#each Object.entries(accountsByType()) as [type, accounts]}
			<div class="space-y-2">
				<h2 class="text-lg font-semibold">
					{ACCOUNT_TYPE_LABELS[type as keyof typeof ACCOUNT_TYPE_LABELS]?.de ?? type}
				</h2>
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each accounts as account}
						<a
							href="/accounts/{account.id}"
							class="rounded-lg border border-border bg-card p-4 hover:bg-accent/50 {account.isArchived
								? 'opacity-60'
								: ''}"
						>
							<div class="flex items-center gap-3">
								<div
									class="h-12 w-12 rounded-full flex items-center justify-center"
									style="background-color: {account.color || '#6b7280'}"
								>
									<span class="text-white font-semibold">{account.name.charAt(0)}</span>
								</div>
								<div class="flex-1">
									<p class="font-medium">{account.name}</p>
									<p class="text-sm text-muted-foreground">{account.currency}</p>
								</div>
							</div>
							<div class="mt-4">
								<p
									class="text-2xl font-bold {parseFloat(account.balance) >= 0
										? ''
										: 'text-red-500'}"
								>
									{formatCurrency(account.balance, account.currency)}
								</p>
								{#if account.isArchived}
									<span class="text-xs text-muted-foreground">Archiviert</span>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/each}
	{/if}
</div>
