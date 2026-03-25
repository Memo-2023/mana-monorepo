<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { decksStore } from '$lib/stores/decks.svelte';
	import { PresiEvents } from '@manacore/shared-utils/analytics';
	import type { Slide } from '@presi/shared';
	import {
		X,
		CaretLeft,
		CaretRight,
		Play,
		Pause,
		Eye,
		EyeSlash,
		ArrowsOut,
		ArrowsIn,
		Clock,
	} from '@manacore/shared-icons';

	let currentSlideIndex = $state(0);
	let isFullscreen = $state(false);
	let showNotes = $state(false);
	let isTimerRunning = $state(false);
	let elapsedSeconds = $state(0);
	let showControls = $state(true);
	let hideControlsTimeout: ReturnType<typeof setTimeout> | null = null;
	let timerInterval: ReturnType<typeof setInterval> | null = null;

	const deckId = $page.params.id as string;

	let maxSlideReached = $state(0);

	onMount(() => {
		decksStore.loadDeck(deckId).then(() => {
			PresiEvents.presentationStarted(decksStore.currentSlides.length);
		});

		// Keyboard navigation
		window.addEventListener('keydown', handleKeydown);
		window.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('fullscreenchange', handleFullscreenChange);

		return () => {
			window.removeEventListener('keydown', handleKeydown);
			window.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			if (timerInterval) clearInterval(timerInterval);
			if (hideControlsTimeout) clearTimeout(hideControlsTimeout);
			decksStore.clearCurrent();
		};
	});

	function handleKeydown(e: KeyboardEvent) {
		switch (e.key) {
			case 'ArrowLeft':
			case 'a':
				prevSlide();
				break;
			case 'ArrowRight':
			case 'd':
			case ' ':
				nextSlide();
				break;
			case 'Escape':
				exitPresentation();
				break;
			case 'f':
				toggleFullscreen();
				break;
		}
		resetHideControlsTimer();
	}

	function handleMouseMove() {
		showControls = true;
		resetHideControlsTimer();
	}

	function resetHideControlsTimer() {
		if (hideControlsTimeout) clearTimeout(hideControlsTimeout);
		hideControlsTimeout = setTimeout(() => {
			showControls = false;
		}, 3000);
	}

	function handleFullscreenChange() {
		isFullscreen = !!document.fullscreenElement;
	}

	function prevSlide() {
		if (currentSlideIndex > 0) {
			currentSlideIndex--;
		}
	}

	function nextSlide() {
		if (currentSlideIndex < decksStore.currentSlides.length - 1) {
			currentSlideIndex++;
			if (currentSlideIndex > maxSlideReached) maxSlideReached = currentSlideIndex;
		}
	}

	function goToSlide(index: number) {
		currentSlideIndex = index;
	}

	function toggleFullscreen() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
		} else {
			document.exitFullscreen();
		}
	}

	function toggleTimer() {
		isTimerRunning = !isTimerRunning;
		if (isTimerRunning) {
			timerInterval = setInterval(() => {
				elapsedSeconds++;
			}, 1000);
		} else if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function exitPresentation() {
		PresiEvents.presentationExited(elapsedSeconds, maxSlideReached + 1);
		if (document.fullscreenElement) {
			document.exitFullscreen();
		}
		goto(`/deck/${deckId}`);
	}

	const currentSlide = $derived(decksStore.currentSlides[currentSlideIndex]);
</script>

<svelte:head>
	<title>Presenting: {decksStore.currentDeck?.title || 'Loading...'}</title>
</svelte:head>

<div class="fixed inset-0 bg-slate-900 text-white flex flex-col">
	{#if decksStore.isLoading}
		<div class="flex-1 flex items-center justify-center">
			<div
				class="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"
			></div>
		</div>
	{:else if currentSlide}
		<!-- Top Bar -->
		<div
			class="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent transition-opacity duration-300"
			class:opacity-0={!showControls}
			class:pointer-events-none={!showControls}
		>
			<div class="flex items-center gap-4">
				<h1 class="text-lg font-medium truncate max-w-xs">{decksStore.currentDeck?.title}</h1>
				<span class="text-sm text-slate-400">
					Slide {currentSlideIndex + 1} of {decksStore.currentSlides.length}
				</span>
			</div>
			<button
				onclick={exitPresentation}
				class="p-2 hover:bg-white/10 rounded-lg transition-colors"
				aria-label="Exit presentation"
			>
				<X class="w-6 h-6" />
			</button>
		</div>

		<!-- Main Slide Area -->
		<div class="flex-1 flex items-center justify-center p-8 pt-20 pb-32">
			<div
				class="w-full max-w-6xl aspect-video bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center justify-center p-12"
			>
				{#if currentSlide.content.imageUrl}
					<img
						src={currentSlide.content.imageUrl}
						alt={currentSlide.content.title || 'Slide image'}
						class="max-w-full max-h-full object-contain"
					/>
				{:else}
					<div class="text-center max-w-4xl">
						{#if currentSlide.content.title}
							<h2 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
								{currentSlide.content.title}
							</h2>
						{/if}
						{#if currentSlide.content.body}
							<p class="text-xl md:text-2xl text-slate-300 mb-8">{currentSlide.content.body}</p>
						{/if}
						{#if currentSlide.content.bulletPoints?.length}
							<ul class="text-left text-xl md:text-2xl space-y-4 mx-auto max-w-2xl">
								{#each currentSlide.content.bulletPoints as point}
									<li class="flex items-start gap-4">
										<span class="text-primary-400 mt-1">•</span>
										<span>{point}</span>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<!-- Speaker Notes -->
		{#if showNotes && currentSlide.content.subtitle}
			<div class="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
				<div class="bg-slate-800/90 rounded-lg p-4 backdrop-blur-sm">
					<h3 class="text-sm font-medium text-slate-400 mb-2">Speaker Notes</h3>
					<p class="text-slate-200">{currentSlide.content.subtitle}</p>
				</div>
			</div>
		{/if}

		<!-- Bottom Controls -->
		<div
			class="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/50 to-transparent transition-opacity duration-300"
			class:opacity-0={!showControls}
			class:pointer-events-none={!showControls}
		>
			<div class="max-w-4xl mx-auto flex items-center justify-between">
				<!-- Left: Timer -->
				<div class="flex items-center gap-4">
					<button
						onclick={toggleTimer}
						class="p-2 hover:bg-white/10 rounded-lg transition-colors"
						aria-label={isTimerRunning ? 'Pause timer' : 'Start timer'}
					>
						{#if isTimerRunning}
							<Pause class="w-5 h-5" />
						{:else}
							<Play class="w-5 h-5" />
						{/if}
					</button>
					<div class="flex items-center gap-2 text-slate-300">
						<Clock class="w-4 h-4" />
						<span class="font-mono">{formatTime(elapsedSeconds)}</span>
					</div>
				</div>

				<!-- Center: Navigation -->
				<div class="flex items-center gap-2">
					<button
						onclick={prevSlide}
						disabled={currentSlideIndex === 0}
						class="p-3 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
						aria-label="Previous slide"
					>
						<CaretLeft class="w-6 h-6" />
					</button>

					<!-- Slide Dots -->
					<div class="flex items-center gap-2 px-4">
						{#each decksStore.currentSlides as _, index}
							<button
								onclick={() => goToSlide(index)}
								class="w-2 h-2 rounded-full transition-all"
								class:bg-primary-500={index === currentSlideIndex}
								class:w-4={index === currentSlideIndex}
								class:bg-slate-500={index !== currentSlideIndex}
								aria-label="Go to slide {index + 1}"
							></button>
						{/each}
					</div>

					<button
						onclick={nextSlide}
						disabled={currentSlideIndex === decksStore.currentSlides.length - 1}
						class="p-3 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
						aria-label="Next slide"
					>
						<CaretRight class="w-6 h-6" />
					</button>
				</div>

				<!-- Right: Options -->
				<div class="flex items-center gap-2">
					<button
						onclick={() => (showNotes = !showNotes)}
						class="p-2 hover:bg-white/10 rounded-lg transition-colors"
						aria-label={showNotes ? 'Hide notes' : 'Show notes'}
					>
						{#if showNotes}
							<EyeSlash class="w-5 h-5" />
						{:else}
							<Eye class="w-5 h-5" />
						{/if}
					</button>
					<button
						onclick={toggleFullscreen}
						class="p-2 hover:bg-white/10 rounded-lg transition-colors"
						aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
					>
						{#if isFullscreen}
							<ArrowsIn class="w-5 h-5" />
						{:else}
							<ArrowsOut class="w-5 h-5" />
						{/if}
					</button>
				</div>
			</div>
		</div>
	{:else}
		<div class="flex-1 flex items-center justify-center">
			<p class="text-slate-400">No slides in this deck</p>
		</div>
	{/if}
</div>
