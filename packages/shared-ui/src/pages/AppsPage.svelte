<script lang="ts">
	import {
		MANA_APPS,
		APP_URLS,
		APP_STATUS_LABELS,
		type ManaApp,
		type AppIconId,
	} from '@mana/shared-branding';

	interface Props {
		/** Current app ID to highlight */
		currentAppId?: AppIconId;
		/** Page title */
		title?: string;
		/** Locale for descriptions */
		locale?: 'de' | 'en';
		/** Custom app click handler */
		onAppClick?: (app: ManaApp) => void;
	}

	let { currentAppId, title = 'Alle Apps', locale = 'de', onAppClick }: Props = $props();

	// Filter active apps (non-archived)
	const apps = $derived(MANA_APPS.filter((app) => !app.archived));

	// Get status labels for current locale
	const statusLabels = $derived(APP_STATUS_LABELS[locale]);

	// Modal state
	let selectedAppIndex = $state<number | null>(null);
	let hoveredAppIndex = $state<number | null>(null);
	let cardRotations = $state<{ [key: number]: { rotateX: number; rotateY: number } }>({});
	let modalScrollContainer = $state<HTMLDivElement | null>(null);

	// Detect dev mode
	const isDev = $derived(
		typeof window !== 'undefined' &&
			(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
	);

	function getStatusColor(status: ManaApp['status']) {
		const colors = {
			published: '#4CAF50',
			beta: '#FFD700',
			development: '#FF9800',
			planning: '#F44336',
		};
		return colors[status];
	}

	function getAppUrl(appId: AppIconId): string | undefined {
		const urls = APP_URLS[appId];
		if (!urls) return undefined;
		return isDev ? urls.dev : urls.prod;
	}

	function openModal(index: number) {
		selectedAppIndex = index;
	}

	function closeModal() {
		selectedAppIndex = null;
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

	function handleAppAction(app: ManaApp) {
		if (onAppClick) {
			onAppClick(app);
		} else {
			const url = getAppUrl(app.id);
			if (url) {
				if (app.id === currentAppId) {
					window.location.href = '/';
				} else {
					window.open(url, '_blank', 'noopener,noreferrer');
				}
			}
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && selectedAppIndex !== null) {
			closeModal();
		}
	}

	// Scroll to selected app in modal
	$effect(() => {
		if (selectedAppIndex !== null && modalScrollContainer) {
			const appIndex = selectedAppIndex;
			setTimeout(() => {
				const cardWidth = 360 + 24;
				const scrollPosition = appIndex * cardWidth;
				modalScrollContainer?.scrollTo({
					left: scrollPosition,
					behavior: 'smooth',
				});
			}, 50);
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="apps-page">
	<h1 class="page-title">{title}</h1>

	<div class="apps-grid">
		{#each apps as app, index}
			<button
				class="app-card"
				class:current={app.id === currentAppId}
				style="--app-color: {app.color};"
				onclick={() => openModal(index)}
			>
				<div
					class="status-indicator"
					style="background-color: {getStatusColor(app.status)};"
					title={statusLabels[app.status]}
				></div>

				<div class="app-icon-wrapper">
					{#if app.icon}
						<img src={app.icon} alt={app.name} class="app-icon" />
					{:else}
						<div class="app-icon-fallback" style="color: {app.color};">
							{app.name.charAt(0)}
						</div>
					{/if}
				</div>

				<h3 class="app-name">{app.name}</h3>
				<p class="app-description">{app.description[locale]}</p>
			</button>
		{/each}
	</div>
</div>

<!-- Modal -->
{#if selectedAppIndex !== null}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="modal-overlay" onclick={closeModal} role="dialog" aria-modal="true" tabindex="-1">
		<button onclick={closeModal} class="modal-close-btn" aria-label="Close modal">
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M18 6L6 18M6 6l12 12" />
			</svg>
		</button>

		<div bind:this={modalScrollContainer} class="modal-scroll-container scrollbar-hide">
			<div class="modal-cards-wrapper">
				{#each apps as app, index}
					<div
						class="modal-card"
						class:active={selectedAppIndex === index}
						class:current={app.id === currentAppId}
						style="--app-color: {app.color}; transform: perspective(1000px) rotateX({cardRotations[
							index
						]?.rotateX || 0}deg) rotateY({cardRotations[index]?.rotateY || 0}deg);"
						onclick={(e) => {
							e.stopPropagation();
							selectedAppIndex = index;
						}}
						onmouseenter={() => (hoveredAppIndex = index)}
						onmousemove={(e) => handleCardMouseMove(e, index, e.currentTarget)}
						onmouseleave={() => {
							handleCardMouseLeave(index);
							hoveredAppIndex = null;
						}}
						onkeydown={() => {}}
						role="button"
						tabindex="0"
					>
						<div class="modal-card-status">
							<div
								class="modal-status-dot"
								style="background-color: {getStatusColor(app.status)};"
							></div>
							<span class="modal-status-label">{statusLabels[app.status]}</span>
						</div>

						{#if app.icon}
							<img src={app.icon} alt={app.name} class="modal-app-icon" />
						{:else}
							<div class="modal-app-icon-fallback" style="color: {app.color};">
								{app.name.charAt(0)}
							</div>
						{/if}

						<h3 class="modal-app-name">{app.name}</h3>

						<p class="modal-app-tagline" style="color: {app.color};">
							{app.description[locale]}
						</p>

						<p class="modal-app-description">{app.longDescription[locale]}</p>

						<div class="modal-app-action">
							{#if app.comingSoon}
								<span class="modal-coming-soon"
									>{locale === 'de' ? 'Demnächst' : 'Coming Soon'}</span
								>
							{:else}
								<button
									class="modal-open-btn"
									style="background-color: {app.color}40; border-color: {app.color};"
									onclick={(e) => {
										e.stopPropagation();
										handleAppAction(app);
									}}
								>
									{app.id === currentAppId
										? locale === 'de'
											? 'Zur Startseite'
											: 'Go to Home'
										: locale === 'de'
											? 'App öffnen'
											: 'Open App'}
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
	.apps-page {
		padding: 1rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 700;
		margin-bottom: 2rem;
		text-align: center;
		color: hsl(var(--color-foreground, 0 0% 0%));
	}

	:global(.dark) .page-title {
		color: hsl(var(--color-foreground, 0 0% 100%));
	}

	/* Grid Layout */
	.apps-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	@media (min-width: 640px) {
		.apps-grid {
			grid-template-columns: repeat(3, 1fr);
			gap: 1.25rem;
		}
	}

	@media (min-width: 1024px) {
		.apps-grid {
			grid-template-columns: repeat(4, 1fr);
			gap: 1.5rem;
		}
	}

	/* App Card (Grid) */
	.app-card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem 1rem;
		border-radius: 1rem;
		cursor: pointer;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background-color: rgba(255, 255, 255, 0.8);
		backdrop-filter: blur(10px);
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease,
			border-color 0.2s ease;
		text-align: center;
	}

	:global(.dark) .app-card {
		border-color: rgba(255, 255, 255, 0.1);
		background-color: rgba(255, 255, 255, 0.06);
	}

	.app-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
	}

	:global(.dark) .app-card:hover {
		box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.4);
	}

	.app-card.current {
		border-color: var(--app-color);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--app-color) 20%, transparent);
	}

	.status-indicator {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		animation: pulse 2s ease-in-out infinite;
	}

	.app-icon-wrapper {
		width: 3.5rem;
		height: 3.5rem;
		margin-bottom: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.app-icon {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.app-icon-fallback {
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: 700;
		border-radius: 0.5rem;
	}

	.app-name {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.375rem;
		color: #1a1a1a;
	}

	:global(.dark) .app-name {
		color: #f3f4f6;
	}

	.app-description {
		font-size: 0.75rem;
		line-height: 1.4;
		color: #6b7280;
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	:global(.dark) .app-description {
		color: #9ca3af;
	}

	/* Animations */
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(0, 0, 0, 0.9);
		backdrop-filter: blur(8px);
		animation: fadeIn 0.2s ease-out;
	}

	.modal-close-btn {
		position: fixed;
		top: 1.5rem;
		right: 1.5rem;
		z-index: 60;
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.2);
		background-color: rgba(255, 255, 255, 0.1);
		color: #fff;
		cursor: pointer;
		transition:
			background-color 0.2s,
			transform 0.2s;
	}

	.modal-close-btn:hover {
		background-color: rgba(255, 255, 255, 0.2);
		transform: scale(1.05);
	}

	.modal-scroll-container {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scroll-behavior: smooth;
	}

	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}

	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.modal-cards-wrapper {
		display: flex;
		gap: 1.5rem;
		padding: 2rem;
		margin: 0 auto;
	}

	.modal-card {
		flex-shrink: 0;
		width: 340px;
		padding: 2rem;
		padding-top: 2.5rem;
		border-radius: 1.5rem;
		scroll-snap-align: center;
		position: relative;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background-color: rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(20px);
		transform-style: preserve-3d;
		transition:
			transform 0.1s ease-out,
			background-color 0.2s ease;
		animation: modalCardIn 0.3s ease-out both;
	}

	.modal-card:hover {
		background-color: rgba(255, 255, 255, 0.12);
	}

	.modal-card.current {
		border-color: var(--app-color);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--app-color) 30%, transparent);
	}

	.modal-card-status {
		position: absolute;
		top: 0.875rem;
		right: 0.875rem;
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem 0.25rem 0.5rem;
		border-radius: 1rem;
		background-color: rgba(0, 0, 0, 0.2);
	}

	.modal-status-dot {
		width: 0.375rem;
		height: 0.375rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.modal-status-label {
		font-size: 0.6875rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.8);
	}

	.modal-app-icon {
		width: 5rem;
		height: 5rem;
		object-fit: contain;
		margin: 0 auto 1rem;
		display: block;
	}

	.modal-app-icon-fallback {
		width: 4rem;
		height: 4rem;
		margin: 0 auto 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		font-weight: 700;
		border-radius: 0.75rem;
	}

	.modal-app-name {
		font-size: 1.5rem;
		font-weight: 700;
		text-align: center;
		margin: 0 0 0.5rem;
		color: #fff;
	}

	.modal-app-tagline {
		font-size: 0.875rem;
		font-weight: 500;
		text-align: center;
		margin: 0 0 1rem;
	}

	.modal-app-description {
		font-size: 0.875rem;
		line-height: 1.6;
		text-align: center;
		margin: 0 0 1.5rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.modal-app-action {
		text-align: center;
	}

	.modal-coming-soon {
		display: inline-block;
		padding: 0.625rem 1.25rem;
		border-radius: 2rem;
		font-size: 0.875rem;
		font-weight: 500;
		background-color: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.5);
	}

	.modal-open-btn {
		padding: 0.75rem 2rem;
		border-radius: 0.75rem;
		font-size: 0.875rem;
		font-weight: 600;
		border: 2px solid;
		cursor: pointer;
		transition:
			opacity 0.2s,
			transform 0.2s;
		color: #fff;
	}

	.modal-open-btn:hover {
		opacity: 0.85;
		transform: scale(1.02);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes modalCardIn {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(10px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.modal-overlay,
		.modal-card {
			animation: none;
		}
		.status-indicator {
			animation: none;
		}
	}
</style>
