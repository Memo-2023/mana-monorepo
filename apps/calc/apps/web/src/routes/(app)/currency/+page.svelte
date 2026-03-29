<script lang="ts">
	let amount = $state(100);
	let fromCurrency = $state('EUR');
	let toCurrency = $state('USD');
	let rates = $state<Record<string, number>>({});
	let loading = $state(false);
	let lastUpdated = $state('');

	const currencies = [
		{ code: 'EUR', name: 'Euro', symbol: '€' },
		{ code: 'USD', name: 'US Dollar', symbol: '$' },
		{ code: 'GBP', name: 'Brit. Pfund', symbol: '£' },
		{ code: 'CHF', name: 'Schweizer Franken', symbol: 'CHF' },
		{ code: 'JPY', name: 'Japanischer Yen', symbol: '¥' },
		{ code: 'CNY', name: 'Chinesischer Yuan', symbol: '¥' },
		{ code: 'CAD', name: 'Kanadischer Dollar', symbol: 'C$' },
		{ code: 'AUD', name: 'Australischer Dollar', symbol: 'A$' },
		{ code: 'SEK', name: 'Schwedische Krone', symbol: 'kr' },
		{ code: 'NOK', name: 'Norwegische Krone', symbol: 'kr' },
		{ code: 'DKK', name: 'Dänische Krone', symbol: 'kr' },
		{ code: 'PLN', name: 'Polnischer Zloty', symbol: 'zł' },
		{ code: 'CZK', name: 'Tschechische Krone', symbol: 'Kč' },
		{ code: 'TRY', name: 'Türkische Lira', symbol: '₺' },
		{ code: 'INR', name: 'Indische Rupie', symbol: '₹' },
		{ code: 'BRL', name: 'Brasilianischer Real', symbol: 'R$' },
		{ code: 'KRW', name: 'Südkoreanischer Won', symbol: '₩' },
	];

	// Static fallback rates (EUR-based, approximate)
	const FALLBACK_RATES: Record<string, number> = {
		EUR: 1,
		USD: 1.08,
		GBP: 0.86,
		CHF: 0.95,
		JPY: 162.5,
		CNY: 7.85,
		CAD: 1.47,
		AUD: 1.66,
		SEK: 11.2,
		NOK: 11.5,
		DKK: 7.46,
		PLN: 4.32,
		CZK: 25.3,
		TRY: 34.8,
		INR: 90.5,
		BRL: 5.35,
		KRW: 1420,
	};

	async function fetchRates() {
		loading = true;
		try {
			// Try free API first
			const res = await fetch(`https://open.er-api.com/v6/latest/${fromCurrency}`);
			if (res.ok) {
				const data = await res.json();
				rates = data.rates || {};
				lastUpdated = data.time_last_update_utc || '';
			} else {
				throw new Error('API unavailable');
			}
		} catch {
			// Fallback to static rates
			const fromRate = FALLBACK_RATES[fromCurrency] || 1;
			const converted: Record<string, number> = {};
			for (const [code, rate] of Object.entries(FALLBACK_RATES)) {
				converted[code] = rate / fromRate;
			}
			rates = converted;
			lastUpdated = 'Offline-Kurse (Richtwerte)';
		}
		loading = false;
	}

	// Fetch on mount and when fromCurrency changes
	$effect(() => {
		fetchRates();
	});

	let result = $derived(() => {
		const rate = rates[toCurrency];
		if (!rate) return null;
		return amount * rate;
	});

	function swapCurrencies() {
		const tmp = fromCurrency;
		fromCurrency = toCurrency;
		toCurrency = tmp;
	}

	function fmt(n: number): string {
		return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}
</script>

<svelte:head>
	<title>Calc - Währung</title>
</svelte:head>

<div class="currency-page">
	<div class="p-6 rounded-xl bg-card border border-border space-y-4">
		<h2 class="text-lg font-bold text-foreground">Währungsrechner</h2>

		<div>
			<label class="text-xs text-muted-foreground mb-1 block">Betrag</label>
			<input
				type="number"
				bind:value={amount}
				class="w-full h-12 px-3 rounded-lg bg-background border border-border text-foreground font-mono text-xl"
			/>
		</div>

		<div class="grid grid-cols-[1fr,auto,1fr] gap-2 items-end">
			<label class="block">
				<span class="text-xs text-muted-foreground">Von</span>
				<select
					bind:value={fromCurrency}
					class="mt-1 w-full h-10 px-2 rounded-lg bg-background border border-border text-foreground text-sm"
				>
					{#each currencies as c}
						<option value={c.code}>{c.code} — {c.name}</option>
					{/each}
				</select>
			</label>
			<button
				class="h-10 px-3 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground"
				onclick={swapCurrencies}>↔</button
			>
			<label class="block">
				<span class="text-xs text-muted-foreground">Nach</span>
				<select
					bind:value={toCurrency}
					class="mt-1 w-full h-10 px-2 rounded-lg bg-background border border-border text-foreground text-sm"
				>
					{#each currencies as c}
						<option value={c.code}>{c.code} — {c.name}</option>
					{/each}
				</select>
			</label>
		</div>

		{#if loading}
			<div class="text-center text-muted-foreground text-sm py-4">Kurse laden...</div>
		{:else if result() !== null}
			<div class="pt-4 border-t border-border text-center">
				<div class="text-3xl font-bold font-mono text-foreground">
					{fmt(result()!)}
					{toCurrency}
				</div>
				<div class="text-sm text-muted-foreground mt-1">
					1 {fromCurrency} = {(rates[toCurrency] || 0).toFixed(4)}
					{toCurrency}
				</div>
			</div>
		{/if}

		{#if lastUpdated}
			<div class="text-xs text-muted-foreground/60 text-center">{lastUpdated}</div>
		{/if}
	</div>

	<!-- Quick conversions -->
	{#if Object.keys(rates).length > 0}
		<div class="mt-6 p-4 rounded-xl bg-card border border-border">
			<h3 class="text-sm font-medium text-muted-foreground mb-3">Schnellübersicht</h3>
			<div class="grid grid-cols-2 gap-2">
				{#each currencies.filter((c) => c.code !== fromCurrency).slice(0, 8) as c}
					<div class="flex justify-between p-2 rounded-lg bg-muted/30 text-sm">
						<span class="text-muted-foreground">{c.code}</span>
						<span class="font-mono text-foreground">{fmt(amount * (rates[c.code] || 0))}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.currency-page {
		max-width: 500px;
		margin: 0 auto;
	}
</style>
