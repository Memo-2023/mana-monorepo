<script lang="ts">
	interface Props {
		hours: number;
		minutes: number;
		seconds: number;
		size?: number;
	}

	let { hours, minutes, seconds, size = 280 }: Props = $props();

	// 7-segment display mapping
	// Segments: a(top), b(topRight), c(bottomRight), d(bottom), e(bottomLeft), f(topLeft), g(middle)
	const segments: Record<string, string> = {
		'0': 'abcdef',
		'1': 'bc',
		'2': 'abdeg',
		'3': 'abcdg',
		'4': 'bcfg',
		'5': 'acdfg',
		'6': 'acdefg',
		'7': 'abc',
		'8': 'abcdefg',
		'9': 'abcdfg',
	};

	let h1 = $derived(Math.floor(hours / 10).toString());
	let h2 = $derived((hours % 10).toString());
	let m1 = $derived(Math.floor(minutes / 10).toString());
	let m2 = $derived((minutes % 10).toString());
	let s1 = $derived(Math.floor(seconds / 10).toString());
	let s2 = $derived((seconds % 10).toString());

	function isOn(digit: string, segment: string): boolean {
		return segments[digit]?.includes(segment) ?? false;
	}
</script>

<div class="clock-face-lcd" style="--size: {size}px;">
	<div class="lcd-case">
		<div class="lcd-screen">
			<!-- Screen glare -->
			<div class="screen-glare"></div>

			<!-- Digits container -->
			<div class="digits">
				<!-- Hours -->
				<div class="digit-group">
					<div class="digit">
						<div class="segment seg-a" class:on={isOn(h1, 'a')}></div>
						<div class="segment seg-b" class:on={isOn(h1, 'b')}></div>
						<div class="segment seg-c" class:on={isOn(h1, 'c')}></div>
						<div class="segment seg-d" class:on={isOn(h1, 'd')}></div>
						<div class="segment seg-e" class:on={isOn(h1, 'e')}></div>
						<div class="segment seg-f" class:on={isOn(h1, 'f')}></div>
						<div class="segment seg-g" class:on={isOn(h1, 'g')}></div>
					</div>
					<div class="digit">
						<div class="segment seg-a" class:on={isOn(h2, 'a')}></div>
						<div class="segment seg-b" class:on={isOn(h2, 'b')}></div>
						<div class="segment seg-c" class:on={isOn(h2, 'c')}></div>
						<div class="segment seg-d" class:on={isOn(h2, 'd')}></div>
						<div class="segment seg-e" class:on={isOn(h2, 'e')}></div>
						<div class="segment seg-f" class:on={isOn(h2, 'f')}></div>
						<div class="segment seg-g" class:on={isOn(h2, 'g')}></div>
					</div>
				</div>

				<!-- Colon -->
				<div class="colon">
					<div class="colon-dot"></div>
					<div class="colon-dot"></div>
				</div>

				<!-- Minutes -->
				<div class="digit-group">
					<div class="digit">
						<div class="segment seg-a" class:on={isOn(m1, 'a')}></div>
						<div class="segment seg-b" class:on={isOn(m1, 'b')}></div>
						<div class="segment seg-c" class:on={isOn(m1, 'c')}></div>
						<div class="segment seg-d" class:on={isOn(m1, 'd')}></div>
						<div class="segment seg-e" class:on={isOn(m1, 'e')}></div>
						<div class="segment seg-f" class:on={isOn(m1, 'f')}></div>
						<div class="segment seg-g" class:on={isOn(m1, 'g')}></div>
					</div>
					<div class="digit">
						<div class="segment seg-a" class:on={isOn(m2, 'a')}></div>
						<div class="segment seg-b" class:on={isOn(m2, 'b')}></div>
						<div class="segment seg-c" class:on={isOn(m2, 'c')}></div>
						<div class="segment seg-d" class:on={isOn(m2, 'd')}></div>
						<div class="segment seg-e" class:on={isOn(m2, 'e')}></div>
						<div class="segment seg-f" class:on={isOn(m2, 'f')}></div>
						<div class="segment seg-g" class:on={isOn(m2, 'g')}></div>
					</div>
				</div>

				<!-- Small colon -->
				<div class="colon colon-small">
					<div class="colon-dot"></div>
					<div class="colon-dot"></div>
				</div>

				<!-- Seconds (smaller) -->
				<div class="digit-group digit-group-small">
					<div class="digit digit-small">
						<div class="segment seg-a" class:on={isOn(s1, 'a')}></div>
						<div class="segment seg-b" class:on={isOn(s1, 'b')}></div>
						<div class="segment seg-c" class:on={isOn(s1, 'c')}></div>
						<div class="segment seg-d" class:on={isOn(s1, 'd')}></div>
						<div class="segment seg-e" class:on={isOn(s1, 'e')}></div>
						<div class="segment seg-f" class:on={isOn(s1, 'f')}></div>
						<div class="segment seg-g" class:on={isOn(s1, 'g')}></div>
					</div>
					<div class="digit digit-small">
						<div class="segment seg-a" class:on={isOn(s2, 'a')}></div>
						<div class="segment seg-b" class:on={isOn(s2, 'b')}></div>
						<div class="segment seg-c" class:on={isOn(s2, 'c')}></div>
						<div class="segment seg-d" class:on={isOn(s2, 'd')}></div>
						<div class="segment seg-e" class:on={isOn(s2, 'e')}></div>
						<div class="segment seg-f" class:on={isOn(s2, 'f')}></div>
						<div class="segment seg-g" class:on={isOn(s2, 'g')}></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.clock-face-lcd {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.lcd-case {
		background: linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 50%, #1a1a1a 100%);
		border-radius: 12px;
		padding: 8px;
		box-shadow:
			0 8px 24px rgba(0, 0, 0, 0.4),
			inset 0 1px 1px rgba(255, 255, 255, 0.1);
	}

	.lcd-screen {
		position: relative;
		background: linear-gradient(180deg, #7a9a6a 0%, #5a7a4a 100%);
		border-radius: 6px;
		padding: 16px 20px;
		box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	:global(.dark) .lcd-screen {
		background: linear-gradient(180deg, #1a2a1a 0%, #0a1a0a 100%);
	}

	.screen-glare {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 40%;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%);
		border-radius: 6px 6px 0 0;
		pointer-events: none;
	}

	.digits {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.digit-group {
		display: flex;
		gap: 4px;
	}

	.digit {
		position: relative;
		width: 28px;
		height: 48px;
	}

	.digit-small {
		width: 20px;
		height: 34px;
	}

	.segment {
		position: absolute;
		background: rgba(30, 60, 30, 0.2);
		transition:
			background-color 50ms,
			box-shadow 50ms;
	}

	:global(.dark) .segment {
		background: rgba(0, 50, 0, 0.3);
	}

	.segment.on {
		background: #2a3a20;
	}

	:global(.dark) .segment.on {
		background: #00dd00;
		box-shadow: 0 0 6px #00dd00;
	}

	/* Segment positions */
	.seg-a {
		top: 0;
		left: 4px;
		right: 4px;
		height: 4px;
		clip-path: polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%);
	}

	.seg-b {
		top: 3px;
		right: 0;
		width: 4px;
		height: 44%;
		clip-path: polygon(50% 0%, 100% 15%, 100% 85%, 50% 100%, 0% 85%, 0% 15%);
	}

	.seg-c {
		top: 53%;
		right: 0;
		width: 4px;
		height: 44%;
		clip-path: polygon(50% 0%, 100% 15%, 100% 85%, 50% 100%, 0% 85%, 0% 15%);
	}

	.seg-d {
		bottom: 0;
		left: 4px;
		right: 4px;
		height: 4px;
		clip-path: polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%);
	}

	.seg-e {
		top: 53%;
		left: 0;
		width: 4px;
		height: 44%;
		clip-path: polygon(50% 0%, 100% 15%, 100% 85%, 50% 100%, 0% 85%, 0% 15%);
	}

	.seg-f {
		top: 3px;
		left: 0;
		width: 4px;
		height: 44%;
		clip-path: polygon(50% 0%, 100% 15%, 100% 85%, 50% 100%, 0% 85%, 0% 15%);
	}

	.seg-g {
		top: 50%;
		left: 4px;
		right: 4px;
		height: 4px;
		margin-top: -2px;
		clip-path: polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%);
	}

	.colon {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 12px;
		padding: 0 4px;
	}

	.colon-small {
		gap: 8px;
		padding: 0 3px;
	}

	.colon-dot {
		width: 5px;
		height: 5px;
		background: #2a3a20;
		border-radius: 1px;
	}

	:global(.dark) .colon-dot {
		background: #00dd00;
		box-shadow: 0 0 4px #00dd00;
	}

	.digit-group-small {
		align-self: flex-end;
		margin-bottom: 2px;
	}

	.digit-small .seg-a,
	.digit-small .seg-d,
	.digit-small .seg-g {
		left: 3px;
		right: 3px;
		height: 3px;
	}

	.digit-small .seg-b,
	.digit-small .seg-c,
	.digit-small .seg-e,
	.digit-small .seg-f {
		width: 3px;
	}

	.digit-small .seg-g {
		margin-top: -1.5px;
	}
</style>
