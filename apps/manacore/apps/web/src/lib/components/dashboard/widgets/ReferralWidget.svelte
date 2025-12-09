<script lang="ts">
	/**
	 * ReferralWidget - Displays referral code, stats, and sharing options
	 */

	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { referralsService, type ReferralStats, type ReferralCode } from '$lib/api/referrals';
	import WidgetSkeleton from '../WidgetSkeleton.svelte';
	import WidgetError from '../WidgetError.svelte';

	let state = $state<'loading' | 'success' | 'error'>('loading');
	let stats = $state<ReferralStats | null>(null);
	let code = $state<ReferralCode | null>(null);
	let error = $state<string | null>(null);
	let retrying = $state(false);
	let copied = $state(false);

	async function load() {
		state = 'loading';
		retrying = true;

		try {
			const [statsData, codeData] = await Promise.all([
				referralsService.getStats(),
				referralsService.getCode(),
			]);
			stats = statsData;
			code = codeData;
			state = 'success';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load referral data';
			state = 'error';
		} finally {
			retrying = false;
		}
	}

	onMount(load);

	async function copyCode() {
		if (!code) return;

		const success = await referralsService.copyShareLink(code.code);
		if (success) {
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}

	function getTierColor(tier: string): string {
		switch (tier) {
			case 'platinum':
				return 'text-purple-500';
			case 'gold':
				return 'text-yellow-500';
			case 'silver':
				return 'text-gray-400';
			default:
				return 'text-amber-700';
		}
	}

	function getTierEmoji(tier: string): string {
		switch (tier) {
			case 'platinum':
				return '💎';
			case 'gold':
				return '🥇';
			case 'silver':
				return '🥈';
			default:
				return '🥉';
		}
	}
</script>

<div>
	<h3 class="mb-3 flex items-center gap-2 text-lg font-semibold">
		<span>🤝</span>
		{$_('dashboard.widgets.referral.title')}
	</h3>

	{#if state === 'loading'}
		<WidgetSkeleton lines={4} />
	{:else if state === 'error'}
		<WidgetError {error} onRetry={load} {retrying} />
	{:else if stats && code}
		<div class="space-y-4">
			<!-- Referral Code -->
			<div class="rounded-lg bg-primary/5 p-3">
				<div class="mb-1 text-xs text-muted-foreground">
					{$_('dashboard.widgets.referral.your_code')}
				</div>
				<div class="flex items-center justify-between">
					<span class="font-mono text-xl font-bold tracking-wider">{code.code}</span>
					<button
						onclick={copyCode}
						class="rounded-md px-3 py-1 text-sm font-medium transition-colors
							{copied ? 'bg-green-500/20 text-green-600' : 'bg-primary/10 text-primary hover:bg-primary/20'}"
					>
						{copied ? '✓ Copied!' : 'Copy Link'}
					</button>
				</div>
			</div>

			<!-- Stats -->
			<div class="grid grid-cols-2 gap-3">
				<div class="rounded-lg bg-muted/50 p-2 text-center">
					<div class="text-2xl font-bold">{stats.totalReferrals}</div>
					<div class="text-xs text-muted-foreground">{$_('dashboard.widgets.referral.total')}</div>
				</div>
				<div class="rounded-lg bg-muted/50 p-2 text-center">
					<div class="text-2xl font-bold text-green-500">+{stats.totalCreditsEarned}</div>
					<div class="text-xs text-muted-foreground">{$_('dashboard.widgets.referral.earned')}</div>
				</div>
			</div>

			<!-- Tier -->
			<div class="flex items-center justify-between text-sm">
				<span class="text-muted-foreground">{$_('dashboard.widgets.referral.tier')}</span>
				<span class="font-medium {getTierColor(stats.currentTier)}">
					{getTierEmoji(stats.currentTier)}
					{stats.currentTier.charAt(0).toUpperCase() + stats.currentTier.slice(1)}
				</span>
			</div>

			<!-- Progress Bar -->
			{#if stats.tierProgress.nextTierAt > 0}
				<div>
					<div class="mb-1 flex justify-between text-xs text-muted-foreground">
						<span>{stats.tierProgress.current} / {stats.tierProgress.nextTierAt}</span>
						<span>{stats.tierProgress.percentToNext}%</span>
					</div>
					<div class="h-2 overflow-hidden rounded-full bg-muted">
						<div
							class="h-full bg-primary transition-all duration-300"
							style="width: {stats.tierProgress.percentToNext}%"
						></div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
