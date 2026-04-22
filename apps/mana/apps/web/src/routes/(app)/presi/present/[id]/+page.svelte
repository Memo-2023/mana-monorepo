<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { useDeck, useDeckSlides } from '$lib/modules/presi/queries';
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
	} from '@mana/shared-icons';

	let currentSlideIndex = $state(0);
	let isFullscreen = $state(false);
	let showNotes = $state(false);
	let isTimerRunning = $state(false);
	let elapsedSeconds = $state(0);
	let showControls = $state(true);
	let hideControlsTimeout: ReturnType<typeof setTimeout> | null = null;
	let timerInterval: ReturnType<typeof setInterval> | null = null;

	const deckId = $page.params.id as string;
	const deckQuery = useDeck(deckId);
	const slidesQuery = useDeckSlides(deckId);
	let currentDeck = $derived(deckQuery.value);
	let currentSlides = $derived(slidesQuery.value ?? []);
	const currentSlide = $derived(currentSlides[currentSlideIndex]);

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		window.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () => {
			window.removeEventListener('keydown', handleKeydown);
			window.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			if (timerInterval) clearInterval(timerInterval);
			if (hideControlsTimeout) clearTimeout(hideControlsTimeout);
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
		if (currentSlideIndex > 0) currentSlideIndex--;
	}
	function nextSlide() {
		if (currentSlideIndex < currentSlides.length - 1) currentSlideIndex++;
	}
	function goToSlide(index: number) {
		currentSlideIndex = index;
	}
	function toggleFullscreen() {
		if (!document.fullscreenElement) document.documentElement.requestFullscreen();
		else document.exitFullscreen();
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
		if (document.fullscreenElement) document.exitFullscreen();
		goto(`/presi/deck/${deckId}`);
	}
</script>

<svelte:head><title>Presenting: {currentDeck?.title || 'Loading...'}</title></svelte:head>

<div class="fixed inset-0 bg-card text-white flex flex-col">
	{#if currentSlide}
		<div
			class="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent transition-opacity duration-300"
			class:opacity-0={!showControls}
			class:pointer-events-none={!showControls}
		>
			<div class="flex items-center gap-4">
				<h1 class="text-lg font-medium truncate max-w-xs">{currentDeck?.title}</h1>
				<span class="text-sm text-muted-foreground"
					>Slide {currentSlideIndex + 1} of {currentSlides.length}</span
				>
			</div>
			<button onclick={exitPresentation} class="p-2 hover:bg-muted/10 rounded-lg transition-colors"
				><X class="w-6 h-6" /></button
			>
		</div>

		<div class="flex-1 flex items-center justify-center p-8 pt-20 pb-32">
			<div
				class="w-full max-w-6xl aspect-video bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center justify-center p-12"
			>
				{#if currentSlide.content.imageUrl}
					<img
						src={currentSlide.content.imageUrl}
						alt={currentSlide.content.title || 'Slide'}
						class="max-w-full max-h-full object-contain"
					/>
				{:else}
					<div class="text-center max-w-4xl">
						{#if currentSlide.content.title}<h2
								class="text-4xl md:text-5xl lg:text-6xl font-bold mb-8"
							>
								{currentSlide.content.title}
							</h2>{/if}
						{#if currentSlide.content.body}<p class="text-xl md:text-2xl text-foreground/90 mb-8">
								{currentSlide.content.body}
							</p>{/if}
						{#if currentSlide.content.bulletPoints?.length}
							<ul class="text-left text-xl md:text-2xl space-y-4 mx-auto max-w-2xl">
								{#each currentSlide.content.bulletPoints as point}
									<li class="flex items-start gap-4">
										<span class="text-primary-400 mt-1">•</span><span>{point}</span>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<div
			class="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/50 to-transparent transition-opacity duration-300"
			class:opacity-0={!showControls}
			class:pointer-events-none={!showControls}
		>
			<div class="max-w-4xl mx-auto flex items-center justify-between">
				<div class="flex items-center gap-4">
					<button onclick={toggleTimer} class="p-2 hover:bg-muted/10 rounded-lg transition-colors">
						{#if isTimerRunning}<Pause class="w-5 h-5" />{:else}<Play class="w-5 h-5" />{/if}
					</button>
					<div class="flex items-center gap-2 text-foreground/90">
						<Clock class="w-4 h-4" /><span class="font-mono">{formatTime(elapsedSeconds)}</span>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<button
						onclick={prevSlide}
						disabled={currentSlideIndex === 0}
						class="p-3 hover:bg-muted/10 rounded-lg transition-colors disabled:opacity-30"
						><CaretLeft class="w-6 h-6" /></button
					>
					<div class="flex items-center gap-2 px-4">
						{#each currentSlides as _, index}
							<!-- svelte-ignore a11y_consider_explicit_label -->
							<button
								onclick={() => goToSlide(index)}
								class="w-2 h-2 rounded-full transition-all"
								class:bg-primary-500={index === currentSlideIndex}
								class:w-4={index === currentSlideIndex}
								class:bg-muted={index !== currentSlideIndex}
							></button>
						{/each}
					</div>
					<button
						onclick={nextSlide}
						disabled={currentSlideIndex === currentSlides.length - 1}
						class="p-3 hover:bg-muted/10 rounded-lg transition-colors disabled:opacity-30"
						><CaretRight class="w-6 h-6" /></button
					>
				</div>
				<div class="flex items-center gap-2">
					<button
						onclick={() => (showNotes = !showNotes)}
						class="p-2 hover:bg-muted/10 rounded-lg transition-colors"
					>
						{#if showNotes}<EyeSlash class="w-5 h-5" />{:else}<Eye class="w-5 h-5" />{/if}
					</button>
					<button
						onclick={toggleFullscreen}
						class="p-2 hover:bg-muted/10 rounded-lg transition-colors"
					>
						{#if isFullscreen}<ArrowsIn class="w-5 h-5" />{:else}<ArrowsOut class="w-5 h-5" />{/if}
					</button>
				</div>
			</div>
		</div>
	{:else}
		<div class="flex-1 flex items-center justify-center">
			<p class="text-muted-foreground">No slides in this deck</p>
		</div>
	{/if}
</div>
