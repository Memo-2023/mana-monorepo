<script lang="ts">
	import { ManaQRCode } from '@manacore/qr-export/svelte';
	import { toDataURL, toSVG } from '@manacore/qr-export/generate';
	import { qrExportService, type QRExportResult } from '$lib/api/services/qr-export';
	import type { UserDataSummary } from '$lib/api/services/my-data';
	import { WallpaperModal } from '@manacore/wallpaper-generator/svelte';

	interface Props {
		show: boolean;
		userData: UserDataSummary | null;
		onClose: () => void;
	}

	let { show, userData, onClose }: Props = $props();

	let loading = $state(true);
	let error = $state<string | null>(null);
	let exportResult = $state<QRExportResult | null>(null);
	let showWallpaperModal = $state(false);
	let qrDataUrl = $state<string | null>(null);

	// Load export data when modal opens
	$effect(() => {
		if (show) {
			loadExportData();
		} else {
			// Reset state when closing
			loading = true;
			error = null;
			exportResult = null;
		}
	});

	async function loadExportData() {
		loading = true;
		error = null;

		try {
			exportResult = await qrExportService.generateFullExport(userData);
		} catch (e) {
			console.error('QR Export failed:', e);
			error = e instanceof Error ? e.message : 'Export fehlgeschlagen';
		} finally {
			loading = false;
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	async function downloadPNG() {
		if (!exportResult) return;

		try {
			const dataUrl = await toDataURL(exportResult.encodeResult, { size: 600 });
			const link = document.createElement('a');
			link.href = dataUrl;
			link.download = `mana-qr-export-${new Date().toISOString().split('T')[0]}.png`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (e) {
			console.error('PNG download failed:', e);
		}
	}

	async function downloadSVG() {
		if (!exportResult) return;

		try {
			const svgString = await toSVG(exportResult.encodeResult, { size: 600 });
			const blob = new Blob([svgString], { type: 'image/svg+xml' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `mana-qr-export-${new Date().toISOString().split('T')[0]}.svg`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (e) {
			console.error('SVG download failed:', e);
		}
	}

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes} Bytes`;
		return `${(bytes / 1024).toFixed(1)} KB`;
	}

	async function openWallpaperModal() {
		if (!exportResult) return;

		try {
			// Generate QR code as data URL for wallpaper generation
			qrDataUrl = await toDataURL(exportResult.encodeResult, { size: 600 });
			showWallpaperModal = true;
		} catch (e) {
			console.error('Failed to generate QR data URL:', e);
		}
	}
</script>

{#if show}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
		onclick={handleBackdropClick}
	>
		<div
			class="bg-card rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
			role="dialog"
			aria-modal="true"
		>
			<div class="p-6">
				<!-- Header -->
				<div class="flex items-center gap-3 mb-6">
					<div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
						<svg class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
							/>
						</svg>
					</div>
					<div>
						<h3 class="text-lg font-semibold">QR-Code Export</h3>
						<p class="text-sm text-muted-foreground">Deine wichtigsten Daten als QR-Code</p>
					</div>
				</div>

				{#if loading}
					<!-- Loading State -->
					<div class="flex flex-col items-center justify-center py-12">
						<div class="relative">
							<div class="w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse"></div>
							<div
								class="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin"
							></div>
						</div>
						<p class="mt-4 text-sm text-muted-foreground">Daten werden geladen...</p>
					</div>
				{:else if error}
					<!-- Error State -->
					<div
						class="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4 text-center"
					>
						<svg
							class="h-8 w-8 text-red-500 mx-auto mb-2"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
						<p class="text-red-600 dark:text-red-400 mb-4">{error}</p>
						<button
							onclick={loadExportData}
							class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
						>
							Erneut versuchen
						</button>
					</div>
				{:else if exportResult}
					<!-- Success State -->
					<div class="space-y-6">
						<!-- QR Code Preview -->
						<div class="flex justify-center">
							<div class="p-4 bg-white rounded-lg shadow-inner">
								<ManaQRCode data={exportResult.encodeResult} size={256} svg={true} />
							</div>
						</div>

						<!-- Size Info -->
						<div class="rounded-lg border bg-muted/50 p-4">
							<div class="flex items-center justify-between mb-3">
								<span class="text-sm font-medium">Datengrosse</span>
								<span
									class="text-sm font-mono {exportResult.encodeResult.fitsInQR
										? 'text-green-600'
										: 'text-red-600'}"
								>
									{formatBytes(exportResult.encodeResult.size)}
									{#if exportResult.encodeResult.fitsInQR}
										<span class="ml-1">✓</span>
									{:else}
										<span class="ml-1">✗</span>
									{/if}
								</span>
							</div>
							<div class="grid grid-cols-3 gap-2 text-center">
								<div class="p-2 rounded bg-card">
									<p class="text-lg font-semibold">{exportResult.stats.contactCount}</p>
									<p class="text-xs text-muted-foreground">Kontakte</p>
								</div>
								<div class="p-2 rounded bg-card">
									<p class="text-lg font-semibold">{exportResult.stats.eventCount}</p>
									<p class="text-xs text-muted-foreground">Termine</p>
								</div>
								<div class="p-2 rounded bg-card">
									<p class="text-lg font-semibold">{exportResult.stats.todoCount}</p>
									<p class="text-xs text-muted-foreground">Todos</p>
								</div>
							</div>
						</div>

						<!-- Info Text -->
						<p class="text-xs text-muted-foreground text-center">
							Scanne diesen QR-Code mit einem kompatiblen Gerat, um deine wichtigsten Daten zu
							ubertragen. Der Code enthalt Kontakte, anstehende Termine und offene Aufgaben.
						</p>

						<!-- Download Buttons -->
						<div class="flex gap-3">
							<button
								onclick={downloadPNG}
								class="flex-1 flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
							>
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
									/>
								</svg>
								PNG
							</button>
							<button
								onclick={downloadSVG}
								class="flex-1 flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
							>
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
									/>
								</svg>
								SVG
							</button>
						</div>

						<!-- Wallpaper Button -->
						<button
							onclick={openWallpaperModal}
							class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
							Als Wallpaper
						</button>
					</div>
				{/if}

				<!-- Close Button -->
				<button
					onclick={onClose}
					class="mt-6 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
				>
					Schliessen
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Wallpaper Modal -->
{#if qrDataUrl}
	<WallpaperModal
		show={showWallpaperModal}
		imageDataUrl={qrDataUrl}
		onClose={() => (showWallpaperModal = false)}
	/>
{/if}
