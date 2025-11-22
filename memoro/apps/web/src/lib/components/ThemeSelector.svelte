<script lang="ts">
	import { theme, type ThemeVariant } from '$lib/stores/theme';

	// Theme info with icons and names
	const themes: Record<ThemeVariant, { icon: string; name: string; code: string }> = {
		lume: { icon: '✨', name: 'Lume', code: 'LU' },
		nature: { icon: '🌿', name: 'Nature', code: 'NA' },
		stone: { icon: '🪨', name: 'Stone', code: 'ST' },
		ocean: { icon: '🌊', name: 'Ocean', code: 'OC' }
	};

	const themeVariants: ThemeVariant[] = ['lume', 'nature', 'stone', 'ocean'];

	let currentTheme = $derived($theme);
	let isDark = $derived(currentTheme.effectiveMode === 'dark');
	let currentVariant = $derived(currentTheme.variant);
	let isOpen = $state(false);

	function getPrimaryColor() {
		const variant = currentTheme.variant;
		if (isDark) {
			const colors = {
				lume: '#f8d62b',
				nature: '#4CAF50',
				stone: '#78909C',
				ocean: '#039BE5'
			};
			return colors[variant];
		} else {
			const colors = {
				lume: '#f8d62b',
				nature: '#4CAF50',
				stone: '#607D8B',
				ocean: '#039BE5'
			};
			return colors[variant];
		}
	}

	function handleThemeChange(newVariant: ThemeVariant) {
		theme.setVariant(newVariant);
		isOpen = false;
	}

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.theme-selector')) {
			isOpen = false;
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div class="theme-selector">
	<button
		onclick={toggleDropdown}
		class="theme-button"
		class:active={isOpen}
		style="background-color: {isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)'};
		       border-color: {isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
		       color: {isDark ? '#ffffff' : '#000000'};"
	>
		<span class="icon">{themes[currentVariant].icon}</span>
		<span class="name">{themes[currentVariant].name}</span>
		<svg
			class="chevron"
			class:rotate={isOpen}
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="none"
			stroke="currentColor"
		>
			<path d="M2 4l4 4 4-4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	</button>

	{#if isOpen}
		<div
			class="dropdown"
			style="background-color: {isDark ? '#1E1E1E' : '#ffffff'};
			       border-color: {isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
			       box-shadow: 0 4px 12px rgba(0, 0, 0, {isDark ? '0.4' : '0.15'});"
		>
			{#each themeVariants as variant}
				<button
					onclick={() => handleThemeChange(variant)}
					class="dropdown-item"
					class:active={currentVariant === variant}
					style="color: {isDark ? '#ffffff' : '#000000'};"
				>
					<span class="icon">{themes[variant].icon}</span>
					<span class="name">{themes[variant].name}</span>
					{#if currentVariant === variant}
						<svg
							class="check"
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke={getPrimaryColor()}
						>
							<path
								d="M3 8l3 3 7-7"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.theme-selector {
		position: relative;
		display: inline-block;
	}

	.theme-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.75rem;
		border: 1px solid;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		backdrop-filter: blur(10px);
	}

	.theme-button:hover {
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.theme-button.active {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.icon {
		font-size: 1.125rem;
		line-height: 1;
	}

	.theme-button .name {
		font-weight: 600;
		letter-spacing: 0.025em;
	}

	.chevron {
		transition: transform 0.2s;
		margin-left: 0.25rem;
	}

	.chevron.rotate {
		transform: rotate(180deg);
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		min-width: 160px;
		border-radius: 0.75rem;
		border: 1px solid;
		overflow: hidden;
		z-index: 100;
		animation: slideDown 0.2s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1rem;
		border: none;
		background: none;
		cursor: pointer;
		transition: background-color 0.15s;
		font-size: 0.875rem;
	}

	.dropdown-item:hover {
		background-color: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .dropdown-item:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}

	.dropdown-item .name {
		flex: 1;
		text-align: left;
		font-weight: 500;
	}

	.dropdown-item.active {
		font-weight: 600;
	}

	.check {
		flex-shrink: 0;
	}
</style>
