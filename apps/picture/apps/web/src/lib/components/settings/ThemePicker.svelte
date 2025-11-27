<script lang="ts">
	import {
		themeVariant,
		themeMode,
		setThemeVariant,
		setThemeMode,
		currentTheme,
	} from '$lib/stores/theme';
	import { themes, type ThemeVariant } from '@picture/design-tokens';
	import type { ThemeMode } from '$lib/stores/theme';

	interface ThemeOption {
		value: ThemeVariant;
		label: string;
		icon: string;
	}

	interface ModeOption {
		value: ThemeMode;
		label: string;
		icon: string;
	}

	const themeOptions: ThemeOption[] = [
		{ value: 'default', label: 'Indigo', icon: '🔵' },
		{ value: 'sunset', label: 'Sunset', icon: '🌅' },
		{ value: 'ocean', label: 'Ocean', icon: '🌊' },
	];

	const modeOptions: ModeOption[] = [
		{ value: 'system', label: 'System', icon: '💻' },
		{ value: 'light', label: 'Hell', icon: '☀️' },
		{ value: 'dark', label: 'Dunkel', icon: '🌙' },
	];
</script>

<div class="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
	<!-- Theme Variant Selection -->
	<div class="mb-8">
		<h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Theme</h3>
		<div class="grid grid-cols-3 gap-3">
			{#each themeOptions as option}
				{@const isSelected = $themeVariant === option.value}
				{@const themePreview = themes[option.value]}
				<button
					onclick={() => setThemeVariant(option.value)}
					class="relative rounded-xl border-2 p-4 transition-all hover:scale-105 {isSelected
						? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950'
						: 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'}"
				>
					<!-- Icon -->
					<div class="mb-2 text-4xl">{option.icon}</div>

					<!-- Label -->
					<div
						class="mb-3 font-semibold {isSelected
							? 'text-blue-600 dark:text-blue-400'
							: 'text-gray-900 dark:text-gray-100'}"
					>
						{option.label}
					</div>

					<!-- Color Preview -->
					<div class="flex justify-center gap-1">
						<div
							class="h-5 w-5 rounded-full"
							style="background-color: {themePreview.colors.dark.primary.default}"
						></div>
						<div
							class="h-5 w-5 rounded-full"
							style="background-color: {themePreview.colors.dark.secondary.default}"
						></div>
					</div>

					<!-- Checkmark -->
					{#if isSelected}
						<div class="absolute right-2 top-2">
							<svg
								class="h-6 w-6 text-blue-600 dark:text-blue-400"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<!-- Mode Selection -->
	<div>
		<h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Modus</h3>
		<div class="grid grid-cols-3 gap-3">
			{#each modeOptions as option}
				{@const isSelected = $themeMode === option.value}
				<button
					onclick={() => setThemeMode(option.value)}
					class="flex flex-col items-center justify-center gap-2 rounded-xl border px-4 py-3 transition-all {isSelected
						? 'border-blue-500 bg-blue-500 text-white'
						: 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'}"
				>
					<span class="text-2xl">{option.icon}</span>
					<span class="text-sm font-medium">{option.label}</span>
				</button>
			{/each}
		</div>

		<!-- System Mode Info -->
		{#if $themeMode === 'system'}
			<div
				class="mt-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950"
			>
				<svg
					class="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500 dark:text-blue-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<p class="text-sm text-blue-700 dark:text-blue-300">
					Das Theme folgt den Systemeinstellungen deines Geräts
				</p>
			</div>
		{/if}
	</div>
</div>
