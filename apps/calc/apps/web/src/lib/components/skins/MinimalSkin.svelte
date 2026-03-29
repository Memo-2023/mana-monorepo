<script lang="ts">
	import type { CalcSkinProps } from './types';

	let { expression, display, error, onButton, onClear, onBackspace, onEquals }: CalcSkinProps =
		$props();

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
		<div class="minimal-result" class:minimal-error={!!error}>
			{error || display}
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
		color: hsl(var(--muted-foreground));
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
		color: hsl(var(--foreground));
		letter-spacing: -1px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1.1;
	}

	.minimal-error {
		color: hsl(var(--destructive, 0 84% 60%));
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
		color: hsl(var(--foreground));
	}

	.minimal-btn:hover {
		background: hsl(var(--muted));
	}

	.minimal-btn:active {
		background: hsl(var(--muted));
		opacity: 0.7;
	}

	.minimal-btn-eq {
		background: hsl(var(--foreground));
		color: hsl(var(--background));
		font-weight: 400;
	}

	.minimal-btn-eq:hover {
		background: hsl(var(--foreground));
		opacity: 0.8;
	}

	.minimal-btn-clear {
		color: hsl(var(--destructive, 0 84% 60%));
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
		color: hsl(var(--muted-foreground));
	}

	.minimal-backspace:hover {
		background: hsl(var(--muted));
	}
</style>
