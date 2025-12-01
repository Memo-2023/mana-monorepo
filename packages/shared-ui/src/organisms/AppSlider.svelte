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
			planning: 'Planned',
		},
		comingSoonLabel = 'Coming Soon',
		openAppLabel = 'Open App',
		onAppClick,
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
			planning: '#F44336',
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
					behavior: 'smooth',
				});
			}, 50);
		}
	});
</script>

<div class="app-slider-root">
	<h3 class="slider-title">{title}</h3>

	<div class="slider-scroll-container">
		<div class="slider-items">
			{#each apps as app, index}
				<button
					class="app-card"
					style="--index: {index};"
					onmouseenter={() => (hoveredApp = index)}
					onmouseleave={() => (hoveredApp = null)}
					onclick={() => openModal(index)}
				>
					<div
						class="status-indicator"
						style="background-color: {getStatusColor(
							app.status
						)}; box-shadow: 0 0 8px {getStatusColor(app.status)};"
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

					<h4 class="app-name">{app.name}</h4>
				</button>
			{/each}
		</div>
	</div>
</div>

{#if selectedApp !== null}
	<div
		class="modal-overlay"
		onclick={closeModal}
		onkeydown={(e) => e.key === 'Escape' && closeModal()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
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
						class:active={selectedApp === index}
						style="transform: perspective(1000px) rotateX({cardRotations[index]?.rotateX ||
							0}deg) rotateY({cardRotations[index]?.rotateY || 0}deg);"
						onclick={(e) => {
							e.stopPropagation();
							selectedApp = index;
						}}
						onmouseenter={() => (hoveredApp = index)}
						onmousemove={(e) => handleCardMouseMove(e, index, e.currentTarget)}
						onmouseleave={() => {
							handleCardMouseLeave(index);
							hoveredApp = null;
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
							<span class="modal-status-label">{getStatusLabel(app.status)}</span>
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
							{app.description}
						</p>

						<p class="modal-app-description">{app.longDescription}</p>

						<div class="modal-app-action">
							{#if app.comingSoon}
								<span class="modal-coming-soon">{comingSoonLabel}</span>
							{:else}
								<button
									class="modal-open-btn"
									style="background-color: {app.color}40; border-color: {app.color};"
									onclick={(e) => {
										e.stopPropagation();
										handleAppAction(app, index);
									}}
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
	.app-slider-root {
		width: 100%;
		max-width: 100%;
	}

	.slider-title {
		margin-bottom: 1rem;
		text-align: center;
		font-size: 0.875rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.5);
	}

	@media (prefers-color-scheme: light) {
		.slider-title {
			color: rgba(0, 0, 0, 0.5);
		}
	}

	.slider-scroll-container {
		width: 100%;
		overflow-x: auto;
		overflow-y: visible;
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.slider-scroll-container::-webkit-scrollbar {
		display: none;
	}

	.slider-items {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		padding-bottom: 1.5rem;
		width: max-content;
		margin: 0 auto;
	}

	.app-card {
		position: relative;
		flex-shrink: 0;
		width: 140px;
		padding: 1.25rem 1rem;
		border-radius: 1rem;
		cursor: pointer;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background-color: rgba(255, 255, 255, 0.06);
		backdrop-filter: blur(10px);
		transition:
			transform 0.2s ease,
			background-color 0.2s ease;
		/* Staggered entrance animation */
		animation: fadeInUp 0.4s ease-out both;
		animation-delay: calc(0.3s + var(--index) * 0.08s);
	}

	.app-card:hover {
		transform: scale(1.05);
		background-color: rgba(255, 255, 255, 0.1);
	}

	@media (prefers-color-scheme: light) {
		.app-card {
			border-color: rgba(0, 0, 0, 0.08);
			background-color: rgba(255, 255, 255, 0.7);
		}
		.app-card:hover {
			background-color: rgba(255, 255, 255, 0.9);
		}
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
		display: flex;
		align-items: center;
		justify-content: center;
		width: 4rem;
		height: 4rem;
		margin: 0 auto 0.75rem;
		transition: transform 0.2s ease;
	}

	.app-card:hover .app-icon-wrapper {
		transform: scale(1.1);
	}

	.app-icon {
		width: 3.5rem;
		height: 3.5rem;
		object-fit: contain;
	}

	.app-icon-fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		font-size: 1.25rem;
		font-weight: 700;
		border-radius: 0.5rem;
	}

	.app-name {
		font-size: 0.875rem;
		font-weight: 600;
		text-align: center;
		color: #fff;
		margin: 0;
	}

	@media (prefers-color-scheme: light) {
		.app-name {
			color: #000;
		}
	}

	/* Entrance animation */
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.app-card {
			animation: none;
		}
		.status-indicator {
			animation: none;
		}
	}

	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}

	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
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

	@media (prefers-color-scheme: light) {
		.modal-card {
			background-color: rgba(255, 255, 255, 0.9);
			border-color: rgba(0, 0, 0, 0.1);
		}
		.modal-card:hover {
			background-color: rgba(255, 255, 255, 0.95);
		}
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

	@media (prefers-color-scheme: light) {
		.modal-card-status {
			background-color: rgba(0, 0, 0, 0.05);
		}
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

	@media (prefers-color-scheme: light) {
		.modal-status-label {
			color: rgba(0, 0, 0, 0.6);
		}
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

	@media (prefers-color-scheme: light) {
		.modal-app-name {
			color: #000;
		}
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

	@media (prefers-color-scheme: light) {
		.modal-app-description {
			color: rgba(0, 0, 0, 0.6);
		}
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

	@media (prefers-color-scheme: light) {
		.modal-coming-soon {
			background-color: rgba(0, 0, 0, 0.08);
			color: rgba(0, 0, 0, 0.4);
		}
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

	@media (prefers-color-scheme: light) {
		.modal-open-btn {
			color: #000;
		}
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
	}
</style>
