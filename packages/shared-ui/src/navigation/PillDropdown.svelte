<script lang="ts">
	import type { PillDropdownItem } from './types';

	interface Props {
		items: PillDropdownItem[];
		direction?: 'up' | 'down';
		label: string;
		icon?: 'globe' | 'language' | 'chevronDown' | 'check' | string;
		isOpen?: boolean;
		onToggle?: (open: boolean) => void;
	}

	let {
		items,
		direction = 'down',
		label,
		icon,
		isOpen = false,
		onToggle
	}: Props = $props();

	let internalOpen = $state(false);
	let triggerButton: HTMLButtonElement;
	let dropdownPosition = $state({ top: 0, left: 0 });

	const open = $derived(onToggle ? isOpen : internalOpen);

	function toggle() {
		if (triggerButton) {
			const rect = triggerButton.getBoundingClientRect();
			if (direction === 'down') {
				dropdownPosition = {
					top: rect.bottom + 8,
					left: rect.left
				};
			} else {
				dropdownPosition = {
					top: rect.top - 8,
					left: rect.left
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
		if (onToggle) {
			onToggle(false);
		} else {
			internalOpen = false;
		}
	}

	function handleItemClick(item: PillDropdownItem) {
		item.onClick();
		close();
	}

	const iconPaths: Record<string, string> = {
		language: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129',
		check: 'M5 13l4 4L19 7',
		chevronDown: 'M19 9l-7 7-7-7',
		globe: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9'
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
	>
		{#if icon}
			<svg
				class="pill-icon"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d={getIcon(icon)}
				/>
			</svg>
		{/if}
		<span class="pill-label">{label}</span>
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
		></button>

		<!-- Dropdown items -->
		<div
			class="fan-container"
			class:fan-up={direction === 'up'}
			class:fan-down={direction === 'down'}
			style="top: {dropdownPosition.top}px; left: {dropdownPosition.left}px;"
		>
			{#each items.filter(i => !i.disabled) as item, i (item.id)}
				<button
					onclick={() => handleItemClick(item)}
					class="pill glass-pill fan-pill"
					class:danger-pill={item.danger}
					class:active-pill={item.active}
					style="animation-delay: {i * 15}ms"
				>
					{#if item.icon}
						<svg
							class="pill-icon"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
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
						<svg
							class="check-icon"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
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
</div>

<style>
	.pill-dropdown {
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

	.glass-pill {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
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
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
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
</style>
