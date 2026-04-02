<script lang="ts">
	import { UNIT_CATEGORIES, UNITS_BY_CATEGORY } from '@calc/shared/constants';
	import type { UnitCategory, UnitDefinition } from '@calc/shared';

	let selectedCategory = $state<UnitCategory>('length');
	let fromUnit = $state('m');
	let toUnit = $state('km');
	let fromValue = $state('1');

	let units = $derived(UNITS_BY_CATEGORY[selectedCategory] || []);

	let result = $derived(() => {
		const val = parseFloat(fromValue);
		if (isNaN(val)) return '';
		const from = units.find((u: UnitDefinition) => u.id === fromUnit);
		const to = units.find((u: UnitDefinition) => u.id === toUnit);
		if (!from || !to) return '';
		const baseValue = from.toBase(val);
		const converted = to.fromBase(baseValue);
		// Format nicely
		if (Math.abs(converted) < 0.001 && converted !== 0) return converted.toExponential(4);
		if (Math.abs(converted) > 1e12) return converted.toExponential(4);
		return parseFloat(converted.toPrecision(10)).toString();
	});

	function swapUnits() {
		const tmp = fromUnit;
		fromUnit = toUnit;
		toUnit = tmp;
	}

	function selectCategory(cat: UnitCategory) {
		selectedCategory = cat;
		const newUnits = UNITS_BY_CATEGORY[cat] || [];
		fromUnit = newUnits[0]?.id || '';
		toUnit = newUnits[1]?.id || newUnits[0]?.id || '';
	}
</script>

<svelte:head>
	<title>Calc - Einheiten</title>
</svelte:head>

<div class="converter-page">
	<!-- Category pills -->
	<div class="flex gap-2 mb-6 overflow-x-auto pb-2">
		{#each UNIT_CATEGORIES.filter((c) => UNITS_BY_CATEGORY[c.id]) as cat}
			<button
				class="shrink-0 px-3 py-1.5 rounded-full text-sm transition-all border
					{selectedCategory === cat.id
					? 'bg-emerald-500 text-white border-emerald-500'
					: 'bg-card border-border text-muted-foreground hover:bg-muted'}"
				onclick={() => selectCategory(cat.id)}
			>
				{cat.label.de}
			</button>
		{/each}
	</div>

	<!-- Converter Card -->
	<div class="p-6 rounded-xl bg-card border border-border space-y-4">
		<!-- From -->
		<div>
			<label class="text-xs text-muted-foreground mb-1 block">Von</label>
			<div class="flex gap-2">
				<input
					type="text"
					inputmode="decimal"
					bind:value={fromValue}
					class="flex-1 h-12 px-3 rounded-lg bg-background border border-border text-foreground font-mono text-xl focus:outline-none focus:border-primary"
				/>
				<select
					bind:value={fromUnit}
					class="h-12 px-3 rounded-lg bg-background border border-border text-foreground"
				>
					{#each units as unit}
						<option value={unit.id}>{unit.symbol} — {unit.name.de}</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- Swap button -->
		<div class="flex justify-center">
			<button
				class="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors text-muted-foreground"
				onclick={swapUnits}
			>
				↕
			</button>
		</div>

		<!-- To -->
		<div>
			<label class="text-xs text-muted-foreground mb-1 block">Nach</label>
			<div class="flex gap-2">
				<div
					class="flex-1 h-12 px-3 rounded-lg bg-muted/30 border border-border flex items-center font-mono text-xl text-foreground"
				>
					{result()}
				</div>
				<select
					bind:value={toUnit}
					class="h-12 px-3 rounded-lg bg-background border border-border text-foreground"
				>
					{#each units as unit}
						<option value={unit.id}>{unit.symbol} — {unit.name.de}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	<!-- Quick reference -->
	{#if fromValue && result()}
		<div
			class="mt-4 p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground text-center font-mono"
		>
			{fromValue}
			{units.find((u: UnitDefinition) => u.id === fromUnit)?.symbol} = {result()}
			{units.find((u: UnitDefinition) => u.id === toUnit)?.symbol}
		</div>
	{/if}
</div>

<style>
	.converter-page {
		max-width: 500px;
		margin: 0 auto;
	}
</style>
