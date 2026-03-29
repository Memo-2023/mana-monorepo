<script lang="ts">
	import type { CalcSkinProps } from './types';

	let { expression, display, error, onButton, onClear, onBackspace, onEquals }: CalcSkinProps =
		$props();

	// HP-35 had a distinctive layout - we adapt it for standard calc use
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

<div class="hp35">
	<!-- Device frame -->
	<div class="hp35-body">
		<!-- HP Logo -->
		<div class="hp35-logo">
			<span class="hp35-hp">HP</span>
			<span class="hp35-model">35</span>
		</div>

		<!-- LED Display (red on dark) -->
		<div class="hp35-display">
			<div class="hp35-expression">{expression || ' '}</div>
			<div class="hp35-result" class:hp35-error={!!error}>
				{error || display}
			</div>
		</div>

		<!-- Keypad -->
		<div class="hp35-keypad">
			{#each buttons as row}
				{#each row as btn}
					<button
						class="hp35-btn"
						class:hp35-btn-eq={btn === '='}
						class:hp35-btn-clear={btn === 'C'}
						class:hp35-btn-op={isOp(btn)}
						onclick={() => handleButton(btn)}
					>
						{btn === '/' ? '÷' : btn === '*' ? '×' : btn}
					</button>
				{/each}
			{/each}
		</div>

		<!-- Backspace -->
		<button class="hp35-backspace" onclick={onBackspace}> CLR ← </button>

		<!-- Footer -->
		<div class="hp35-footer">
			<span>HEWLETT · PACKARD</span>
		</div>
	</div>
</div>

<style>
	.hp35 {
		display: flex;
		justify-content: center;
	}

	.hp35-body {
		width: 320px;
		background: linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
		border-radius: 20px 20px 24px 24px;
		padding: 20px 16px 24px;
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.6),
			inset 0 1px 0 rgba(255, 255, 255, 0.08),
			0 0 0 2px #0a0a1a;
		position: relative;
	}

	.hp35-logo {
		text-align: center;
		margin-bottom: 12px;
		font-family: 'Courier New', monospace;
	}

	.hp35-hp {
		font-size: 18px;
		font-weight: bold;
		color: #c4c4c4;
		letter-spacing: 4px;
	}

	.hp35-model {
		font-size: 14px;
		color: #888;
		margin-left: 4px;
	}

	.hp35-display {
		background: #0a0a0a;
		border: 2px solid #333;
		border-radius: 8px;
		padding: 12px 16px;
		margin-bottom: 16px;
		min-height: 72px;
		box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.8);
	}

	.hp35-expression {
		font-family: 'Courier New', monospace;
		font-size: 11px;
		color: #ff3333;
		opacity: 0.6;
		min-height: 16px;
		text-align: right;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.hp35-result {
		font-family: 'Courier New', monospace;
		font-size: 28px;
		font-weight: bold;
		color: #ff2200;
		text-align: right;
		text-shadow: 0 0 12px rgba(255, 34, 0, 0.6);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		letter-spacing: 2px;
	}

	.hp35-error {
		color: #ff6644;
		font-size: 18px;
	}

	.hp35-keypad {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 6px;
	}

	.hp35-btn {
		height: 48px;
		border: none;
		border-radius: 6px;
		font-family: 'Courier New', monospace;
		font-size: 16px;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.1s;
		background: #2a2a4a;
		color: #e0e0e0;
		box-shadow:
			0 3px 0 #1a1a30,
			0 4px 8px rgba(0, 0, 0, 0.3);
		position: relative;
		top: 0;
	}

	.hp35-btn:active {
		top: 2px;
		box-shadow:
			0 1px 0 #1a1a30,
			0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.hp35-btn-eq {
		background: #c63030;
		color: white;
		box-shadow:
			0 3px 0 #8a2020,
			0 4px 8px rgba(0, 0, 0, 0.3);
	}

	.hp35-btn-eq:active {
		box-shadow:
			0 1px 0 #8a2020,
			0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.hp35-btn-clear {
		background: #4a3020;
		color: #ff9966;
		box-shadow:
			0 3px 0 #2a1810,
			0 4px 8px rgba(0, 0, 0, 0.3);
	}

	.hp35-btn-op {
		background: #3a3a5a;
		color: #aaccff;
	}

	.hp35-backspace {
		width: 100%;
		margin-top: 8px;
		height: 32px;
		border: none;
		border-radius: 4px;
		font-family: 'Courier New', monospace;
		font-size: 11px;
		cursor: pointer;
		background: #1a1a30;
		color: #888;
		letter-spacing: 1px;
	}

	.hp35-backspace:hover {
		color: #aaa;
	}

	.hp35-footer {
		text-align: center;
		margin-top: 16px;
		font-family: 'Courier New', monospace;
		font-size: 9px;
		color: #555;
		letter-spacing: 3px;
		text-transform: uppercase;
	}
</style>
