<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import type { ThemeVariant, ThemeMode } from '@manacore/shared-theme';
	import { THEME_DEFINITIONS } from '@manacore/shared-theme';
	import { CheckCircle, Info } from '@manacore/shared-icons';

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
		{ value: 'lume', label: 'Lume', icon: '✨' },
		{ value: 'nature', label: 'Nature', icon: '🌿' },
		{ value: 'stone', label: 'Stone', icon: '🪨' },
		{ value: 'ocean', label: 'Ocean', icon: '🌊' },
	];

	const modeOptions: ModeOption[] = [
		{ value: 'system', label: 'System', icon: '💻' },
		{ value: 'light', label: 'Hell', icon: '☀️' },
		{ value: 'dark', label: 'Dunkel', icon: '🌙' },
	];

	/**
	 * Get the primary color for a variant based on current effective mode
	 */
	function getVariantColor(variant: ThemeVariant): string {
		const definition = THEME_DEFINITIONS[variant];
		const colors = theme.effectiveMode === 'dark' ? definition.dark : definition.light;
		return `hsl(${colors.primary})`;
	}
</script>

<div class="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
	<!-- Theme Variant Selection -->
	<div class="mb-8">
		<h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Theme</h3>
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
			{#each themeOptions as option}
				{@const isSelected = theme.variant === option.value}
				<button
					onclick={() => theme.setVariant(option.value)}
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
					<div class="flex justify-center">
						<div
							class="h-5 w-5 rounded-full"
							style="background-color: {getVariantColor(option.value)}"
						></div>
					</div>

					<!-- Checkmark -->
					{#if isSelected}
						<div class="absolute right-2 top-2">
							<CheckCircle size={24} weight="fill" class="text-blue-600 dark:text-blue-400" />
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
				{@const isSelected = theme.mode === option.value}
				<button
					onclick={() => theme.setMode(option.value)}
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
		{#if theme.mode === 'system'}
			<div
				class="mt-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950"
			>
				<Info size={20} class="mt-0.5 flex-shrink-0 text-blue-500 dark:text-blue-400" />
				<p class="text-sm text-blue-700 dark:text-blue-300">
					Das Theme folgt den Systemeinstellungen deines Geräts
				</p>
			</div>
		{/if}
	</div>
</div>
