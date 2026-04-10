<script lang="ts">
	import type {
		WallpaperResult,
		DevicePreset,
		DeviceCategory,
		Layout,
		Background,
		CornerPosition,
	} from '../types.js';
	import { createBrowserGenerator, downloadWallpaper } from '../renderers/browser.js';
	import {
		PHONE_PRESETS,
		TABLET_PRESETS,
		DESKTOP_PRESETS,
		getRecommendedPresets,
	} from '../presets/index.js';
	import { GRADIENT_PRESETS } from '../types.js';

	interface Props {
		show: boolean;
		imageDataUrl: string;
		imageSize?: { width: number; height: number };
		onClose: () => void;
		onGenerate?: (result: WallpaperResult) => void;
	}

	let { show, imageDataUrl, imageSize, onClose, onGenerate }: Props = $props();

	// State
	let selectedCategory = $state<DeviceCategory>('phone');
	let selectedDeviceId = $state<string>('iphone-15-pro-max');
	let layoutType = $state<'center' | 'corner' | 'pattern'>('center');
	let cornerPosition = $state<CornerPosition>('bottom-right');
	let layoutScale = $state(0.6);
	let backgroundType = $state<'solid' | 'gradient'>('gradient');
	let solidColor = $state('#1a1a2e');
	let selectedGradient = $state('dark');
	let generating = $state(false);
	let previewUrl = $state<string | null>(null);
	let result = $state<WallpaperResult | null>(null);

	// Computed
	const devicesByCategory = $derived<Record<DeviceCategory, DevicePreset[]>>({
		phone: PHONE_PRESETS,
		tablet: TABLET_PRESETS,
		desktop: DESKTOP_PRESETS,
	});

	const currentDevices = $derived(devicesByCategory[selectedCategory] || []);

	// `$derived.by(...)` is the variant that takes a thunk and runs it
	// inside the derivation. Plain `$derived(expr)` only takes a single
	// expression — passing an arrow function there made `currentLayout`
	// itself a function value, which is why the call sites below had to
	// invoke it as `currentLayout()`. Both call sites now read it as a
	// plain value.
	const currentLayout = $derived.by<Layout>(() => {
		if (layoutType === 'center') {
			return { type: 'center', scale: layoutScale };
		} else if (layoutType === 'corner') {
			return { type: 'corner', position: cornerPosition, scale: layoutScale * 0.5, padding: 60 };
		} else {
			return { type: 'pattern', scale: layoutScale * 0.3, gap: 40, opacity: 0.15 };
		}
	});

	const currentBackground = $derived.by<Background>(() => {
		if (backgroundType === 'solid') {
			return { type: 'solid', color: solidColor };
		} else {
			const preset = GRADIENT_PRESETS[selectedGradient] || GRADIENT_PRESETS['dark'];
			return preset;
		}
	});

	// Generator
	const generator = createBrowserGenerator();

	// Generate preview when settings change
	$effect(() => {
		if (show && imageDataUrl) {
			generatePreview();
		}
	});

	async function generatePreview() {
		try {
			const url = await generator.preview(
				{ type: 'dataUrl', data: imageDataUrl },
				{
					device: selectedDeviceId,
					layout: currentLayout,
					background: currentBackground,
				}
			);
			previewUrl = url;
		} catch (e) {
			console.error('Preview generation failed:', e);
		}
	}

	async function generateWallpaper() {
		generating = true;
		result = null;

		try {
			result = await generator.generate(
				{ type: 'dataUrl', data: imageDataUrl },
				{
					device: selectedDeviceId,
					layout: currentLayout,
					background: currentBackground,
					format: 'png',
				}
			);

			onGenerate?.(result);
		} catch (e) {
			console.error('Wallpaper generation failed:', e);
		} finally {
			generating = false;
		}
	}

	function handleDownload() {
		if (result) {
			const device = currentDevices.find((d) => d.id === selectedDeviceId);
			const deviceName = device?.name.replace(/\s+/g, '-').toLowerCase() || 'custom';
			downloadWallpaper(result, `wallpaper-${deviceName}.png`);
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	// Reset state when modal closes
	$effect(() => {
		if (!show) {
			result = null;
			previewUrl = null;
		}
	});
</script>

{#if show}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
		onclick={handleBackdropClick}
	>
		<div
			class="bg-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
			role="dialog"
			aria-modal="true"
		>
			<div class="p-6">
				<!-- Header -->
				<div class="flex items-center justify-between mb-6">
					<div class="flex items-center gap-3">
						<div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
							<svg
								class="h-5 w-5 text-primary"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
						</div>
						<div>
							<h3 class="text-lg font-semibold">Wallpaper erstellen</h3>
							<p class="text-sm text-muted-foreground">Erstelle ein Wallpaper fur dein Gerat</p>
						</div>
					</div>
					<button
						onclick={onClose}
						class="p-2 hover:bg-muted rounded-lg transition-colors"
						aria-label="Schliessen"
					>
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<div class="grid md:grid-cols-2 gap-6">
					<!-- Preview -->
					<div class="space-y-4">
						<h4 class="font-medium text-sm">Vorschau</h4>
						<div
							class="aspect-[9/16] bg-muted rounded-lg overflow-hidden flex items-center justify-center border"
						>
							{#if previewUrl}
								<img
									src={previewUrl}
									alt="Wallpaper Preview"
									class="w-full h-full object-contain"
								/>
							{:else}
								<div class="text-muted-foreground text-sm">Wird generiert...</div>
							{/if}
						</div>
					</div>

					<!-- Settings -->
					<div class="space-y-6">
						<!-- Device Selection -->
						<div class="space-y-3">
							<h4 class="font-medium text-sm">Gerat</h4>

							<!-- Category Tabs -->
							<div class="flex gap-1 p-1 bg-muted rounded-lg">
								{#each ['phone', 'tablet', 'desktop'] as category}
									<button
										onclick={() => {
											selectedCategory = category as DeviceCategory;
											selectedDeviceId = devicesByCategory[category as DeviceCategory][0]?.id || '';
										}}
										class="flex-1 px-3 py-1.5 text-sm rounded-md transition-colors {selectedCategory ===
										category
											? 'bg-card shadow-sm font-medium'
											: 'hover:bg-card/50'}"
									>
										{category === 'phone' ? 'Handy' : category === 'tablet' ? 'Tablet' : 'Desktop'}
									</button>
								{/each}
							</div>

							<!-- Device Dropdown -->
							<select
								bind:value={selectedDeviceId}
								class="w-full px-3 py-2 bg-muted border rounded-lg text-sm"
							>
								{#each currentDevices as device}
									<option value={device.id}>
										{device.name} ({device.width}x{device.height})
									</option>
								{/each}
							</select>
						</div>

						<!-- Layout -->
						<div class="space-y-3">
							<h4 class="font-medium text-sm">Layout</h4>

							<div class="flex gap-2">
								{#each ['center', 'corner', 'pattern'] as type}
									<button
										onclick={() => (layoutType = type as 'center' | 'corner' | 'pattern')}
										class="flex-1 px-3 py-2 text-sm border rounded-lg transition-colors {layoutType ===
										type
											? 'bg-primary text-primary-foreground border-primary'
											: 'hover:bg-muted'}"
									>
										{type === 'center' ? 'Zentriert' : type === 'corner' ? 'Ecke' : 'Muster'}
									</button>
								{/each}
							</div>

							{#if layoutType === 'corner'}
								<div class="grid grid-cols-2 gap-2">
									{#each ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as pos}
										<button
											onclick={() => (cornerPosition = pos as CornerPosition)}
											class="px-3 py-2 text-xs border rounded-lg transition-colors {cornerPosition ===
											pos
												? 'bg-primary/10 border-primary'
												: 'hover:bg-muted'}"
										>
											{pos === 'top-left'
												? 'Oben Links'
												: pos === 'top-right'
													? 'Oben Rechts'
													: pos === 'bottom-left'
														? 'Unten Links'
														: 'Unten Rechts'}
										</button>
									{/each}
								</div>
							{/if}

							<!-- Scale Slider -->
							<div class="space-y-2">
								<div class="flex justify-between text-sm">
									<span class="text-muted-foreground">Grosse</span>
									<span>{Math.round(layoutScale * 100)}%</span>
								</div>
								<input
									type="range"
									min="0.1"
									max="1.5"
									step="0.05"
									bind:value={layoutScale}
									class="w-full"
								/>
							</div>
						</div>

						<!-- Background -->
						<div class="space-y-3">
							<h4 class="font-medium text-sm">Hintergrund</h4>

							<div class="flex gap-2">
								<button
									onclick={() => (backgroundType = 'gradient')}
									class="flex-1 px-3 py-2 text-sm border rounded-lg transition-colors {backgroundType ===
									'gradient'
										? 'bg-primary text-primary-foreground border-primary'
										: 'hover:bg-muted'}"
								>
									Verlauf
								</button>
								<button
									onclick={() => (backgroundType = 'solid')}
									class="flex-1 px-3 py-2 text-sm border rounded-lg transition-colors {backgroundType ===
									'solid'
										? 'bg-primary text-primary-foreground border-primary'
										: 'hover:bg-muted'}"
								>
									Einfarbig
								</button>
							</div>

							{#if backgroundType === 'gradient'}
								<div class="grid grid-cols-5 gap-2">
									{#each Object.entries(GRADIENT_PRESETS) as [key, preset]}
										<button
											onclick={() => (selectedGradient = key)}
											class="aspect-square rounded-lg border-2 transition-all {selectedGradient ===
											key
												? 'border-primary scale-105'
												: 'border-transparent hover:border-muted-foreground/30'}"
											style="background: linear-gradient({preset.angle ??
												180}deg, {preset.colors.join(', ')})"
											aria-label={key}
										></button>
									{/each}
								</div>
							{:else}
								<div class="flex items-center gap-3">
									<input
										type="color"
										bind:value={solidColor}
										class="w-12 h-10 rounded cursor-pointer"
									/>
									<input
										type="text"
										bind:value={solidColor}
										class="flex-1 px-3 py-2 bg-muted border rounded-lg text-sm font-mono"
										pattern="^#[0-9A-Fa-f]{6}$"
									/>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Result Info -->
				{#if result}
					<div
						class="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
					>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<svg
									class="h-5 w-5 text-green-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									/>
								</svg>
								<span class="font-medium text-green-800 dark:text-green-200"
									>Wallpaper erstellt!</span
								>
							</div>
							<span class="text-sm text-green-700 dark:text-green-300">
								{result.width}x{result.height} · {formatSize(result.size)}
							</span>
						</div>
					</div>
				{/if}

				<!-- Actions -->
				<div class="mt-6 flex gap-3">
					<button
						onclick={onClose}
						class="flex-1 px-4 py-2.5 border rounded-lg hover:bg-muted transition-colors"
					>
						Abbrechen
					</button>
					{#if result}
						<button
							onclick={handleDownload}
							class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
								/>
							</svg>
							Herunterladen
						</button>
					{:else}
						<button
							onclick={generateWallpaper}
							disabled={generating}
							class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
						>
							{#if generating}
								<div
									class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
								></div>
								Generiert...
							{:else}
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
								Wallpaper erstellen
							{/if}
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
