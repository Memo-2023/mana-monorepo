<script lang="ts">
	import { getContext } from 'svelte';
	import { evaluate, formatResult } from '$lib/engine/evaluate';
	import { calculationsStore } from '$lib/stores/calculations.svelte';
	import { SCIENTIFIC_CONSTANTS } from '@calc/shared/constants';
	import type { Calculation } from '@calc/shared';

	const allCalculations = getContext<{ value: Calculation[] }>('calculations');

	let expression = $state('');
	let display = $state('0');
	let hasResult = $state(false);
	let error = $state('');
	let angleMode = $state<'deg' | 'rad'>('rad');

	function append(char: string) {
		if (hasResult && /[0-9.]/.test(char)) {
			expression = '';
			display = '';
			hasResult = false;
		} else if (hasResult) {
			expression = display;
			hasResult = false;
		}
		error = '';
		expression += char;
		display = expression;
	}

	function clear() {
		expression = '';
		display = '0';
		hasResult = false;
		error = '';
	}

	function backspace() {
		if (hasResult) {
			clear();
			return;
		}
		expression = expression.slice(0, -1);
		display = expression || '0';
	}

	async function calculate() {
		if (!expression.trim()) return;
		try {
			const result = evaluate(expression);
			const formatted = formatResult(result);
			await calculationsStore.addCalculation({
				mode: 'scientific',
				expression,
				result: formatted,
			});
			display = formatted;
			hasResult = true;
			error = '';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler';
		}
	}

	function handleButton(btn: string) {
		if (btn === 'C') clear();
		else if (btn === '=') calculate();
		else if (btn === 'DEL') backspace();
		else append(btn);
	}

	let recentHistory = $derived(
		allCalculations.value.filter((c) => c.mode === 'scientific').slice(0, 8)
	);

	const sciButtons = [
		['sin(', 'cos(', 'tan(', 'π'],
		['asin(', 'acos(', 'atan(', 'e'],
		['log(', 'ln(', 'sqrt(', '^'],
		['(', ')', '!', '%'],
		['7', '8', '9', '/'],
		['4', '5', '6', '*'],
		['1', '2', '3', '-'],
		['0', '.', '=', '+'],
	];

	function getButtonClass(btn: string): string {
		if (btn === '=') return 'bg-pink-500 text-white hover:bg-pink-600 font-bold';
		if (['sin(', 'cos(', 'tan(', 'asin(', 'acos(', 'atan(', 'log(', 'ln(', 'sqrt('].includes(btn))
			return 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 text-xs';
		if (['π', 'e', '^', '!', '%'].includes(btn))
			return 'bg-muted text-foreground hover:bg-muted/80';
		if (['+', '-', '*', '/', '(', ')'].includes(btn))
			return 'bg-muted text-foreground hover:bg-muted/80';
		return 'bg-card text-foreground hover:bg-card/80';
	}
</script>

<svelte:head>
	<title>Calc - Wissenschaftlich</title>
</svelte:head>

<div class="scientific-page">
	<div class="calculator">
		<div class="display rounded-xl bg-card border border-border p-4 mb-4">
			<div class="flex justify-between items-center mb-1">
				<span class="text-xs text-muted-foreground font-mono truncate flex-1"
					>{expression || ' '}</span
				>
				<button
					class="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground hover:bg-muted/80"
					onclick={() => (angleMode = angleMode === 'rad' ? 'deg' : 'rad')}
				>
					{angleMode.toUpperCase()}
				</button>
			</div>
			<div
				class="text-3xl font-bold text-foreground font-mono text-right tabular-nums truncate"
				class:text-red-400={!!error}
			>
				{error || display}
			</div>
		</div>

		<!-- Constants quick insert -->
		<div class="flex gap-1 mb-3 overflow-x-auto pb-1">
			{#each SCIENTIFIC_CONSTANTS.slice(0, 6) as constant}
				<button
					class="shrink-0 text-xs px-2 py-1 rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
					onclick={() => append(String(constant.value))}
					title={constant.name}
				>
					{constant.symbol}
				</button>
			{/each}
		</div>

		<div class="grid grid-cols-4 gap-1.5">
			{#each sciButtons as row}
				{#each row as btn}
					<button
						class="calc-btn h-12 rounded-lg border border-border transition-all active:scale-95 {getButtonClass(
							btn
						)}"
						onclick={() => handleButton(btn)}
					>
						{btn === '/' ? '÷' : btn === '*' ? '×' : btn}
					</button>
				{/each}
			{/each}
		</div>

		<div class="flex gap-2 mt-2">
			<button
				class="flex-1 h-9 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm"
				onclick={clear}>C</button
			>
			<button
				class="flex-1 h-9 rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted text-sm"
				onclick={backspace}>← DEL</button
			>
		</div>
	</div>

	<!-- History -->
	<div class="history">
		<h3 class="text-sm font-medium text-muted-foreground mb-3">Verlauf</h3>
		{#if recentHistory.length === 0}
			<p class="text-xs text-muted-foreground/60">Noch keine Berechnungen</p>
		{:else}
			<div class="space-y-2">
				{#each recentHistory as calc}
					<button
						class="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors"
						onclick={() => {
							expression = calc.result;
							display = calc.result;
							hasResult = true;
						}}
					>
						<div class="text-xs text-muted-foreground truncate font-mono">{calc.expression}</div>
						<div class="text-sm font-medium text-foreground font-mono">= {calc.result}</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.scientific-page {
		max-width: 700px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr 180px;
		gap: 2rem;
		align-items: start;
	}

	.calculator {
		max-width: 380px;
	}

	@media (max-width: 640px) {
		.scientific-page {
			grid-template-columns: 1fr;
		}
		.calculator {
			max-width: 100%;
		}
	}
</style>
