<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { shareApi } from '$lib/api/client';
  import type { Slide } from '@presi/shared';
  import {
    ChevronLeft, ChevronRight, Play, Pause,
    Maximize, Minimize, Clock, Presentation, AlertCircle
  } from 'lucide-svelte';

  let deck = $state<any>(null);
  let slides = $state<Slide[]>([]);
  let isLoading = $state(true);
  let error = $state('');
  let currentSlideIndex = $state(0);
  let isFullscreen = $state(false);
  let isTimerRunning = $state(false);
  let elapsedSeconds = $state(0);
  let showControls = $state(true);
  let hideControlsTimeout: ReturnType<typeof setTimeout> | null = null;
  let timerInterval: ReturnType<typeof setInterval> | null = null;

  const shareCode = $page.params.code as string;

  async function loadSharedDeck() {
    try {
      const data = await shareApi.getByCode(shareCode);
      deck = data;
      slides = data.slides || [];
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load shared deck';
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadSharedDeck();

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
    if (currentSlideIndex < slides.length - 1) {
      currentSlideIndex++;
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

  const currentSlide = $derived(slides[currentSlideIndex]);
</script>

<svelte:head>
  <title>{deck?.title || 'Shared Presentation'} - Presi</title>
</svelte:head>

<div class="fixed inset-0 bg-slate-900 text-white flex flex-col">
  {#if isLoading}
    <div class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
    </div>
  {:else if error}
    <div class="flex-1 flex flex-col items-center justify-center px-4">
      <div class="p-4 bg-red-900/30 rounded-full mb-4">
        <AlertCircle class="w-12 h-12 text-red-400" />
      </div>
      <h1 class="text-2xl font-bold mb-2">Unable to load presentation</h1>
      <p class="text-slate-400 text-center max-w-md mb-6">{error}</p>
      <a
        href="/login"
        class="px-6 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors"
      >
        Sign in to Presi
      </a>
    </div>
  {:else if currentSlide}
    <!-- Top Bar -->
    <div
      class="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent transition-opacity duration-300"
      class:opacity-0={!showControls}
      class:pointer-events-none={!showControls}
    >
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2 text-primary-400">
          <Presentation class="w-5 h-5" />
          <span class="text-sm font-medium">Presi</span>
        </div>
        <h1 class="text-lg font-medium truncate max-w-xs">{deck?.title}</h1>
        <span class="text-sm text-slate-400">
          Slide {currentSlideIndex + 1} of {slides.length}
        </span>
      </div>
      <a
        href="/login"
        class="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-medium transition-colors"
      >
        Sign in
      </a>
    </div>

    <!-- Main Slide Area -->
    <div class="flex-1 flex items-center justify-center p-8 pt-20 pb-32">
      <div class="w-full max-w-6xl aspect-video bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center justify-center p-12">
        {#if currentSlide.content.imageUrl}
          <img
            src={currentSlide.content.imageUrl}
            alt={currentSlide.content.title || 'Slide image'}
            class="max-w-full max-h-full object-contain"
          />
        {:else}
          <div class="text-center max-w-4xl">
            {#if currentSlide.content.title}
              <h2 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">{currentSlide.content.title}</h2>
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
            <ChevronLeft class="w-6 h-6" />
          </button>

          <!-- Slide Dots -->
          <div class="flex items-center gap-2 px-4">
            {#each slides as _, index}
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
            disabled={currentSlideIndex === slides.length - 1}
            class="p-3 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
            aria-label="Next slide"
          >
            <ChevronRight class="w-6 h-6" />
          </button>
        </div>

        <!-- Right: Fullscreen -->
        <div class="flex items-center gap-2">
          <button
            onclick={toggleFullscreen}
            class="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {#if isFullscreen}
              <Minimize class="w-5 h-5" />
            {:else}
              <Maximize class="w-5 h-5" />
            {/if}
          </button>
        </div>
      </div>
    </div>
  {:else}
    <div class="flex-1 flex flex-col items-center justify-center">
      <p class="text-slate-400 mb-4">No slides in this presentation</p>
      <a
        href="/login"
        class="px-6 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors"
      >
        Sign in to Presi
      </a>
    </div>
  {/if}
</div>
