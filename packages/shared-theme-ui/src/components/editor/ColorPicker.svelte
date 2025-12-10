<script lang="ts">
	import type { HSLValue } from '@manacore/shared-theme';

	interface Props {
		/** Current HSL value (format: "H S% L%") */
		value: HSLValue;
		/** Callback when color changes */
		onChange: (value: HSLValue) => void;
		/** Label for the color picker */
		label?: string;
		/** Show hex input field */
		showHexInput?: boolean;
		/** Compact mode (smaller size) */
		compact?: boolean;
	}

	let { value, onChange, label, showHexInput = true, compact = false }: Props = $props();

	// Parse HSL value to components
	function parseHSL(hsl: HSLValue): { h: number; s: number; l: number } {
		const match = hsl.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%?\s+(\d+(?:\.\d+)?)%?$/);
		if (match) {
			return {
				h: parseFloat(match[1]),
				s: parseFloat(match[2]),
				l: parseFloat(match[3]),
			};
		}
		return { h: 0, s: 50, l: 50 };
	}

	// Convert HSL to hex
	function hslToHex(h: number, s: number, l: number): string {
		s /= 100;
		l /= 100;
		const a = s * Math.min(l, 1 - l);
		const f = (n: number) => {
			const k = (n + h / 30) % 12;
			const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
			return Math.round(255 * color)
				.toString(16)
				.padStart(2, '0');
		};
		return `#${f(0)}${f(8)}${f(4)}`;
	}

	// Convert hex to HSL
	function hexToHSL(hex: string): { h: number; s: number; l: number } {
		// Remove # if present
		hex = hex.replace(/^#/, '');

		// Parse hex to RGB
		const r = parseInt(hex.substring(0, 2), 16) / 255;
		const g = parseInt(hex.substring(2, 4), 16) / 255;
		const b = parseInt(hex.substring(4, 6), 16) / 255;

		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		let h = 0;
		let s = 0;
		const l = (max + min) / 2;

		if (max !== min) {
			const d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

			switch (max) {
				case r:
					h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
					break;
				case g:
					h = ((b - r) / d + 2) / 6;
					break;
				case b:
					h = ((r - g) / d + 4) / 6;
					break;
			}
		}

		return {
			h: Math.round(h * 360),
			s: Math.round(s * 100),
			l: Math.round(l * 100),
		};
	}

	// Current color values
	let hsl = $derived(parseHSL(value));
	let hex = $derived(hslToHex(hsl.h, hsl.s, hsl.l));
	let hexInput = $state('');

	// Keep hex input in sync
	$effect(() => {
		hexInput = hex;
	});

	function updateColor(h: number, s: number, l: number) {
		const newValue = `${h} ${s}% ${l}%` as HSLValue;
		onChange(newValue);
	}

	function handleHueChange(e: Event) {
		const target = e.target as HTMLInputElement;
		updateColor(parseInt(target.value), hsl.s, hsl.l);
	}

	function handleSaturationChange(e: Event) {
		const target = e.target as HTMLInputElement;
		updateColor(hsl.h, parseInt(target.value), hsl.l);
	}

	function handleLightnessChange(e: Event) {
		const target = e.target as HTMLInputElement;
		updateColor(hsl.h, hsl.s, parseInt(target.value));
	}

	function handleHexChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const newHex = target.value;
		hexInput = newHex;

		// Only update if valid hex
		if (/^#?[0-9A-Fa-f]{6}$/.test(newHex)) {
			const newHSL = hexToHSL(newHex);
			updateColor(newHSL.h, newHSL.s, newHSL.l);
		}
	}

	// Gradient backgrounds for sliders
	const hueGradient = `linear-gradient(to right,
		hsl(0, 100%, 50%),
		hsl(60, 100%, 50%),
		hsl(120, 100%, 50%),
		hsl(180, 100%, 50%),
		hsl(240, 100%, 50%),
		hsl(300, 100%, 50%),
		hsl(360, 100%, 50%)
	)`;

	let saturationGradient = $derived(
		`linear-gradient(to right, hsl(${hsl.h}, 0%, ${hsl.l}%), hsl(${hsl.h}, 100%, ${hsl.l}%))`
	);

	let lightnessGradient = $derived(
		`linear-gradient(to right, hsl(${hsl.h}, ${hsl.s}%, 0%), hsl(${hsl.h}, ${hsl.s}%, 50%), hsl(${hsl.h}, ${hsl.s}%, 100%))`
	);
</script>

<div class="color-picker" class:compact>
	{#if label}
		<label class="label">{label}</label>
	{/if}

	<div class="color-display">
		<!-- Color preview swatch -->
		<div class="swatch" style="background-color: hsl({hsl.h}, {hsl.s}%, {hsl.l}%)"></div>

		{#if showHexInput}
			<input
				type="text"
				class="hex-input"
				value={hexInput}
				oninput={handleHexChange}
				placeholder="#000000"
				maxlength="7"
			/>
		{/if}
	</div>

	<div class="sliders">
		<!-- Hue slider -->
		<div class="slider-group">
			<span class="slider-label">H</span>
			<input
				type="range"
				min="0"
				max="360"
				value={hsl.h}
				oninput={handleHueChange}
				class="slider hue-slider"
				style="--slider-bg: {hueGradient}"
			/>
			<span class="slider-value">{hsl.h}</span>
		</div>

		<!-- Saturation slider -->
		<div class="slider-group">
			<span class="slider-label">S</span>
			<input
				type="range"
				min="0"
				max="100"
				value={hsl.s}
				oninput={handleSaturationChange}
				class="slider"
				style="--slider-bg: {saturationGradient}"
			/>
			<span class="slider-value">{hsl.s}%</span>
		</div>

		<!-- Lightness slider -->
		<div class="slider-group">
			<span class="slider-label">L</span>
			<input
				type="range"
				min="0"
				max="100"
				value={hsl.l}
				oninput={handleLightnessChange}
				class="slider"
				style="--slider-bg: {lightnessGradient}"
			/>
			<span class="slider-value">{hsl.l}%</span>
		</div>
	</div>
</div>

<style>
	.color-picker {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.color-picker.compact {
		gap: 0.5rem;
	}

	.label {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	.color-display {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.swatch {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.5rem;
		border: 2px solid hsl(var(--border));
		flex-shrink: 0;
	}

	.compact .swatch {
		width: 2rem;
		height: 2rem;
	}

	.hex-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		font-family: ui-monospace, monospace;
		background: hsl(var(--input));
		border: 1px solid hsl(var(--border));
		border-radius: 0.375rem;
		color: hsl(var(--foreground));
		max-width: 100px;
	}

	.hex-input:focus {
		outline: none;
		border-color: hsl(var(--primary));
		box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2);
	}

	.sliders {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.slider-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.slider-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		width: 1rem;
		text-align: center;
	}

	.slider {
		flex: 1;
		height: 0.5rem;
		-webkit-appearance: none;
		appearance: none;
		background: var(--slider-bg);
		border-radius: 0.25rem;
		cursor: pointer;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 1rem;
		height: 1rem;
		background: white;
		border-radius: 50%;
		border: 2px solid hsl(var(--border-strong));
		cursor: pointer;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.slider::-moz-range-thumb {
		width: 1rem;
		height: 1rem;
		background: white;
		border-radius: 50%;
		border: 2px solid hsl(var(--border-strong));
		cursor: pointer;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.slider-value {
		font-size: 0.75rem;
		font-family: ui-monospace, monospace;
		color: hsl(var(--muted-foreground));
		width: 2.5rem;
		text-align: right;
	}

	.compact .slider-group {
		gap: 0.375rem;
	}

	.compact .slider {
		height: 0.375rem;
	}

	.compact .slider::-webkit-slider-thumb {
		width: 0.75rem;
		height: 0.75rem;
	}

	.compact .slider::-moz-range-thumb {
		width: 0.75rem;
		height: 0.75rem;
	}
</style>
