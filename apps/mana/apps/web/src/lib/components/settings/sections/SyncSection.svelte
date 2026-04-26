<script lang="ts">
	import { onMount } from 'svelte';
	import { _, locale } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import { CloudCheck, Pause, Cloud } from '@mana/shared-icons';
	import { syncBilling } from '$lib/stores/sync-billing.svelte';
	import { creditsService, type CreditBalance } from '$lib/api/credits';
	import type { BillingInterval } from '$lib/api/sync';
	import { toast } from '$lib/stores/toast.svelte';
	import SettingsPanel from '../SettingsPanel.svelte';
	import SettingsSectionHeader from '../SettingsSectionHeader.svelte';

	const SYNC_PRICES: Record<BillingInterval, number> = {
		monthly: 30,
		quarterly: 90,
		yearly: 360,
	};

	const intervalLabels = $derived<Record<BillingInterval, string>>({
		monthly: $_('settings.sync.interval_monthly'),
		quarterly: $_('settings.sync.interval_quarterly'),
		yearly: $_('settings.sync.interval_yearly'),
	});

	const intervalShortLabels = $derived<Record<BillingInterval, string>>({
		monthly: $_('settings.sync.interval_short_monthly'),
		quarterly: $_('settings.sync.interval_short_quarterly'),
		yearly: $_('settings.sync.interval_short_yearly'),
	});

	const intervalHints = $derived<Record<BillingInterval, string>>({
		monthly: $_('settings.sync.interval_hint_monthly'),
		quarterly: $_('settings.sync.interval_hint_quarterly'),
		yearly: $_('settings.sync.interval_hint_yearly'),
	});

	let balance = $state<CreditBalance | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let selectedInterval = $state<BillingInterval>('monthly');

	const insufficientCredits = $derived(
		balance !== null && balance.balance < SYNC_PRICES[selectedInterval]
	);
	const intervalChanged = $derived(syncBilling.active && selectedInterval !== syncBilling.interval);

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
			toast.success($_('settings.sync.toast_activated'));
		} catch (e) {
			error = e instanceof Error ? e.message : $_('settings.sync.err_activation_failed');
			toast.error(error);
		} finally {
			loading = false;
		}
	}

	async function handleDeactivate() {
		if (!confirm($_('settings.sync.deactivate_confirm'))) return;
		loading = true;
		error = null;
		try {
			await syncBilling.deactivate();
			toast.success($_('settings.sync.toast_deactivated'));
		} catch (e) {
			error = e instanceof Error ? e.message : $_('settings.sync.err_deactivation_failed');
			toast.error(error);
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
			toast.success(
				$_('settings.sync.toast_interval_changed', {
					values: { label: intervalLabels[selectedInterval] },
				})
			);
		} catch (e) {
			error = e instanceof Error ? e.message : $_('settings.sync.err_change_failed');
			toast.error(error);
		} finally {
			loading = false;
		}
	}

	function formatCredits(amount: number): string {
		return amount.toLocaleString(get(locale) ?? 'de');
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString(get(locale) ?? 'de', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}
</script>

<SettingsPanel id="cloud-sync">
	<SettingsSectionHeader
		icon={Cloud}
		title={$_('settings.sync.title')}
		description={$_('settings.sync.description')}
		tone="blue"
	/>

	{#if syncBilling.loading}
		<div class="spinner-wrap">
			<div class="spinner"></div>
		</div>
	{:else}
		<div class="rows">
			<div class="row">
				<div class="row-info">
					<p class="row-title">{$_('settings.sync.status_label')}</p>
					<p class="row-desc">
						{#if syncBilling.active && syncBilling.nextChargeAt}
							{$_('settings.sync.status_next_charge', {
								values: { date: formatDate(syncBilling.nextChargeAt) },
							})}
						{:else if syncBilling.active}
							{$_('settings.sync.status_encrypted')}
						{:else if syncBilling.paused}
							{$_('settings.sync.status_insufficient')}
						{:else}
							{$_('settings.sync.status_local_only')}
						{/if}
					</p>
				</div>
				<span class="badge" class:active={syncBilling.active} class:paused={syncBilling.paused}>
					{#if syncBilling.active}
						<CloudCheck size={14} weight="fill" />
						{$_('settings.sync.badge_active')}
					{:else if syncBilling.paused}
						<Pause size={14} weight="fill" />
						{$_('settings.sync.badge_paused')}
					{:else}
						<Cloud size={14} />
						{$_('settings.sync.badge_inactive')}
					{/if}
				</span>
			</div>

			{#if balance}
				<div class="row">
					<div class="row-info">
						<p class="row-title">{$_('settings.sync.credits_available')}</p>
						<p class="row-desc">
							<a class="inline-link" href="/?app=credits&tab=packages"
								>{$_('settings.sync.credits_topup')}</a
							>
						</p>
					</div>
					<span class="value">{formatCredits(balance.balance)}</span>
				</div>
			{/if}

			<div class="row">
				<div class="row-info">
					<p class="row-title">{$_('settings.sync.interval_label')}</p>
					<p class="row-desc">
						{$_('settings.sync.interval_price_hint', {
							values: {
								price: SYNC_PRICES[selectedInterval],
								hint: intervalHints[selectedInterval],
							},
						})}
					</p>
				</div>
				<div class="btn-group">
					{#each ['monthly', 'quarterly', 'yearly'] as const as iv}
						<button
							class="choice-btn"
							class:active={selectedInterval === iv}
							onclick={() => (selectedInterval = iv)}
						>
							{intervalShortLabels[iv]}
						</button>
					{/each}
				</div>
			</div>
		</div>

		{#if error}
			<p class="error-text">{error}</p>
		{/if}

		<div class="actions">
			{#if syncBilling.active}
				{#if intervalChanged}
					<button class="btn-secondary" onclick={handleChangeInterval} disabled={loading}>
						{loading
							? $_('settings.sync.changing')
							: $_('settings.sync.change_to', {
									values: { label: intervalLabels[selectedInterval] },
								})}
					</button>
					<p class="muted-hint">{$_('settings.sync.change_hint')}</p>
				{/if}
				<button class="btn-danger" onclick={handleDeactivate} disabled={loading}>
					{loading ? $_('settings.sync.deactivating') : $_('settings.sync.deactivate')}
				</button>
			{:else}
				<button
					class="btn-primary"
					onclick={handleActivate}
					disabled={loading || insufficientCredits}
				>
					{#if loading}
						{$_('settings.sync.activating')}
					{:else}
						{$_('settings.sync.activate', { values: { price: SYNC_PRICES[selectedInterval] } })}
					{/if}
				</button>
				{#if insufficientCredits}
					<p class="warn-hint">
						{$_('settings.sync.insufficient_warn_pre')}
						<a href="/?app=credits&tab=packages">{$_('settings.sync.insufficient_topup')}</a>
					</p>
				{/if}
			{/if}
		</div>

		<p class="footnote">{$_('settings.sync.footnote')}</p>
	{/if}
</SettingsPanel>

<style>
	.rows {
		display: flex;
		flex-direction: column;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.row:last-child {
		border-bottom: none;
	}

	.row-info {
		min-width: 0;
		flex: 1;
	}

	.row-title {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}

	.row-desc {
		margin: 0;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.inline-link {
		color: hsl(var(--color-primary));
		text-decoration: none;
	}

	.inline-link:hover {
		text-decoration: underline;
	}

	.btn-group {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.choice-btn {
		padding: 0.375rem 0.625rem;
		font-size: 0.8125rem;
		font-weight: 500;
		border-radius: 0.5rem;
		border: none;
		cursor: pointer;
		transition: all 0.15s;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.choice-btn:hover {
		opacity: 0.8;
	}

	.choice-btn.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: 9999px;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
	}

	.badge.active {
		background: hsl(142 76% 36% / 0.12);
		color: hsl(142 71% 32%);
	}

	.badge.paused {
		background: hsl(38 92% 50% / 0.15);
		color: hsl(32 80% 38%);
	}

	.value {
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 1.25rem;
	}

	.btn-primary,
	.btn-secondary,
	.btn-danger {
		padding: 0.625rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		border-radius: 0.5rem;
		border: 1px solid transparent;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	.btn-primary:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-secondary {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.btn-secondary:hover:not(:disabled) {
		background: hsl(var(--color-surface-hover));
	}

	.btn-danger {
		background: transparent;
		border-color: hsl(0 84% 60% / 0.4);
		color: hsl(0 72% 50%);
	}

	.btn-danger:hover:not(:disabled) {
		background: hsl(0 84% 60% / 0.08);
	}

	.btn-primary:disabled,
	.btn-secondary:disabled,
	.btn-danger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.error-text {
		margin: 0.75rem 0 0;
		font-size: 0.8125rem;
		color: hsl(0 72% 50%);
	}

	.warn-hint {
		margin: 0;
		font-size: 0.75rem;
		color: hsl(32 80% 38%);
		text-align: center;
	}

	.warn-hint a {
		color: inherit;
		text-decoration: underline;
	}

	.muted-hint {
		margin: -0.25rem 0 0;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		text-align: center;
	}

	.footnote {
		margin: 1.25rem 0 0;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--color-border));
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.5;
	}

	.spinner-wrap {
		display: flex;
		justify-content: center;
		padding: 2.5rem 0;
	}

	.spinner {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		border: 3px solid hsl(var(--color-primary));
		border-top-color: transparent;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
