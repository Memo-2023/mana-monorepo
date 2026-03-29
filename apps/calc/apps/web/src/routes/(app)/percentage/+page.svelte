<script lang="ts">
	// Percentage calculator modes
	let mode = $state<'of' | 'change' | 'markup' | 'discount'>('of');

	// X% of Y
	let percentValue = $state(15);
	let baseValue = $state(200);

	// Percentage change
	let oldValue = $state(100);
	let newValue = $state(125);

	// Markup/Discount
	let price = $state(100);
	let percentChange = $state(20);

	let percentOfResult = $derived((baseValue * percentValue) / 100);

	let changeResult = $derived(() => {
		if (oldValue === 0) return { percent: 0, diff: 0 };
		const diff = newValue - oldValue;
		const percent = (diff / oldValue) * 100;
		return { percent, diff };
	});

	let markupResult = $derived(price * (1 + percentChange / 100));
	let discountResult = $derived(price * (1 - percentChange / 100));

	function fmt(n: number): string {
		return parseFloat(n.toPrecision(10)).toLocaleString('de-DE', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});
	}

	const modes: { id: typeof mode; label: string }[] = [
		{ id: 'of', label: 'X% von Y' },
		{ id: 'change', label: 'Änderung' },
		{ id: 'markup', label: 'Aufschlag' },
		{ id: 'discount', label: 'Rabatt' },
	];
</script>

<svelte:head>
	<title>Calc - Prozent</title>
</svelte:head>

<div class="percent-page">
	<div class="flex gap-2 mb-6">
		{#each modes as m}
			<button
				class="flex-1 py-1.5 rounded-full text-sm transition-all border
					{mode === m.id
					? 'bg-rose-500 text-white border-rose-500'
					: 'bg-card border-border text-muted-foreground hover:bg-muted'}"
				onclick={() => (mode = m.id)}>{m.label}</button
			>
		{/each}
	</div>

	<div class="p-6 rounded-xl bg-card border border-border space-y-4">
		{#if mode === 'of'}
			<h2 class="text-lg font-bold text-foreground">X% von Y</h2>
			<div class="flex items-center gap-2">
				<input
					type="number"
					bind:value={percentValue}
					class="w-20 h-10 px-3 rounded-lg bg-background border border-border text-foreground font-mono text-center"
				/>
				<span class="text-muted-foreground">% von</span>
				<input
					type="number"
					bind:value={baseValue}
					class="flex-1 h-10 px-3 rounded-lg bg-background border border-border text-foreground font-mono"
				/>
			</div>
			<div class="pt-4 border-t border-border text-center">
				<div class="text-3xl font-bold font-mono text-foreground">{fmt(percentOfResult)}</div>
				<div class="text-sm text-muted-foreground">
					{percentValue}% von {baseValue} = {fmt(percentOfResult)}
				</div>
			</div>
		{:else if mode === 'change'}
			<h2 class="text-lg font-bold text-foreground">Prozentuale Änderung</h2>
			<label class="block">
				<span class="text-xs text-muted-foreground">Alter Wert</span>
				<input
					type="number"
					bind:value={oldValue}
					class="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground font-mono"
				/>
			</label>
			<label class="block">
				<span class="text-xs text-muted-foreground">Neuer Wert</span>
				<input
					type="number"
					bind:value={newValue}
					class="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground font-mono"
				/>
			</label>
			<div class="pt-4 border-t border-border text-center">
				<div
					class="text-3xl font-bold font-mono {changeResult().percent >= 0
						? 'text-emerald-500'
						: 'text-red-400'}"
				>
					{changeResult().percent >= 0 ? '+' : ''}{fmt(changeResult().percent)}%
				</div>
				<div class="text-sm text-muted-foreground">Differenz: {fmt(changeResult().diff)}</div>
			</div>
		{:else if mode === 'markup'}
			<h2 class="text-lg font-bold text-foreground">Preisaufschlag</h2>
			<label class="block">
				<span class="text-xs text-muted-foreground">Preis (€)</span>
				<input
					type="number"
					bind:value={price}
					class="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground font-mono"
				/>
			</label>
			<label class="block">
				<span class="text-xs text-muted-foreground">Aufschlag (%)</span>
				<input
					type="number"
					bind:value={percentChange}
					class="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground font-mono"
				/>
			</label>
			<div class="pt-4 border-t border-border text-center">
				<div class="text-3xl font-bold font-mono text-foreground">{fmt(markupResult)} €</div>
				<div class="text-sm text-muted-foreground">
					{fmt(price)} + {percentChange}% = {fmt(markupResult)} €
				</div>
			</div>
		{:else if mode === 'discount'}
			<h2 class="text-lg font-bold text-foreground">Rabatt</h2>
			<label class="block">
				<span class="text-xs text-muted-foreground">Originalpreis (€)</span>
				<input
					type="number"
					bind:value={price}
					class="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground font-mono"
				/>
			</label>
			<label class="block">
				<span class="text-xs text-muted-foreground">Rabatt (%)</span>
				<input
					type="number"
					bind:value={percentChange}
					class="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground font-mono"
				/>
			</label>
			<div class="flex gap-2 mt-1">
				{#each [10, 15, 20, 25, 50] as pct}
					<button
						class="flex-1 py-1 rounded text-xs border {percentChange === pct
							? 'bg-rose-500 text-white border-rose-500'
							: 'bg-card border-border text-muted-foreground hover:bg-muted'}"
						onclick={() => (percentChange = pct)}>{pct}%</button
					>
				{/each}
			</div>
			<div class="pt-4 border-t border-border text-center">
				<div class="text-3xl font-bold font-mono text-foreground">{fmt(discountResult)} €</div>
				<div class="text-sm text-muted-foreground">Ersparnis: {fmt(price - discountResult)} €</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.percent-page {
		max-width: 500px;
		margin: 0 auto;
	}
</style>
