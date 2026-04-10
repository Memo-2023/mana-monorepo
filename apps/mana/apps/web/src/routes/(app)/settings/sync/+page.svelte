<script lang="ts">
	import { Card, PageHeader } from '@mana/shared-ui';
	import { syncBilling } from '$lib/stores/sync-billing.svelte';
	import { creditsService, type CreditBalance } from '$lib/api/credits';
	import type { BillingInterval } from '$lib/api/sync';
	import { onMount } from 'svelte';

	const SYNC_PRICES: Record<BillingInterval, number> = {
		monthly: 30,
		quarterly: 90,
		yearly: 360,
	};

	const INTERVAL_LABELS: Record<BillingInterval, string> = {
		monthly: 'Monatlich',
		quarterly: 'Quartalsweise',
		yearly: 'Jährlich',
	};

	let balance = $state<CreditBalance | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let selectedInterval = $state<BillingInterval>('monthly');

	// Toast
	let toastMessage = $state<string | null>(null);
	let toastType = $state<'success' | 'error'>('success');

	onMount(async () => {
		await Promise.all([syncBilling.load(), loadBalance()]);
		selectedInterval = syncBilling.interval;
	});

	async function loadBalance() {
		try {
			balance = await creditsService.getBalance();
		} catch {
			// Non-critical
		}
	}

	async function handleActivate() {
		loading = true;
		error = null;
		try {
			await syncBilling.activate(selectedInterval);
			await loadBalance();
			showToast('Cloud Sync aktiviert!', 'success');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Aktivierung fehlgeschlagen';
			showToast(error, 'error');
		} finally {
			loading = false;
		}
	}

	async function handleDeactivate() {
		if (!confirm('Cloud Sync wirklich deaktivieren? Deine Daten bleiben lokal erhalten.')) return;
		loading = true;
		error = null;
		try {
			await syncBilling.deactivate();
			showToast('Cloud Sync deaktiviert', 'success');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Deaktivierung fehlgeschlagen';
			showToast(error, 'error');
		} finally {
			loading = false;
		}
	}

	async function handleChangeInterval() {
		if (selectedInterval === syncBilling.interval) return;
		loading = true;
		error = null;
		try {
			await syncBilling.changeInterval(selectedInterval);
			showToast(`Intervall auf ${INTERVAL_LABELS[selectedInterval]} geändert`, 'success');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Änderung fehlgeschlagen';
			showToast(error, 'error');
		} finally {
			loading = false;
		}
	}

	function formatCredits(amount: number): string {
		return amount.toLocaleString('de-DE');
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}

	function showToast(message: string, type: 'success' | 'error') {
		toastMessage = message;
		toastType = type;
		setTimeout(() => {
			toastMessage = null;
		}, 4000);
	}
</script>

<div>
	<PageHeader
		title="Cloud Sync"
		description="Synchronisiere deine Daten über alle Geräte"
		size="lg"
	/>

	{#if syncBilling.loading}
		<div class="flex items-center justify-center py-12">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
		</div>
	{:else}
		<div class="grid gap-6 lg:grid-cols-2">
			<!-- Status Card -->
			<Card>
				<div class="p-6">
					<h2 class="text-lg font-semibold mb-4">Status</h2>

					<div class="flex items-center gap-3 mb-6">
						<div
							class="flex h-12 w-12 items-center justify-center rounded-full {syncBilling.active
								? 'bg-green-100 dark:bg-green-900/20'
								: syncBilling.paused
									? 'bg-amber-100 dark:bg-amber-900/20'
									: 'bg-surface'}"
						>
							<span class="text-2xl"
								>{syncBilling.active ? '🔄' : syncBilling.paused ? '⏸️' : '☁️'}</span
							>
						</div>
						<div>
							<p class="text-xl font-bold">
								{#if syncBilling.active}
									Aktiv
								{:else if syncBilling.paused}
									Pausiert
								{:else}
									Inaktiv
								{/if}
							</p>
							{#if syncBilling.active && syncBilling.nextChargeAt}
								<p class="text-sm text-muted-foreground">
									Nächste Abbuchung: {formatDate(syncBilling.nextChargeAt)}
								</p>
							{:else if syncBilling.paused}
								<p class="text-sm text-amber-600 dark:text-amber-400">
									Credits reichen nicht aus — lade Credits auf um fortzufahren
								</p>
							{:else}
								<p class="text-sm text-muted-foreground">
									Deine Daten sind nur lokal auf diesem Gerät gespeichert
								</p>
							{/if}
						</div>
					</div>

					{#if balance}
						<div class="rounded-lg bg-surface p-4 mb-6">
							<div class="flex justify-between items-center">
								<span class="text-sm text-muted-foreground">Verfügbare Credits</span>
								<span class="text-lg font-bold text-primary">{formatCredits(balance.balance)}</span>
							</div>
						</div>
					{/if}

					{#if error}
						<div class="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
							<p class="text-sm text-red-800 dark:text-red-200">{error}</p>
						</div>
					{/if}

					{#if syncBilling.active}
						<button
							onclick={handleDeactivate}
							disabled={loading}
							class="w-full rounded-lg border border-red-300 dark:border-red-700 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-50"
						>
							{loading ? 'Wird deaktiviert...' : 'Cloud Sync deaktivieren'}
						</button>
					{:else}
						<button
							onclick={handleActivate}
							disabled={loading ||
								(balance !== null && balance.balance < SYNC_PRICES[selectedInterval])}
							class="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
						>
							{#if loading}
								Wird aktiviert...
							{:else}
								Cloud Sync aktivieren ({SYNC_PRICES[selectedInterval]} Credits)
							{/if}
						</button>
						{#if balance !== null && balance.balance < SYNC_PRICES[selectedInterval]}
							<p class="mt-2 text-center text-sm text-amber-600 dark:text-amber-400">
								Nicht genügend Credits.
								<a href="/credits?tab=packages" class="underline hover:no-underline">Aufladen</a>
							</p>
						{/if}
					{/if}
				</div>
			</Card>

			<!-- Interval Selection Card -->
			<Card>
				<div class="p-6">
					<h2 class="text-lg font-semibold mb-4">Abrechnungsintervall</h2>

					<div class="space-y-3">
						{#each ['monthly', 'quarterly', 'yearly'] as const as iv}
							<label
								class="flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors {selectedInterval ===
								iv
									? 'border-primary bg-primary/5'
									: 'border-border hover:bg-surface'}"
							>
								<div class="flex items-center gap-3">
									<input
										type="radio"
										name="interval"
										value={iv}
										checked={selectedInterval === iv}
										onchange={() => (selectedInterval = iv)}
										class="h-4 w-4 text-primary"
									/>
									<div>
										<p class="font-medium">{INTERVAL_LABELS[iv]}</p>
										<p class="text-sm text-muted-foreground">
											{iv === 'monthly'
												? '~1 Credit/Tag'
												: iv === 'quarterly'
													? '3 Monate'
													: '12 Monate'}
										</p>
									</div>
								</div>
								<span class="text-lg font-bold text-primary">{SYNC_PRICES[iv]}</span>
							</label>
						{/each}
					</div>

					{#if syncBilling.active && selectedInterval !== syncBilling.interval}
						<button
							onclick={handleChangeInterval}
							disabled={loading}
							class="mt-4 w-full rounded-lg bg-surface py-2 font-medium text-foreground hover:bg-surface-hover border border-border transition-colors disabled:opacity-50"
						>
							{loading ? 'Wird geändert...' : `Auf ${INTERVAL_LABELS[selectedInterval]} wechseln`}
						</button>
						<p class="mt-2 text-center text-xs text-muted-foreground">
							Änderung gilt ab der nächsten Abbuchung
						</p>
					{/if}

					<div class="mt-6 rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4">
						<p class="text-sm text-blue-800 dark:text-blue-200">
							Cloud Sync synchronisiert deine Daten verschlüsselt über alle Geräte. Deine lokalen
							Daten bleiben immer erhalten — auch wenn Sync pausiert oder deaktiviert wird.
						</p>
					</div>
				</div>
			</Card>
		</div>

		<!-- Back link -->
		<div class="mt-6">
			<a href="/settings" class="text-sm text-primary hover:underline">
				← Zurück zu Einstellungen
			</a>
		</div>
	{/if}
</div>

<!-- Toast Notification -->
{#if toastMessage}
	<div
		class="fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg {toastType === 'success'
			? 'bg-green-600 text-white'
			: 'bg-red-600 text-white'}"
	>
		{toastMessage}
	</div>
{/if}
