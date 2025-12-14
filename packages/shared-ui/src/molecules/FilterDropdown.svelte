<script lang="ts">
	import { tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import type { FilterDropdownOption } from './FilterDropdown.types';

	interface Props {
		/** Available options */
		options: FilterDropdownOption[];
		/** Current selected value(s) - string for single, string[] for multi */
		value: string | string[] | null;
		/** Callback when selection changes */
		onChange: (value: string | string[] | null) => void;
		/** Placeholder text when no value selected */
		placeholder?: string;
		/** Enable multi-select mode with checkboxes */
		multiSelect?: boolean;
		/** Force searchable mode (auto-enabled at 8+ options) */
		searchable?: boolean;
		/** Dropdown direction */
		direction?: 'up' | 'down';
		/** Embedded mode for toolbar usage (smaller, no shadow) */
		embedded?: boolean;
		/** Max dropdown height */
		maxHeight?: string;
		/** Disabled state */
		disabled?: boolean;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		options,
		value,
		onChange,
		placeholder = 'Select...',
		multiSelect = false,
		searchable = false,
		direction = 'down',
		embedded = false,
		maxHeight = '300px',
		disabled = false,
		class: className = '',
	}: Props = $props();

	// State
	let isOpen = $state(false);
	let searchQuery = $state('');
	let triggerRef: HTMLButtonElement | undefined = $state();
	let searchInputRef: HTMLInputElement | undefined = $state();
	let dropdownPosition = $state({ top: 0, left: 0, width: 0 });
	let focusedIndex = $state(-1);

	// Auto-searchable at 8+ options
	let showSearch = $derived(searchable || options.length >= 8);

	// Filtered options based on search
	let filteredOptions = $derived(
		searchQuery
			? options.filter(
					(o) => !o.divider && o.label.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: options
	);

	// Group options by group property
	let groupedOptions = $derived.by(() => {
		const groups = new Map<string | null, FilterDropdownOption[]>();
		for (const opt of filteredOptions) {
			if (opt.divider) continue;
			const key = opt.group || null;
			if (!groups.has(key)) groups.set(key, []);
			groups.get(key)!.push(opt);
		}
		return groups;
	});

	// Flat list of selectable options for keyboard navigation
	let selectableOptions = $derived(filteredOptions.filter((o) => !o.divider && !o.disabled));

	// Display label for trigger
	let displayLabel = $derived.by(() => {
		if (multiSelect && Array.isArray(value) && value.length > 0) {
			if (value.length === 1) {
				const opt = options.find((o) => o.value === value[0]);
				return opt?.label || placeholder;
			}
			return `${value.length} ausgewählt`;
		}
		if (typeof value === 'string' && value) {
			const selected = options.find((o) => o.value === value);
			return selected?.label || placeholder;
		}
		return placeholder;
	});

	// Is active (has non-default value)
	let isActive = $derived(
		multiSelect
			? Array.isArray(value) && value.length > 0
			: value !== null && value !== '' && value !== undefined
	);

	// Portal action
	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			},
		};
	}

	// Update dropdown position
	async function updatePosition() {
		if (!triggerRef) return;
		await tick();
		const rect = triggerRef.getBoundingClientRect();
		const viewportHeight = window.innerHeight;

		let top: number;
		if (direction === 'up') {
			top = rect.top - 8;
		} else {
			top = rect.bottom + 8;
		}

		// Adjust if would go off-screen
		const dropdownHeight = 250; // Approximate
		if (direction === 'down' && top + dropdownHeight > viewportHeight - 20) {
			top = rect.top - dropdownHeight - 8;
		}

		dropdownPosition = {
			top,
			left: rect.left,
			width: Math.max(rect.width, 160),
		};
	}

	function open() {
		if (disabled) return;
		isOpen = true;
		searchQuery = '';
		focusedIndex = -1;
		updatePosition();
		// Focus search input if shown
		tick().then(() => {
			if (showSearch && searchInputRef) {
				searchInputRef.focus();
			}
		});
	}

	function close() {
		isOpen = false;
		searchQuery = '';
		focusedIndex = -1;
	}

	function toggle() {
		if (isOpen) {
			close();
		} else {
			open();
		}
	}

	function isSelected(optionValue: string): boolean {
		if (multiSelect && Array.isArray(value)) {
			return value.includes(optionValue);
		}
		return value === optionValue;
	}

	function select(option: FilterDropdownOption) {
		if (option.disabled) return;

		if (multiSelect) {
			const currentValue = Array.isArray(value) ? value : [];
			if (currentValue.includes(option.value)) {
				// Remove
				const newValue = currentValue.filter((v) => v !== option.value);
				onChange(newValue.length > 0 ? newValue : null);
			} else {
				// Add
				onChange([...currentValue, option.value]);
			}
		} else {
			// Single select - also allow deselecting by clicking same option
			if (value === option.value) {
				onChange(null);
			} else {
				onChange(option.value);
			}
			close();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!isOpen) {
			if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
				e.preventDefault();
				open();
			}
			return;
		}

		switch (e.key) {
			case 'Escape':
				e.preventDefault();
				close();
				triggerRef?.focus();
				break;
			case 'ArrowDown':
				e.preventDefault();
				focusedIndex = Math.min(focusedIndex + 1, selectableOptions.length - 1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				focusedIndex = Math.max(focusedIndex - 1, 0);
				break;
			case 'Enter':
			case ' ':
				e.preventDefault();
				if (focusedIndex >= 0 && focusedIndex < selectableOptions.length) {
					select(selectableOptions[focusedIndex]);
				}
				break;
			case 'Tab':
				close();
				break;
		}
	}

	// Icon paths for common icons
	const iconPaths: Record<string, string> = {
		check: 'M5 13l4 4L19 7',
		chevronDown: 'M19 9l-7 7-7-7',
		search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
		x: 'M6 18L18 6M6 6l12 12',
	};
</script>

<div class="filter-dropdown-wrapper {className}" class:embedded>
	<!-- Trigger Button -->
	<button
		bind:this={triggerRef}
		type="button"
		onclick={toggle}
		onkeydown={handleKeydown}
		class="filter-trigger"
		class:active={isActive}
		class:open={isOpen}
		class:embedded
		{disabled}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
	>
		<span class="trigger-label">{displayLabel}</span>
		<svg
			class="trigger-chevron"
			class:rotated={isOpen}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d={iconPaths.chevronDown}
			/>
		</svg>
	</button>

	{#if isOpen}
		<!-- Backdrop -->
		<button
			use:portal
			type="button"
			class="filter-backdrop"
			onclick={close}
			aria-label="Close dropdown"
		></button>

		<!-- Dropdown Panel -->
		<div
			use:portal
			class="filter-dropdown-panel"
			class:direction-up={direction === 'up'}
			class:embedded
			style="
				top: {dropdownPosition.top}px;
				left: {dropdownPosition.left}px;
				min-width: {dropdownPosition.width}px;
				max-height: {maxHeight};
			"
			transition:fly={{ duration: 150, y: direction === 'up' ? 8 : -8 }}
			role="listbox"
			aria-multiselectable={multiSelect}
		>
			<!-- Search Input -->
			{#if showSearch}
				<div class="search-container">
					<svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d={iconPaths.search}
						/>
					</svg>
					<input
						bind:this={searchInputRef}
						type="text"
						bind:value={searchQuery}
						placeholder="Suchen..."
						class="search-input"
						onkeydown={handleKeydown}
					/>
					{#if searchQuery}
						<button
							type="button"
							class="search-clear"
							onclick={() => (searchQuery = '')}
							aria-label="Suche löschen"
						>
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d={iconPaths.x}
								/>
							</svg>
						</button>
					{/if}
				</div>
			{/if}

			<!-- Options List -->
			<div class="options-list">
				{#if filteredOptions.length === 0}
					<div class="no-results">Keine Ergebnisse</div>
				{:else}
					{#each [...groupedOptions] as [groupName, groupOptions], groupIndex}
						{#if groupName}
							<div class="group-header">{groupName}</div>
						{/if}
						{#each groupOptions as option, optionIndex}
							{@const flatIndex = selectableOptions.indexOf(option)}
							<button
								type="button"
								class="option-item"
								class:selected={isSelected(option.value)}
								class:focused={flatIndex === focusedIndex}
								class:disabled={option.disabled}
								onclick={() => select(option)}
								role="option"
								aria-selected={isSelected(option.value)}
								disabled={option.disabled}
							>
								<!-- Checkbox/Check indicator -->
								<span class="option-indicator">
									{#if multiSelect}
										<span class="checkbox" class:checked={isSelected(option.value)}>
											{#if isSelected(option.value)}
												<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="3"
														d={iconPaths.check}
													/>
												</svg>
											{/if}
										</span>
									{:else if isSelected(option.value)}
										<svg class="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d={iconPaths.check}
											/>
										</svg>
									{/if}
								</span>
								<span class="option-label">{option.label}</span>
							</button>
						{/each}
					{/each}
				{/if}
			</div>

			<!-- Multi-select footer -->
			{#if multiSelect && Array.isArray(value) && value.length > 0}
				<div class="dropdown-footer">
					<button type="button" class="clear-all-btn" onclick={() => onChange(null)}>
						Alle entfernen
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.filter-dropdown-wrapper {
		position: relative;
		display: inline-flex;
	}

	/* Trigger Button */
	.filter-trigger {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.filter-trigger:hover:not(:disabled) {
		border-color: hsl(var(--color-border-strong, var(--color-border)));
		background: hsl(var(--color-muted) / 0.5);
	}

	.filter-trigger:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
		box-shadow: 0 0 0 2px hsl(var(--color-primary) / 0.2);
	}

	.filter-trigger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.filter-trigger.active {
		background: color-mix(in srgb, #3b82f6 15%, transparent 85%);
		color: #3b82f6;
		border-color: #3b82f6;
	}

	.filter-trigger.open {
		border-color: hsl(var(--color-primary));
	}

	/* Embedded mode - pill style for toolbars */
	.filter-trigger.embedded {
		padding: 0.375rem 0.5rem;
		font-size: 0.75rem;
		background: hsl(var(--color-muted) / 0.5);
		border: 1px solid transparent;
		border-radius: 9999px;
	}

	.filter-trigger.embedded:hover:not(:disabled) {
		background: hsl(var(--color-muted));
		border-color: hsl(var(--color-border));
	}

	.filter-trigger.embedded.active {
		background: color-mix(in srgb, #3b82f6 15%, transparent 85%);
		color: #3b82f6;
		border-color: #3b82f6;
	}

	.trigger-label {
		flex: 1;
		text-align: left;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.trigger-chevron {
		width: 0.875rem;
		height: 0.875rem;
		flex-shrink: 0;
		transition: transform 0.2s ease;
		color: hsl(var(--color-muted-foreground));
	}

	.trigger-chevron.rotated {
		transform: rotate(180deg);
	}

	.filter-trigger.active .trigger-chevron {
		color: #3b82f6;
	}

	/* Backdrop */
	:global(.filter-backdrop) {
		position: fixed;
		inset: 0;
		z-index: 9998;
		background: transparent;
		border: none;
		cursor: default;
	}

	/* Dropdown Panel */
	:global(.filter-dropdown-panel) {
		position: fixed;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		min-width: 160px;
		max-width: 320px;
		background: hsl(var(--color-surface) / 0.98);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		box-shadow:
			0 10px 25px -5px rgba(0, 0, 0, 0.15),
			0 8px 10px -6px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	:global(.filter-dropdown-panel.direction-up) {
		transform: translateY(-100%);
	}

	:global(.filter-dropdown-panel.embedded) {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	/* Search Container */
	.search-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.625rem;
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
	}

	.search-icon {
		width: 1rem;
		height: 1rem;
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
	}

	.search-input {
		flex: 1;
		border: none;
		background: transparent;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		outline: none;
	}

	.search-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.search-clear {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem;
		background: transparent;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
		transition: all 0.15s;
	}

	.search-clear:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.search-clear svg {
		width: 0.75rem;
		height: 0.75rem;
	}

	/* Options List */
	.options-list {
		overflow-y: auto;
		padding: 0.375rem;
	}

	.no-results {
		padding: 0.75rem;
		text-align: center;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* Group Header */
	.group-header {
		padding: 0.5rem 0.625rem 0.25rem;
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.025em;
		color: hsl(var(--color-muted-foreground));
	}

	/* Option Item */
	.option-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.625rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		background: transparent;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.1s ease;
		text-align: left;
	}

	.option-item:hover:not(.disabled) {
		background: hsl(var(--color-muted));
	}

	.option-item.focused {
		background: hsl(var(--color-muted));
		outline: 2px solid hsl(var(--color-primary) / 0.5);
		outline-offset: -2px;
	}

	.option-item.selected {
		color: #3b82f6;
	}

	.option-item.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Option Indicator (checkbox or check) */
	.option-indicator {
		width: 1.125rem;
		height: 1.125rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.checkbox {
		width: 1rem;
		height: 1rem;
		border: 2px solid hsl(var(--color-border-strong, var(--color-border)));
		border-radius: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease;
	}

	.checkbox.checked {
		background: #3b82f6;
		border-color: #3b82f6;
	}

	.checkbox svg {
		width: 0.625rem;
		height: 0.625rem;
		color: white;
	}

	.check-icon {
		width: 1rem;
		height: 1rem;
		color: #3b82f6;
	}

	.option-label {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Dropdown Footer */
	.dropdown-footer {
		padding: 0.5rem 0.625rem;
		border-top: 1px solid hsl(var(--color-border) / 0.5);
	}

	.clear-all-btn {
		width: 100%;
		padding: 0.375rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.clear-all-btn:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}
</style>
