<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { Mood } from '$lib/types/mood';
	import { getMoodGradient } from '$lib/data/default-moods';
	import { X, Pause, Play, Heart, Timer } from '@manacore/shared-icons';

	interface Props {
		mood: Mood;
		isFavorite?: boolean;
		onClose: () => void;
		onFavoriteToggle?: () => void;
	}

	let { mood, isFavorite = false, onClose, onFavoriteToggle }: Props = $props();

	let isPlaying = $state(true);
	let showControls = $state(true);
	let controlsTimeout: ReturnType<typeof setTimeout> | null = null;
	let timerActive = $state(false);
	let timerMinutes = $state(5);
	let timerRemaining = $state(0);
	let timerInterval: ReturnType<typeof setInterval> | null = null;

	const gradient = $derived(getMoodGradient(mood));
	const animationClass = $derived(getAnimationClass(mood.animationType));

	function getAnimationClass(type: string): string {
		switch (type) {
			case 'pulse':
			case 'breath':
				return 'animate-breath';
			case 'wave':
				return 'animate-wave';
			case 'candle':
			case 'fire':
				return 'animate-candle';
			case 'disco':
			case 'rave':
				return 'animate-disco';
			case 'thunder':
				return 'animate-thunder';
			case 'police':
				return 'animate-police';
			case 'warning':
				return 'animate-warning';
			case 'flash':
				return 'animate-flash';
			case 'sos':
				return 'animate-sos';
			case 'scanner':
				return 'animate-scanner';
			case 'matrix':
				return 'animate-matrix';
			case 'sunrise':
				return 'animate-sunrise';
			case 'sunset':
				return 'animate-sunset';
			default:
				return 'animate-gradient';
		}
	}

	function showControlsTemporarily() {
		showControls = true;
		if (controlsTimeout) {
			clearTimeout(controlsTimeout);
		}
		controlsTimeout = setTimeout(() => {
			if (isPlaying) {
				showControls = false;
			}
		}, 3000);
	}

	function togglePlay() {
		isPlaying = !isPlaying;
		if (isPlaying) {
			showControlsTemporarily();
		} else {
			showControls = true;
		}
	}

	function startTimer() {
		timerActive = true;
		timerRemaining = timerMinutes * 60;
		timerInterval = setInterval(() => {
			timerRemaining--;
			if (timerRemaining <= 0) {
				stopTimer();
				onClose();
			}
		}, 1000);
	}

	function stopTimer() {
		timerActive = false;
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		} else if (e.key === ' ') {
			e.preventDefault();
			togglePlay();
		}
	}

	$effect(() => {
		showControlsTemporarily();
		return () => {
			if (controlsTimeout) clearTimeout(controlsTimeout);
			if (timerInterval) clearInterval(timerInterval);
		};
	});
</script>

<svelte:window on:keydown={handleKeydown} />

<div
	class="fixed inset-0 z-50 flex items-center justify-center cursor-pointer select-none"
	onclick={showControlsTemporarily}
	onmousemove={showControlsTemporarily}
	role="presentation"
>
	<!-- Animated Background -->
	<div
		class="absolute inset-0 {animationClass}"
		class:paused={!isPlaying}
		style="background: {gradient}; background-size: 400% 400%;"
	></div>

	<!-- Particle Effects for certain animations -->
	{#if mood.animationType === 'sparkle' || mood.animationType === 'matrix'}
		<div class="particles absolute inset-0 pointer-events-none overflow-hidden">
			{#each Array(20) as _, i}
				<div
					class="particle absolute w-1 h-1 bg-white/60 rounded-full"
					style="left: {Math.random() * 100}%; animation-delay: {Math.random() *
						5}s; animation-duration: {3 + Math.random() * 2}s;"
				></div>
			{/each}
		</div>
	{/if}

	<!-- Controls Overlay -->
	<div
		class="absolute inset-0 flex flex-col transition-opacity duration-300 pointer-events-none"
		class:opacity-0={!showControls}
		class:opacity-100={showControls}
	>
		<!-- Top Bar -->
		<div
			class="flex items-center justify-between p-4 bg-gradient-to-b from-black/40 to-transparent pointer-events-auto"
		>
			<div class="flex items-center gap-3">
				<button
					type="button"
					class="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors"
					onclick={(e) => {
						e.stopPropagation();
						onClose();
					}}
					aria-label="Close"
				>
					<X size={24} class="text-white" />
				</button>
				<div>
					<h1 class="text-xl font-bold text-white drop-shadow-lg">{mood.name}</h1>
					<p class="text-sm text-white/70 capitalize">{mood.animationType}</p>
				</div>
			</div>

			<div class="flex items-center gap-2">
				{#if timerActive}
					<div class="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white font-mono">
						{formatTime(timerRemaining)}
					</div>
				{/if}

				<button
					type="button"
					class="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors"
					onclick={(e) => {
						e.stopPropagation();
						onFavoriteToggle?.();
					}}
					aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
				>
					<Heart
						size={20}
						weight={isFavorite ? 'fill' : 'regular'}
						class={isFavorite ? 'text-red-500' : 'text-white'}
					/>
				</button>
			</div>
		</div>

		<!-- Center Play/Pause -->
		<div class="flex-1 flex items-center justify-center pointer-events-auto">
			<button
				type="button"
				class="p-6 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all hover:scale-110"
				onclick={(e) => {
					e.stopPropagation();
					togglePlay();
				}}
				aria-label={isPlaying ? 'Pause' : 'Play'}
			>
				{#if isPlaying}
					<Pause size={48} class="text-white" />
				{:else}
					<Play size={48} class="text-white" />
				{/if}
			</button>
		</div>

		<!-- Bottom Bar -->
		<div class="p-4 bg-gradient-to-t from-black/40 to-transparent pointer-events-auto">
			<div class="flex items-center justify-center gap-4">
				{#if !timerActive}
					<div class="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
						<Timer size={20} class="text-white" />
						<select
							class="bg-transparent text-white border-none outline-none cursor-pointer"
							bind:value={timerMinutes}
							onclick={(e) => e.stopPropagation()}
						>
							<option value={1}>1 min</option>
							<option value={5}>5 min</option>
							<option value={10}>10 min</option>
							<option value={15}>15 min</option>
							<option value={30}>30 min</option>
							<option value={60}>60 min</option>
						</select>
						<button
							type="button"
							class="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-sm text-white transition-colors"
							onclick={(e) => {
								e.stopPropagation();
								startTimer();
							}}
						>
							{$_('mood.startTimer')}
						</button>
					</div>
				{:else}
					<button
						type="button"
						class="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors"
						onclick={(e) => {
							e.stopPropagation();
							stopTimer();
						}}
					>
						{$_('mood.stopTimer')}
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	/* Base animation styles */
	.animate-gradient {
		animation: gradient-shift 8s ease infinite;
	}

	.animate-breath {
		animation: breath 4s ease-in-out infinite;
	}

	.animate-wave {
		animation: wave 3s ease-in-out infinite;
	}

	.animate-candle {
		animation: candle 0.5s ease-in-out infinite;
	}

	.animate-disco {
		animation: disco 0.5s linear infinite;
	}

	.animate-thunder {
		animation: thunder 5s ease-in-out infinite;
	}

	.animate-police {
		animation: police 0.5s linear infinite;
	}

	.animate-warning {
		animation: warning 0.8s ease-in-out infinite;
	}

	.animate-flash {
		animation: flash 0.2s linear infinite;
	}

	.animate-sos {
		animation: sos 2.5s linear infinite;
	}

	.animate-scanner {
		animation: scanner 2s ease-in-out infinite;
	}

	.animate-matrix {
		animation: matrix 0.1s steps(2) infinite;
	}

	.animate-sunrise {
		animation: sunrise 30s ease-in-out infinite;
	}

	.animate-sunset {
		animation: sunset 30s ease-in-out infinite;
	}

	.paused {
		animation-play-state: paused !important;
	}

	@keyframes gradient-shift {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}

	@keyframes breath {
		0%,
		100% {
			opacity: 0.7;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.02);
		}
	}

	@keyframes wave {
		0%,
		100% {
			background-position: 0% 50%;
			opacity: 1;
		}
		50% {
			background-position: 100% 50%;
			opacity: 0.85;
		}
	}

	@keyframes candle {
		0%,
		100% {
			opacity: 1;
			filter: brightness(1);
		}
		25% {
			opacity: 0.9;
			filter: brightness(0.95);
		}
		50% {
			opacity: 0.85;
			filter: brightness(1.1);
		}
		75% {
			opacity: 0.95;
			filter: brightness(0.92);
		}
	}

	@keyframes disco {
		0% {
			filter: hue-rotate(0deg) saturate(1.2);
		}
		100% {
			filter: hue-rotate(360deg) saturate(1.2);
		}
	}

	@keyframes thunder {
		0%,
		94%,
		100% {
			opacity: 1;
			filter: brightness(1);
		}
		95%,
		97% {
			opacity: 1;
			filter: brightness(3);
		}
	}

	@keyframes police {
		0%,
		49% {
			filter: hue-rotate(0deg);
		}
		50%,
		100% {
			filter: hue-rotate(180deg);
		}
	}

	@keyframes warning {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
	}

	@keyframes flash {
		0%,
		50% {
			opacity: 1;
		}
		51%,
		100% {
			opacity: 0;
		}
	}

	@keyframes sos {
		/* S: ... */
		0%,
		5% {
			opacity: 1;
		}
		5.1%,
		10% {
			opacity: 0;
		}
		10.1%,
		15% {
			opacity: 1;
		}
		15.1%,
		20% {
			opacity: 0;
		}
		20.1%,
		25% {
			opacity: 1;
		}
		25.1%,
		35% {
			opacity: 0;
		}
		/* O: --- */
		35.1%,
		45% {
			opacity: 1;
		}
		45.1%,
		50% {
			opacity: 0;
		}
		50.1%,
		60% {
			opacity: 1;
		}
		60.1%,
		65% {
			opacity: 0;
		}
		65.1%,
		75% {
			opacity: 1;
		}
		75.1%,
		80% {
			opacity: 0;
		}
		/* S: ... */
		80.1%,
		82% {
			opacity: 1;
		}
		82.1%,
		85% {
			opacity: 0;
		}
		85.1%,
		87% {
			opacity: 1;
		}
		87.1%,
		90% {
			opacity: 0;
		}
		90.1%,
		92% {
			opacity: 1;
		}
		92.1%,
		100% {
			opacity: 0;
		}
	}

	@keyframes scanner {
		0%,
		100% {
			filter: brightness(0.8);
		}
		50% {
			filter: brightness(1.5);
		}
	}

	@keyframes matrix {
		0% {
			filter: brightness(1) contrast(1.1);
		}
		50% {
			filter: brightness(0.8) contrast(1.2);
		}
	}

	@keyframes sunrise {
		0% {
			filter: brightness(0.3) saturate(0.5);
		}
		50% {
			filter: brightness(1) saturate(1);
		}
		100% {
			filter: brightness(1.2) saturate(1.2);
		}
	}

	@keyframes sunset {
		0% {
			filter: brightness(1.2) saturate(1.2);
		}
		50% {
			filter: brightness(0.8) saturate(1.5);
		}
		100% {
			filter: brightness(0.3) saturate(0.5);
		}
	}

	/* Particle animation */
	.particle {
		animation: float-up linear infinite;
	}

	@keyframes float-up {
		0% {
			transform: translateY(100vh) scale(0);
			opacity: 0;
		}
		10% {
			opacity: 1;
		}
		90% {
			opacity: 1;
		}
		100% {
			transform: translateY(-10vh) scale(1);
			opacity: 0;
		}
	}
</style>
