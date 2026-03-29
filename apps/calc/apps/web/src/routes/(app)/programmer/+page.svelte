<script lang="ts">
	import { convertBase } from '$lib/engine/evaluate';
	import type { NumberBase } from '@calc/shared';

	let inputValue = $state('0');
	let activeBase = $state<NumberBase>('dec');
	let error = $state('');

	const bases: { id: NumberBase; label: string; radix: number }[] = [
		{ id: 'hex', label: 'HEX', radix: 16 },
		{ id: 'dec', label: 'DEC', radix: 10 },
		{ id: 'oct', label: 'OCT', radix: 8 },
		{ id: 'bin', label: 'BIN', radix: 2 },
	];

	function getRadix(base: NumberBase): number {
		return bases.find((b) => b.id === base)!.radix;
	}

	function getConverted(targetBase: NumberBase): string {
		if (!inputValue || inputValue === '0') return '0';
		try {
			return convertBase(inputValue, getRadix(activeBase), getRadix(targetBase));
		} catch {
			return '—';
		}
	}

	function appendDigit(digit: string) {
		error = '';
		if (inputValue === '0') {
			inputValue = digit;
		} else {
			inputValue += digit;
		}
	}

	function clear() {
		inputValue = '0';
		error = '';
	}

	function backspace() {
		inputValue = inputValue.length > 1 ? inputValue.slice(0, -1) : '0';
	}

	function switchBase(newBase: NumberBase) {
		try {
			if (inputValue !== '0') {
				inputValue = convertBase(inputValue, getRadix(activeBase), getRadix(newBase));
			}
		} catch {
			inputValue = '0';
		}
		activeBase = newBase;
	}

	// Available digits per base
	function isDigitValid(digit: string): boolean {
		const val = parseInt(digit, 16);
		return val < getRadix(activeBase);
	}

	const hexDigits = [
		'0',
		'1',
		'2',
		'3',
		'4',
		'5',
		'6',
		'7',
		'8',
		'9',
		'A',
		'B',
		'C',
		'D',
		'E',
		'F',
	];
</script>

<svelte:head>
	<title>Calc - Programmierer</title>
</svelte:head>

<div class="programmer-page">
	<!-- Base selector -->
	<div class="flex gap-2 mb-4">
		{#each bases as base}
			<button
				class="flex-1 py-2 rounded-lg text-sm font-medium transition-all border {activeBase ===
				base.id
					? 'bg-cyan-500 text-white border-cyan-500'
					: 'bg-card border-border text-muted-foreground hover:bg-muted'}"
				onclick={() => switchBase(base.id)}
			>
				{base.label}
			</button>
		{/each}
	</div>

	<!-- Display all bases -->
	<div class="space-y-1 mb-6 p-4 rounded-xl bg-card border border-border">
		{#each bases as base}
			<div class="flex items-center gap-3 py-1">
				<span class="text-xs font-medium text-muted-foreground w-8">{base.label}</span>
				<span
					class="font-mono text-sm flex-1 truncate {activeBase === base.id
						? 'text-foreground font-bold text-lg'
						: 'text-muted-foreground'}"
				>
					{activeBase === base.id ? inputValue : getConverted(base.id)}
				</span>
			</div>
		{/each}
		{#if error}
			<div class="text-red-400 text-xs mt-1">{error}</div>
		{/if}
	</div>

	<!-- Keypad -->
	<div class="grid grid-cols-4 gap-2">
		{#each hexDigits as digit}
			<button
				class="h-12 rounded-lg border border-border font-mono text-sm transition-all active:scale-95
					{isDigitValid(digit)
					? 'bg-card text-foreground hover:bg-muted cursor-pointer'
					: 'bg-muted/30 text-muted-foreground/30 cursor-not-allowed'}"
				onclick={() => isDigitValid(digit) && appendDigit(digit)}
				disabled={!isDigitValid(digit)}
			>
				{digit}
			</button>
		{/each}
	</div>

	<div class="flex gap-2 mt-3">
		<button
			class="flex-1 h-10 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
			onclick={clear}>C</button
		>
		<button
			class="flex-1 h-10 rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted"
			onclick={backspace}>← DEL</button
		>
	</div>

	<!-- Bit info -->
	{#if activeBase === 'dec' && inputValue !== '0'}
		{@const num = parseInt(inputValue, 10)}
		{#if !isNaN(num)}
			<div class="mt-4 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
				<div class="font-mono">
					{num} = 0x{num.toString(16).toUpperCase()} = 0b{num.toString(2)}
				</div>
				<div class="mt-1">
					Bits: {num.toString(2).length} | Bytes: {Math.ceil(num.toString(2).length / 8)}
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.programmer-page {
		max-width: 400px;
		margin: 0 auto;
	}
</style>
