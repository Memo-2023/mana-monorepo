<script lang="ts">
	import type { AppItem } from './AppSlider.types';

	interface Props {
		apps: AppItem[];
		title?: string;
		isDark?: boolean;
		statusLabels?: {
			published: string;
			beta: string;
			development: string;
			planning: string;
		};
		comingSoonLabel?: string;
		openAppLabel?: string;
		onAppClick?: (app: AppItem, index: number) => void;
	}

	let {
		apps,
		title = 'Part of the Mana Ecosystem',
		isDark = false,
		statusLabels = {
			published: 'Live',
			beta: 'Beta',
			development: 'In Development',
			planning: 'Planned'
		},
		comingSoonLabel = 'Coming Soon',
		openAppLabel = 'Open App',
		onAppClick
	}: Props = $props();

	let selectedApp = $state<number | null>(null);
	let hoveredApp = $state<number | null>(null);
	let cardRotations = $state<{ [key: number]: { rotateX: number; rotateY: number } }>({});
	let modalScrollContainer = $state<HTMLDivElement | null>(null);

	function getStatusColor(status: AppItem['status']) {
		const colors = {
			published: '#4CAF50',
			beta: '#FFD700',
			development: '#FF9800',
			planning: '#F44336'
		};
		return colors[status];
	}

	function getStatusLabel(status: AppItem['status']) {
		return statusLabels[status];
	}

	function openModal(index: number) {
		selectedApp = index;
	}

	function closeModal() {
		selectedApp = null;
	}

	function handleCardMouseMove(e: MouseEvent, index: number, cardElement: HTMLElement) {
		const rect = cardElement.getBoundingClientRect();
		const cardCenterX = rect.left + rect.width / 2;
		const cardCenterY = rect.top + rect.height / 2;

		const mouseXRelative = e.clientX - cardCenterX;
		const mouseYRelative = e.clientY - cardCenterY;

		const maxRotation = 3;
		const rotateY = (mouseXRelative / (rect.width / 2)) * maxRotation;
		const rotateX = -(mouseYRelative / (rect.height / 2)) * maxRotation;

		cardRotations[index] = { rotateX, rotateY };
	}

	function handleCardMouseLeave(index: number) {
		cardRotations[index] = { rotateX: 0, rotateY: 0 };
	}

	function handleAppAction(app: AppItem, index: number) {
		if (onAppClick) {
			onAppClick(app, index);
		}
	}

	$effect(() => {
		if (selectedApp !== null && modalScrollContainer) {
			const appIndex = selectedApp;
			setTimeout(() => {
				const cardWidth = 360 + 24;
				const scrollPosition = appIndex * cardWidth;
				modalScrollContainer?.scrollTo({
					left: scrollPosition,
					behavior: 'smooth'
				});
			}, 50);
		}
	});
</script>

<div class="w-full">
	<h3
		class="mb-4 text-center text-sm font-medium"
		style="color: {isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'};"
	>
		{title}
	</h3>

	<div class="relative">
		<div class="flex gap-4 justify-center overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory scroll-smooth px-4 py-4" style="perspective: 1000px;">
			{#each apps as app, index}
				<button
					class="group relative flex-shrink-0 rounded-xl p-5 cursor-pointer snap-center transition-transform hover:scale-105"
					style="width: 160px; background-color: {isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.7)'}; backdrop-filter: blur(10px); border: 1px solid {isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};"
					onmouseenter={() => hoveredApp = index}
					onmouseleave={() => hoveredApp = null}
					onclick={() => openModal(index)}
				>
					<div
						class="absolute top-3 right-3 w-3 h-3 rounded-full status-indicator"
						style="background-color: {getStatusColor(app.status)}; box-shadow: 0 0 8px {getStatusColor(app.status)};"
					></div>

					<div class="mb-2 flex h-20 w-20 mx-auto items-center justify-center rounded-xl transition-transform group-hover:scale-110">
						{#if app.icon}
							<img src={app.icon} alt={app.name} class="w-16 h-16 object-contain" />
						{:else}
							<div
								class="flex h-10 w-10 items-center justify-center rounded font-bold text-lg"
								style="color: {app.color};"
							>
								{app.name.charAt(0)}
							</div>
						{/if}
					</div>

					<h4
						class="text-base font-semibold text-center"
						style="color: {isDark ? '#ffffff' : '#000000'};"
					>
						{app.name}
					</h4>
				</button>
			{/each}
		</div>
	</div>
</div>

{#if selectedApp !== null}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center"
		style="background-color: rgba(0, 0, 0, 0.85);"
		onclick={closeModal}
		onkeydown={(e) => e.key === 'Escape' && closeModal()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<button
			onclick={closeModal}
			class="absolute top-6 right-6 rounded-full p-2 transition-all hover:bg-white/10 z-10"
			aria-label="Close modal"
		>
			<svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>

		<div
			bind:this={modalScrollContainer}
			class="absolute inset-0 flex items-center overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth"
		>
			<div class="flex gap-6 px-8 py-8 mx-auto" style="perspective: 1000px;">
				{#each apps as app, index}
					<div
						class="flex-shrink-0 rounded-3xl p-8 snap-center shadow-2xl relative"
						style="min-width: 360px; max-width: 360px; background-color: {hoveredApp === index ? (isDark ? '#2A2A2A' : '#F5F5F5') : (isDark ? '#1E1E1E' : '#ffffff')}; border: 3px solid {app.color}40; transform: perspective(1000px) rotateX({cardRotations[index]?.rotateX || 0}deg) rotateY({cardRotations[index]?.rotateY || 0}deg); transform-style: preserve-3d; transition: transform 0.1s ease-out, background-color 0.2s ease-out;"
						onclick={(e) => { e.stopPropagation(); selectedApp = index; }}
						onmouseenter={() => hoveredApp = index}
						onmousemove={(e) => handleCardMouseMove(e, index, e.currentTarget)}
						onmouseleave={() => { handleCardMouseLeave(index); hoveredApp = null; }}
						onkeydown={() => {}}
						role="button"
						tabindex="0"
					>
						<div class="absolute top-4 right-4 flex items-center gap-2">
							<span class="text-xs font-medium" style="color: {isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'};">
								{getStatusLabel(app.status)}
							</span>
							<div
								class="w-4 h-4 rounded-full status-indicator"
								style="background-color: {getStatusColor(app.status)}; box-shadow: 0 0 12px {getStatusColor(app.status)};"
							></div>
						</div>

						{#if app.icon}
							<img src={app.icon} alt={app.name} class="w-28 h-28 object-contain mb-3 mx-auto" />
						{:else}
							<div
								class="flex h-16 w-16 items-center justify-center rounded font-bold text-3xl mb-3 mx-auto"
								style="color: {app.color};"
							>
								{app.name.charAt(0)}
							</div>
						{/if}

						<h3 class="text-2xl font-bold mb-2 text-center" style="color: {isDark ? '#ffffff' : '#000000'};">
							{app.name}
						</h3>

						<p class="text-sm mb-4 text-center font-medium" style="color: {app.color};">
							{app.description}
						</p>

						<p class="text-sm leading-relaxed mb-6 text-center" style="color: {isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'};">
							{app.longDescription}
						</p>

						<div class="text-center">
							{#if app.comingSoon}
								<div
									class="inline-block rounded-full px-5 py-2.5 text-sm font-medium"
									style="background-color: {isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}; color: {isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'};"
								>
									{comingSoonLabel}
								</div>
							{:else}
								<button
									class="rounded-xl px-8 py-3 text-sm font-semibold transition-all hover:opacity-80 border-2 text-white"
									style="background-color: {app.color}60; border-color: {app.color};"
									onclick={(e) => { e.stopPropagation(); handleAppAction(app, index); }}
								>
									{openAppLabel}
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}

	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.status-indicator {
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}
</style>
