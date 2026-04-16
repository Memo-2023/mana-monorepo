<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Card, PageHeader } from '@mana/shared-ui';
	import { giftsService, type GiftCodeInfo } from '$lib/api/gifts';

	let code = $derived($page.params.code ?? '');
	let giftInfo = $state<GiftCodeInfo | null>(null);
	let loading = $state(true);
	let redeeming = $state(false);
	let success = $state(false);
	let error = $state<string | null>(null);
	let receivedCredits = $state(0);
	let newBalance = $state(0);

	// Toast notification
	let toastMessage = $state<string | null>(null);
	let toastType = $state<'success' | 'error'>('success');

	onMount(async () => {
		await loadGiftInfo();
	});

	async function loadGiftInfo() {
		loading = true;
		error = null;

		try {
			giftInfo = await giftsService.getGiftInfo(code);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Geschenk-Code nicht gefunden';
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
				showToast(`${receivedCredits} Credits erhalten!`, 'success');
			} else {
				error = result.error || 'Einlösen fehlgeschlagen';
				showToast(error, 'error');
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Einlösen fehlgeschlagen';
			showToast(error, 'error');
			console.error('Failed to redeem gift:', e);
		} finally {
			redeeming = false;
		}
	}

	function showToast(message: string, type: 'success' | 'error') {
		toastMessage = message;
		toastType = type;
		setTimeout(() => {
			toastMessage = null;
		}, 4000);
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}

	function getStatusLabel(status: string): string {
		switch (status) {
			case 'active':
				return 'Aktiv';
			case 'depleted':
				return 'Aufgebraucht';
			case 'expired':
				return 'Abgelaufen';
			case 'cancelled':
				return 'Storniert';
			case 'refunded':
				return 'Erstattet';
			default:
				return status;
		}
	}

	function getTypeLabel(type: string): string {
		switch (type) {
			case 'simple':
				return 'Geschenk';
			case 'personalized':
				return 'Persönliches Geschenk';
			default:
				return type;
		}
	}
</script>

<div>
	<PageHeader title="Geschenk einlösen" description="Löse deinen Geschenk-Code ein" size="lg" />

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
				<h2 class="text-2xl font-bold text-foreground">Geschenk eingelöst!</h2>
				<p class="mt-2 text-5xl font-bold text-primary">+{receivedCredits}</p>
				<p class="text-lg text-muted-foreground">Credits erhalten</p>
				<p class="mt-4 text-muted-foreground">
					Dein neuer Kontostand: <span class="font-semibold">{newBalance} Credits</span>
				</p>
				<div class="mt-8 flex justify-center gap-4">
					<a
						href="/?app=credits"
						class="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90"
					>
						Zu meinen Credits
					</a>
					<a
						href="/gifts"
						class="rounded-lg bg-surface px-6 py-2 font-medium text-foreground hover:bg-surface-hover"
					>
						Geschenke ansehen
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
					Anderen Code eingeben
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
						<p class="mt-1 text-sm text-muted-foreground">Von {giftInfo.creatorName}</p>
					{/if}
				</div>

				<div class="mt-6 text-center">
					<p class="text-sm text-muted-foreground">Du erhältst</p>
					<p class="text-4xl font-bold text-primary">{giftInfo.totalCredits}</p>
					<p class="text-muted-foreground">Credits</p>
				</div>

				<div class="mt-6 space-y-3 rounded-lg bg-surface p-4">
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Art</span>
						<span class="font-medium">{getTypeLabel(giftInfo.type)}</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Status</span>
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
							<span class="text-muted-foreground">Gültig bis</span>
							<span class="font-medium">{formatDate(giftInfo.expiresAt)}</span>
						</div>
					{/if}
				</div>

				{#if giftInfo.message}
					<div class="mt-6 rounded-lg border border-border p-4">
						<p class="text-sm text-muted-foreground mb-1">Nachricht:</p>
						<p class="italic text-foreground">"{giftInfo.message}"</p>
					</div>
				{/if}
			</Card>

			<!-- Redemption card -->
			<Card>
				<h3 class="text-lg font-semibold mb-4">Einlösen</h3>

				{#if giftInfo.status !== 'active'}
					<div class="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4 text-center">
						<p class="font-medium text-amber-800 dark:text-amber-200">
							{#if giftInfo.status === 'depleted'}
								Dieses Geschenk wurde bereits eingelöst
							{:else if giftInfo.status === 'expired'}
								Dieses Geschenk ist abgelaufen
							{:else}
								Dieses Geschenk kann nicht eingelöst werden
							{/if}
						</p>
					</div>
				{:else}
					{#if giftInfo.isPersonalized}
						<div class="mb-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
							<div class="flex items-center gap-2">
								<span class="text-xl">👤</span>
								<p class="text-sm text-blue-800 dark:text-blue-200">
									Dieses Geschenk ist für eine bestimmte Person. Nur der vorgesehene Empfänger kann
									es einlösen.
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
							Wird eingelöst...
						{:else}
							🎁 Geschenk einlösen
						{/if}
					</button>
				{/if}

				<div class="mt-6 text-center">
					<a href="/gifts/redeem" class="text-sm text-primary hover:underline">
						Anderen Code eingeben
					</a>
				</div>
			</Card>
		</div>
	{/if}
</div>

<!-- Toast Notification -->
{#if toastMessage}
	<div
		class="fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg animate-fade-in {toastType ===
		'success'
			? 'bg-green-600 text-white'
			: 'bg-red-600 text-white'}"
	>
		{toastMessage}
	</div>
{/if}

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
