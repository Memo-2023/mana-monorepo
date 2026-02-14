<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { giftsService, type GiftCodeInfo } from '$lib/api/gifts';

	let code = $derived($page.params.code);
	let giftInfo = $state<GiftCodeInfo | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

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

	function handleRedeem() {
		// Redirect to the redemption page (within the authenticated area)
		goto(`/gifts/redeem/${code}`);
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
			case 'split':
				return 'Geteiltes Geschenk';
			case 'first_come':
				return 'Erste kommen';
			case 'riddle':
				return 'Rätsel-Geschenk';
			default:
				return type;
		}
	}
</script>

<svelte:head>
	<title>Geschenk-Code {code} | ManaCore</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
	<div class="flex min-h-screen items-center justify-center p-4">
		<div class="w-full max-w-md">
			{#if loading}
				<div class="rounded-2xl bg-card p-8 shadow-xl">
					<div class="flex flex-col items-center justify-center py-8">
						<div
							class="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"
						></div>
						<p class="mt-4 text-muted-foreground">Geschenk wird geladen...</p>
					</div>
				</div>
			{:else if error}
				<div class="rounded-2xl bg-card p-8 shadow-xl">
					<div class="text-center">
						<div
							class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20"
						>
							<span class="text-3xl">❌</span>
						</div>
						<h1 class="text-xl font-bold text-foreground">Geschenk nicht gefunden</h1>
						<p class="mt-2 text-muted-foreground">{error}</p>
						<a
							href="/gifts/redeem"
							class="mt-6 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
						>
							Code manuell eingeben
						</a>
					</div>
				</div>
			{:else if giftInfo}
				<div class="rounded-2xl bg-card overflow-hidden shadow-xl">
					<!-- Header with gift icon -->
					<div class="bg-gradient-to-r from-primary to-primary/80 px-8 py-6 text-center text-white">
						<div
							class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur"
						>
							<span class="text-4xl">🎁</span>
						</div>
						<h1 class="text-2xl font-bold">Du hast ein Geschenk!</h1>
						{#if giftInfo.creatorName}
							<p class="mt-1 text-sm text-white/80">Von {giftInfo.creatorName}</p>
						{/if}
					</div>

					<!-- Gift details -->
					<div class="p-8">
						{#if giftInfo.status !== 'active'}
							<div class="mb-6 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4 text-center">
								<p class="font-medium text-amber-800 dark:text-amber-200">
									{#if giftInfo.status === 'depleted'}
										Dieses Geschenk wurde bereits vollständig eingelöst
									{:else if giftInfo.status === 'expired'}
										Dieses Geschenk ist abgelaufen
									{:else}
										Status: {getStatusLabel(giftInfo.status)}
									{/if}
								</p>
							</div>
						{/if}

						<!-- Credits amount -->
						<div class="mb-6 text-center">
							<p class="text-sm text-muted-foreground">Du erhältst</p>
							<p class="text-5xl font-bold text-primary">{giftInfo.creditsPerPortion}</p>
							<p class="text-lg text-muted-foreground">Credits</p>
						</div>

						<!-- Gift info -->
						<div class="mb-6 space-y-3 rounded-lg bg-surface p-4">
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Art</span>
								<span class="font-medium">{getTypeLabel(giftInfo.type)}</span>
							</div>
							{#if giftInfo.totalPortions > 1}
								<div class="flex justify-between text-sm">
									<span class="text-muted-foreground">Verfügbar</span>
									<span class="font-medium"
										>{giftInfo.remainingPortions} / {giftInfo.totalPortions}</span
									>
								</div>
							{/if}
							{#if giftInfo.expiresAt}
								<div class="flex justify-between text-sm">
									<span class="text-muted-foreground">Gültig bis</span>
									<span class="font-medium">{formatDate(giftInfo.expiresAt)}</span>
								</div>
							{/if}
						</div>

						<!-- Message -->
						{#if giftInfo.message}
							<div class="mb-6 rounded-lg border border-border p-4">
								<p class="text-sm text-muted-foreground mb-1">Nachricht:</p>
								<p class="italic text-foreground">"{giftInfo.message}"</p>
							</div>
						{/if}

						<!-- Riddle hint -->
						{#if giftInfo.hasRiddle}
							<div class="mb-6 rounded-lg bg-purple-50 dark:bg-purple-900/20 p-4 text-center">
								<span class="text-2xl">🧩</span>
								<p class="mt-1 text-sm text-purple-800 dark:text-purple-200">
									Dieses Geschenk enthält ein Rätsel
								</p>
							</div>
						{/if}

						<!-- Personalized hint -->
						{#if giftInfo.isPersonalized && giftInfo.status === 'active'}
							<div class="mb-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-center">
								<span class="text-2xl">👤</span>
								<p class="mt-1 text-sm text-blue-800 dark:text-blue-200">
									Dieses Geschenk ist für eine bestimmte Person
								</p>
							</div>
						{/if}

						<!-- Redeem button -->
						{#if giftInfo.status === 'active'}
							<button
								onclick={handleRedeem}
								class="w-full rounded-lg bg-primary py-3 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
							>
								Jetzt einlösen
							</button>
						{:else}
							<a
								href="/gifts/redeem"
								class="block w-full rounded-lg bg-surface py-3 text-center text-lg font-semibold text-foreground transition-colors hover:bg-surface-hover"
							>
								Anderen Code eingeben
							</a>
						{/if}
					</div>
				</div>

				<!-- Code display -->
				<div class="mt-4 text-center">
					<p class="text-sm text-muted-foreground">
						Code: <span class="font-mono font-bold">{giftInfo.code}</span>
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
