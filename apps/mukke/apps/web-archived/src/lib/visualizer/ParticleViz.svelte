<script lang="ts">
	import { playerStore } from '$lib/stores/player.svelte';
	import { connectAnalyzer, getFrequencyData, resumeAudioContext } from './analyzer';

	interface Props {
		height?: number;
		/** Number of particles */
		particleCount?: number;
		/** Color mode */
		colorMode?: 'spectrum' | 'pulse' | 'white';
	}

	let { height = 300, particleCount = 200, colorMode = 'spectrum' }: Props = $props();

	let container: HTMLDivElement | undefined = $state();
	let app: any = null;
	let particles: Particle[] = [];
	let isInitialized = $state(false);

	interface Particle {
		graphics: any;
		x: number;
		y: number;
		vx: number;
		vy: number;
		baseRadius: number;
		frequencyBin: number;
		hue: number;
	}

	async function initPixi() {
		if (!container || isInitialized) return;

		const audio = playerStore.getAudioElement();
		if (!audio) return;

		try {
			connectAnalyzer(audio, { fftSize: 256 });
			await resumeAudioContext();

			const PIXI = await import('pixi.js');

			app = new PIXI.Application();
			const dpr = window.devicePixelRatio || 1;
			const width = container.clientWidth;

			await app.init({
				width: Math.floor(width * dpr),
				height: Math.floor(height * dpr),
				backgroundAlpha: 0,
				antialias: true,
				resolution: 1,
				autoDensity: false,
			});

			app.canvas.style.width = '100%';
			app.canvas.style.height = `${height}px`;
			container.appendChild(app.canvas);

			createParticles(PIXI, width * dpr, height * dpr);
			isInitialized = true;
		} catch (e) {
			console.warn('[ParticleViz] Failed to initialize:', e);
		}
	}

	function createParticles(PIXI: typeof import('pixi.js'), width: number, height: number) {
		particles = [];

		for (let i = 0; i < particleCount; i++) {
			const graphics = new PIXI.Graphics();
			const baseRadius = 1.5 + Math.random() * 3;
			const hue = (i / particleCount) * 360;

			graphics.circle(0, 0, baseRadius);
			graphics.fill({ color: hslToHex(hue, 80, 60), alpha: 0.7 });

			graphics.x = Math.random() * width;
			graphics.y = Math.random() * height;

			app.stage.addChild(graphics);

			particles.push({
				graphics,
				x: graphics.x,
				y: graphics.y,
				vx: (Math.random() - 0.5) * 0.5,
				vy: (Math.random() - 0.5) * 0.5,
				baseRadius,
				frequencyBin: Math.floor((i / particleCount) * 128),
				hue,
			});
		}
	}

	function hslToHex(h: number, s: number, l: number): number {
		s /= 100;
		l /= 100;
		const a = s * Math.min(l, 1 - l);
		const f = (n: number) => {
			const k = (n + h / 30) % 12;
			const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
			return Math.round(255 * color);
		};
		return (f(0) << 16) | (f(8) << 8) | f(4);
	}

	function updateParticles() {
		const frequencyData = getFrequencyData();
		if (!frequencyData || !app) return;

		const w = app.canvas.width;
		const h = app.canvas.height;

		// Calculate energy bands
		let bassEnergy = 0;
		const bassEnd = Math.floor(frequencyData.length * 0.15);
		for (let i = 0; i < bassEnd; i++) bassEnergy += frequencyData[i];
		bassEnergy = bassEnergy / bassEnd / 255;

		for (const p of particles) {
			const freq = frequencyData[p.frequencyBin] / 255;

			// Bass makes particles expand and move faster
			const energy = freq * 0.7 + bassEnergy * 0.3;
			const speed = 0.3 + energy * 3;

			p.vx += (Math.random() - 0.5) * speed * 0.3;
			p.vy += (Math.random() - 0.5) * speed * 0.3;

			// Damping
			p.vx *= 0.96;
			p.vy *= 0.96;

			// Gravity toward center on bass hits
			if (bassEnergy > 0.6) {
				const cx = w / 2;
				const cy = h / 2;
				const dx = cx - p.x;
				const dy = cy - p.y;
				const dist = Math.sqrt(dx * dx + dy * dy) + 1;
				p.vx += (dx / dist) * bassEnergy * 0.5;
				p.vy += (dy / dist) * bassEnergy * 0.5;
			}

			p.x += p.vx;
			p.y += p.vy;

			// Wrap around edges
			if (p.x < 0) p.x = w;
			if (p.x > w) p.x = 0;
			if (p.y < 0) p.y = h;
			if (p.y > h) p.y = 0;

			p.graphics.x = p.x;
			p.graphics.y = p.y;

			// Scale based on frequency energy
			const scale = 1 + energy * 3;
			p.graphics.scale.set(scale);

			// Alpha based on energy
			p.graphics.alpha = 0.3 + energy * 0.7;

			// Redraw with updated color
			if (colorMode === 'spectrum') {
				const hue = (p.hue + energy * 60) % 360;
				const lightness = 50 + energy * 30;
				p.graphics.clear();
				p.graphics.circle(0, 0, p.baseRadius);
				p.graphics.fill({ color: hslToHex(hue, 85, lightness), alpha: 0.3 + energy * 0.7 });
			} else if (colorMode === 'pulse') {
				const hue = 200 + bassEnergy * 120;
				p.graphics.clear();
				p.graphics.circle(0, 0, p.baseRadius);
				p.graphics.fill({ color: hslToHex(hue, 90, 55 + energy * 25), alpha: 0.3 + energy * 0.7 });
			}
		}
	}

	// Initialize when playing starts
	$effect(() => {
		if (playerStore.isPlaying && container && !isInitialized) {
			initPixi();
		}
	});

	// Ticker-based render loop
	$effect(() => {
		if (isInitialized && app) {
			if (playerStore.isPlaying) {
				app.ticker.add(updateParticles);
			} else {
				app.ticker.remove(updateParticles);
			}
		}
		return () => {
			if (app) {
				app.ticker.remove(updateParticles);
			}
		};
	});

	// Cleanup
	$effect(() => {
		return () => {
			if (app) {
				app.destroy(true);
				app = null;
				isInitialized = false;
				particles = [];
			}
		};
	});
</script>

<div
	bind:this={container}
	class="w-full rounded-lg overflow-hidden"
	style="height: {height}px;"
	aria-hidden="true"
></div>
