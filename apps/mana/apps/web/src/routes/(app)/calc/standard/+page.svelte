<script lang="ts">
	import { evaluate, formatResult } from '$lib/modules/calc/engine/evaluate';
	import { calculationsStore } from '$lib/modules/calc/stores/calculations.svelte';
	import { useAllCalculations } from '$lib/modules/calc/queries';
	import { CALCULATOR_SKINS } from '@calc/shared/constants';
	import type { CalculatorSkin } from '@calc/shared';
	import {
		ModernSkin,
		HP35Skin,
		CasioSkin,
		TI84Skin,
		MinimalSkin,
	} from '$lib/modules/calc/components';

	const allCalculations = useAllCalculations();

	let expression = $state('');
	let display = $state('0');
	let hasResult = $state(false);
	let error = $state('');
	let copied = $state(false);

	async function copyToClipboard() {
		if (display === '0' || error) return;
		try {
			await navigator.clipboard.writeText(display);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch {}
	}

	let activeSkin = $state<CalculatorSkin>('modern');
	let showSkinPicker = $state(false);

	if (typeof localStorage !== 'undefined') {
		const saved = localStorage.getItem('calc-skin');
		if (saved && CALCULATOR_SKINS.some((s) => s.id === saved)) {
			activeSkin = saved as CalculatorSkin;
		}
	}

	function setSkin(skin: CalculatorSkin) {
		activeSkin = skin;
		showSkinPicker = false;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('calc-skin', skin);
		}
	}

	function appendToExpression(char: string) {
		if (hasResult) {
			if (/[0-9.]/.test(char)) {
				expression = '';
				display = '';
				hasResult = false;
			} else {
				expression = display;
				hasResult = false;
			}
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
				mode: 'standard',
				expression: expression,
				result: formatted,
				skin: activeSkin,
			});

			display = formatted;
			hasResult = true;
			error = '';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler';
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
		if (event.metaKey || event.ctrlKey) return;

		if (/^[0-9.]$/.test(event.key)) {
			event.preventDefault();
			appendToExpression(event.key);
		} else if (['+', '-', '*', '/', '%', '^'].includes(event.key)) {
			event.preventDefault();
			appendToExpression(event.key);
		} else if (event.key === '(' || event.key === ')') {
			event.preventDefault();
			appendToExpression(event.key);
		} else if (event.key === 'Enter' || event.key === '=') {
			event.preventDefault();
			calculate();
		} else if (event.key === 'Backspace') {
			event.preventDefault();
			backspace();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			if (showSkinPicker) showSkinPicker = false;
			else clear();
		}
	}

	let recentHistory = $derived(
		($allCalculations ?? []).filter((c) => c.mode === 'standard').slice(0, 10)
	);

	let skinProps = $derived({
		expression,
		display,
		error,
		copied,
		onButton: appendToExpression,
		onClear: clear,
		onBackspace: backspace,
		onEquals: calculate,
		onCopy: copyToClipboard,
	});
</script>

<svelte:head>
	<title>Calc - Standard | Mana</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="calculator-page">
	<div class="calculator-column">
		<!-- Skin picker toggle -->
		<div class="mb-3 flex items-center justify-between">
			<button
				class="text-xs rounded-full border px-3 py-1.5 transition-all
					{showSkinPicker
					? 'border-pink-500 bg-pink-500 text-white'
					: 'border-border bg-card text-muted-foreground hover:bg-muted'}"
				onclick={() => (showSkinPicker = !showSkinPicker)}
			>
				🎨 {CALCULATOR_SKINS.find((s) => s.id === activeSkin)?.label || 'Modern'}
				{#if CALCULATOR_SKINS.find((s) => s.id === activeSkin)?.year}
					<span class="opacity-60">({CALCULATOR_SKINS.find((s) => s.id === activeSkin)?.year})</span
					>
				{/if}
			</button>
		</div>

		<!-- Skin picker panel -->
		{#if showSkinPicker}
			<div class="mb-4 rounded-xl border border-border bg-card p-3">
				<div class="grid grid-cols-5 gap-2">
					{#each CALCULATOR_SKINS as skin}
						<button
							class="rounded-lg border p-2 text-center transition-all
								{activeSkin === skin.id ? 'border-pink-500 bg-pink-500/10' : 'border-transparent hover:bg-muted'}"
							onclick={() => setSkin(skin.id)}
						>
							<div class="text-sm font-medium text-foreground">{skin.label}</div>
							{#if skin.year}
								<div class="text-xs text-muted-foreground">{skin.year}</div>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Active Skin -->
		{#if activeSkin === 'modern'}
			<ModernSkin {...skinProps} />
		{:else if activeSkin === 'hp35'}
			<HP35Skin {...skinProps} />
		{:else if activeSkin === 'casio-fx'}
			<CasioSkin {...skinProps} />
		{:else if activeSkin === 'ti84'}
			<TI84Skin {...skinProps} />
		{:else if activeSkin === 'minimal'}
			<MinimalSkin {...skinProps} />
		{/if}
	</div>

	<!-- History Sidebar -->
	<div class="history">
		<h3 class="mb-3 text-sm font-medium text-muted-foreground">Verlauf</h3>
		{#if recentHistory.length === 0}
			<p class="text-xs text-muted-foreground/60">Noch keine Berechnungen</p>
		{:else}
			<div class="space-y-2">
				{#each recentHistory as calc}
					<button
						class="w-full rounded-lg p-2 text-left transition-colors hover:bg-muted/50 group"
						onclick={() => {
							expression = calc.result;
							display = calc.result;
							hasResult = true;
						}}
					>
						<div class="truncate font-mono text-xs text-muted-foreground">{calc.expression}</div>
						<div class="font-mono text-sm font-medium text-foreground">= {calc.result}</div>
					</button>
				{/each}
			</div>
			<button
				class="mt-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
				onclick={() => calculationsStore.clearHistory()}
			>
				Verlauf löschen
			</button>
		{/if}
	</div>
</div>

<style>
	.calculator-page {
		max-width: 750px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr 200px;
		gap: 2rem;
		align-items: start;
	}

	.calculator-column {
		max-width: 400px;
	}

	@media (max-width: 640px) {
		.calculator-page {
			grid-template-columns: 1fr;
		}

		.calculator-column {
			max-width: 100%;
		}

		.history {
			order: -1;
			max-height: 120px;
			overflow-y: auto;
		}
	}
</style>
