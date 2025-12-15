<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import type { CalendarViewType } from '@calendar/shared';

	// Context menu state
	let visible = $state(false);
	let x = $state(0);
	let y = $state(0);
	let menuElement = $state<HTMLElement | null>(null);
	let adjustedX = $state(0);
	let adjustedY = $state(0);

	// Custom day count input state
	let customDayInput = $state(String(settingsStore.customDayCount));

	// View labels
	const viewLabels: Record<CalendarViewType, string> = {
		day: 'Tag (1)',
		'3day': '3 Tage',
		'5day': '5 Tage',
		week: 'Woche (7)',
		'10day': '10 Tage',
		'14day': '14 Tage',
		'30day': '30 Tage',
		'60day': '60 Tage',
		'90day': '90 Tage',
		'365day': '365 Tage',
		month: 'Monat',
		year: 'Jahr',
		agenda: 'Agenda',
		custom: 'Benutzerdefiniert',
	};

	// All available views (ordered)
	const allViews: CalendarViewType[] = [
		'day',
		'3day',
		'5day',
		'week',
		'10day',
		'14day',
		'30day',
		'60day',
		'90day',
		'365day',
		'month',
		'year',
		'agenda',
		'custom',
	];

	// Adjust position to keep menu within viewport
	$effect(() => {
		if (visible && menuElement) {
			const rect = menuElement.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			// Adjust X if menu would overflow right
			if (x + rect.width > viewportWidth - 10) {
				adjustedX = x - rect.width;
			} else {
				adjustedX = x;
			}

			// Adjust Y if menu would overflow bottom
			if (y + rect.height > viewportHeight - 10) {
				adjustedY = y - rect.height;
			} else {
				adjustedY = y;
			}
		}
	});

	// Sync custom day input when settings change
	$effect(() => {
		customDayInput = String(settingsStore.customDayCount);
	});

	function isViewEnabled(view: CalendarViewType): boolean {
		return settingsStore.quickViewPillViews.includes(view);
	}

	function toggleView(view: CalendarViewType) {
		const current = settingsStore.quickViewPillViews;
		if (current.includes(view)) {
			// Remove view (but keep at least one)
			if (current.length > 1) {
				settingsStore.set(
					'quickViewPillViews',
					current.filter((v) => v !== view)
				);
			}
		} else {
			// Add view
			settingsStore.set('quickViewPillViews', [...current, view]);
		}
	}

	function handleCustomDayInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		customDayInput = target.value;
	}

	function applyCustomDays() {
		const value = parseInt(customDayInput, 10);
		if (isNaN(value) || value < 1 || value > 365) {
			// Reset to current value if invalid
			customDayInput = String(settingsStore.customDayCount);
			return;
		}

		// Set custom day count
		settingsStore.set('customDayCount', value);
		customDayInput = String(value);

		// Auto-enable 'custom' view if not already
		const current = settingsStore.quickViewPillViews;
		if (!current.includes('custom')) {
			settingsStore.set('quickViewPillViews', [...current, 'custom']);
		}

		// Switch to custom view
		viewStore.setViewType('custom');

		// Close the menu
		visible = false;
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			visible = false;
		}
	}

	function handleInputKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			applyCustomDays();
		}
		// Stop propagation to prevent menu from closing
		e.stopPropagation();
	}

	onMount(() => {
		// Close on click outside
		const handleClickOutside = (e: MouseEvent) => {
			if (menuElement && !menuElement.contains(e.target as Node)) {
				visible = false;
			}
		};

		// Close on scroll
		const handleScroll = () => {
			visible = false;
		};

		window.addEventListener('click', handleClickOutside);
		window.addEventListener('scroll', handleScroll, true);
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('click', handleClickOutside);
			window.removeEventListener('scroll', handleScroll, true);
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	// Export show function to be called from parent
	export function show(clientX: number, clientY: number) {
		x = clientX;
		y = clientY;
		visible = true;
	}

	export function hide() {
		visible = false;
	}
</script>

{#if visible}
	<!-- Backdrop to block clicks on elements behind -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="context-menu-backdrop"
		onpointerdown={(e) => {
			e.preventDefault();
			e.stopPropagation();
			visible = false;
		}}
		onclick={(e) => {
			e.preventDefault();
			e.stopPropagation();
			visible = false;
		}}
		oncontextmenu={(e) => {
			e.preventDefault();
			e.stopPropagation();
			visible = false;
		}}
	></div>

	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		bind:this={menuElement}
		class="context-menu"
		style="left: {adjustedX}px; top: {adjustedY}px;"
		role="menu"
		tabindex="-1"
		transition:fly={{ duration: 150, y: -8 }}
		onclick={(e) => e.stopPropagation()}
		oncontextmenu={(e) => e.preventDefault()}
		onkeydown={handleKeyDown}
	>
		<!-- Standard view toggles -->
		{#each allViews as view}
			<button class="menu-item has-toggle" onclick={() => toggleView(view)} role="menuitem">
				<span class="item-toggle" class:checked={isViewEnabled(view)}>
					<span class="toggle-track">
						<span class="toggle-thumb"></span>
					</span>
				</span>
				<span class="item-label">{viewLabels[view]}</span>
			</button>
		{/each}

		<!-- Divider -->
		<div class="divider"></div>

		<!-- Custom day count section -->
		<div class="custom-section">
			<span class="custom-label">Benutzerdefiniert (1-365)</span>
			<div class="custom-input-row">
				<input
					type="number"
					class="custom-input"
					min="1"
					max="365"
					value={customDayInput}
					oninput={handleCustomDayInputChange}
					onkeydown={handleInputKeyDown}
					onclick={(e) => e.stopPropagation()}
				/>
				<span class="custom-unit">Tage</span>
				<button class="custom-apply-btn" onclick={applyCustomDays}> Setzen </button>
			</div>
		</div>
	</div>
{/if}

<style>
	.context-menu-backdrop {
		position: fixed;
		inset: 0;
		z-index: 9998;
		background: transparent;
		pointer-events: auto;
	}

	.context-menu {
		position: fixed;
		z-index: 9999;
		min-width: 200px;
		max-width: 280px;
		padding: 0.375rem;
		background: var(--color-surface-elevated-3);
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-lg);
		pointer-events: auto;
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.625rem;
		border: none;
		background: transparent;
		border-radius: var(--radius-md);
		cursor: pointer;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		text-align: left;
		transition: background-color 100ms ease;
	}

	.menu-item:hover {
		background: hsl(var(--color-muted));
	}

	.item-label {
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.divider {
		height: 1px;
		margin: 0.375rem 0.5rem;
		background: hsl(var(--color-border));
	}

	/* Toggle switch styles */
	.item-toggle {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.toggle-track {
		position: relative;
		width: 28px;
		height: 16px;
		background: hsl(var(--color-muted));
		border-radius: 8px;
		transition: background-color 150ms ease;
	}

	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 12px;
		height: 12px;
		background: hsl(var(--color-background));
		border-radius: 50%;
		transition: transform 150ms ease;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.item-toggle.checked .toggle-track {
		background: hsl(var(--color-primary));
	}

	.item-toggle.checked .toggle-thumb {
		transform: translateX(12px);
	}

	/* Custom section styles */
	.custom-section {
		padding: 0.5rem 0.625rem;
	}

	.custom-label {
		display: block;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		margin-bottom: 0.5rem;
	}

	.custom-input-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.custom-input {
		width: 60px;
		padding: 0.375rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-md);
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		text-align: center;
	}

	.custom-input:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
	}

	/* Hide number input spinners */
	.custom-input::-webkit-outer-spin-button,
	.custom-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	.custom-input[type='number'] {
		-moz-appearance: textfield;
	}

	.custom-unit {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	.custom-apply-btn {
		margin-left: auto;
		padding: 0.375rem 0.75rem;
		border: none;
		border-radius: var(--radius-md);
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 150ms ease;
	}

	.custom-apply-btn:hover {
		opacity: 0.9;
	}
</style>
