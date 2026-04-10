<script lang="ts">
	import { ManaQRCode } from '@mana/qr-export/svelte';
	import { toDataURL, toSVG } from '@mana/qr-export/generate';
	import { qrExportService, type QRExportResult } from '$lib/api/services/qr-export';
	import type { UserDataSummary } from '$lib/api/services/my-data';
	import { WallpaperModal } from '@mana/wallpaper-generator/svelte';
	import { DownloadSimple, Image, Warning, QrCode } from '@mana/shared-icons';

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
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
		onclick={handleBackdropClick}
	>
		<div
			class="bg-card rounded-t-xl sm:rounded-xl shadow-xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
			role="dialog"
			aria-modal="true"
		>
			<div class="p-6">
				<!-- Header -->
				<div class="flex items-center gap-3 mb-6">
					<div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
						<QrCode size={20} class="text-primary" />
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
						<Warning size={20} class="text-red-500 mx-auto mb-2" />
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
								<DownloadSimple size={20} />
								PNG
							</button>
							<button
								onclick={downloadSVG}
								class="flex-1 flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
							>
								<DownloadSimple size={20} />
								SVG
							</button>
						</div>

						<!-- Wallpaper Button -->
						<button
							onclick={openWallpaperModal}
							class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors"
						>
							<Image size={20} />
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
