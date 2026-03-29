<script lang="ts">
	import type { FinanceMode } from '@calc/shared';

	let mode = $state<FinanceMode>('compound-interest');

	// Compound Interest
	let principal = $state(10000);
	let rate = $state(5);
	let years = $state(10);
	let compoundsPerYear = $state(12);

	// Loan
	let loanAmount = $state(200000);
	let loanRate = $state(3.5);
	let loanYears = $state(25);

	// Savings
	let monthlyDeposit = $state(200);
	let savingsRate = $state(5);
	let savingsYears = $state(20);
	let initialDeposit = $state(1000);

	// Tip
	let billAmount = $state(50);
	let tipPercent = $state(15);
	let splitCount = $state(2);

	// Compound Interest Result
	let compoundResult = $derived(() => {
		const r = rate / 100 / compoundsPerYear;
		const n = compoundsPerYear * years;
		const total = principal * Math.pow(1 + r, n);
		return { total, interest: total - principal };
	});

	// Loan Result
	let loanResult = $derived(() => {
		const r = loanRate / 100 / 12;
		const n = loanYears * 12;
		const monthly = (loanAmount * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
		const total = monthly * n;
		return { monthly, total, interest: total - loanAmount };
	});

	// Savings Result
	let savingsResult = $derived(() => {
		const r = savingsRate / 100 / 12;
		const n = savingsYears * 12;
		const futureValue =
			initialDeposit * Math.pow(1 + r, n) + monthlyDeposit * ((Math.pow(1 + r, n) - 1) / r);
		const totalDeposited = initialDeposit + monthlyDeposit * n;
		return {
			total: futureValue,
			deposited: totalDeposited,
			interest: futureValue - totalDeposited,
		};
	});

	// Tip Result
	let tipResult = $derived(() => {
		const tip = (billAmount * tipPercent) / 100;
		const total = billAmount + tip;
		const perPerson = total / splitCount;
		return { tip, total, perPerson };
	});

	function fmt(n: number): string {
		return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	const modes: { id: FinanceMode; label: string }[] = [
		{ id: 'compound-interest', label: 'Zinseszins' },
		{ id: 'loan', label: 'Kredit' },
		{ id: 'savings', label: 'Sparplan' },
		{ id: 'tip', label: 'Trinkgeld' },
	];
</script>

<svelte:head>
	<title>Calc - Finanzen</title>
</svelte:head>

<div class="finance-page">
	<!-- Mode tabs -->
	<div class="flex gap-2 mb-6 overflow-x-auto pb-2">
		{#each modes as m}
			<button
				class="shrink-0 px-3 py-1.5 rounded-full text-sm transition-all border
					{mode === m.id
					? 'bg-blue-500 text-white border-blue-500'
					: 'bg-card border-border text-muted-foreground hover:bg-muted'}"
				onclick={() => (mode = m.id)}
			>
				{m.label}
			</button>
		{/each}
	</div>

	<div class="p-6 rounded-xl bg-card border border-border space-y-4">
		{#if mode === 'compound-interest'}
			<h2 class="text-lg font-bold text-foreground">Zinseszinsrechner</h2>
			<label class="block">
				<span class="text-xs text-muted-foreground">Anfangskapital (€)</span>
				<input
					type="number"
					bind:value={principal}
					class="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground font-mono"
				/>
			</label>
			<label class="block">
				<span class="text-xs text-muted-foreground">Zinssatz (% p.a.)</span>
				<input
					type="number"
					step="0.1"
					bind:value={rate}
					class="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground font-mono"
				/>
			</label>
			<label class="block">
				<span class="text-xs text-muted-foreground">Laufzeit (Jahre)</span>
				<input
					type="number"
					bind:value={years}
					class="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground font-mono"
				/>
			</label>
			<label class="block">
				<span class="text-xs text-muted-foreground">Zinsperioden/Jahr</span>
				<select
					bind:value={compoundsPerYear}
					class="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground"
				>
					<option value={1}>Jährlich</option>
					<option value={4}>Vierteljährlich</option>
					<option value={12}>Monatlich</option>
					<option value={365}>Täglich</option>
				</select>
			</label>
			<div class="pt-4 border-t border-border space-y-2">
				<div class="flex justify-between">
					<span class="text-muted-foreground">Endkapital</span><span
						class="font-bold font-mono text-foreground">{fmt(compoundResult().total)} €</span
					>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Zinsen</span><span class="font-mono text-emerald-500"
						>{fmt(compoundResult().interest)} €</span
					>
				</div>
			</div>
		{:else if mode === 'loan'}
			<h2 class="text-lg font-bold text-foreground">Kreditrechner</h2>
			<label class="block">
				<span class="text-xs text-muted-foreground">Darlehensbetrag (€)</span>
				<input
					type="number"
					bind:value={loanAmount}
					class="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground font-mono"
				/>
			</label>
			<label class="block">
				<span class="text-xs text-muted-foreground">Zinssatz (% p.a.)</span>
				<input
					type="number"
					step="0.1"
					bind:value={loanRate}
					class="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground font-mono"
				/>
			</label>
			<label class="block">
				<span class="text-xs text-muted-foreground">Laufzeit (Jahre)</span>
				<input
					type="number"
					bind:value={loanYears}
					class="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground font-mono"
				/>
			</label>
			<div class="pt-4 border-t border-border space-y-2">
				<div class="flex justify-between">
					<span class="text-muted-foreground">Monatliche Rate</span><span
						class="font-bold font-mono text-foreground">{fmt(loanResult().monthly)} €</span
					>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Gesamtkosten</span><span
						class="font-mono text-foreground">{fmt(loanResult().total)} €</span
					>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Zinskosten</span><span class="font-mono text-red-400"
						>{fmt(loanResult().interest)} €</span
					>
				</div>
			</div>
		{:else if mode === 'savings'}
			<h2 class="text-lg font-bold text-foreground">Sparplanrechner</h2>
			<label class="block">
				<span class="text-xs text-muted-foreground">Anfangseinlage (€)</span>
				<input
					type="number"
					bind:value={initialDeposit}
					class="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground font-mono"
				/>
			</label>
			<label class="block">
				<span class="text-xs text-muted-foreground">Monatliche Sparrate (€)</span>
				<input
					type="number"
					bind:value={monthlyDeposit}
					class="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground font-mono"
				/>
			</label>
			<label class="block">
				<span class="text-xs text-muted-foreground">Zinssatz (% p.a.)</span>
				<input
					type="number"
					step="0.1"
					bind:value={savingsRate}
					class="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground font-mono"
				/>
			</label>
			<label class="block">
				<span class="text-xs text-muted-foreground">Laufzeit (Jahre)</span>
				<input
					type="number"
					bind:value={savingsYears}
					class="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground font-mono"
				/>
			</label>
			<div class="pt-4 border-t border-border space-y-2">
				<div class="flex justify-between">
					<span class="text-muted-foreground">Endkapital</span><span
						class="font-bold font-mono text-foreground">{fmt(savingsResult().total)} €</span
					>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Eingezahlt</span><span
						class="font-mono text-foreground">{fmt(savingsResult().deposited)} €</span
					>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Zinsen</span><span class="font-mono text-emerald-500"
						>{fmt(savingsResult().interest)} €</span
					>
				</div>
			</div>
		{:else if mode === 'tip'}
			<h2 class="text-lg font-bold text-foreground">Trinkgeld & Split</h2>
			<label class="block">
				<span class="text-xs text-muted-foreground">Rechnungsbetrag (€)</span>
				<input
					type="number"
					bind:value={billAmount}
					class="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground font-mono"
				/>
			</label>
			<label class="block">
				<span class="text-xs text-muted-foreground">Trinkgeld (%)</span>
				<div class="flex gap-2 mt-1">
					{#each [10, 15, 20, 25] as pct}
						<button
							class="flex-1 h-10 rounded-lg text-sm transition-all border {tipPercent === pct
								? 'bg-amber-500 text-white border-amber-500'
								: 'bg-card border-border text-muted-foreground hover:bg-muted'}"
							onclick={() => (tipPercent = pct)}>{pct}%</button
						>
					{/each}
				</div>
				<input
					type="number"
					bind:value={tipPercent}
					class="mt-2 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground font-mono"
				/>
			</label>
			<label class="block">
				<span class="text-xs text-muted-foreground">Aufteilen auf (Personen)</span>
				<input
					type="number"
					min="1"
					bind:value={splitCount}
					class="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground font-mono"
				/>
			</label>
			<div class="pt-4 border-t border-border space-y-2">
				<div class="flex justify-between">
					<span class="text-muted-foreground">Trinkgeld</span><span
						class="font-mono text-foreground">{fmt(tipResult().tip)} €</span
					>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Gesamt</span><span
						class="font-bold font-mono text-foreground">{fmt(tipResult().total)} €</span
					>
				</div>
				{#if splitCount > 1}
					<div class="flex justify-between">
						<span class="text-muted-foreground">Pro Person</span><span
							class="font-bold font-mono text-amber-500">{fmt(tipResult().perPerson)} €</span
						>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.finance-page {
		max-width: 500px;
		margin: 0 auto;
	}
</style>
