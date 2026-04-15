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

	function handleButton(btn: string) {
		if (btn === 'C') onClear();
		else if (btn === '=') onEquals();
		else onButton(btn);
	}
</script>

<div class="minimal">
	<!-- Display: just big text -->
	<div class="minimal-display">
		<div class="minimal-expression">{expression || ' '}</div>
		<div style="display: flex; align-items: flex-end; gap: 4px; justify-content: flex-end;">
			<div class="minimal-result" style="flex: 1;" class:minimal-error={!!error}>
				{error || display}
			</div>
			{#if display !== '0' && !error}
				<button class="minimal-copy" onclick={onCopy}>
					{copied ? '✓' : '⎘'}
				</button>
			{/if}
		</div>
	</div>

	<!-- Buttons: clean, borderless -->
	<div class="minimal-grid">
		{#each buttons as row}
			{#each row as btn}
				<button
					class="minimal-btn"
					class:minimal-btn-eq={btn === '='}
					class:minimal-btn-clear={btn === 'C'}
					onclick={() => handleButton(btn)}
				>
					{btn === '/' ? '÷' : btn === '*' ? '×' : btn}
				</button>
			{/each}
		{/each}
	</div>

	<button class="minimal-backspace" onclick={onBackspace}>←</button>
</div>

<style>
	.minimal {
		max-width: 300px;
		margin: 0 auto;
	}

	.minimal-display {
		padding: 24px 8px 16px;
		text-align: right;
	}

	.minimal-expression {
		font-family: system-ui, sans-serif;
		font-size: 14px;
		color: hsl(var(--color-muted-foreground));
		opacity: 0.5;
		min-height: 20px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.minimal-result {
		font-family: system-ui, sans-serif;
		font-size: 48px;
		font-weight: 200;
		color: hsl(var(--color-foreground));
		letter-spacing: -1px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1.1;
	}

	.minimal-error {
		color: hsl(var(--color-error, 0 84% 60%));
		font-size: 24px;
	}

	.minimal-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 2px;
	}

	.minimal-btn {
		height: 56px;
		border: none;
		border-radius: 50%;
		font-family: system-ui, sans-serif;
		font-size: 20px;
		font-weight: 300;
		cursor: pointer;
		transition: background 0.15s;
		background: transparent;
		color: hsl(var(--color-foreground));
	}

	.minimal-btn:hover {
		background: hsl(var(--color-muted));
	}

	.minimal-btn:active {
		background: hsl(var(--color-muted));
		opacity: 0.7;
	}

	.minimal-btn-eq {
		background: hsl(var(--color-foreground));
		color: hsl(var(--color-background));
		font-weight: 400;
	}

	.minimal-btn-eq:hover {
		background: hsl(var(--color-foreground));
		opacity: 0.8;
	}

	.minimal-btn-clear {
		color: hsl(var(--color-error, 0 84% 60%));
		font-weight: 400;
	}

	.minimal-backspace {
		width: 100%;
		margin-top: 4px;
		height: 36px;
		border: none;
		border-radius: 18px;
		font-size: 16px;
		cursor: pointer;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
	}

	.minimal-copy {
		background: none;
		border: none;
		color: hsl(var(--color-muted-foreground));
		opacity: 0.3;
		font-size: 16px;
		cursor: pointer;
		padding: 2px;
	}

	.minimal-copy:hover {
		opacity: 0.7;
	}

	.minimal-backspace:hover {
		background: hsl(var(--color-muted));
	}
</style>
