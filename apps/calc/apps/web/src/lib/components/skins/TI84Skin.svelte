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

	function isOp(btn: string): boolean {
		return ['+', '-', '*', '/', '%', '(', ')'].includes(btn);
	}
</script>

<div class="ti84">
	<div class="ti84-body">
		<!-- Brand -->
		<div class="ti84-header">
			<span class="ti84-brand">TEXAS INSTRUMENTS</span>
			<span class="ti84-model">TI-84 Plus</span>
		</div>

		<!-- Screen (blue LCD with pixel feel) -->
		<div class="ti84-screen">
			<div class="ti84-screen-inner">
				<div class="ti84-expression">{expression || ' '}</div>
				<div class="ti84-result" class:ti84-error={!!error}>
					{error || display}
				</div>
			</div>
		</div>

		<!-- Navigation cluster -->
		<div class="ti84-nav">
			<button class="ti84-nav-btn" onclick={onBackspace}>DEL</button>
			<button class="ti84-nav-btn ti84-nav-mode">2ND</button>
		</div>

		<!-- Keypad -->
		<div class="ti84-keypad">
			{#each buttons as row}
				{#each row as btn}
					<button
						class="ti84-btn"
						class:ti84-btn-eq={btn === '='}
						class:ti84-btn-clear={btn === 'C'}
						class:ti84-btn-op={isOp(btn)}
						onclick={() => handleButton(btn)}
					>
						{btn === '/' ? '÷' : btn === '*' ? '×' : btn}
					</button>
				{/each}
			{/each}
		</div>

		<div class="ti84-footer">
			<div class="ti84-usb"></div>
		</div>
	</div>
</div>

<style>
	.ti84 {
		display: flex;
		justify-content: center;
	}

	.ti84-body {
		width: 320px;
		background: linear-gradient(180deg, #1a1a1a 0%, #222 50%, #1a1a1a 100%);
		border-radius: 18px 18px 22px 22px;
		padding: 16px;
		box-shadow:
			0 16px 50px rgba(0, 0, 0, 0.5),
			inset 0 1px 0 rgba(255, 255, 255, 0.05),
			0 0 0 2px #111;
	}

	.ti84-header {
		text-align: center;
		margin-bottom: 10px;
	}

	.ti84-brand {
		display: block;
		font-family: 'Arial', sans-serif;
		font-size: 9px;
		color: #888;
		letter-spacing: 3px;
		text-transform: uppercase;
	}

	.ti84-model {
		font-family: 'Arial', sans-serif;
		font-size: 13px;
		font-weight: bold;
		color: #ccc;
		letter-spacing: 1px;
	}

	.ti84-screen {
		background: #1a2a1a;
		border: 3px solid #333;
		border-radius: 8px;
		padding: 3px;
		margin-bottom: 12px;
		box-shadow:
			inset 0 2px 10px rgba(0, 0, 0, 0.8),
			0 1px 0 rgba(255, 255, 255, 0.05);
	}

	.ti84-screen-inner {
		background: #2a4a3a;
		border-radius: 4px;
		padding: 12px 14px;
		min-height: 72px;
	}

	.ti84-expression {
		font-family: 'Courier New', monospace;
		font-size: 11px;
		color: #88cc88;
		opacity: 0.7;
		min-height: 14px;
		text-align: right;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ti84-result {
		font-family: 'Courier New', monospace;
		font-size: 26px;
		font-weight: bold;
		color: #aaffaa;
		text-align: right;
		text-shadow: 0 0 8px rgba(170, 255, 170, 0.3);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		letter-spacing: 2px;
	}

	.ti84-error {
		color: #ffaa88;
		font-size: 16px;
	}

	.ti84-nav {
		display: flex;
		gap: 6px;
		margin-bottom: 10px;
		justify-content: center;
	}

	.ti84-nav-btn {
		padding: 4px 16px;
		border: none;
		border-radius: 4px;
		font-family: 'Arial', sans-serif;
		font-size: 10px;
		font-weight: 600;
		cursor: pointer;
		background: #444;
		color: #ccc;
		letter-spacing: 1px;
	}

	.ti84-nav-btn:hover {
		background: #555;
	}

	.ti84-nav-mode {
		background: #3366aa;
		color: #ddeeff;
	}

	.ti84-keypad {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 5px;
	}

	.ti84-btn {
		height: 46px;
		border: none;
		border-radius: 6px;
		font-family: 'Arial', sans-serif;
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.08s;
		background: #3a3a3a;
		color: #e0e0e0;
		box-shadow:
			0 3px 0 #222,
			0 4px 8px rgba(0, 0, 0, 0.3);
		position: relative;
		top: 0;
	}

	.ti84-btn:active {
		top: 2px;
		box-shadow:
			0 1px 0 #222,
			0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.ti84-btn-op {
		background: #4a4a4a;
		color: #aaccff;
	}

	.ti84-btn-eq {
		background: #2255aa;
		color: white;
		font-size: 18px;
		box-shadow:
			0 3px 0 #153888,
			0 4px 8px rgba(0, 0, 0, 0.3);
	}

	.ti84-btn-clear {
		background: #555;
		color: #ff9966;
	}

	.ti84-footer {
		display: flex;
		justify-content: center;
		margin-top: 12px;
	}

	.ti84-usb {
		width: 20px;
		height: 6px;
		background: #333;
		border-radius: 0 0 3px 3px;
	}
</style>
