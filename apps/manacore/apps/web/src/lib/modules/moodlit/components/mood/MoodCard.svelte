<script lang="ts">
	import type { Mood } from '$lib/modules/moodlit/types';
	import { getMoodGradient } from '$lib/modules/moodlit/default-moods';
	import { Heart } from '@manacore/shared-icons';

	interface Props {
		mood: Mood;
		isActive?: boolean;
		isFavorite?: boolean;
		showFavorite?: boolean;
		onClick?: () => void;
		onFavoriteToggle?: () => void;
	}

	let {
		mood,
		isActive = false,
		isFavorite = false,
		showFavorite = true,
		onClick,
		onFavoriteToggle,
	}: Props = $props();

	const gradient = $derived(getMoodGradient(mood));
	const animationClass = $derived(getAnimationClass(mood.animationType));

	function getAnimationClass(type: string): string {
		switch (type) {
			case 'pulse':
			case 'breath':
				return 'animate-pulse-slow';
			case 'wave':
				return 'animate-wave';
			case 'candle':
				return 'animate-candle';
			case 'disco':
			case 'rave':
				return 'animate-disco';
			case 'thunder':
				return 'animate-thunder';
			default:
				return '';
		}
	}

	function handleFavoriteClick(e: MouseEvent) {
		e.stopPropagation();
		onFavoriteToggle?.();
	}

	function handleClick() {
		onClick?.();
	}
</script>

<button
	type="button"
	class="mood-card group relative w-full overflow-hidden rounded-2xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
	class:ring-2={isActive}
	class:ring-primary={isActive}
	onclick={handleClick}
>
	<!-- Gradient Background -->
	<div class="aspect-[16/10] w-full {animationClass}" style="background: {gradient};"></div>

	<!-- Overlay gradient for text readability -->
	<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

	<!-- Content -->
	<div class="absolute inset-x-0 bottom-0 p-4">
		<div class="flex items-end justify-between">
			<div class="text-left">
				<h3 class="font-semibold text-white drop-shadow-md">{mood.name}</h3>
				<p class="text-xs text-white/70 capitalize">{mood.animationType}</p>
			</div>

			{#if showFavorite}
				<button
					type="button"
					class="rounded-full p-1.5 transition-colors hover:bg-white/20"
					onclick={handleFavoriteClick}
					aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
				>
					<Heart
						size={20}
						weight={isFavorite ? 'fill' : 'regular'}
						class={isFavorite ? 'text-red-500' : 'text-white/70'}
					/>
				</button>
			{/if}
		</div>
	</div>

	<!-- Custom badge -->
	{#if mood.isCustom}
		<div class="absolute right-2 top-2">
			<span class="rounded-full bg-primary/80 px-2 py-0.5 text-xs font-medium text-white">
				Custom
			</span>
		</div>
	{/if}
</button>

<style>
	@keyframes pulse-slow {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.85;
			transform: scale(1.01);
		}
	}

	@keyframes wave {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
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
			filter: brightness(1.05);
		}
		75% {
			opacity: 0.95;
			filter: brightness(0.9);
		}
	}

	@keyframes disco {
		0%,
		100% {
			filter: hue-rotate(0deg);
		}
		50% {
			filter: hue-rotate(180deg);
		}
	}

	@keyframes thunder {
		0%,
		95%,
		100% {
			opacity: 1;
		}
		97% {
			opacity: 1;
			filter: brightness(3);
		}
	}

	.animate-pulse-slow {
		animation: pulse-slow 4s ease-in-out infinite;
	}

	.animate-wave {
		animation: wave 3s ease-in-out infinite;
	}

	.animate-candle {
		animation: candle 0.8s ease-in-out infinite;
	}

	.animate-disco {
		animation: disco 2s linear infinite;
	}

	.animate-thunder {
		animation: thunder 5s ease-in-out infinite;
	}
</style>
