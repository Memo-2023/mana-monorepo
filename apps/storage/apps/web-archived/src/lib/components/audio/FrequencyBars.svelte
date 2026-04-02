<script lang="ts">
	import { audioPlayerStore } from '$lib/stores/audio-player.svelte';
	import { connectAnalyzer, getFrequencyData, resumeAudioContext } from '$lib/audio/analyzer';

	interface Props {
		barCount?: number;
		barGap?: number;
		barRadius?: number;
		color?: string;
		height?: number;
		mirror?: boolean;
	}

	let {
		barCount = 32,
		barGap = 2,
		barRadius = 2,
		color = 'gradient',
		height = 64,
		mirror = false,
	}: Props = $props();

	let canvas: HTMLCanvasElement | undefined = $state();
	let animationId: number | null = null;
	let isConnected = $state(false);

	$effect(() => {
		const audio = audioPlayerStore.getAudioElement();
		if (audio && audioPlayerStore.isPlaying && !isConnected) {
			try {
				connectAnalyzer(audio);
				resumeAudioContext();
				isConnected = true;
			} catch (e) {
				console.warn('[Visualizer] Failed to connect analyzer:', e);
			}
		}
	});

	$effect(() => {
		if (audioPlayerStore.isPlaying && canvas && isConnected) {
			startAnimation();
		} else {
			stopAnimation();
			if (canvas) drawBars(null);
		}

		return () => stopAnimation();
	});

	function startAnimation() {
		if (animationId !== null) return;

		function loop() {
			const data = getFrequencyData();
			drawBars(data);
			animationId = requestAnimationFrame(loop);
		}
		animationId = requestAnimationFrame(loop);
	}

	function stopAnimation() {
		if (animationId !== null) {
			cancelAnimationFrame(animationId);
			animationId = null;
		}
	}

	function drawBars(frequencyData: Uint8Array | null) {
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const dpr = window.devicePixelRatio || 1;
		const w = canvas.clientWidth;
		const h = canvas.clientHeight;

		if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
			canvas.width = w * dpr;
			canvas.height = h * dpr;
			ctx.scale(dpr, dpr);
		}

		ctx.clearRect(0, 0, w, h);

		const effectiveBarCount = mirror ? Math.ceil(barCount / 2) : barCount;
		const totalGap = barGap * (barCount - 1);
		const barWidth = Math.max(1, (w - totalGap) / barCount);

		const bars = new Float32Array(effectiveBarCount);
		if (frequencyData) {
			const binCount = frequencyData.length;
			for (let i = 0; i < effectiveBarCount; i++) {
				const logStart = Math.pow(i / effectiveBarCount, 1.5) * binCount;
				const logEnd = Math.pow((i + 1) / effectiveBarCount, 1.5) * binCount;
				const start = Math.floor(logStart);
				const end = Math.max(start + 1, Math.floor(logEnd));

				let sum = 0;
				for (let j = start; j < end && j < binCount; j++) {
					sum += frequencyData[j];
				}
				bars[i] = sum / (end - start) / 255;
			}
		}

		for (let i = 0; i < barCount; i++) {
			let barIndex: number;
			if (mirror) {
				const center = Math.floor(barCount / 2);
				barIndex = Math.abs(i - center);
				barIndex = Math.min(barIndex, effectiveBarCount - 1);
			} else {
				barIndex = Math.min(i, effectiveBarCount - 1);
			}

			const value = bars[barIndex];
			const minHeight = 2;
			const barHeight = Math.max(minHeight, value * h);

			const x = i * (barWidth + barGap);
			const y = h - barHeight;

			if (color === 'gradient') {
				const hue = mirror
					? 200 + (Math.abs(i - barCount / 2) / (barCount / 2)) * 120
					: 200 + (i / barCount) * 120;
				const lightness = 50 + value * 20;
				ctx.fillStyle = `hsl(${hue}, 80%, ${lightness}%)`;
			} else {
				ctx.fillStyle = color;
			}

			if (barRadius > 0) {
				const r = Math.min(barRadius, barWidth / 2, barHeight / 2);
				ctx.beginPath();
				ctx.moveTo(x + r, y);
				ctx.lineTo(x + barWidth - r, y);
				ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
				ctx.lineTo(x + barWidth, y + barHeight);
				ctx.lineTo(x, y + barHeight);
				ctx.lineTo(x, y + r);
				ctx.quadraticCurveTo(x, y, x + r, y);
				ctx.fill();
			} else {
				ctx.fillRect(x, y, barWidth, barHeight);
			}
		}
	}
</script>

<canvas bind:this={canvas} class="w-full block" style="height: {height}px;" aria-hidden="true"
></canvas>
