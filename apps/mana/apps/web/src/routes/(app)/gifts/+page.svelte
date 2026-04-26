<script lang="ts">
	import { _, locale } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Card, PageHeader } from '@mana/shared-ui';
	import { toast } from '$lib/stores/toast.svelte';
	import { ClipboardText, X } from '@mana/shared-icons';
	import {
		giftsService,
		type GiftListItem,
		type ReceivedGiftItem,
		type CreateGiftRequest,
	} from '$lib/api/gifts';
	import { creditsService, type CreditBalance } from '$lib/api/credits';
	import { RoutePage } from '$lib/components/shell';

	let receivedGifts = $state<ReceivedGiftItem[]>([]);
	let createdGifts = $state<GiftListItem[]>([]);
	let balance = $state<CreditBalance | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeTab = $state<'received' | 'created' | 'create'>('received');

	// Create form state
	let createCredits = $state(50);
	let createType = $state<'simple' | 'personalized'>('simple');
	let createTargetEmail = $state('');
	let createMessage = $state('');
	let creating = $state(false);
	let createError = $state<string | null>(null);
	let createdGift = $state<{ code: string; url: string } | null>(null);

	// Cancel state
	let cancellingId = $state<string | null>(null);

	// Toast notification

	// Handle tab from URL params
	$effect(() => {
		const tab = $page.url.searchParams.get('tab');
		if (tab === 'created') activeTab = 'created';
		else if (tab === 'create') activeTab = 'create';
	});

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		loading = true;
		error = null;
		try {
			const [received, created, balanceData] = await Promise.all([
				giftsService.getReceivedGifts(),
				giftsService.getCreatedGifts(),
				creditsService.getBalance(),
			]);
			receivedGifts = received;
			createdGifts = created;
			balance = balanceData;
		} catch (e) {
			error = e instanceof Error ? e.message : $_('common.error_loading');
			console.error('Failed to load gifts data:', e);
		} finally {
			loading = false;
		}
	}

	async function handleCreate() {
		if (createCredits < 1) {
			createError = $_('gifts.page.err_min_credit');
			return;
		}

		if (createType === 'personalized' && !createTargetEmail.trim()) {
			createError = $_('gifts.page.err_email_required');
			return;
		}

		creating = true;
		createError = null;
		createdGift = null;

		try {
			const request: CreateGiftRequest = {
				credits: createCredits,
				type: createType,
				targetEmail: createType === 'personalized' ? createTargetEmail.trim() : undefined,
				message: createMessage.trim() || undefined,
			};

			const result = await giftsService.createGift(request);
			createdGift = { code: result.code, url: result.url };
			toast.success($_('gifts.page.toast_created'));

			// Reset form
			createCredits = 50;
			createType = 'simple';
			createTargetEmail = '';
			createMessage = '';

			// Reload data
			await loadData();
		} catch (e) {
			createError = e instanceof Error ? e.message : $_('gifts.page.err_create');
			toast.error(createError);
			console.error('Failed to create gift:', e);
		} finally {
			creating = false;
		}
	}

	async function handleCancel(gift: GiftListItem) {
		if (!confirm($_('gifts.page.confirm_cancel', { values: { code: gift.code } }))) {
			return;
		}

		cancellingId = gift.id;
		try {
			const result = await giftsService.cancelGift(gift.id);
			toast.success($_('gifts.page.toast_refunded', { values: { count: result.refundedCredits } }));
			await loadData();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : $_('gifts.page.err_cancel'));
			console.error('Failed to cancel gift:', e);
		} finally {
			cancellingId = null;
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		toast.success($_('gifts.page.toast_clipboard'));
	}

	function activeLocale(): string {
		return get(locale) ?? 'de';
	}

	function formatCredits(amount: number): string {
		return amount.toLocaleString(activeLocale());
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString(activeLocale(), {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}

	function getStatusLabel(status: string): string {
		switch (status) {
			case 'active':
				return $_('gifts.page.status_active');
			case 'depleted':
				return $_('gifts.page.status_depleted');
			case 'expired':
				return $_('gifts.page.status_expired');
			case 'cancelled':
				return $_('gifts.page.status_cancelled');
			case 'refunded':
				return $_('gifts.page.status_refunded');
			default:
				return status;
		}
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'active':
				return 'text-green-600 dark:text-green-400';
			case 'depleted':
				return 'text-blue-600 dark:text-blue-400';
			case 'expired':
			case 'cancelled':
			case 'refunded':
				return 'text-muted-foreground';
			default:
				return 'text-foreground';
		}
	}

	function getTypeLabel(type: string): string {
		switch (type) {
			case 'simple':
				return $_('gifts.page.type_simple_label');
			case 'personalized':
				return $_('gifts.page.type_personalized_label');
			default:
				return type;
		}
	}
</script>

<RoutePage appId="gifts">
	<div>
		<PageHeader title={$_('gifts.page.title')} description={$_('gifts.page.subtitle')} size="lg" />

		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
				></div>
			</div>
		{:else if error}
			<Card>
				<div class="text-center py-8">
					<p class="text-red-500 mb-4">{error}</p>
					<button
						onclick={loadData}
						class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
					>
						{$_('gifts.page.action_retry')}
					</button>
				</div>
			</Card>
		{:else}
			<!-- Quick actions -->
			<div class="mb-8 flex flex-wrap gap-4">
				<a
					href="/gifts/redeem"
					class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
				>
					<span>🎁</span>
					{$_('gifts.page.action_redeem')}
				</a>
				<button
					onclick={() => (activeTab = 'create')}
					class="flex items-center gap-2 rounded-lg bg-surface px-4 py-2 font-medium text-foreground hover:bg-surface-hover border border-border"
				>
					<span>✨</span>
					{$_('gifts.page.action_create_gift')}
				</button>
			</div>

			<!-- Tabs -->
			<div class="flex gap-2 mb-6 border-b border-border">
				<button
					onclick={() => (activeTab = 'received')}
					class="px-4 py-2 -mb-px transition-colors {activeTab === 'received'
						? 'border-b-2 border-primary text-primary font-medium'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					{$_('gifts.page.tab_received', { values: { count: receivedGifts.length } })}
				</button>
				<button
					onclick={() => (activeTab = 'created')}
					class="px-4 py-2 -mb-px transition-colors {activeTab === 'created'
						? 'border-b-2 border-primary text-primary font-medium'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					{$_('gifts.page.tab_created', { values: { count: createdGifts.length } })}
				</button>
				<button
					onclick={() => (activeTab = 'create')}
					class="px-4 py-2 -mb-px transition-colors {activeTab === 'create'
						? 'border-b-2 border-primary text-primary font-medium'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					{$_('gifts.page.tab_create')}
				</button>
			</div>

			<!-- Tab Content -->
			{#if activeTab === 'received'}
				<Card>
					<h3 class="text-lg font-semibold mb-4">{$_('gifts.page.section_received')}</h3>
					{#if receivedGifts.length === 0}
						<div class="text-center py-8">
							<span class="text-4xl">🎁</span>
							<p class="mt-2 text-muted-foreground">{$_('gifts.page.empty_received')}</p>
							<a
								href="/gifts/redeem"
								class="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
							>
								{$_('gifts.page.action_redeem')}
							</a>
						</div>
					{:else}
						<div class="space-y-4">
							{#each receivedGifts as gift}
								<div
									class="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-surface transition-colors"
								>
									<div class="flex items-center gap-4">
										<div
											class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
										>
											<span class="text-2xl">🎁</span>
										</div>
										<div>
											<p class="font-mono font-medium">{gift.code}</p>
											{#if gift.creatorName}
												<p class="text-sm text-muted-foreground">
													{$_('gifts.page.label_from', {
														values: { name: gift.creatorName },
													})}
												</p>
											{/if}
											{#if gift.message}
												<p class="text-sm italic text-muted-foreground mt-1">"{gift.message}"</p>
											{/if}
										</div>
									</div>
									<div class="text-right">
										<p class="text-xl font-bold text-green-600 dark:text-green-400">
											+{formatCredits(gift.credits)}
										</p>
										<p class="text-xs text-muted-foreground">{formatDate(gift.redeemedAt)}</p>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</Card>
			{:else if activeTab === 'created'}
				<Card>
					<h3 class="text-lg font-semibold mb-4">{$_('gifts.page.section_created')}</h3>
					{#if createdGifts.length === 0}
						<div class="text-center py-8">
							<span class="text-4xl">✨</span>
							<p class="mt-2 text-muted-foreground">{$_('gifts.page.empty_created')}</p>
							<button
								onclick={() => (activeTab = 'create')}
								class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
							>
								{$_('gifts.page.action_create_gift')}
							</button>
						</div>
					{:else}
						<div class="space-y-4">
							{#each createdGifts as gift}
								<div class="p-4 rounded-lg border border-border hover:bg-surface transition-colors">
									<div class="flex items-center justify-between mb-2">
										<div class="flex items-center gap-3">
											<span class="font-mono font-bold text-lg">{gift.code}</span>
											<span
												class="px-2 py-0.5 text-xs rounded-full bg-surface {getStatusColor(
													gift.status
												)}"
											>
												{getStatusLabel(gift.status)}
											</span>
											<span
												class="px-2 py-0.5 text-xs rounded-full bg-surface text-muted-foreground"
											>
												{getTypeLabel(gift.type)}
											</span>
										</div>
										<div class="flex items-center gap-2">
											<button
												onclick={() => copyToClipboard(gift.url)}
												class="p-2 rounded hover:bg-surface-hover text-muted-foreground hover:text-foreground"
												title={$_('gifts.page.action_copy_link_title')}
											>
												<ClipboardText size={16} />
											</button>
											{#if gift.status === 'active'}
												<button
													onclick={() => handleCancel(gift)}
													disabled={cancellingId === gift.id}
													class="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-600 disabled:opacity-50"
													title={$_('gifts.page.action_cancel_title')}
												>
													{#if cancellingId === gift.id}
														<svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
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
													{:else}
														<X size={20} />
													{/if}
												</button>
											{/if}
										</div>
									</div>
									<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
										<div>
											<p class="text-muted-foreground">{$_('gifts.page.label_credits')}</p>
											<p class="font-medium">{formatCredits(gift.totalCredits)}</p>
										</div>
										<div>
											<p class="text-muted-foreground">{$_('gifts.page.label_redeemed')}</p>
											<p class="font-medium">
												{gift.redeemed
													? $_('gifts.page.label_redeemed_yes')
													: $_('gifts.page.label_redeemed_no')}
											</p>
										</div>
										<div>
											<p class="text-muted-foreground">{$_('gifts.page.label_created')}</p>
											<p class="font-medium">{formatDate(gift.createdAt)}</p>
										</div>
										{#if gift.expiresAt}
											<div>
												<p class="text-muted-foreground">{$_('gifts.page.label_valid_until')}</p>
												<p class="font-medium">{formatDate(gift.expiresAt)}</p>
											</div>
										{/if}
									</div>
									{#if gift.message}
										<p class="mt-2 text-sm italic text-muted-foreground">"{gift.message}"</p>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</Card>
			{:else if activeTab === 'create'}
				<div class="grid gap-6 lg:grid-cols-2">
					<!-- Create form -->
					<Card>
						<h3 class="text-lg font-semibold mb-4">{$_('gifts.page.section_create')}</h3>

						{#if balance}
							<div class="mb-6 rounded-lg bg-surface p-4 text-center">
								<p class="text-sm text-muted-foreground">
									{$_('gifts.page.label_available_credits')}
								</p>
								<p class="text-2xl font-bold text-primary">
									{formatCredits(balance.balance + (balance.freeCreditsRemaining ?? 0))}
								</p>
							</div>
						{/if}

						<div class="space-y-4">
							<div>
								<label for="credits" class="block text-sm font-medium text-foreground mb-2">
									{$_('gifts.page.label_credits_input')}
								</label>
								<input
									id="credits"
									type="number"
									bind:value={createCredits}
									min="1"
									max="10000"
									class="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
									disabled={creating}
								/>
							</div>

							<div>
								<label for="type" class="block text-sm font-medium text-foreground mb-2">
									{$_('gifts.page.label_type')}
								</label>
								<select
									id="type"
									bind:value={createType}
									class="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
									disabled={creating}
								>
									<option value="simple">{$_('gifts.page.type_simple')}</option>
									<option value="personalized">{$_('gifts.page.type_personalized')}</option>
								</select>
							</div>

							{#if createType === 'personalized'}
								<div>
									<label for="target-email" class="block text-sm font-medium text-foreground mb-2">
										{$_('gifts.page.label_target_email')}
									</label>
									<input
										id="target-email"
										type="email"
										bind:value={createTargetEmail}
										placeholder={$_('gifts.page.placeholder_target_email')}
										class="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
										disabled={creating}
									/>
									<p class="mt-1 text-sm text-muted-foreground">
										{$_('gifts.page.hint_personalized')}
									</p>
								</div>
							{/if}

							<div>
								<label for="message" class="block text-sm font-medium text-foreground mb-2">
									{$_('gifts.page.label_message')}
								</label>
								<textarea
									id="message"
									bind:value={createMessage}
									placeholder={$_('gifts.page.placeholder_message')}
									maxlength="500"
									rows="3"
									class="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
									disabled={creating}
								></textarea>
							</div>

							{#if createError}
								<div class="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
									<p class="text-sm text-red-800 dark:text-red-200">{createError}</p>
								</div>
							{/if}

							<button
								onclick={handleCreate}
								disabled={creating || createCredits < 1}
								class="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
							>
								{#if creating}
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
									{$_('gifts.page.action_creating')}
								{:else}
									{$_('gifts.page.action_create')}
								{/if}
							</button>
						</div>
					</Card>

					<!-- Created gift result -->
					{#if createdGift}
						<Card>
							<div class="text-center">
								<div
									class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
								>
									<span class="text-4xl">🎁</span>
								</div>
								<h3 class="text-xl font-bold text-foreground">{$_('gifts.page.created_title')}</h3>
								<p class="mt-1 text-muted-foreground">{$_('gifts.page.created_subtitle')}</p>

								<div class="mt-6 rounded-lg bg-surface p-4">
									<p class="font-mono text-2xl font-bold text-primary">{createdGift.code}</p>
									<p class="mt-2 text-sm text-muted-foreground break-all">{createdGift.url}</p>
								</div>

								<div class="mt-4 flex justify-center gap-2">
									<button
										onclick={() => copyToClipboard(createdGift!.url)}
										class="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
									>
										{$_('gifts.page.action_copy_link')}
									</button>
									<button
										onclick={() => copyToClipboard(createdGift!.code)}
										class="rounded-lg bg-surface px-4 py-2 font-medium text-foreground hover:bg-surface-hover border border-border"
									>
										{$_('gifts.page.action_copy_code')}
									</button>
								</div>

								<button
									onclick={() => (createdGift = null)}
									class="mt-6 text-sm text-primary hover:underline"
								>
									{$_('gifts.page.action_create_another')}
								</button>
							</div>
						</Card>
					{:else}
						<!-- Info card -->
						<Card>
							<h3 class="text-lg font-semibold mb-4">{$_('gifts.page.info_title')}</h3>
							<div class="space-y-4">
								<div class="flex gap-3">
									<div
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold"
									>
										1
									</div>
									<div>
										<p class="font-medium">{$_('gifts.page.info_step1_title')}</p>
										<p class="text-sm text-muted-foreground">
											{$_('gifts.page.info_step1_body')}
										</p>
									</div>
								</div>
								<div class="flex gap-3">
									<div
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold"
									>
										2
									</div>
									<div>
										<p class="font-medium">{$_('gifts.page.info_step2_title')}</p>
										<p class="text-sm text-muted-foreground">
											{$_('gifts.page.info_step2_body')}
										</p>
									</div>
								</div>
								<div class="flex gap-3">
									<div
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold"
									>
										3
									</div>
									<div>
										<p class="font-medium">{$_('gifts.page.info_step3_title')}</p>
										<p class="text-sm text-muted-foreground">
											{$_('gifts.page.info_step3_body')}
										</p>
									</div>
								</div>
								<div class="flex gap-3">
									<div
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold"
									>
										4
									</div>
									<div>
										<p class="font-medium">{$_('gifts.page.info_step4_title')}</p>
										<p class="text-sm text-muted-foreground">
											{$_('gifts.page.info_step4_body')}
										</p>
									</div>
								</div>
							</div>

							<div class="mt-6 rounded-lg bg-surface p-4">
								<p class="text-sm text-muted-foreground">
									<strong>{$_('gifts.page.info_note_strong')}</strong>
									{$_('gifts.page.info_note_body')}
								</p>
							</div>
						</Card>
					{/if}
				</div>
			{/if}
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
	.animate-fade-in {
		animation: fade-in 0.2s ease-out;
	}
</style>
