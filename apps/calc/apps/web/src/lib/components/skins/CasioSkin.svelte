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

	function isOp(btn: string): boolean {
		return ['+', '-', '*', '/', '%', '(', ')'].includes(btn);
	}
</script>

<div class="casio">
	<div class="casio-body">
		<!-- Brand header -->
		<div class="casio-header">
			<span class="casio-brand">CASIO</span>
			<span class="casio-model">fx-82</span>
		</div>

		<!-- Solar panel strip -->
		<div class="casio-solar">
			{#each Array(8) as _}
				<div class="casio-solar-cell"></div>
			{/each}
		</div>

		<!-- LCD Display (green-gray) -->
		<div class="casio-display">
			<div class="casio-expression">{expression || ' '}</div>
			<div style="display: flex; align-items: flex-end; gap: 4px;">
				<div class="casio-result" style="flex: 1;" class:casio-error={!!error}>
					{error || display}
				</div>
				{#if display !== '0' && !error}
					<button class="casio-copy" onclick={onCopy} title="Kopieren">
						{copied ? '✓' : '⎘'}
					</button>
				{/if}
			</div>
		</div>

		<!-- Keypad -->
		<div class="casio-keypad">
			{#each buttons as row}
				{#each row as btn}
					<button
						class="casio-btn"
						class:casio-btn-eq={btn === '='}
						class:casio-btn-clear={btn === 'C'}
						class:casio-btn-op={isOp(btn)}
						class:casio-btn-num={!isOp(btn) && btn !== '=' && btn !== 'C'}
						onclick={() => handleButton(btn)}
					>
						{btn === '/' ? '÷' : btn === '*' ? '×' : btn}
					</button>
				{/each}
			{/each}
		</div>

		<button class="casio-backspace" onclick={onBackspace}>DEL</button>

		<!-- Footer -->
		<div class="casio-footer">
			<span>S-V.P.A.M.</span>
		</div>
	</div>
</div>

<style>
	.casio {
		display: flex;
		justify-content: center;
	}

	.casio-body {
		width: 310px;
		background: linear-gradient(180deg, #e8e8e8 0%, #d0d0d0 30%, #c0c0c0 100%);
		border-radius: 16px 16px 20px 20px;
		padding: 16px 14px 20px;
		box-shadow:
			0 12px 40px rgba(0, 0, 0, 0.25),
			inset 0 1px 0 rgba(255, 255, 255, 0.6),
			0 0 0 1px #aaa;
	}

	.casio-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 8px;
		padding: 0 4px;
	}

	.casio-brand {
		font-family: 'Arial', sans-serif;
		font-size: 16px;
		font-weight: bold;
		color: #333;
		letter-spacing: 2px;
	}

	.casio-model {
		font-family: 'Arial', sans-serif;
		font-size: 12px;
		color: #666;
		font-style: italic;
	}

	.casio-solar {
		display: flex;
		gap: 2px;
		margin-bottom: 8px;
		padding: 0 4px;
	}

	.casio-solar-cell {
		flex: 1;
		height: 8px;
		background: linear-gradient(180deg, #2a2a4a, #1a1a3a);
		border-radius: 1px;
	}

	.casio-display {
		background: #b8c8a0;
		border: 2px solid #8a9a70;
		border-radius: 6px;
		padding: 10px 14px;
		margin-bottom: 14px;
		min-height: 68px;
		box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.15);
	}

	.casio-expression {
		font-family: 'Courier New', monospace;
		font-size: 11px;
		color: #3a4a2a;
		opacity: 0.7;
		min-height: 14px;
		text-align: right;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.casio-result {
		font-family: 'Courier New', monospace;
		font-size: 28px;
		font-weight: bold;
		color: #1a2a0a;
		text-align: right;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		letter-spacing: 1px;
	}

	.casio-error {
		color: #8a2020;
		font-size: 16px;
	}

	.casio-copy {
		background: none;
		border: none;
		color: #3a4a2a;
		opacity: 0.4;
		font-size: 14px;
		cursor: pointer;
		padding: 2px 4px;
	}

	.casio-copy:hover {
		opacity: 0.8;
	}

	.casio-keypad {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 5px;
	}

	.casio-btn {
		height: 44px;
		border: none;
		border-radius: 4px;
		font-family: 'Arial', sans-serif;
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.08s;
		position: relative;
		top: 0;
	}

	.casio-btn:active {
		top: 1px;
		filter: brightness(0.9);
	}

	.casio-btn-num {
		background: #f0f0f0;
		color: #222;
		box-shadow:
			0 2px 0 #bbb,
			0 3px 6px rgba(0, 0, 0, 0.15);
	}

	.casio-btn-op {
		background: #e0e0e0;
		color: #333;
		box-shadow:
			0 2px 0 #aaa,
			0 3px 6px rgba(0, 0, 0, 0.15);
	}

	.casio-btn-eq {
		background: #3366cc;
		color: white;
		font-size: 18px;
		box-shadow:
			0 2px 0 #2244aa,
			0 3px 6px rgba(0, 0, 0, 0.2);
	}

	.casio-btn-clear {
		background: #cc3333;
		color: white;
		box-shadow:
			0 2px 0 #992222,
			0 3px 6px rgba(0, 0, 0, 0.2);
	}

	.casio-backspace {
		width: 100%;
		margin-top: 6px;
		height: 30px;
		border: none;
		border-radius: 4px;
		font-family: 'Arial', sans-serif;
		font-size: 11px;
		font-weight: 600;
		cursor: pointer;
		background: #d8d8d8;
		color: #555;
		box-shadow: 0 1px 0 #bbb;
	}

	.casio-backspace:hover {
		background: #ccc;
	}

	.casio-footer {
		text-align: right;
		margin-top: 10px;
		font-family: 'Arial', sans-serif;
		font-size: 8px;
		color: #999;
		letter-spacing: 1px;
		padding-right: 4px;
	}
</style>
