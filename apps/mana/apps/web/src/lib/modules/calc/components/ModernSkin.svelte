<script lang="ts">
	import type { CalcSkinProps } from './types';

	let {
		expression,
		display,
		error,
		copied,
		onButton,
		onClear,
		onBackspace,
		onEquals,
		onCopy,
	}: CalcSkinProps = $props();

	const buttons = [
		['C', '(', ')', '%'],
		['7', '8', '9', '/'],
		['4', '5', '6', '*'],
		['1', '2', '3', '-'],
		['0', '.', '=', '+'],
	];

	function getButtonClass(btn: string): string {
		if (btn === '=') return 'bg-pink-500 text-white hover:bg-pink-600 font-bold text-xl';
		if (btn === 'C') return 'bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold';
		if (['+', '-', '*', '/', '%', '(', ')'].includes(btn))
			return 'bg-muted text-foreground hover:bg-muted/80 font-medium';
		return 'bg-card text-foreground hover:bg-card/80 font-medium';
	}

	function handleButton(btn: string) {
		if (btn === 'C') onClear();
		else if (btn === '=') onEquals();
		else onButton(btn);
	}
</script>

<div class="modern-skin">
	<div class="display rounded-xl bg-card border border-border p-4 mb-4">
		<div class="text-sm text-muted-foreground min-h-[1.5rem] font-mono truncate">
			{expression || ' '}
		</div>
		<div class="flex items-end gap-2">
			<div
				class="flex-1 text-4xl font-bold text-foreground font-mono text-right tabular-nums truncate"
				class:text-red-400={!!error}
			>
				{error || display}
			</div>
			{#if display !== '0' && !error}
				<button
					class="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-xs"
					onclick={onCopy}
					title="Kopieren"
				>
					{copied ? '✓' : '⎘'}
				</button>
			{/if}
		</div>
	</div>

	<div class="grid grid-cols-4 gap-2">
		{#each buttons as row}
			{#each row as btn}
				<button
					class="h-14 rounded-xl border border-border transition-[transform,colors,box-shadow] active:scale-95 text-lg {getButtonClass(
						btn
					)}"
					onclick={() => handleButton(btn)}
				>
					{btn === '/' ? '÷' : btn === '*' ? '×' : btn}
				</button>
			{/each}
		{/each}
	</div>

	<button
		class="mt-2 w-full h-10 rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted transition-colors text-sm"
		onclick={onBackspace}
	>
		← Löschen
	</button>
</div>
