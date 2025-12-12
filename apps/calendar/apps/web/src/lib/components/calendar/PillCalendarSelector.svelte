<script lang="ts">
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { goto } from '$app/navigation';

	interface Props {
		direction?: 'up' | 'down';
		embedded?: boolean;
	}

	let { direction = 'up', embedded = false }: Props = $props();

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

	function handleToggle(calendarId: string) {
		calendarsStore.toggleVisibility(calendarId);
	}

	function handleAddCalendar() {
		close();
		goto('/settings');
	}

	// Count visible calendars
	let visibleCount = $derived(calendarsStore.calendars.filter((c) => c.isVisible).length);
	let totalCount = $derived(calendarsStore.calendars.length);
</script>

<div class="pill-calendar-selector">
	<!-- Trigger Button -->
	<button
		bind:this={triggerButton}
		onclick={toggle}
		class="trigger-button"
		class:pill={!embedded}
		class:glass-pill={!embedded}
		class:embedded-btn={embedded}
	>
		<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
			/>
		</svg>
		<span class="pill-label">{visibleCount}/{totalCount}</span>
		<svg
			class="chevron-icon"
			class:rotated={isOpen}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if isOpen}
		<!-- Backdrop -->
		<button
			class="menu-backdrop"
			onclick={close}
			onkeydown={(e) => e.key === 'Escape' && close()}
			aria-label="Close dropdown"
		></button>

		<!-- Dropdown -->
		<div
			class="dropdown-container"
			class:dropdown-up={direction === 'up'}
			class:dropdown-down={direction === 'down'}
			style="top: {dropdownPosition.top}px; left: {dropdownPosition.left}px;"
		>
			<div class="dropdown-header">
				<span class="header-title">Kalender</span>
				<button class="add-btn" onclick={handleAddCalendar} aria-label="Kalender hinzufügen">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
				</button>
			</div>

			<div class="calendar-list">
				{#each calendarsStore.calendars as calendar}
					<label class="calendar-item">
						<input
							type="checkbox"
							checked={calendar.isVisible}
							onchange={() => handleToggle(calendar.id)}
							style="accent-color: {calendar.color}"
						/>
						<span class="color-dot" style="background-color: {calendar.color}"></span>
						<span class="calendar-name">{calendar.name}</span>
					</label>
				{/each}

				{#if calendarsStore.calendars.length === 0}
					<p class="empty-message">Keine Kalender</p>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.pill-calendar-selector {
		position: relative;
	}

	.trigger-button {
		position: relative;
	}

	/* Embedded mode - no background/border, for use inside a parent bar */
	.embedded-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
		border: none;
		cursor: pointer;
		transition: all 0.15s ease;
		background: transparent;
		color: #374151;
	}

	:global(.dark) .embedded-btn {
		color: #f3f4f6;
	}

	.embedded-btn:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .embedded-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}

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

	.pill-icon {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
	}

	.pill-label {
		display: inline;
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

	.menu-backdrop {
		position: fixed;
		inset: 0;
		z-index: 9998;
		background: transparent;
		border: none;
		cursor: default;
	}

	.dropdown-container {
		position: fixed;
		z-index: 9999;
		min-width: 200px;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 1rem;
		box-shadow:
			0 10px 25px -5px rgba(0, 0, 0, 0.15),
			0 8px 10px -6px rgba(0, 0, 0, 0.1);
		padding: 0.75rem;
		animation: dropdownIn 0.15s ease-out forwards;
	}

	:global(.dark) .dropdown-container {
		background: rgba(30, 30, 30, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.dropdown-up {
		transform: translateY(-100%);
	}

	.dropdown-down {
		transform: translateY(0);
	}

	@keyframes dropdownIn {
		from {
			opacity: 0;
			transform: translateY(-100%) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(-100%) scale(1);
		}
	}

	.dropdown-down {
		animation-name: dropdownInDown;
	}

	@keyframes dropdownInDown {
		from {
			opacity: 0;
			transform: translateY(0) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.dropdown-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 0.5rem;
		margin-bottom: 0.5rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .dropdown-header {
		border-bottom-color: rgba(255, 255, 255, 0.15);
	}

	.header-title {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7280;
	}

	:global(.dark) .header-title {
		color: #9ca3af;
	}

	.add-btn {
		padding: 0.25rem;
		border: none;
		background: transparent;
		border-radius: 0.375rem;
		cursor: pointer;
		color: #6b7280;
		transition: all 0.15s;
	}

	:global(.dark) .add-btn {
		color: #9ca3af;
	}

	.add-btn:hover {
		background: rgba(0, 0, 0, 0.05);
		color: #374151;
	}

	:global(.dark) .add-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #f3f4f6;
	}

	.calendar-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.calendar-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		padding: 0.375rem 0.5rem;
		border-radius: 0.5rem;
		transition: background 0.15s;
	}

	.calendar-item:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .calendar-item:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.calendar-item input {
		width: 16px;
		height: 16px;
		cursor: pointer;
		flex-shrink: 0;
	}

	.color-dot {
		width: 10px;
		height: 10px;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	.calendar-name {
		font-size: 0.875rem;
		color: #374151;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	:global(.dark) .calendar-name {
		color: #f3f4f6;
	}

	.empty-message {
		font-size: 0.875rem;
		color: #6b7280;
		text-align: center;
		padding: 0.5rem;
	}

	:global(.dark) .empty-message {
		color: #9ca3af;
	}
</style>
