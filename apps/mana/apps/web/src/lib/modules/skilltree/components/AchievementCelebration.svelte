<script lang="ts">
	import type { AchievementUnlockResult } from '../types';
	import { RARITY_INFO } from '../types';
	import { Trophy, Sparkle, Star } from '@mana/shared-icons';
	import { onMount } from 'svelte';

	interface Props {
		result: AchievementUnlockResult;
		onClose: () => void;
	}

	let { result, onClose }: Props = $props();

	// svelte-ignore state_referenced_locally
	const rarity = RARITY_INFO[result.achievement.rarity];

	function getRarityGradient(r: string): string {
		const gradients: Record<string, string> = {
			common: 'from-gray-500 to-gray-600',
			uncommon: 'from-green-500 to-green-600',
			rare: 'from-blue-500 to-blue-600',
			epic: 'from-purple-500 to-purple-600',
			legendary: 'from-yellow-400 to-yellow-500',
		};
		return gradients[r] ?? gradients.common;
	}

	// Auto-close after 3.5 seconds
	onMount(() => {
		const timer = setTimeout(onClose, 3500);
		return () => clearTimeout(timer);
	});
</script>

<div
	class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
	onclick={onClose}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	tabindex="-1"
	role="dialog"
	aria-modal="true"
>
	<div class="celebration-container text-center">
		<!-- Sparkle effects -->
		<div class="sparkles">
			{#each Array(10) as _, i}
				<div class="sparkle" style="--delay: {i * 0.08}s; --angle: {i * 36}deg">
					<Sparkle class="h-5 w-5 text-yellow-400" />
				</div>
			{/each}
		</div>

		<!-- Main content -->
		<div class="relative z-10">
			<!-- Trophy icon -->
			<div
				class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br {getRarityGradient(
					result.achievement.rarity
				)} achievement-bounce shadow-lg shadow-yellow-500/20"
			>
				<Trophy class="h-10 w-10 text-white" />
			</div>

			<!-- Achievement unlocked text -->
			<h2 class="mb-1 text-2xl font-bold text-yellow-400 achievement-text">
				Achievement freigeschaltet!
			</h2>

			<!-- Achievement name -->
			<p class="mb-2 text-xl font-semibold text-white">{result.achievement.name}</p>

			<!-- Description -->
			<p class="mb-4 text-muted-foreground">{result.achievement.description}</p>

			<!-- Rarity + XP reward -->
			<div class="inline-flex items-center gap-3">
				<span class="rounded-full px-3 py-1 text-sm font-medium {rarity.color} {rarity.bgColor}">
					{rarity.name}
				</span>
				<span class="flex items-center gap-1 text-yellow-400">
					<Star class="h-4 w-4" />
					+{result.xpReward} XP
				</span>
			</div>

			<!-- Click to close -->
			<p class="mt-6 text-sm text-muted-foreground">Klicken zum Schließen</p>
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
		animation: sparkle-fly 0.8s ease-out forwards;
		animation-delay: var(--delay);
		opacity: 0;
	}

	@keyframes sparkle-fly {
		0% {
			transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0);
			opacity: 1;
		}
		100% {
			transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-120px);
			opacity: 0;
		}
	}

	.achievement-bounce {
		animation: ach-bounce 0.5s ease-out;
	}

	@keyframes ach-bounce {
		0% {
			transform: scale(0);
		}
		60% {
			transform: scale(1.15);
		}
		100% {
			transform: scale(1);
		}
	}

	.achievement-text {
		animation: ach-glow 1s ease-in-out infinite alternate;
	}

	@keyframes ach-glow {
		from {
			text-shadow: 0 0 8px rgba(251, 191, 36, 0.4);
		}
		to {
			text-shadow:
				0 0 20px rgba(251, 191, 36, 0.6),
				0 0 40px rgba(251, 191, 36, 0.3);
		}
	}
</style>
