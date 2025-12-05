<script lang="ts">
	import { MANA_APPS, getActiveManaApps } from '@manacore/shared-branding';

	let { isOpen = $bindable(false) } = $props();

	// Get only active (non-archived) apps
	const apps = getActiveManaApps();

	function close() {
		isOpen = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- Backdrop -->
	<button
		class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
		onclick={close}
		aria-label="Close app menu"
		tabindex="-1"
	></button>

	<!-- Slider -->
	<div class="fixed left-0 top-0 z-50 h-full w-80 bg-card shadow-xl overflow-y-auto">
		<div class="p-4">
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-lg font-semibold">ManaCore Apps</h2>
				<button onclick={close} class="rounded-lg p-2 hover:bg-accent" aria-label="Close">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<div class="grid grid-cols-3 gap-3">
				{#each apps as app}
					<a
						href={app.url || '#'}
						class="flex flex-col items-center gap-2 rounded-lg p-3 hover:bg-accent transition-colors {app.comingSoon
							? 'opacity-50'
							: ''}"
						target="_blank"
						rel="noopener noreferrer"
					>
						<div
							class="h-12 w-12 rounded-xl flex items-center justify-center overflow-hidden"
							style="background-color: {app.color}20;"
						>
							<img src={app.icon} alt={app.name} class="h-8 w-8" />
						</div>
						<span class="text-xs text-center font-medium">{app.name}</span>
					</a>
				{/each}
			</div>
		</div>
	</div>
{/if}
