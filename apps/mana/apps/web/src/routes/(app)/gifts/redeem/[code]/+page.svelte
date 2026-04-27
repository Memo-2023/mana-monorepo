<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Card, PageHeader } from '@mana/shared-ui';
	import { toast } from '$lib/stores/toast.svelte';
	import { giftsService, type GiftCodeInfo } from '$lib/api/gifts';
	import { RoutePage } from '$lib/components/shell';
	import { _, locale } from 'svelte-i18n';
	import { get } from 'svelte/store';

	let code = $derived($page.params.code ?? '');
	let giftInfo = $state<GiftCodeInfo | null>(null);
	let loading = $state(true);
	let redeeming = $state(false);
	let success = $state(false);
	let error = $state<string | null>(null);
	let receivedCredits = $state(0);
	let newBalance = $state(0);

	// Toast notification

	onMount(async () => {
		await loadGiftInfo();
	});

	async function loadGiftInfo() {
		loading = true;
		error = null;

		try {
			giftInfo = await giftsService.getGiftInfo(code);
		} catch (e) {
			error = e instanceof Error ? e.message : $_('gifts.redeem.err_not_found');
			console.error('Failed to load gift info:', e);
		} finally {
			loading = false;
		}
	}

	async function handleRedeem() {
		if (!giftInfo) return;

		redeeming = true;
		error = null;

		try {
			const result = await giftsService.redeemGift(code);

			if (result.success) {
				success = true;
				receivedCredits = result.credits || 0;
				newBalance = result.newBalance || 0;
				toast.success($_('gifts.redeem.toast_received', { values: { credits: receivedCredits } }));
			} else {
				error = result.error || $_('gifts.redeem.err_redeem_failed');
				toast.error(error);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : $_('gifts.redeem.err_redeem_failed');
			toast.error(error);
			console.error('Failed to redeem gift:', e);
		} finally {
			redeeming = false;
		}
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString(get(locale) ?? 'de', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}

	function getStatusLabel(status: string): string {
		switch (status) {
			case 'active':
				return $_('gifts.redeem.status_active');
			case 'depleted':
				return $_('gifts.redeem.status_depleted');
			case 'expired':
				return $_('gifts.redeem.status_expired');
			case 'cancelled':
				return $_('gifts.redeem.status_cancelled');
			case 'refunded':
				return $_('gifts.redeem.status_refunded');
			default:
				return status;
		}
	}

	function getTypeLabel(type: string): string {
		switch (type) {
			case 'simple':
				return $_('gifts.redeem.type_simple');
			case 'personalized':
				return $_('gifts.redeem.type_personalized');
			default:
				return type;
		}
	}
</script>

<RoutePage appId="gifts" backHref="/gifts" title={$_('gifts.redeem.page_back_title')}>
	<div>
		<PageHeader
			title={$_('gifts.redeem.page_title')}
			description={$_('gifts.redeem.page_description')}
			size="lg"
		/>

		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
				></div>
			</div>
		{:else if success}
			<!-- Success state -->
			<Card>
				<div class="py-12 text-center">
					<div
						class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 animate-bounce-once"
					>
						<span class="text-5xl">🎉</span>
					</div>
					<h2 class="text-2xl font-bold text-foreground">{$_('gifts.redeem.success_heading')}</h2>
					<p class="mt-2 text-5xl font-bold text-primary">+{receivedCredits}</p>
					<p class="text-lg text-muted-foreground">{$_('gifts.redeem.success_credits_label')}</p>
					<p class="mt-4 text-muted-foreground">
						{@html $_('gifts.redeem.success_balance_html', {
							values: { balance: newBalance },
						})}
					</p>
					<div class="mt-8 flex justify-center gap-4">
						<a
							href="/?app=credits"
							class="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90"
						>
							{$_('gifts.redeem.success_link_credits')}
						</a>
						<a
							href="/gifts"
							class="rounded-lg bg-surface px-6 py-2 font-medium text-foreground hover:bg-surface-hover"
						>
							{$_('gifts.redeem.success_link_overview')}
						</a>
					</div>
				</div>
			</Card>
		{:else if error && !giftInfo}
			<!-- Gift not found error -->
			<Card>
				<div class="py-8 text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20"
					>
						<span class="text-3xl">❌</span>
					</div>
					<p class="text-red-500 mb-4">{error}</p>
					<a
						href="/gifts/redeem"
						class="inline-block rounded-lg bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90"
					>
						{$_('gifts.redeem.action_other_code')}
					</a>
				</div>
			</Card>
		{:else if giftInfo}
			<div class="grid gap-6 lg:grid-cols-2">
				<!-- Gift info card -->
				<Card>
					<div class="text-center">
						<div
							class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
						>
							<span class="text-4xl">🎁</span>
						</div>
						<p class="font-mono text-lg font-bold text-primary">{giftInfo.code}</p>
						{#if giftInfo.creatorName}
							<p class="mt-1 text-sm text-muted-foreground">
								{$_('gifts.redeem.label_from', {
									values: { name: giftInfo.creatorName },
								})}
							</p>
						{/if}
					</div>

					<div class="mt-6 text-center">
						<p class="text-sm text-muted-foreground">{$_('gifts.redeem.label_you_get')}</p>
						<p class="text-4xl font-bold text-primary">{giftInfo.totalCredits}</p>
						<p class="text-muted-foreground">{$_('gifts.redeem.label_credits')}</p>
					</div>

					<div class="mt-6 space-y-3 rounded-lg bg-surface p-4">
						<div class="flex justify-between text-sm">
							<span class="text-muted-foreground">{$_('gifts.redeem.label_type')}</span>
							<span class="font-medium">{getTypeLabel(giftInfo.type)}</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-muted-foreground">{$_('gifts.redeem.label_status')}</span>
							<span
								class="font-medium {giftInfo.status === 'active'
									? 'text-green-600 dark:text-green-400'
									: 'text-amber-600 dark:text-amber-400'}"
							>
								{getStatusLabel(giftInfo.status)}
							</span>
						</div>
						{#if giftInfo.expiresAt}
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">{$_('gifts.redeem.label_valid_until')}</span>
								<span class="font-medium">{formatDate(giftInfo.expiresAt)}</span>
							</div>
						{/if}
					</div>

					{#if giftInfo.message}
						<div class="mt-6 rounded-lg border border-border p-4">
							<p class="text-sm text-muted-foreground mb-1">
								{$_('gifts.redeem.label_message_prefix')}
							</p>
							<p class="italic text-foreground">"{giftInfo.message}"</p>
						</div>
					{/if}
				</Card>

				<!-- Redemption card -->
				<Card>
					<h3 class="text-lg font-semibold mb-4">{$_('gifts.redeem.section_redeem')}</h3>

					{#if giftInfo.status !== 'active'}
						<div class="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4 text-center">
							<p class="font-medium text-amber-800 dark:text-amber-200">
								{#if giftInfo.status === 'depleted'}
									{$_('gifts.redeem.warn_depleted')}
								{:else if giftInfo.status === 'expired'}
									{$_('gifts.redeem.warn_expired')}
								{:else}
									{$_('gifts.redeem.warn_other')}
								{/if}
							</p>
						</div>
					{:else}
						{#if giftInfo.isPersonalized}
							<div class="mb-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
								<div class="flex items-center gap-2">
									<span class="text-xl">👤</span>
									<p class="text-sm text-blue-800 dark:text-blue-200">
										{$_('gifts.redeem.info_personalized')}
									</p>
								</div>
							</div>
						{/if}

						{#if error}
							<div class="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
								<p class="text-sm text-red-800 dark:text-red-200">{error}</p>
							</div>
						{/if}

						<button
							onclick={handleRedeem}
							disabled={redeeming}
							class="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
						>
							{#if redeeming}
								<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								{$_('gifts.redeem.action_redeeming')}
							{:else}
								{$_('gifts.redeem.action_redeem')}
							{/if}
						</button>
					{/if}

					<div class="mt-6 text-center">
						<a href="/gifts/redeem" class="text-sm text-primary hover:underline">
							{$_('gifts.redeem.action_other_code')}
						</a>
					</div>
				</Card>
			</div>
		{/if}
	</div>
</RoutePage>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	@keyframes bounce-once {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-20px);
		}
	}
	.animate-bounce-once {
		animation: bounce-once 0.6s ease-out;
	}
</style>
