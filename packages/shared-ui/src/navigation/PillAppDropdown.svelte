<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { PillAppItem } from './types';

	interface Props {
		/** List of apps to show in dropdown */
		apps: PillAppItem[];
		/** Current app name */
		currentAppName: string;
		/** Logo snippet (optional) */
		logo?: Snippet;
		/** Home route for current app */
		homeRoute?: string;
		/** Direction of dropdown */
		direction?: 'up' | 'down';
	}

	let {
		apps,
		currentAppName,
		logo,
		homeRoute = '/',
		direction = 'down',
	}: Props = $props();

	let isOpen = $state(false);
	let triggerButton: HTMLButtonElement;
	let dropdownPosition = $state({ top: 0, left: 0 });

	function toggle() {
		if (triggerButton) {
			const rect = triggerButton.getBoundingClientRect();
			if (direction === 'down') {
				dropdownPosition = {
					top: rect.bottom + 8,
					left: rect.left,
				};
			} else {
				dropdownPosition = {
					top: rect.top - 8,
					left: rect.left,
				};
			}
		}
		isOpen = !isOpen;
	}

	function close() {
		isOpen = false;
	}

	function openApp(app: PillAppItem) {
		if (app.url) {
			window.open(app.url, '_blank', 'noopener,noreferrer');
		}
		close();
	}
</script>

<div class="pill-app-dropdown">
	<!-- Trigger Button -->
	<button bind:this={triggerButton} onclick={toggle} class="pill glass-pill trigger-button">
		{#if logo}
			{@render logo()}
		{:else}
			<span class="pill-label font-bold">{currentAppName}</span>
		{/if}
		<svg
			class="chevron-icon"
			class:rotated={isOpen}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M19 9l-7 7-7-7"
			/>
		</svg>
	</button>

	{#if isOpen}
		<!-- Backdrop -->
		<button
			class="menu-backdrop"
			onclick={close}
			onkeydown={(e) => e.key === 'Escape' && close()}
		></button>

		<!-- Dropdown -->
		<div
			class="dropdown-container"
			class:dropdown-up={direction === 'up'}
			class:dropdown-down={direction === 'down'}
			style="top: {dropdownPosition.top}px; left: {dropdownPosition.left}px;"
		>
			<!-- Header: Current app link -->
			<a
				href={homeRoute}
				class="current-app-link"
				onclick={close}
			>
				<span class="current-app-label">Zur {currentAppName} Startseite</span>
				<svg class="link-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
				</svg>
			</a>

			<div class="dropdown-divider"></div>

			<!-- Section title -->
			<div class="section-title">Mana Apps</div>

			<!-- App list -->
			<div class="app-list">
				{#each apps as app, i (app.id)}
					<button
						onclick={() => openApp(app)}
						class="app-item"
						class:current={app.isCurrent}
						style="animation-delay: {i * 20}ms"
						disabled={app.isCurrent}
					>
						{#if app.icon}
							<img src={app.icon} alt={app.name} class="app-icon" />
						{:else}
							<div class="app-icon-placeholder" style="background-color: {app.color || '#6b7280'}">
								{app.name.charAt(0)}
							</div>
						{/if}
						<span class="app-name">{app.name}</span>
						{#if app.isCurrent}
							<span class="current-badge">Aktuell</span>
						{:else}
							<svg class="external-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
							</svg>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.pill-app-dropdown {
		position: relative;
	}

	.trigger-button {
		position: relative;
		z-index: 10;
	}

	.chevron-icon {
		width: 0.75rem;
		height: 0.75rem;
		transition: transform 0.2s;
		margin-left: 0.25rem;
	}

	.chevron-icon.rotated {
		transform: rotate(180deg);
	}

	/* Base pill styles */
	.pill {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
		text-decoration: none;
		transition: all 0.2s;
		border: none;
		cursor: pointer;
	}

	.glass-pill {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		color: #374151;
	}

	:global(.dark) .glass-pill {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: #f3f4f6;
	}

	.glass-pill:hover {
		background: rgba(255, 255, 255, 0.95);
		border-color: rgba(0, 0, 0, 0.15);
		transform: translateY(-2px);
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .glass-pill:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.25);
	}

	.pill-label {
		display: inline;
	}

	.font-bold {
		font-weight: 700;
	}

	/* Dropdown container */
	.dropdown-container {
		position: fixed;
		z-index: 9999;
		min-width: 240px;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 1rem;
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
		overflow: hidden;
		animation: dropdownIn 0.2s ease-out;
	}

	:global(.dark) .dropdown-container {
		background: rgba(30, 30, 30, 0.95);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.dropdown-up {
		transform: translateY(-100%);
	}

	@keyframes dropdownIn {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.dropdown-up {
		animation-name: dropdownInUp;
	}

	@keyframes dropdownInUp {
		from {
			opacity: 0;
			transform: translateY(calc(-100% + 8px));
		}
		to {
			opacity: 1;
			transform: translateY(-100%);
		}
	}

	/* Current app link */
	.current-app-link {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		text-decoration: none;
		color: #374151;
		transition: background 0.15s;
	}

	:global(.dark) .current-app-link {
		color: #f3f4f6;
	}

	.current-app-link:hover {
		background: rgba(0, 0, 0, 0.04);
	}

	:global(.dark) .current-app-link:hover {
		background: rgba(255, 255, 255, 0.06);
	}

	.current-app-label {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.link-icon {
		width: 1rem;
		height: 1rem;
		opacity: 0.5;
	}

	/* Divider */
	.dropdown-divider {
		height: 1px;
		background: rgba(0, 0, 0, 0.08);
		margin: 0;
	}

	:global(.dark) .dropdown-divider {
		background: rgba(255, 255, 255, 0.1);
	}

	/* Section title */
	.section-title {
		padding: 0.75rem 1rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7280;
	}

	:global(.dark) .section-title {
		color: #9ca3af;
	}

	/* App list */
	.app-list {
		padding: 0 0.5rem 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.app-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 0.75rem;
		border: none;
		background: transparent;
		border-radius: 0.625rem;
		cursor: pointer;
		text-align: left;
		width: 100%;
		transition: background 0.15s;
		animation: itemIn 0.15s ease-out forwards;
		opacity: 0;
	}

	@keyframes itemIn {
		to {
			opacity: 1;
		}
	}

	.app-item:hover:not(:disabled) {
		background: rgba(0, 0, 0, 0.04);
	}

	:global(.dark) .app-item:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.06);
	}

	.app-item:disabled {
		cursor: default;
	}

	.app-item.current {
		background: rgba(0, 0, 0, 0.04);
	}

	:global(.dark) .app-item.current {
		background: rgba(255, 255, 255, 0.06);
	}

	.app-icon {
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		object-fit: cover;
	}

	.app-icon-placeholder {
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.875rem;
		font-weight: 600;
		color: white;
	}

	.app-name {
		flex: 1;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	:global(.dark) .app-name {
		color: #f3f4f6;
	}

	.current-badge {
		font-size: 0.6875rem;
		font-weight: 500;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: rgba(0, 0, 0, 0.06);
		color: #6b7280;
	}

	:global(.dark) .current-badge {
		background: rgba(255, 255, 255, 0.1);
		color: #9ca3af;
	}

	.external-icon {
		width: 1rem;
		height: 1rem;
		color: #9ca3af;
		opacity: 0;
		transition: opacity 0.15s;
	}

	.app-item:hover .external-icon {
		opacity: 1;
	}

	/* Backdrop */
	.menu-backdrop {
		position: fixed;
		inset: 0;
		z-index: 9998;
		background: transparent;
		border: none;
		cursor: default;
	}
</style>
