<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		stats?: {
			totalUsers: number;
			totalLinks: number;
			totalFolders: number;
			totalClicks: number;
		};
	}

	let { stats = { totalUsers: 0, totalLinks: 0, totalFolders: 0, totalClicks: 0 } }: Props =
		$props();

	let displayStats = $state({
		totalUsers: 0,
		totalLinks: 0,
		totalFolders: 0,
		totalClicks: 0,
	});

	let isVisible = $state(false);

	// Animate numbers counting up
	function animateValue(
		start: number,
		end: number,
		duration: number,
		key: keyof typeof displayStats
	) {
		const range = end - start;
		const startTime = Date.now();

		function update() {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);

			// Easing function for smooth animation
			const easeOutQuart = 1 - Math.pow(1 - progress, 4);
			const current = Math.floor(start + range * easeOutQuart);

			displayStats[key] = current;

			if (progress < 1) {
				requestAnimationFrame(update);
			}
		}

		requestAnimationFrame(update);
	}

	// Format large numbers with commas
	function formatNumber(num: number): string {
		return num.toLocaleString('en-US');
	}

	onMount(() => {
		// Trigger visibility animation
		setTimeout(() => {
			isVisible = true;
		}, 100);

		// Start counter animations after a short delay
		if (stats) {
			setTimeout(() => {
				animateValue(0, stats.totalUsers || 0, 1500, 'totalUsers');
				animateValue(0, stats.totalLinks || 0, 1500, 'totalLinks');
				animateValue(0, stats.totalFolders || 0, 1500, 'totalFolders');
				animateValue(0, stats.totalClicks || 0, 1500, 'totalClicks');
			}, 500);
		}
	});

	const statItems = [
		{
			icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
			label: 'Users',
			key: 'totalUsers' as const,
			color: 'blue',
		},
		{
			icon: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
			label: 'Links',
			key: 'totalLinks' as const,
			color: 'purple',
		},
		{
			icon: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
			label: 'Folders',
			key: 'totalFolders' as const,
			color: 'green',
		},
		{
			icon: 'M22 12h-4l-3 9L9 3l-3 9H2',
			label: 'Clicks',
			key: 'totalClicks' as const,
			color: 'orange',
		},
	];
</script>

<div class="transition-all duration-500 {isVisible ? 'opacity-100' : 'opacity-0'}">
	<!-- Stats bar -->
	<div class="rounded-lg border border-theme-border bg-theme-surface shadow-sm">
		<div class="px-4 py-2 sm:px-6">
			<div class="flex flex-wrap items-center justify-between gap-4">
				{#each statItems as stat}
					<div class="group flex items-center gap-2">
						<!-- Icon -->
						<svg
							class="h-5 w-5 text-theme-text-muted"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d={stat.icon} />
						</svg>

						<!-- Stats text -->
						<div class="flex items-baseline gap-1">
							<span class="text-lg font-bold text-theme-text">
								{formatNumber(displayStats[stat.key] || 0)}
							</span>
							<span class="text-xs text-theme-text-muted">
								{stat.label}
							</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	/* Additional styles for smooth animations */
	@keyframes slideUp {
		from {
			transform: translateY(100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
