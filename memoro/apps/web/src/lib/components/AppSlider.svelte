<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import MemoroLogo from './MemoroLogo.svelte';
	import { t } from 'svelte-i18n';

	interface App {
		name: string;
		description: string;
		longDescription: string;
		icon?: string;
		color: string;
		comingSoon?: boolean;
		status: 'published' | 'beta' | 'development' | 'planning';
	}

	let currentTheme = $derived($theme);
	let isDark = $derived(currentTheme.effectiveMode === 'dark');
	let selectedApp = $state<number | null>(null);
	let hoveredApp = $state<number | null>(null);
	let cardRotations = $state<{ [key: number]: { rotateX: number; rotateY: number } }>({});
	let modalScrollContainer = $state<HTMLDivElement | null>(null);

	let apps = $derived<App[]>([
		{
			name: 'Memoro',
			description: $t('app_slider.memoro_desc'),
			longDescription: $t('app_slider.memoro_long_desc'),
			icon: '/images/app-icons/memoro-logo-gradient.png',
			color: '#f8d62b',
			comingSoon: false,
			status: 'published'
		},
		{
			name: 'Märchenzauber',
			description: $t('app_slider.maerchenzauber_desc'),
			longDescription: $t('app_slider.maerchenzauber_long_desc'),
			icon: '/images/app-icons/maerchenzauber-logo-gradient.png',
			color: '#FF6B9D',
			comingSoon: true,
			status: 'beta'
		},
		{
			name: 'Moodlit',
			description: $t('app_slider.moodlit_desc'),
			longDescription: $t('app_slider.moodlit_long_desc'),
			icon: '/images/app-icons/moodlit-logo-gradient.png',
			color: '#9C27B0',
			comingSoon: true,
			status: 'beta'
		},
		{
			name: 'Manacore',
			description: $t('app_slider.manacore_desc'),
			longDescription: $t('app_slider.manacore_long_desc'),
			icon: '/images/app-icons/manacore-logo-gradient.png',
			color: '#00BCD4',
			comingSoon: true,
			status: 'development'
		}
	]);

	function getPrimaryColor() {
		const variant = currentTheme.variant;
		if (isDark) {
			const colors = {
				lume: '#f8d62b',
				nature: '#4CAF50',
				stone: '#78909C',
				ocean: '#039BE5'
			};
			return colors[variant];
		} else {
			const colors = {
				lume: '#f8d62b',
				nature: '#4CAF50',
				stone: '#607D8B',
				ocean: '#039BE5'
			};
			return colors[variant];
		}
	}

	function getStatusColor(status: App['status']) {
		const colors = {
			published: '#4CAF50',  // Green
			beta: '#FFD700',        // Yellow/Gold
			development: '#FF9800', // Orange
			planning: '#F44336'     // Red (not used)
		};
		return colors[status];
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

		// Calculate mouse position relative to card center
		const mouseXRelative = e.clientX - cardCenterX;
		const mouseYRelative = e.clientY - cardCenterY;

		// Calculate rotation (max 3 degrees)
		const maxRotation = 3;
		const rotateY = (mouseXRelative / (rect.width / 2)) * maxRotation;
		const rotateX = -(mouseYRelative / (rect.height / 2)) * maxRotation;

		cardRotations[index] = { rotateX, rotateY };
	}

	function handleCardMouseLeave(index: number) {
		cardRotations[index] = { rotateX: 0, rotateY: 0 };
	}

	// Scroll to selected app when modal opens
	$effect(() => {
		if (selectedApp !== null && modalScrollContainer) {
			setTimeout(() => {
				if (selectedApp === null) return;
				const cardWidth = 360 + 24; // card width + gap
				const scrollPosition = selectedApp * cardWidth;
				modalScrollContainer?.scrollTo({
					left: scrollPosition,
					behavior: 'smooth'
				});
			}, 50);
		}
	});
</script>

<div class="w-full">
	<!-- Title -->
	<h3
		class="mb-4 text-center text-sm font-medium"
		style="color: {isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'};"
	>
		{$t('app_slider.title')}
	</h3>

	<!-- Slider Container with horizontal scroll -->
	<div class="relative">
		<div class="flex gap-4 justify-center overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory scroll-smooth px-4 py-4" style="perspective: 1000px;">
			{#each apps as app, index}
				<button
					class="group relative flex-shrink-0 rounded-2xl p-5 cursor-pointer snap-center"
					style="width: 160px; background-color: {hoveredApp === index
						? isDark
							? 'rgba(255, 255, 255, 0.08)'
							: 'rgba(0, 0, 0, 0.08)'
						: isDark
							? 'rgba(255, 255, 255, 0.05)'
							: 'rgba(0, 0, 0, 0.05)'}; border: 1px solid {isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}; box-shadow: 0 4px 20px rgba(0, 0, 0, {isDark ? '0.3' : '0.15'}); transform: perspective(1000px) rotateX({cardRotations[index]?.rotateX || 0}deg) rotateY({cardRotations[index]?.rotateY || 0}deg); transform-style: preserve-3d; transition: transform 0.1s ease-out, background-color 0.2s ease-out;"
					onmouseenter={() => hoveredApp = index}
					onmousemove={(e) => handleCardMouseMove(e, index, e.currentTarget)}
					onmouseleave={() => { handleCardMouseLeave(index); hoveredApp = null; }}
					onclick={() => openModal(index)}
				>
					<!-- Status Indicator -->
					<div
						class="absolute top-3 right-3 w-3 h-3 rounded-full status-indicator"
						style="background-color: {getStatusColor(app.status)}; box-shadow: 0 0 8px {getStatusColor(app.status)};"
					></div>

					<!-- App Icon -->
					<div
						class="mb-2 flex h-20 w-20 mx-auto items-center justify-center rounded-xl transition-transform group-hover:scale-110"
					>
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

					<!-- App Name -->
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

<!-- Modal for App Details -->
{#if selectedApp !== null}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center"
		style="background-color: rgba(0, 0, 0, 0.85);"
		onclick={closeModal}
	>
		<!-- Close Button -->
		<button
			onclick={closeModal}
			class="absolute top-6 right-6 rounded-full p-2 transition-all hover:bg-white/10 z-10"
		>
			<svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: #ffffff;">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>

		<!-- Full-screen Scrollable Container -->
		<div
			bind:this={modalScrollContainer}
			class="absolute inset-0 flex items-center overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth"
		>
			<div class="flex gap-6 px-8 py-8 mx-auto" style="perspective: 1000px;">
				{#each apps as app, index}
					<div
						class="flex-shrink-0 rounded-3xl p-8 snap-center shadow-2xl card-3d relative"
						style="min-width: 360px; max-width: 360px; background-color: {hoveredApp === index ? (isDark ? '#2A2A2A' : '#F5F5F5') : (isDark ? '#1E1E1E' : '#ffffff')}; border: 3px solid {app.color}40; transform: perspective(1000px) rotateX({cardRotations[index]?.rotateX || 0}deg) rotateY({cardRotations[index]?.rotateY || 0}deg); transform-style: preserve-3d; transition: transform 0.1s ease-out, background-color 0.2s ease-out; opacity: 1;"
						onclick={(e) => { e.stopPropagation(); selectedApp = index; }}
						onmouseenter={() => hoveredApp = index}
						onmousemove={(e) => handleCardMouseMove(e, index, e.currentTarget)}
						onmouseleave={() => { handleCardMouseLeave(index); hoveredApp = null; }}
					>
<!-- Status Indicator with Label -->
						<div class="absolute top-4 right-4 flex items-center gap-2">
							<span class="text-xs font-medium" style="color: {isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'};">
								{$t(`app_slider.status_${app.status}`)}
							</span>
							<div
								class="w-4 h-4 rounded-full status-indicator"
								style="background-color: {getStatusColor(app.status)}; box-shadow: 0 0 12px {getStatusColor(app.status)};"
							></div>
						</div>

						<!-- App Icon Large -->
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

						<!-- App Name -->
						<h3 class="text-2xl font-bold mb-2 text-center" style="color: {isDark ? '#ffffff' : '#000000'};">
							{app.name}
						</h3>

						<!-- Short Description -->
						<p class="text-sm mb-4 text-center font-medium" style="color: {app.color};">
							{app.description}
						</p>

						<!-- Long Description -->
						<p class="text-sm leading-relaxed mb-6 text-center" style="color: {isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'};">
							{app.longDescription}
						</p>

						<!-- Coming Soon Badge or Action Button -->
						<div class="text-center">
							{#if app.comingSoon}
								<div
									class="inline-block rounded-full px-5 py-2.5 text-sm font-medium"
									style="background-color: {isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}; color: {isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'};"
								>
									{$t('app_slider.coming_soon')}
								</div>
							{:else}
								<button
									class="rounded-xl px-8 py-3 text-sm font-semibold transition-all hover:opacity-80 border-2 text-white"
									style="background-color: {app.color}60; border-color: {app.color};"
								>
									{$t('app_slider.download')}
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
	/* Hide scrollbar for Chrome, Safari and Opera */
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}

	/* Hide scrollbar for IE, Edge and Firefox */
	.scrollbar-hide {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}

	/* Status indicator pulse animation */
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
