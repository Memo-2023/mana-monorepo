<script lang="ts">
	import { getContext } from 'svelte';
	import { evaluate, formatResult } from '$lib/engine/evaluate';
	import { calculationsStore } from '$lib/stores/calculations.svelte';
	import { CALCULATOR_SKINS, SCIENTIFIC_CONSTANTS } from '@calc/shared/constants';
	import type { CalculatorSkin, Calculation } from '@calc/shared';
	import { ModernSkin, HP35Skin, CasioSkin, TI84Skin, MinimalSkin } from '$lib/components/skins';

	const allCalculations = getContext<{ value: Calculation[] }>('calculations');

	let expression = $state('');
	let display = $state('0');
	let hasResult = $state(false);
	let error = $state('');
	let copied = $state(false);
	let angleMode = $state<'deg' | 'rad'>('rad');
	let showExtraKeys = $state(true);

	// Skin state
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

	async function copyToClipboard() {
		if (display === '0' || error) return;
		try {
			await navigator.clipboard.writeText(display);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch {}
	}

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
				skin: activeSkin,
			});
			display = formatted;
			hasResult = true;
			error = '';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler';
		}
	}

	let recentHistory = $derived(
		allCalculations.value.filter((c) => c.mode === 'scientific').slice(0, 8)
	);

	let skinProps = $derived({
		expression,
		display,
		error,
		copied,
		onButton: append,
		onClear: clear,
		onBackspace: backspace,
		onEquals: calculate,
		onCopy: copyToClipboard,
	});

	const sciExtraButtons = [
		['sin(', 'cos(', 'tan(', 'π'],
		['asin(', 'acos(', 'atan(', 'e'],
		['log(', 'ln(', 'sqrt(', '^'],
	];

	function getSciButtonClass(btn: string): string {
		if (['sin(', 'cos(', 'tan(', 'asin(', 'acos(', 'atan(', 'log(', 'ln(', 'sqrt('].includes(btn))
			return 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 text-xs';
		return 'bg-muted text-foreground hover:bg-muted/80';
	}
</script>

<svelte:head>
	<title>Calc - Wissenschaftlich</title>
</svelte:head>

<div class="scientific-page">
	<div class="calculator-column">
		<!-- Skin picker + angle mode -->
		<div class="flex items-center justify-between mb-3 gap-2">
			<button
				class="skin-toggle text-xs px-3 py-1.5 rounded-full border transition-all
					{showSkinPicker
					? 'bg-pink-500 text-white border-pink-500'
					: 'bg-card border-border text-muted-foreground hover:bg-muted'}"
				onclick={() => (showSkinPicker = !showSkinPicker)}
			>
				🎨 {CALCULATOR_SKINS.find((s) => s.id === activeSkin)?.label || 'Modern'}
			</button>
			<div class="flex gap-1">
				<button
					class="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/80"
					onclick={() => (angleMode = angleMode === 'rad' ? 'deg' : 'rad')}
				>
					{angleMode.toUpperCase()}
				</button>
				<button
					class="text-xs px-2 py-1 rounded transition-all {showExtraKeys
						? 'bg-violet-500 text-white'
						: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
					onclick={() => (showExtraKeys = !showExtraKeys)}
				>
					f(x)
				</button>
			</div>
		</div>

		{#if showSkinPicker}
			<div class="skin-picker mb-4 p-3 rounded-xl bg-card border border-border">
				<div class="grid grid-cols-5 gap-2">
					{#each CALCULATOR_SKINS as skin}
						<button
							class="skin-option p-2 rounded-lg text-center transition-all border
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

		<!-- Scientific extra keys (above the skin) -->
		{#if showExtraKeys}
			<div class="mb-3 space-y-1.5">
				<!-- Constants -->
				<div class="flex gap-1 overflow-x-auto pb-1">
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

				<!-- Function buttons -->
				<div class="grid grid-cols-4 gap-1.5">
					{#each sciExtraButtons as row}
						{#each row as btn}
							<button
								class="h-9 rounded-lg border border-border transition-all active:scale-95 {getSciButtonClass(
									btn
								)}"
								onclick={() => append(btn)}
							>
								{btn}
							</button>
						{/each}
					{/each}
				</div>
			</div>
		{/if}

		<!-- Active Skin (handles standard buttons: 0-9, +-*/%, =, C, backspace) -->
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
		max-width: 750px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr 180px;
		gap: 2rem;
		align-items: start;
	}

	.calculator-column {
		max-width: 400px;
	}

	@media (max-width: 640px) {
		.scientific-page {
			grid-template-columns: 1fr;
		}
		.calculator-column {
			max-width: 100%;
		}
	}
</style>
