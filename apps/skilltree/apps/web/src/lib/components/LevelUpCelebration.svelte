<script lang="ts">
	import { LEVEL_NAMES } from '$lib/types';
	import { Star, Trophy, Sparkle } from '@manacore/shared-icons';
	import { onMount } from 'svelte';

	interface Props {
		skillName: string;
		newLevel: number;
		onClose: () => void;
	}

	let { skillName, newLevel, onClose }: Props = $props();

	const levelName = LEVEL_NAMES[newLevel] ?? 'Unbekannt';

	// Auto-close after 4 seconds
	onMount(() => {
		const timer = setTimeout(onClose, 4000);
		return () => clearTimeout(timer);
	});

	function getLevelColor(level: number): string {
		const colors = [
			'from-gray-500 to-gray-600',
			'from-blue-500 to-blue-600',
			'from-purple-500 to-purple-600',
			'from-pink-500 to-pink-600',
			'from-orange-500 to-orange-600',
			'from-yellow-400 to-yellow-500',
		];
		return colors[level] ?? colors[0];
	}
</script>

<div
	class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
	onclick={onClose}
	role="dialog"
	aria-modal="true"
>
	<div class="celebration-container text-center">
		<!-- Sparkle effects -->
		<div class="sparkles">
			{#each Array(12) as _, i}
				<div class="sparkle" style="--delay: {i * 0.1}s; --angle: {i * 30}deg">
					<Sparkle class="h-6 w-6 text-yellow-400" />
				</div>
			{/each}
		</div>

		<!-- Main content -->
		<div class="relative z-10">
			<!-- Trophy icon -->
			<div
				class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br {getLevelColor(
					newLevel
				)} level-up-bounce shadow-lg shadow-yellow-500/30"
			>
				<Trophy class="h-12 w-12 text-white" />
			</div>

			<!-- Level up text -->
			<h2 class="mb-2 text-3xl font-bold text-white level-up-text">LEVEL UP!</h2>

			<!-- Skill name -->
			<p class="mb-4 text-xl text-gray-300">{skillName}</p>

			<!-- New level badge -->
			<div
				class="inline-flex items-center gap-2 rounded-full bg-gradient-to-r {getLevelColor(
					newLevel
				)} px-6 py-3 text-lg font-bold text-white shadow-lg"
			>
				<Star class="h-5 w-5 fill-current" />
				Level {newLevel} - {levelName}
				<Star class="h-5 w-5 fill-current" />
			</div>

			<!-- Stars -->
			<div class="mt-6 flex justify-center gap-2">
				{#each Array(newLevel) as _, i}
					<Star
						class="h-8 w-8 fill-yellow-400 text-yellow-400 star-pop"
						style="animation-delay: {0.5 + i * 0.1}s"
					/>
				{/each}
			</div>

			<!-- Click to close -->
			<p class="mt-6 text-sm text-gray-500">Klicken zum Schließen</p>
		</div>
	</div>
</div>

<style>
	.celebration-container {
		position: relative;
		padding: 2rem;
	}

	.sparkles {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.sparkle {
		position: absolute;
		top: 50%;
		left: 50%;
		animation: sparkle-fly 1s ease-out forwards;
		animation-delay: var(--delay);
		opacity: 0;
	}

	@keyframes sparkle-fly {
		0% {
			transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0);
			opacity: 1;
		}
		100% {
			transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-150px);
			opacity: 0;
		}
	}

	.level-up-bounce {
		animation: level-bounce 0.6s ease-out;
	}

	@keyframes level-bounce {
		0% {
			transform: scale(0);
		}
		50% {
			transform: scale(1.2);
		}
		70% {
			transform: scale(0.9);
		}
		100% {
			transform: scale(1);
		}
	}

	.level-up-text {
		animation: text-glow 1s ease-in-out infinite alternate;
	}

	@keyframes text-glow {
		from {
			text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
		}
		to {
			text-shadow:
				0 0 30px rgba(251, 191, 36, 0.8),
				0 0 60px rgba(251, 191, 36, 0.4);
		}
	}

	:global(.star-pop) {
		opacity: 0;
		animation: star-pop 0.4s ease-out forwards;
	}

	@keyframes star-pop {
		0% {
			transform: scale(0) rotate(-180deg);
			opacity: 0;
		}
		100% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
	}
</style>
