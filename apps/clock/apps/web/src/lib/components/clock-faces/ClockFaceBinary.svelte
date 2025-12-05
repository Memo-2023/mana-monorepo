<script lang="ts">
	interface Props {
		hours: number;
		minutes: number;
		seconds: number;
		size?: number;
	}

	let { hours, minutes, seconds, size = 280 }: Props = $props();

	// Convert to BCD (Binary Coded Decimal)
	function toBCD(value: number): { tens: number[]; ones: number[] } {
		const tens = Math.floor(value / 10);
		const ones = value % 10;
		return {
			tens: [(tens >> 2) & 1, (tens >> 1) & 1, tens & 1],
			ones: [(ones >> 3) & 1, (ones >> 2) & 1, (ones >> 1) & 1, ones & 1],
		};
	}

	let hoursBCD = $derived(toBCD(hours));
	let minutesBCD = $derived(toBCD(minutes));
	let secondsBCD = $derived(toBCD(seconds));

	let timeString = $derived(
		`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
	);
</script>

<div class="clock-face-binary" style="--size: {size}px;">
	<div class="binary-display">
		<!-- Column headers -->
		<div class="row header-row">
			<div class="cell header"></div>
			<div class="cell header label">H</div>
			<div class="cell header label">H</div>
			<div class="cell header spacer"></div>
			<div class="cell header label">M</div>
			<div class="cell header label">M</div>
			<div class="cell header spacer"></div>
			<div class="cell header label">S</div>
			<div class="cell header label">S</div>
		</div>

		<!-- Row 8 (only for ones columns) -->
		<div class="row">
			<div class="cell weight">8</div>
			<div class="cell empty"></div>
			<div class="led" class:on={hoursBCD.ones[0] === 1}></div>
			<div class="cell spacer"></div>
			<div class="cell empty"></div>
			<div class="led" class:on={minutesBCD.ones[0] === 1}></div>
			<div class="cell spacer"></div>
			<div class="cell empty"></div>
			<div class="led led-small" class:on={secondsBCD.ones[0] === 1}></div>
		</div>

		<!-- Row 4 -->
		<div class="row">
			<div class="cell weight">4</div>
			<div class="led" class:on={hoursBCD.tens[0] === 1}></div>
			<div class="led" class:on={hoursBCD.ones[1] === 1}></div>
			<div class="cell spacer"></div>
			<div class="led" class:on={minutesBCD.tens[0] === 1}></div>
			<div class="led" class:on={minutesBCD.ones[1] === 1}></div>
			<div class="cell spacer"></div>
			<div class="led led-small" class:on={secondsBCD.tens[0] === 1}></div>
			<div class="led led-small" class:on={secondsBCD.ones[1] === 1}></div>
		</div>

		<!-- Row 2 -->
		<div class="row">
			<div class="cell weight">2</div>
			<div class="led" class:on={hoursBCD.tens[1] === 1}></div>
			<div class="led" class:on={hoursBCD.ones[2] === 1}></div>
			<div class="cell spacer"></div>
			<div class="led" class:on={minutesBCD.tens[1] === 1}></div>
			<div class="led" class:on={minutesBCD.ones[2] === 1}></div>
			<div class="cell spacer"></div>
			<div class="led led-small" class:on={secondsBCD.tens[1] === 1}></div>
			<div class="led led-small" class:on={secondsBCD.ones[2] === 1}></div>
		</div>

		<!-- Row 1 -->
		<div class="row">
			<div class="cell weight">1</div>
			<div class="led" class:on={hoursBCD.tens[2] === 1}></div>
			<div class="led" class:on={hoursBCD.ones[3] === 1}></div>
			<div class="cell spacer"></div>
			<div class="led" class:on={minutesBCD.tens[2] === 1}></div>
			<div class="led" class:on={minutesBCD.ones[3] === 1}></div>
			<div class="cell spacer"></div>
			<div class="led led-small" class:on={secondsBCD.tens[2] === 1}></div>
			<div class="led led-small" class:on={secondsBCD.ones[3] === 1}></div>
		</div>

		<!-- Decimal display -->
		<div class="decimal-row">
			<span class="decimal-time">{timeString}</span>
		</div>
	</div>
</div>

<style>
	.clock-face-binary {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.binary-display {
		background: linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%);
		border-radius: 12px;
		padding: 16px 20px;
		box-shadow:
			0 8px 24px rgba(0, 0, 0, 0.4),
			inset 0 1px 1px rgba(255, 255, 255, 0.05);
	}

	.row {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 6px;
	}

	.header-row {
		margin-bottom: 10px;
		padding-bottom: 8px;
		border-bottom: 1px solid #333;
	}

	.cell {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.cell.header {
		height: 16px;
	}

	.cell.label {
		width: 22px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.65rem;
		font-weight: 600;
		color: #555;
	}

	.cell.weight {
		width: 16px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.6rem;
		font-weight: 600;
		color: #444;
		text-align: right;
		padding-right: 4px;
	}

	.cell.empty {
		width: 22px;
		height: 22px;
	}

	.cell.spacer {
		width: 10px;
	}

	.led {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: #1a1a1a;
		border: 2px solid #2a2a2a;
		transition: all 120ms;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
	}

	.led.on {
		background: radial-gradient(circle at 30% 30%, #00ff44 0%, #00cc33 50%, #00aa22 100%);
		border-color: #00ff44;
		box-shadow:
			0 0 8px #00ff44,
			0 0 16px rgba(0, 255, 68, 0.5),
			inset 0 -2px 4px rgba(0, 0, 0, 0.2),
			inset 0 2px 4px rgba(255, 255, 255, 0.3);
	}

	.led-small {
		width: 16px;
		height: 16px;
	}

	.decimal-row {
		margin-top: 12px;
		padding-top: 10px;
		border-top: 1px solid #333;
		text-align: center;
	}

	.decimal-time {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.9rem;
		font-weight: 500;
		color: #666;
		letter-spacing: 0.15em;
	}
</style>
