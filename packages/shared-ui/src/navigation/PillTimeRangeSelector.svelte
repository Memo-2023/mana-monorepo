<script lang="ts">
	import { CaretDown, Clock } from '@manacore/shared-icons';

	// Portal action - moves element to body to escape stacking contexts
	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			},
		};
	}

	interface Props {
		/** Start hour (0-23) */
		startHour: number;
		/** End hour (1-24) */
		endHour: number;
		/** Called when start hour changes */
		onStartHourChange: (hour: number) => void;
		/** Called when end hour changes */
		onEndHourChange: (hour: number) => void;
		/** Dropdown direction */
		direction?: 'up' | 'down';
		/** Label format - 'range' shows "8-18h", 'icon' shows clock icon only */
		labelFormat?: 'range' | 'icon';
		/** Embedded mode - no background/border, for use inside a parent bar */
		embedded?: boolean;
		/** Toggle mode - click toggles active state, right-click/long-press opens dropdown */
		toggleMode?: boolean;
		/** Whether the filter is active (only used in toggleMode) */
		active?: boolean;
		/** Called when toggle state changes (only used in toggleMode) */
		onToggle?: () => void;
	}

	let {
		startHour,
		endHour,
		onStartHourChange,
		onEndHourChange,
		direction = 'down',
		labelFormat = 'range',
		embedded = false,
		toggleMode = false,
		active = false,
		onToggle,
	}: Props = $props();

	let isOpen = $state(false);
	let triggerButton: HTMLButtonElement;
	let dropdownPosition = $state({ top: 0, left: 0 });
	let longPressTimer: ReturnType<typeof setTimeout> | null = null;
	let isLongPress = $state(false);

	function openDropdown() {
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
		isOpen = true;
	}

	function handleClick() {
		if (toggleMode) {
			// In toggle mode, click toggles the filter
			if (!isLongPress) {
				onToggle?.();
			}
			isLongPress = false;
		} else {
			// Normal mode - click opens dropdown
			openDropdown();
		}
	}

	function handleContextMenu(e: MouseEvent) {
		if (toggleMode) {
			e.preventDefault();
			openDropdown();
		}
	}

	function handlePointerDown() {
		if (toggleMode) {
			isLongPress = false;
			longPressTimer = setTimeout(() => {
				isLongPress = true;
				openDropdown();
			}, 500);
		}
	}

	function handlePointerUp() {
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
	}

	function handlePointerLeave() {
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
	}

	function close() {
		isOpen = false;
	}

	function handleStartChange(hour: number) {
		if (hour < endHour) {
			onStartHourChange(hour);
		}
	}

	function handleEndChange(hour: number) {
		if (hour > startHour) {
			onEndHourChange(hour);
		}
	}

	function formatHour(hour: number): string {
		return `${hour.toString().padStart(2, '0')}:00`;
	}

	let label = $derived(labelFormat === 'range' ? `${startHour}-${endHour}h` : '');

	// Generate hour options
	const startHours = Array.from({ length: 24 }, (_, i) => i);
	const endHours = Array.from({ length: 24 }, (_, i) => i + 1);
</script>

<div class="pill-time-selector">
	<button
		bind:this={triggerButton}
		onclick={handleClick}
		oncontextmenu={handleContextMenu}
		onpointerdown={handlePointerDown}
		onpointerup={handlePointerUp}
		onpointerleave={handlePointerLeave}
		class="trigger-button"
		class:pill={!embedded}
		class:glass-pill={!embedded}
		class:embedded-btn={embedded}
		class:active={toggleMode && active}
		title={toggleMode ? 'Klick: Ein/Aus | Rechtsklick: Zeitbereich' : 'Zeitbereich auswählen'}
	>
		<Clock size={20} class="pill-icon" />
		{#if label}
			<span class="pill-label">{label}</span>
		{/if}
		{#if !toggleMode}
			<CaretDown size={20} class="chevron-icon" />
		{/if}
	</button>

	{#if isOpen}
		<!-- Backdrop - portal to body -->
		<button
			use:portal
			class="backdrop"
			onclick={close}
			onkeydown={(e) => e.key === 'Escape' && close()}
			aria-label="Close"
			style="z-index: 99990;"
		></button>

		<!-- Dropdown - portal to body -->
		<div
			use:portal
			class="dropdown glass-dropdown"
			class:dropdown-up={direction === 'up'}
			style="top: {dropdownPosition.top}px; left: {dropdownPosition.left}px; z-index: 99991;"
		>
			<div class="dropdown-header">Zeitbereich</div>

			<div class="time-selectors">
				<div class="time-column">
					<span class="column-label">Von</span>
					<div class="hour-list">
						{#each startHours as hour}
							<button
								class="hour-option"
								class:active={startHour === hour}
								class:disabled={hour >= endHour}
								onclick={() => handleStartChange(hour)}
								disabled={hour >= endHour}
							>
								{formatHour(hour)}
							</button>
						{/each}
					</div>
				</div>

				<div class="time-divider"></div>

				<div class="time-column">
					<span class="column-label">Bis</span>
					<div class="hour-list">
						{#each endHours as hour}
							<button
								class="hour-option"
								class:active={endHour === hour}
								class:disabled={hour <= startHour}
								onclick={() => handleEndChange(hour)}
								disabled={hour <= startHour}
							>
								{formatHour(hour)}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<div class="dropdown-footer">
				<span class="current-range">{formatHour(startHour)} - {formatHour(endHour)}</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.pill-time-selector {
		position: relative;
	}

	.trigger-button {
		position: relative;
	}

	.pill {
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
		transition: all 0.2s;
	}

	.glass-pill {
		background: hsl(var(--color-surface) / 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid hsl(var(--color-border));
		box-shadow:
			0 4px 6px -1px hsl(var(--color-foreground) / 0.1),
			0 2px 4px -1px hsl(var(--color-foreground) / 0.06);
		color: hsl(var(--color-foreground));
	}

	.glass-pill:hover {
		background: hsl(var(--color-surface) / 0.95);
		transform: translateY(-1px);
		box-shadow:
			0 10px 15px -3px hsl(var(--color-foreground) / 0.1),
			0 4px 6px -2px hsl(var(--color-foreground) / 0.05);
	}

	.pill-icon {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
	}

	.pill-label {
		font-size: 0.8125rem;
	}

	/* Embedded mode - no background/border */
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
		color: hsl(var(--color-foreground));
	}

	.embedded-btn:hover {
		background: hsl(var(--color-foreground) / 0.05);
	}

	/* Active state for toggle mode */
	.embedded-btn.active {
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
	}

	.glass-pill.active {
		background: hsl(var(--color-primary) / 0.15);
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
	}

	.chevron-icon {
		width: 0.75rem;
		height: 0.75rem;
		transition: transform 0.2s;
		margin-left: 0.125rem;
	}

	.chevron-icon.rotated {
		transform: rotate(180deg);
	}

	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 9998;
		background: transparent;
		border: none;
		cursor: default;
	}

	.dropdown {
		position: fixed;
		z-index: 9999;
		min-width: 280px;
		border-radius: 1rem;
		overflow: hidden;
		animation: dropdownIn 0.15s ease-out;
	}

	.dropdown-up {
		transform: translateY(-100%);
	}

	@keyframes dropdownIn {
		from {
			opacity: 0;
			transform: translateY(10px);
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
			transform: translateY(-100%) translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(-100%);
		}
	}

	.glass-dropdown {
		background: color-mix(in srgb, var(--color-surface-elevated-1) 95%, transparent);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid hsl(var(--color-border));
	}

	.dropdown-header {
		padding: 0.75rem 1rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.time-selectors {
		display: flex;
		padding: 0.5rem;
		gap: 0.5rem;
	}

	.time-column {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.column-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
		padding: 0 0.5rem;
	}

	.hour-list {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		max-height: 200px;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
	}

	.hour-list::-webkit-scrollbar {
		width: 4px;
	}

	.hour-list::-webkit-scrollbar-track {
		background: transparent;
	}

	.hour-list::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 2px;
	}

	:global(.dark) .hour-list::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
	}

	.hour-option {
		padding: 0.375rem 0.75rem;
		border: none;
		background: transparent;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		cursor: pointer;
		transition: all 0.15s;
		text-align: left;
	}

	.hour-option:hover:not(.disabled) {
		background: hsl(var(--color-foreground) / 0.05);
	}

	.hour-option.active {
		background: hsl(var(--color-primary) / 0.2);
		color: hsl(var(--color-primary));
	}

	.hour-option.disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.time-divider {
		width: 1px;
		background: hsl(var(--color-border));
		margin: 0.5rem 0;
	}

	.dropdown-footer {
		padding: 0.5rem 1rem;
		border-top: 1px solid hsl(var(--color-border));
		text-align: center;
	}

	.current-range {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--color-primary));
	}
</style>
