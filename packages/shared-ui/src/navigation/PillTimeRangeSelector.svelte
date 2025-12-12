<script lang="ts">
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
	}

	let {
		startHour,
		endHour,
		onStartHourChange,
		onEndHourChange,
		direction = 'down',
		labelFormat = 'range',
		embedded = false,
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
		onclick={toggle}
		class="trigger-button"
		class:pill={!embedded}
		class:glass-pill={!embedded}
		class:embedded-btn={embedded}
		title="Zeitbereich auswählen"
	>
		<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		{#if label}
			<span class="pill-label">{label}</span>
		{/if}
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
		<button
			class="backdrop"
			onclick={close}
			onkeydown={(e) => e.key === 'Escape' && close()}
			aria-label="Close"
		></button>

		<div
			class="dropdown glass-dropdown"
			class:dropdown-up={direction === 'up'}
			style="top: {dropdownPosition.top}px; left: {dropdownPosition.left}px;"
		>
			<div class="dropdown-header">Zeitbereich</div>

			<div class="time-selectors">
				<div class="time-column">
					<label class="column-label">Von</label>
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
					<label class="column-label">Bis</label>
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
		z-index: 10;
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
		transform: translateY(-1px);
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
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}

	:global(.dark) .glass-dropdown {
		background: rgba(30, 30, 30, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.dropdown-header {
		padding: 0.75rem 1rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7280;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .dropdown-header {
		color: #9ca3af;
		border-bottom-color: rgba(255, 255, 255, 0.1);
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
		color: #6b7280;
		padding: 0 0.5rem;
	}

	:global(.dark) .column-label {
		color: #9ca3af;
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
		color: #374151;
		cursor: pointer;
		transition: all 0.15s;
		text-align: left;
	}

	:global(.dark) .hour-option {
		color: #e5e7eb;
	}

	.hour-option:hover:not(.disabled) {
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .hour-option:hover:not(.disabled) {
		background: rgba(255, 255, 255, 0.1);
	}

	.hour-option.active {
		background: color-mix(in srgb, var(--color-primary-500, #3b82f6) 20%, white 80%);
		color: var(--color-primary-500, #3b82f6);
	}

	:global(.dark) .hour-option.active {
		background: color-mix(in srgb, var(--color-primary-500, #3b82f6) 30%, transparent 70%);
		color: var(--color-primary-500, #3b82f6);
	}

	.hour-option.disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.time-divider {
		width: 1px;
		background: rgba(0, 0, 0, 0.1);
		margin: 0.5rem 0;
	}

	:global(.dark) .time-divider {
		background: rgba(255, 255, 255, 0.1);
	}

	.dropdown-footer {
		padding: 0.5rem 1rem;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	:global(.dark) .dropdown-footer {
		border-top-color: rgba(255, 255, 255, 0.1);
	}

	.current-range {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-primary-500, #3b82f6);
	}
</style>
