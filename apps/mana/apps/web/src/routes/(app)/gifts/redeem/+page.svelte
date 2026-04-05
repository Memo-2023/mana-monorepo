<script lang="ts">
	import { goto } from '$app/navigation';
	import { Card, PageHeader } from '@mana/shared-ui';
	import { giftsService, type GiftCodeInfo } from '$lib/api/gifts';

	let code = $state('');
	let checking = $state(false);
	let error = $state<string | null>(null);
	let giftInfo = $state<GiftCodeInfo | null>(null);

	function formatCode(value: string): string {
		// Remove non-alphanumeric characters and convert to uppercase
		return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
	}

	function handleInput(event: Event) {
		const input = event.target as HTMLInputElement;
		code = formatCode(input.value);
		// Clear previous results when typing
		error = null;
		giftInfo = null;
	}

	async function checkCode() {
		if (!code.trim()) {
			error = 'Bitte gib einen Code ein';
			return;
		}

		checking = true;
		error = null;
		giftInfo = null;

		try {
			giftInfo = await giftsService.getGiftInfo(code);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Code nicht gefunden';
			console.error('Failed to check gift code:', e);
		} finally {
			checking = false;
		}
	}

	function goToRedeem() {
		goto(`/gifts/redeem/${code}`);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			if (giftInfo) {
				goToRedeem();
			} else {
				checkCode();
			}
		}
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
</script>

<div>
	<PageHeader
		title="Geschenk-Code eingeben"
		description="Gib deinen 6-stelligen Geschenk-Code ein"
		size="lg"
	/>

	<div class="max-w-md mx-auto">
		<Card>
			<div class="text-center mb-6">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
				>
					<span class="text-3xl">🎁</span>
				</div>
				<p class="text-muted-foreground">
					Geschenk-Codes bestehen aus 6 Zeichen und sind unter URLs wie
					<span class="font-mono text-primary">mana.how/g/ABC123</span> zu finden.
				</p>
			</div>

			<div class="mb-6">
				<label for="gift-code" class="block text-sm font-medium text-foreground mb-2">
					Geschenk-Code
				</label>
				<input
					id="gift-code"
					type="text"
					value={code}
					oninput={handleInput}
					onkeydown={handleKeydown}
					placeholder="z.B. MANA01"
					maxlength="10"
					class="w-full rounded-lg border border-border bg-background px-4 py-3 text-center text-2xl font-mono font-bold tracking-widest text-foreground placeholder:text-lg placeholder:font-normal placeholder:tracking-normal focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
					disabled={checking}
				/>
			</div>

			{#if error}
				<div class="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-center">
					<p class="text-sm text-red-800 dark:text-red-200">{error}</p>
				</div>
			{/if}

			{#if giftInfo}
				<div
					class="mb-6 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4"
				>
					<div class="flex items-center gap-2 mb-2">
						<span class="text-xl">✓</span>
						<p class="font-medium text-green-800 dark:text-green-200">Gültiger Code gefunden!</p>
					</div>
					<div class="text-sm text-green-700 dark:text-green-300 space-y-1">
						<p>Credits: <span class="font-semibold">{giftInfo.creditsPerPortion}</span></p>
						<p>Status: <span class="font-semibold">{getStatusLabel(giftInfo.status)}</span></p>
						{#if giftInfo.creatorName}
							<p>Von: <span class="font-semibold">{giftInfo.creatorName}</span></p>
						{/if}
					</div>
				</div>
			{/if}

			{#if giftInfo && giftInfo.status === 'active'}
				<button
					onclick={goToRedeem}
					class="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
				>
					Jetzt einlösen
				</button>
			{:else}
				<button
					onclick={checkCode}
					disabled={checking || !code.trim()}
					class="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
				>
					{#if checking}
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
						Code wird geprüft...
					{:else}
						Code prüfen
					{/if}
				</button>
			{/if}
		</Card>

		<div class="mt-6 text-center">
			<a href="/gifts" class="text-sm text-primary hover:underline"> ← Zurück zu Geschenke </a>
		</div>
	</div>
</div>
