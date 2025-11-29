<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { X } from '@manacore/shared-icons';

	export interface AspectRatio {
		label: string;
		value: string;
		width: number;
		height: number;
	}

	export interface AdvancedSettings {
		imageCount: number;
		aspectRatio: AspectRatio;
		steps: number;
		guidanceScale: number;
	}

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		settings: AdvancedSettings;
		onUpdate: (settings: AdvancedSettings) => void;
	}

	let { isOpen, onClose, settings, onUpdate }: Props = $props();

	// Available aspect ratios (compatible with most models)
	const aspectRatios: AspectRatio[] = [
		{ label: 'Quadratisch', value: 'square', width: 1024, height: 1024 },
		{ label: 'Hochformat', value: 'portrait', width: 768, height: 1344 },
		{ label: 'Querformat', value: 'landscape', width: 1344, height: 768 },
	];

	// Local state
	let localSettings = $state<AdvancedSettings>({ ...settings });

	// Update local settings when props change
	$effect(() => {
		if (isOpen) {
			localSettings = { ...settings };
		}
	});

	function handleSave() {
		onUpdate(localSettings);
		onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
		transition:fade={{ duration: 200 }}
		onclick={onClose}
		role="presentation"
	></div>

	<!-- Modal -->
	<div
		class="fixed left-1/2 top-1/2 z-[80] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-gray-200/50 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/95"
		transition:fly={{ y: 20, duration: 200 }}
		onclick={(e) => e.stopPropagation()}
		role="dialog"
		aria-modal="true"
	>
		<!-- Header -->
		<div class="mb-6 flex items-center justify-between">
			<h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Erweiterte Einstellungen</h2>
			<button
				onclick={onClose}
				class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
				aria-label="Schließen"
			>
				<X size={20} weight="bold" />
			</button>
		</div>

		<!-- Content -->
		<div class="space-y-6">
			<!-- Image Count -->
			<div>
				<div class="mb-3 flex items-center justify-between">
					<label class="text-sm font-semibold text-gray-900 dark:text-gray-100">
						Anzahl Bilder
					</label>
					{#if localSettings.imageCount > 1}
						<span
							class="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
						>
							{localSettings.imageCount} Bilder
						</span>
					{/if}
				</div>
				<div class="flex gap-2">
					{#each [1, 2, 3, 4, 5] as count}
						<button
							onclick={() => (localSettings.imageCount = count)}
							class="flex h-12 w-12 items-center justify-center rounded-xl border-2 font-medium transition-all {localSettings.imageCount ===
							count
								? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500'
								: 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-400'}"
						>
							{count}
						</button>
					{/each}
				</div>
				{#if localSettings.imageCount > 1}
					<p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
						Jedes Bild wird mit einem anderen Seed generiert
					</p>
				{/if}
			</div>

			<!-- Aspect Ratio -->
			<div>
				<label class="mb-3 block text-sm font-semibold text-gray-900 dark:text-gray-100">
					Seitenverhältnis
				</label>
				<div class="grid grid-cols-3 gap-3">
					{#each aspectRatios as ratio}
						<button
							onclick={() => (localSettings.aspectRatio = ratio)}
							class="flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all {localSettings
								.aspectRatio.value === ratio.value
								? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20'
								: 'border-gray-300 bg-white hover:border-blue-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-400'}"
						>
							<div
								class="flex h-12 w-12 items-center justify-center rounded-lg {localSettings
									.aspectRatio.value === ratio.value
									? 'bg-blue-600 dark:bg-blue-500'
									: 'bg-gray-200 dark:bg-gray-700'}"
							>
								<div
									class="rounded {localSettings.aspectRatio.value === ratio.value
										? 'bg-white'
										: 'bg-gray-400 dark:bg-gray-500'}"
									style="width: {ratio.value === 'square'
										? '24px'
										: ratio.value === 'portrait'
											? '16px'
											: '32px'}; height: {ratio.value === 'square'
										? '24px'
										: ratio.value === 'portrait'
											? '32px'
											: '16px'};"
								></div>
							</div>
							<div class="text-center">
								<p
									class="text-sm font-medium {localSettings.aspectRatio.value === ratio.value
										? 'text-blue-900 dark:text-blue-100'
										: 'text-gray-900 dark:text-gray-100'}"
								>
									{ratio.label}
								</p>
								<p
									class="text-xs {localSettings.aspectRatio.value === ratio.value
										? 'text-blue-700 dark:text-blue-300'
										: 'text-gray-500 dark:text-gray-400'}"
								>
									{ratio.width}×{ratio.height}
								</p>
							</div>
						</button>
					{/each}
				</div>
			</div>

			<!-- Steps Slider -->
			<div>
				<div class="mb-3 flex items-center justify-between">
					<label class="text-sm font-semibold text-gray-900 dark:text-gray-100">
						Schritte (Steps)
					</label>
					<span
						class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300"
					>
						{localSettings.steps}
					</span>
				</div>
				<input
					type="range"
					min="20"
					max="150"
					step="5"
					bind:value={localSettings.steps}
					class="h-2 w-full appearance-none rounded-lg bg-gray-200 dark:bg-gray-700 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:dark:bg-blue-500 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:dark:bg-blue-500"
				/>
				<div class="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
					<span>20 (Schnell)</span>
					<span>150 (Höchste Qualität)</span>
				</div>
			</div>

			<!-- Guidance Scale Slider -->
			<div>
				<div class="mb-3 flex items-center justify-between">
					<label class="text-sm font-semibold text-gray-900 dark:text-gray-100">
						Guidance Scale
					</label>
					<span
						class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300"
					>
						{localSettings.guidanceScale}
					</span>
				</div>
				<input
					type="range"
					min="1"
					max="20"
					step="0.5"
					bind:value={localSettings.guidanceScale}
					class="h-2 w-full appearance-none rounded-lg bg-gray-200 dark:bg-gray-700 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:dark:bg-blue-500 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:dark:bg-blue-500"
				/>
				<div class="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
					<span>1 (Kreativ)</span>
					<span>20 (Präzise)</span>
				</div>
				<p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
					Höhere Werte folgen dem Prompt genauer, niedrigere sind kreativer
				</p>
			</div>
		</div>

		<!-- Actions -->
		<div class="mt-8 flex gap-3">
			<button
				onclick={onClose}
				class="flex-1 rounded-xl bg-gray-100 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
			>
				Abbrechen
			</button>
			<button
				onclick={handleSave}
				class="flex-1 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
			>
				Übernehmen
			</button>
		</div>
	</div>
{/if}
