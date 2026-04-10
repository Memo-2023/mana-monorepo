<script lang="ts">
	/**
	 * Onboarding step: introduces Cloud Sync and lets the user decide
	 * whether to activate it. Shows pricing and explains the local-first
	 * model — sync is optional, data always stays local.
	 */
	import { syncBilling } from '$lib/stores/sync-billing.svelte';
	import { creditsService, type CreditBalance } from '$lib/api/credits';
	import { Cloud, DeviceMobile, Info, CheckCircle, Warning } from '@mana/shared-icons';
	import type { BillingInterval } from '$lib/api/sync';
	import { onMount } from 'svelte';

	const SYNC_PRICES: Record<BillingInterval, { credits: number; label: string }> = {
		monthly: { credits: 30, label: 'Monatlich' },
		quarterly: { credits: 90, label: 'Quartalsweise' },
		yearly: { credits: 360, label: 'Jährlich' },
	};

	let balance = $state<CreditBalance | null>(null);
	let selectedInterval = $state<BillingInterval>('monthly');
	let activating = $state(false);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			balance = await creditsService.getBalance();
		} catch {
			// Non-critical
		}
	});

	async function handleActivate() {
		activating = true;
		error = null;
		try {
			await syncBilling.activate(selectedInterval);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Aktivierung fehlgeschlagen';
		} finally {
			activating = false;
		}
	}
</script>

<div class="mx-auto max-w-2xl">
	<div class="mb-6 text-center">
		<div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
			<Cloud size={28} class="text-primary" />
		</div>
		<div class="mb-2 text-2xl font-bold">Cloud Sync</div>
		<p class="text-muted-foreground">
			Synchronisiere deine Daten verschlüsselt über alle Geräte — oder nutze Mana nur lokal.
		</p>
	</div>

	<!-- Local-first info -->
	<div class="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
		<div class="flex items-center gap-3">
			<DeviceMobile size={20} class="text-emerald-500" />
			<div class="flex-1">
				<div class="font-semibold">Lokal — immer verfügbar</div>
				<div class="text-sm text-muted-foreground">
					Alle deine Daten sind lokal auf deinem Gerät gespeichert. Mana funktioniert vollständig
					offline — auch ohne Cloud Sync.
				</div>
			</div>
		</div>
	</div>

	<!-- Sync option -->
	{#if syncBilling.active}
		<div class="rounded-xl border border-primary bg-primary/5 p-4">
			<div class="flex items-center gap-3">
				<CheckCircle size={20} weight="fill" class="text-primary" />
				<div>
					<div class="font-semibold">Cloud Sync ist aktiv</div>
					<div class="text-sm text-muted-foreground">
						Deine Daten werden über alle Geräte synchronisiert.
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="rounded-xl border border-border bg-card p-4">
			<div class="flex items-start gap-3 mb-4">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
				>
					<Cloud size={20} />
				</div>
				<div>
					<div class="text-base font-semibold">Cloud Sync aktivieren</div>
					<p class="mt-1 text-sm text-muted-foreground">
						Multi-Device-Sync, automatische Backups, Ende-zu-Ende-Verschlüsselung.
					</p>
				</div>
			</div>

			<!-- Interval selection -->
			<div class="space-y-2 mb-4">
				{#each ['monthly', 'quarterly', 'yearly'] as const as iv}
					<label
						class="flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors {selectedInterval ===
						iv
							? 'border-primary bg-primary/5'
							: 'border-border hover:border-primary/40'}"
					>
						<div class="flex items-center gap-2">
							<input
								type="radio"
								name="sync-interval"
								value={iv}
								checked={selectedInterval === iv}
								onchange={() => (selectedInterval = iv)}
								class="h-3.5 w-3.5 text-primary"
							/>
							<span class="text-sm font-medium">{SYNC_PRICES[iv].label}</span>
						</div>
						<span class="text-sm font-bold text-primary">{SYNC_PRICES[iv].credits} Credits</span>
					</label>
				{/each}
			</div>

			{#if error}
				<div class="mb-3 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
					<Warning size={16} class="text-red-600 dark:text-red-400" />
					<p class="text-sm text-red-800 dark:text-red-200">{error}</p>
				</div>
			{/if}

			<button
				onclick={handleActivate}
				disabled={activating ||
					(balance !== null && balance.balance < SYNC_PRICES[selectedInterval].credits)}
				class="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
			>
				{activating
					? 'Wird aktiviert...'
					: `Sync aktivieren (${SYNC_PRICES[selectedInterval].credits} Credits)`}
			</button>

			{#if balance !== null && balance.balance < SYNC_PRICES[selectedInterval].credits}
				<p class="mt-2 text-center text-xs text-amber-600 dark:text-amber-400">
					Nicht genügend Credits ({balance.balance} verfügbar). Du kannst Sync jederzeit später in den
					Einstellungen aktivieren.
				</p>
			{/if}
		</div>
	{/if}

	<div class="mt-6 flex items-start gap-3 rounded-xl bg-primary/5 p-4">
		<Info size={20} class="mt-0.5 shrink-0 text-primary" />
		<div class="text-sm text-muted-foreground">
			Sync ist optional — du kannst diesen Schritt überspringen und Mana nur lokal nutzen. Alle
			Features funktionieren auch ohne Sync. Du kannst jederzeit in den Einstellungen aktivieren.
		</div>
	</div>
</div>
