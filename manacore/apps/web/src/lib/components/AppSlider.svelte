<script lang="ts">
	interface App {
		name: string;
		description: string;
		longDescription: string;
		icon: string;
		color: string;
		comingSoon?: boolean;
		status: 'published' | 'beta' | 'development' | 'planning';
	}

	let selectedApp = $state<number | null>(null);
	let hoveredApp = $state<number | null>(null);
	let cardRotations = $state<{ [key: number]: { rotateX: number; rotateY: number } }>({});
	let modalScrollContainer = $state<HTMLDivElement | null>(null);

	const apps: App[] = [
		{
			name: 'Memoro',
			description: 'AI Voice Memos',
			longDescription: 'Transform your voice recordings into organized, searchable notes with AI-powered transcription and insights.',
			icon: '/images/app-icons/memoro-logo-gradient.png',
			color: '#f8d62b',
			comingSoon: false,
			status: 'published'
		},
		{
			name: 'Märchenzauber',
			description: 'AI Story Creator',
			longDescription: 'Create magical personalized stories for children with AI-generated illustrations and consistent characters.',
			icon: '/images/app-icons/maerchenzauber-logo-gradient.png',
			color: '#FF6B9D',
			comingSoon: true,
			status: 'beta'
		},
		{
			name: 'Moodlit',
			description: 'AI Mood Tracker',
			longDescription: 'Track your emotional well-being with AI-powered insights and personalized recommendations.',
			icon: '/images/app-icons/moodlit-logo-gradient.png',
			color: '#9C27B0',
			comingSoon: true,
			status: 'beta'
		},
		{
			name: 'Manacore',
			description: 'Central Hub',
			longDescription: 'Your central hub for managing all Mana applications, subscriptions, and account settings.',
			icon: '/images/app-icons/manacore-logo-gradient.png',
			color: '#6366f1',
			comingSoon: false,
			status: 'development'
		}
	];

	function getStatusColor(status: App['status']) {
		const colors = {
			published: '#4CAF50',
			beta: '#FFD700',
			development: '#FF9800',
			planning: '#F44336'
		};
		return colors[status];
	}

	function getStatusLabel(status: App['status']) {
		const labels = {
			published: 'Live',
			beta: 'Beta',
			development: 'In Development',
			planning: 'Planned'
		};
		return labels[status];
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
	<h3 class="mb-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
		Part of the Mana Ecosystem
	</h3>

	<div class="relative">
		<div class="flex gap-4 justify-center overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory scroll-smooth px-4 py-4" style="perspective: 1000px;">
			{#each apps as app, index}
				<button
					class="group relative flex-shrink-0 rounded-2xl p-5 cursor-pointer snap-center border transition-all"
					class:bg-gray-100={hoveredApp !== index}
					class:dark:bg-gray-800={hoveredApp !== index}
					class:bg-gray-200={hoveredApp === index}
					class:dark:bg-gray-700={hoveredApp === index}
					style="width: 160px; border-color: rgba(0, 0, 0, 0.1); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15); transform: perspective(1000px) rotateX({cardRotations[index]?.rotateX || 0}deg) rotateY({cardRotations[index]?.rotateY || 0}deg); transform-style: preserve-3d; transition: transform 0.1s ease-out, background-color 0.2s ease-out;"
					onmouseenter={() => hoveredApp = index}
					onmousemove={(e) => handleCardMouseMove(e, index, e.currentTarget)}
					onmouseleave={() => { handleCardMouseLeave(index); hoveredApp = null; }}
					onclick={() => openModal(index)}
				>
					<div
						class="absolute top-3 right-3 w-3 h-3 rounded-full status-indicator"
						style="background-color: {getStatusColor(app.status)}; box-shadow: 0 0 8px {getStatusColor(app.status)};"
					></div>

					<div class="mb-2 flex h-20 w-20 mx-auto items-center justify-center rounded-xl transition-transform group-hover:scale-110">
						<img src={app.icon} alt={app.name} class="w-16 h-16 object-contain" />
					</div>

					<h4 class="text-base font-semibold text-center text-gray-900 dark:text-white">
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
						class:bg-gray-100={hoveredApp !== index}
						class:dark:bg-gray-800={hoveredApp !== index}
						class:bg-gray-200={hoveredApp === index}
						class:dark:bg-gray-700={hoveredApp === index}
						style="min-width: 360px; max-width: 360px; border: 3px solid {app.color}40; transform: perspective(1000px) rotateX({cardRotations[index]?.rotateX || 0}deg) rotateY({cardRotations[index]?.rotateY || 0}deg); transform-style: preserve-3d; transition: transform 0.1s ease-out, background-color 0.2s ease-out;"
						onclick={(e) => { e.stopPropagation(); selectedApp = index; }}
						onmouseenter={() => hoveredApp = index}
						onmousemove={(e) => handleCardMouseMove(e, index, e.currentTarget)}
						onmouseleave={() => { handleCardMouseLeave(index); hoveredApp = null; }}
						onkeydown={() => {}}
						role="button"
						tabindex="0"
					>
						<div class="absolute top-4 right-4 flex items-center gap-2">
							<span class="text-xs font-medium text-gray-600 dark:text-gray-300">
								{getStatusLabel(app.status)}
							</span>
							<div
								class="w-4 h-4 rounded-full status-indicator"
								style="background-color: {getStatusColor(app.status)}; box-shadow: 0 0 12px {getStatusColor(app.status)};"
							></div>
						</div>

						<img src={app.icon} alt={app.name} class="w-28 h-28 object-contain mb-3 mx-auto" />

						<h3 class="text-2xl font-bold mb-2 text-center text-gray-900 dark:text-white">
							{app.name}
						</h3>

						<p class="text-sm mb-4 text-center font-medium" style="color: {app.color};">
							{app.description}
						</p>

						<p class="text-sm leading-relaxed mb-6 text-center text-gray-600 dark:text-gray-300">
							{app.longDescription}
						</p>

						<div class="text-center">
							{#if app.comingSoon}
								<div class="inline-block rounded-full px-5 py-2.5 text-sm font-medium bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400">
									Coming Soon
								</div>
							{:else}
								<button
									class="rounded-xl px-8 py-3 text-sm font-semibold transition-all hover:opacity-80 border-2 text-white"
									style="background-color: {app.color}60; border-color: {app.color};"
								>
									Open App
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
