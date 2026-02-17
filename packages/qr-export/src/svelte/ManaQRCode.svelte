<script lang="ts">
	import { toDataURL, toSVG } from '../generate';
	import type { ManaQRExport, EncodeResult } from '../types';

	interface Props {
		/** Encoded QR data string, EncodeResult, or ManaQRExport object */
		data: string | ManaQRExport | EncodeResult;
		/** Width/height in pixels */
		size?: number;
		/** Margin in QR modules */
		margin?: number;
		/** Error correction level */
		errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
		/** Dark color (QR modules) */
		darkColor?: string;
		/** Light color (background) */
		lightColor?: string;
		/** Render as SVG instead of PNG (sharper, smaller file) */
		svg?: boolean;
		/** Alt text for accessibility */
		alt?: string;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		data,
		size = 300,
		margin = 2,
		errorCorrectionLevel = 'M',
		darkColor = '#000000',
		lightColor = '#ffffff',
		svg = false,
		alt = 'ManaQR Code',
		class: className = '',
	}: Props = $props();

	let qrOutput = $state<string>('');
	let error = $state<string | null>(null);

	const options = $derived({
		size,
		margin,
		errorCorrectionLevel,
		darkColor,
		lightColor,
	});

	$effect(() => {
		generateQR();
	});

	async function generateQR() {
		try {
			error = null;
			if (svg) {
				qrOutput = await toSVG(data, options);
			} else {
				qrOutput = await toDataURL(data, options);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to generate QR code';
			qrOutput = '';
		}
	}
</script>

{#if error}
	<div class="mana-qr-error {className}" role="alert">
		<span>QR Error: {error}</span>
	</div>
{:else if qrOutput}
	{#if svg}
		<div
			class="mana-qr-svg {className}"
			style="width: {size}px; height: {size}px;"
			role="img"
			aria-label={alt}
		>
			{@html qrOutput}
		</div>
	{:else}
		<img src={qrOutput} {alt} class="mana-qr-img {className}" width={size} height={size} />
	{/if}
{:else}
	<div
		class="mana-qr-loading {className}"
		style="width: {size}px; height: {size}px;"
		role="status"
		aria-label="Loading QR code"
	>
		<span class="mana-qr-spinner"></span>
	</div>
{/if}

<style>
	.mana-qr-img {
		display: block;
		image-rendering: pixelated;
	}

	.mana-qr-svg {
		display: block;
	}

	.mana-qr-svg :global(svg) {
		width: 100%;
		height: 100%;
	}

	.mana-qr-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f5f5f5;
		border-radius: 8px;
	}

	.mana-qr-spinner {
		width: 24px;
		height: 24px;
		border: 3px solid #e0e0e0;
		border-top-color: #333;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.mana-qr-error {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: #fee;
		color: #c00;
		border-radius: 8px;
		font-size: 0.875rem;
	}
</style>
