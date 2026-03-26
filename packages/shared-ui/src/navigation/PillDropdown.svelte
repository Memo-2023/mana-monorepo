<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { PillDropdownItem } from './types';

	interface Props {
		items: PillDropdownItem[];
		direction?: 'up' | 'down';
		label: string;
		icon?: 'globe' | 'language' | 'chevronDown' | 'check' | string;
		isOpen?: boolean;
		onToggle?: (open: boolean) => void;
		/** Optional header content (e.g., mode selector) */
		header?: Snippet;
		/** Optional footer content (e.g., a11y toggles) */
		footer?: Snippet;
		/** Show only the icon without label */
		iconOnly?: boolean;
	}

	let {
		items,
		direction = 'down',
		label,
		icon,
		isOpen = false,
		onToggle,
		header,
		footer,
		iconOnly = false,
	}: Props = $props();

	let internalOpen = $state(false);
	let triggerButton: HTMLButtonElement;
	let dropdownPosition = $state({ top: 0, left: 0 });
	let openSubmenuId = $state<string | null>(null);

	const open = $derived(onToggle ? isOpen : internalOpen);

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

		if (onToggle) {
			onToggle(!isOpen);
		} else {
			internalOpen = !internalOpen;
		}
	}

	function close() {
		openSubmenuId = null;
		if (onToggle) {
			onToggle(false);
		} else {
			internalOpen = false;
		}
	}

	function toggleSubmenu(itemId: string) {
		openSubmenuId = openSubmenuId === itemId ? null : itemId;
	}

	function handleItemClick(item: PillDropdownItem, event: MouseEvent) {
		if (item.submenu && item.submenu.length > 0) {
			toggleSubmenu(item.id);
			return;
		}
		if (item.onClick) {
			item.onClick(event);
		}
		close();
	}

	function handleSplitClick(item: PillDropdownItem, event: MouseEvent) {
		event.stopPropagation();
		if (item.onSplitClick) {
			item.onSplitClick();
		}
		close();
	}

	function handleSubmenuItemClick(item: PillDropdownItem) {
		if (item.onClick) {
			item.onClick();
		}
		close();
	}

	const iconPaths: Record<string, string> = {
		language:
			'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129',
		check: 'M5 13l4 4L19 7',
		chevronDown: 'M19 9l-7 7-7-7',
		chevronRight: 'M9 5l7 7-7 7',
		globe:
			'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
		palette:
			'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
		// Theme icons (Phosphor-style)
		sparkle:
			'M12 2L13.09 8.26L18 6L15.74 10.91L22 12L15.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L8.26 13.09L2 12L8.26 10.91L6 6L10.91 8.26L12 2Z',
		leaf: 'M6.5 21.5C3.5 18.5 3.5 12.5 6.5 8.5C9.5 4.5 15 3 20 3C20 8 18.5 13.5 14.5 16.5C10.5 19.5 4.5 19.5 4.5 19.5M6.5 21.5L4.5 19.5M6.5 21.5C6.5 21.5 12 18 14.5 16.5',
		hexagon: 'M12 2L21.5 7.5V16.5L12 22L2.5 16.5V7.5L12 2Z',
		waves:
			'M2 12C2 12 5 8 9 8C13 8 15 12 15 12C15 12 17 16 21 16M2 17C2 17 5 13 9 13C13 13 15 17 15 17C15 17 17 21 21 21M2 7C2 7 5 3 9 3C13 3 15 7 15 7C15 7 17 11 21 11',
		// User menu icons
		user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
		settings:
			'M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93s.844.083 1.16-.175l.713-.57a1.125 1.125 0 011.578.112l.773.773a1.125 1.125 0 01.112 1.578l-.57.713c-.258.316-.29.756-.175 1.16s.506.71.93.78l.894.15c.542.09.94.56.94 1.109v1.094c0 .55-.398 1.02-.94 1.11l-.894.149c-.424.07-.764.384-.93.78s-.083.844.175 1.16l.57.713a1.125 1.125 0 01-.112 1.578l-.773.773a1.125 1.125 0 01-1.578.112l-.713-.57c-.316-.258-.756-.29-1.16-.175s-.71.506-.78.93l-.15.894c-.09.542-.56.94-1.109.94h-1.094c-.55 0-1.02-.398-1.11-.94l-.149-.894c-.07-.424-.384-.764-.78-.93s-.844-.083-1.16.175l-.713.57a1.125 1.125 0 01-1.578-.112l-.773-.773a1.125 1.125 0 01-.112-1.578l.57-.713c.258-.316.29-.756.175-1.16s-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.764-.384.93-.78s.083-.844-.175-1.16l-.57-.713a1.125 1.125 0 01.112-1.578l.773-.773a1.125 1.125 0 011.578-.112l.713.57c.316.258.756.29 1.16.175s.71-.506.78-.93l.15-.894zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
		logout:
			'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
		// App icons
		grid: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
		// Help icon (question mark circle)
		help: 'M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm2-1.645A3.502 3.502 0 0012 6.5 3.501 3.501 0 008.645 9h2.012A1.5 1.5 0 0112 8.5c.828 0 1.5.672 1.5 1.5 0 .828-.672 1.5-1.5 1.5a1 1 0 00-1 1V14h2v-.645z',
		// Mana icon (water drop)
		mana: 'M12.3 1c.03.05 7.3 9.67 7.3 13.7 0 4.03-3.27 7.3-7.3 7.3S5 18.73 5 14.7C5 10.66 12.3 1 12.3 1zm0 6.4c-.02.03-3.65 4.83-3.65 6.84 0 2.02 1.64 3.65 3.65 3.65s3.65-1.64 3.65-3.65c0-2.01-3.62-6.81-3.65-6.84z',
	};

	function getIcon(iconName: string) {
		return iconPaths[iconName] || iconName;
	}
</script>

<div class="pill-dropdown">
	<!-- Trigger Button -->
	<button
		bind:this={triggerButton}
		onclick={toggle}
		class="pill glass-pill trigger-button"
		class:icon-only={iconOnly}
	>
		{#if icon}
			<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIcon(icon)} />
			</svg>
		{/if}
		{#if !iconOnly}
			<span class="pill-label">{label}</span>
		{/if}
		<svg
			class="chevron-icon"
			class:rotated={open}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d={getIcon('chevronDown')}
			/>
		</svg>
	</button>

	{#if open}
		<!-- Backdrop -->
		<button
			class="menu-backdrop"
			onclick={close}
			onkeydown={(e) => e.key === 'Escape' && close()}
			aria-label="Close dropdown"
		></button>

		<!-- Dropdown items -->
		<div
			class="fan-container"
			class:fan-up={direction === 'up'}
			class:fan-down={direction === 'down'}
			style="top: {dropdownPosition.top}px; left: {dropdownPosition.left}px;"
		>
			<!-- Optional header (e.g., mode selector) -->
			{#if header}
				<div class="dropdown-header">
					{@render header()}
				</div>
			{/if}

			{#each items.filter((i) => !i.disabled) as item, i (item.id)}
				{#if item.divider}
					<div
						class="dropdown-divider"
						style="animation-delay: {(header ? i + 1 : i) * 15}ms"
					></div>
				{:else}
					<div
						class="fan-pill-wrapper"
						class:has-split-button={item.showSplitButton}
						style="animation-delay: {(header ? i + 1 : i) * 15}ms"
					>
						<button
							onclick={(e) => handleItemClick(item, e)}
							class="pill glass-pill fan-pill"
							class:danger-pill={item.danger}
							class:active-pill={item.active}
							class:has-submenu={item.submenu && item.submenu.length > 0}
							class:submenu-open={openSubmenuId === item.id}
						>
							{#if item.imageUrl}
								<img src={item.imageUrl} alt="" class="pill-image-icon" />
							{:else if item.icon === 'mana'}
								<svg class="pill-icon" viewBox="0 0 24 24" fill="currentColor">
									<path d={getIcon('mana')} />
								</svg>
							{:else if item.icon}
								<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d={getIcon(item.icon)}
									/>
								</svg>
							{/if}
							<span class="pill-label">{item.label}</span>
							{#if item.active}
								<svg class="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d={getIcon('check')}
									/>
								</svg>
							{:else if item.submenu && item.submenu.length > 0}
								<svg
									class="chevron-submenu"
									class:rotated={openSubmenuId === item.id}
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d={getIcon('chevronDown')}
									/>
								</svg>
							{/if}
						</button>
						{#if item.showSplitButton && item.onSplitClick}
							<button
								onclick={(e) => handleSplitClick(item, e)}
								class="split-button glass-pill"
								title="Open in split panel (Ctrl/Cmd+Click)"
							>
								<svg class="split-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4a1 1 0 001-1V5a1 1 0 00-1-1zM19 4h-4a1 1 0 00-1 1v14a1 1 0 001 1h4a1 1 0 001-1V5a1 1 0 00-1-1z"
									/>
								</svg>
							</button>
						{/if}
					</div>
					<!-- Submenu items -->
					{#if item.submenu && item.submenu.length > 0 && openSubmenuId === item.id}
						<div class="submenu-container">
							{#each item.submenu.filter((si) => !si.disabled) as subitem, si (subitem.id)}
								<button
									onclick={() => handleSubmenuItemClick(subitem)}
									class="pill glass-pill fan-pill submenu-item"
									class:active-pill={subitem.active}
									style="animation-delay: {si * 15}ms"
								>
									<span class="pill-label">{subitem.label}</span>
									{#if subitem.active}
										<svg class="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d={getIcon('check')}
											/>
										</svg>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				{/if}
			{/each}

			<!-- Optional footer (e.g., a11y toggles) -->
			{#if footer}
				<div class="dropdown-footer">
					{@render footer()}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.pill-dropdown {
		position: relative;
		z-index: 1;
	}

	.pill-dropdown:has(.fan-container) {
		z-index: 10000;
	}

	.trigger-button {
		position: relative;
		z-index: 10;
	}

	.trigger-button.icon-only {
		padding: 0.5rem 0.625rem;
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

	.fan-container {
		position: fixed;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		z-index: 9999;
	}

	.fan-up {
		flex-direction: column-reverse;
		transform: translateY(-100%);
	}

	.fan-down {
		flex-direction: column;
	}

	.fan-pill {
		animation: fanIn 0.15s ease-out forwards;
		opacity: 0;
		transform: translateY(10px);
	}

	.fan-up .fan-pill {
		transform: translateY(-10px);
	}

	@keyframes fanIn {
		to {
			opacity: 1;
			transform: translateY(0);
		}
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

	.glass-pill,
	:global(.fan-container .glass-pill) {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		color: #374151;
	}

	:global(.dark) .glass-pill,
	:global(.dark .fan-container .glass-pill) {
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

	.active-pill {
		background: var(--color-primary-100, rgba(248, 214, 43, 0.2));
		border-color: var(--color-primary-200, rgba(248, 214, 43, 0.3));
	}

	:global(.dark) .active-pill {
		background: var(--color-primary-900, rgba(248, 214, 43, 0.15));
		border-color: var(--color-primary-800, rgba(248, 214, 43, 0.25));
	}

	.danger-pill {
		color: #dc2626;
	}

	:global(.dark) .danger-pill {
		color: #ef4444;
	}

	.danger-pill:hover {
		background: rgba(220, 38, 38, 0.15);
		border-color: rgba(220, 38, 38, 0.3);
	}

	.pill-icon {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
	}

	.pill-image-icon {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
		border-radius: 0.25rem;
		object-fit: cover;
	}

	.check-icon {
		width: 0.875rem;
		height: 0.875rem;
		margin-left: 0.25rem;
		color: var(--color-primary-500, #f8d62b);
	}

	.pill-label {
		display: inline;
	}

	.menu-backdrop {
		position: fixed;
		inset: 0;
		z-index: 9998;
		background: transparent;
		border: none;
		cursor: default;
	}

	/* Header for custom content (e.g., mode selector) */
	.dropdown-header {
		animation: fanIn 0.15s ease-out forwards;
		opacity: 0;
		transform: translateY(10px);
		position: relative;
		z-index: 1;
	}

	.fan-up .dropdown-header {
		transform: translateY(-10px);
	}

	/* Divider in dropdown */
	.dropdown-divider {
		height: 1px;
		background: rgba(0, 0, 0, 0.1);
		margin: 0.25rem 0.5rem;
		animation: fanIn 0.15s ease-out forwards;
		opacity: 0;
	}

	:global(.dark) .dropdown-divider {
		background: rgba(255, 255, 255, 0.15);
	}

	/* Submenu styles */
	.chevron-submenu {
		width: 0.75rem;
		height: 0.75rem;
		margin-left: auto;
		transition: transform 0.2s;
	}

	.chevron-submenu.rotated {
		transform: rotate(180deg);
	}

	.has-submenu {
		justify-content: flex-start;
	}

	.submenu-open {
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .submenu-open {
		background: rgba(255, 255, 255, 0.1);
	}

	.submenu-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 0;
		margin-bottom: 0;
	}

	.submenu-item {
		padding: 0.5rem 0.875rem;
		font-size: 0.875rem;
		animation: fanIn 0.15s ease-out forwards;
		opacity: 0;
		justify-content: flex-start;
	}

	.submenu-item .pill-label {
		flex: 1;
		text-align: left;
	}

	/* Split button wrapper */
	.fan-pill-wrapper {
		display: flex;
		align-items: stretch;
		gap: 2px;
		animation: fanIn 0.15s ease-out forwards;
		opacity: 0;
		transform: translateY(10px);
	}

	.fan-up .fan-pill-wrapper {
		transform: translateY(-10px);
	}

	.fan-pill-wrapper .fan-pill {
		animation: none;
		opacity: 1;
		transform: none;
	}

	.fan-pill-wrapper.has-split-button .fan-pill {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
		flex: 1;
	}

	.split-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
		border-top-right-radius: 9999px;
		border-bottom-right-radius: 9999px;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
	}

	.split-button:hover {
		background: var(--color-primary-100, rgba(59, 130, 246, 0.15));
		border-color: var(--color-primary-200, rgba(59, 130, 246, 0.3));
	}

	:global(.dark) .split-button:hover {
		background: var(--color-primary-900, rgba(59, 130, 246, 0.2));
		border-color: var(--color-primary-800, rgba(59, 130, 246, 0.4));
	}

	.split-icon {
		width: 0.875rem;
		height: 0.875rem;
	}

	/* Footer for custom content (e.g., a11y toggles) */
	.dropdown-footer {
		animation: fanIn 0.15s ease-out forwards;
		opacity: 0;
		transform: translateY(10px);
		position: relative;
		z-index: 1;
		margin-top: 0.25rem;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .dropdown-footer {
		border-top-color: rgba(255, 255, 255, 0.15);
	}

	.fan-up .dropdown-footer {
		transform: translateY(-10px);
		margin-top: 0;
		margin-bottom: 0.25rem;
		padding-top: 0;
		padding-bottom: 0.5rem;
		border-top: none;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .fan-up .dropdown-footer {
		border-bottom-color: rgba(255, 255, 255, 0.15);
	}
</style>
