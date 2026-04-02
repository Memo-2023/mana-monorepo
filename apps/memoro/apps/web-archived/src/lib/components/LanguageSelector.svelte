<script lang="ts">
	import { locale } from 'svelte-i18n';
	import { setLocale, supportedLocales, type SupportedLocale } from '$lib/i18n';
	import { theme } from '$lib/stores/theme';

	// Language info with flags and names
	const languages: Record<SupportedLocale, { flag: string; name: string; code: string }> = {
		de: { flag: '🇩🇪', name: 'Deutsch', code: 'DE' },
		en: { flag: '🇬🇧', name: 'English', code: 'EN' },
		fr: { flag: '🇫🇷', name: 'Français', code: 'FR' },
		it: { flag: '🇮🇹', name: 'Italiano', code: 'IT' },
		es: { flag: '🇪🇸', name: 'Español', code: 'ES' },
	};

	let currentTheme = $derived($theme);
	let isDark = $derived(currentTheme.effectiveMode === 'dark');
	let currentLocale = $derived(($locale as SupportedLocale) || 'en');
	let isOpen = $state(false);

	function getPrimaryColor() {
		const variant = currentTheme.variant;
		if (isDark) {
			const colors = {
				lume: '#f8d62b',
				nature: '#4CAF50',
				stone: '#78909C',
				ocean: '#039BE5',
			};
			return colors[variant];
		} else {
			const colors = {
				lume: '#f8d62b',
				nature: '#4CAF50',
				stone: '#607D8B',
				ocean: '#039BE5',
			};
			return colors[variant];
		}
	}

	function handleLocaleChange(newLocale: SupportedLocale) {
		setLocale(newLocale);
		isOpen = false;
	}

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.language-selector')) {
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

<div class="language-selector">
	<button
		onclick={toggleDropdown}
		class="language-button"
		class:active={isOpen}
		style="background-color: {isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)'};
		       border-color: {isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
		       color: {isDark ? '#ffffff' : '#000000'};"
	>
		<span class="flag">{languages[currentLocale].flag}</span>
		<span class="code">{languages[currentLocale].code}</span>
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
			{#each supportedLocales as lang}
				<button
					onclick={() => handleLocaleChange(lang)}
					class="dropdown-item"
					class:active={currentLocale === lang}
					style="color: {isDark ? '#ffffff' : '#000000'};"
				>
					<span class="flag">{languages[lang].flag}</span>
					<span class="name">{languages[lang].name}</span>
					{#if currentLocale === lang}
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
	.language-selector {
		position: relative;
		display: inline-block;
	}

	.language-button {
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

	.language-button:hover {
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.language-button.active {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.flag {
		font-size: 1.125rem;
		line-height: 1;
	}

	.code {
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
