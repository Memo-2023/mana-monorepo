<script lang="ts">
	import { decode } from '../encoder';
	import type { ManaQRExport, DecodeResult } from '../types';

	interface Props {
		/** Called when a valid ManaQR code is scanned */
		onScan?: (data: ManaQRExport) => void;
		/** Called on any scan error */
		onError?: (error: string) => void;
		/** Width of the scanner view */
		width?: number;
		/** Height of the scanner view */
		height?: number;
		/** Show scan overlay guide */
		showOverlay?: boolean;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		onScan,
		onError,
		width = 300,
		height = 300,
		showOverlay = true,
		class: className = '',
	}: Props = $props();

	let videoElement = $state<HTMLVideoElement | null>(null);
	let canvasElement = $state<HTMLCanvasElement | null>(null);
	let isScanning = $state(false);
	let error = $state<string | null>(null);
	let stream = $state<MediaStream | null>(null);

	// Dynamically import jsQR only when needed
	let jsQR: typeof import('jsqr').default | null = null;

	$effect(() => {
		return () => {
			stopScanning();
		};
	});

	export async function startScanning() {
		if (isScanning) return;

		try {
			// Lazy load jsQR
			if (!jsQR) {
				const module = await import('jsqr');
				jsQR = module.default;
			}

			error = null;
			stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment', width, height },
			});

			if (videoElement) {
				videoElement.srcObject = stream;
				await videoElement.play();
				isScanning = true;
				requestAnimationFrame(scanFrame);
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Camera access denied';
			error = msg;
			onError?.(msg);
		}
	}

	export function stopScanning() {
		isScanning = false;
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
			stream = null;
		}
		if (videoElement) {
			videoElement.srcObject = null;
		}
	}

	function scanFrame() {
		if (!isScanning || !videoElement || !canvasElement || !jsQR) return;

		const ctx = canvasElement.getContext('2d');
		if (!ctx) return;

		if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
			canvasElement.width = videoElement.videoWidth;
			canvasElement.height = videoElement.videoHeight;
			ctx.drawImage(videoElement, 0, 0);

			const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
			const code = jsQR(imageData.data, imageData.width, imageData.height);

			if (code?.data) {
				handleScan(code.data);
			}
		}

		if (isScanning) {
			requestAnimationFrame(scanFrame);
		}
	}

	function handleScan(qrData: string) {
		const result = decode(qrData);

		if (result.success) {
			stopScanning();
			onScan?.(result.data);
		} else {
			// Not a valid ManaQR - might be scanning something else
			// Don't stop, keep scanning
		}
	}

	async function handleFileUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		try {
			// Lazy load jsQR
			if (!jsQR) {
				const module = await import('jsqr');
				jsQR = module.default;
			}

			const img = new Image();
			img.src = URL.createObjectURL(file);
			await new Promise((resolve) => (img.onload = resolve));

			const canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext('2d')!;
			ctx.drawImage(img, 0, 0);

			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const code = jsQR(imageData.data, imageData.width, imageData.height);

			if (code?.data) {
				handleScan(code.data);
			} else {
				const msg = 'No QR code found in image';
				error = msg;
				onError?.(msg);
			}

			URL.revokeObjectURL(img.src);
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Failed to read image';
			error = msg;
			onError?.(msg);
		}

		input.value = '';
	}
</script>

<div class="mana-qr-scanner {className}" style="width: {width}px;">
	{#if error}
		<div class="scanner-error" role="alert">
			<span>{error}</span>
			<button onclick={() => (error = null)}>Dismiss</button>
		</div>
	{/if}

	<div class="scanner-view" style="width: {width}px; height: {height}px;">
		<video bind:this={videoElement} playsinline muted class:hidden={!isScanning}></video>
		<canvas bind:this={canvasElement} class="hidden"></canvas>

		{#if showOverlay && isScanning}
			<div class="scanner-overlay">
				<div class="scanner-frame"></div>
			</div>
		{/if}

		{#if !isScanning}
			<div class="scanner-placeholder">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="48"
					height="48"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path d="M3 7V5a2 2 0 0 1 2-2h2" />
					<path d="M17 3h2a2 2 0 0 1 2 2v2" />
					<path d="M21 17v2a2 2 0 0 1-2 2h-2" />
					<path d="M7 21H5a2 2 0 0 1-2-2v-2" />
					<rect x="7" y="7" width="10" height="10" rx="1" />
				</svg>
				<span>Ready to scan</span>
			</div>
		{/if}
	</div>

	<div class="scanner-controls">
		{#if isScanning}
			<button class="btn-stop" onclick={stopScanning}>Stop Scanning</button>
		{:else}
			<button class="btn-start" onclick={startScanning}>Start Camera</button>
			<label class="btn-upload">
				Upload Image
				<input type="file" accept="image/*" onchange={handleFileUpload} />
			</label>
		{/if}
	</div>
</div>

<style>
	.mana-qr-scanner {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.scanner-view {
		position: relative;
		background: #111;
		border-radius: 12px;
		overflow: hidden;
	}

	.scanner-view video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.hidden {
		display: none;
	}

	.scanner-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.scanner-frame {
		width: 70%;
		height: 70%;
		border: 3px solid rgba(255, 255, 255, 0.8);
		border-radius: 16px;
		box-shadow:
			0 0 0 9999px rgba(0, 0, 0, 0.4),
			inset 0 0 20px rgba(255, 255, 255, 0.1);
	}

	.scanner-placeholder {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		color: #666;
	}

	.scanner-controls {
		display: flex;
		gap: 0.5rem;
	}

	.scanner-controls button,
	.scanner-controls label {
		flex: 1;
		padding: 0.75rem 1rem;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		text-align: center;
	}

	.btn-start {
		background: #000;
		color: #fff;
	}

	.btn-start:hover {
		background: #333;
	}

	.btn-stop {
		background: #c00;
		color: #fff;
	}

	.btn-stop:hover {
		background: #a00;
	}

	.btn-upload {
		background: #f0f0f0;
		color: #333;
	}

	.btn-upload:hover {
		background: #e0e0e0;
	}

	.btn-upload input {
		display: none;
	}

	.scanner-error {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background: #fee;
		color: #c00;
		border-radius: 8px;
		font-size: 0.875rem;
	}

	.scanner-error button {
		padding: 0.25rem 0.5rem;
		background: transparent;
		border: 1px solid currentColor;
		border-radius: 4px;
		color: inherit;
		cursor: pointer;
	}
</style>
