<script lang="ts">
	import { onMount } from 'svelte';
	import { CurrencyCircleDollar } from '@mana/shared-icons';
	import { creditsService } from '$lib/api/credits';
	import type { CreditBalance } from '$lib/api/credits';
	import { authStore } from '$lib/stores/auth.svelte';
	import SettingsPanel from '../SettingsPanel.svelte';
	import SettingsSectionHeader from '../SettingsSectionHeader.svelte';

	let creditBalance = $state<CreditBalance | null>(null);

	onMount(async () => {
		if (!authStore.isAuthenticated) return;
		try {
			creditBalance = await creditsService.getBalance();
		} catch (e) {
			console.error('CreditsSection load failed:', e);
		}
	});

	function formatCredits(amount: number): string {
		return amount.toLocaleString('de-DE');
	}
</script>

<SettingsPanel id="credits">
	<SettingsSectionHeader
		icon={CurrencyCircleDollar}
		title="Credits"
		description="Dein Guthaben für Mana Apps"
		tone="yellow"
	>
		{#snippet action()}
			<a href="/credits" class="text-sm text-primary hover:underline">Alle Details</a>
		{/snippet}
	</SettingsSectionHeader>

	<div class="grid gap-4 sm:grid-cols-3">
		<div class="rounded-lg bg-surface-hover p-4 text-center">
			<p class="text-sm text-muted-foreground">Verfügbar</p>
			<p class="text-2xl font-bold text-primary">
				{creditBalance ? formatCredits(creditBalance.balance) : '...'}
			</p>
		</div>
		<div class="rounded-lg bg-surface-hover p-4 text-center">
			<p class="text-sm text-muted-foreground">Gratis heute</p>
			<p class="text-2xl font-bold text-green-600 dark:text-green-400">
				{creditBalance
					? `${creditBalance.freeCreditsRemaining}/${creditBalance.dailyFreeCredits}`
					: '...'}
			</p>
		</div>
		<div class="rounded-lg bg-surface-hover p-4 text-center">
			<p class="text-sm text-muted-foreground">Gesamt verbraucht</p>
			<p class="text-2xl font-bold">
				{creditBalance ? formatCredits(creditBalance.totalSpent) : '...'}
			</p>
		</div>
	</div>

	<div class="mt-4 flex gap-2">
		<a
			href="/credits?tab=packages"
			class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
		>
			Credits kaufen
		</a>
		<a
			href="/credits?tab=transactions"
			class="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover"
		>
			Transaktionen
		</a>
	</div>
</SettingsPanel>
