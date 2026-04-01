<script lang="ts">
	import { X, Copy, QrCode, Link, ArrowSquareOut, Lock, Clock } from '@manacore/shared-icons';
	import type { CreatedLink, CreateShortLinkOptions } from './types';
	import { createShortLink, isSharedUloadReady, getBaseUrl } from './create-link';
	import { getQrCodeUrl, getShortUrl, downloadQrCode } from './utils';

	interface Props {
		visible: boolean;
		onClose: () => void;
		url: string;
		title?: string;
		source: string;
		description?: string;
		onCreated?: (link: CreatedLink) => void;
	}

	let { visible, onClose, url, title = '', source, description = '', onCreated }: Props = $props();

	let customCode = $state('');
	let useCustomCode = $state(false);
	let password = $state('');
	let usePassword = $state(false);
	let expiresAt = $state('');
	let useExpiry = $state(false);
	let createdLink = $state<CreatedLink | null>(null);
	let creating = $state(false);
	let error = $state('');
	let copied = $state(false);
	let showQr = $state(false);
	let showAdvanced = $state(false);

	function reset() {
		customCode = '';
		useCustomCode = false;
		password = '';
		usePassword = false;
		expiresAt = '';
		useExpiry = false;
		createdLink = null;
		creating = false;
		error = '';
		copied = false;
		showQr = false;
		showAdvanced = false;
	}

	function handleClose() {
		reset();
		onClose();
	}

	async function handleCreate() {
		if (!isSharedUloadReady()) {
			error = 'uLoad ist nicht initialisiert';
			return;
		}

		creating = true;
		error = '';

		try {
			const options: CreateShortLinkOptions = {
				url,
				title: title || undefined,
				source,
				description: description || undefined,
				customCode: useCustomCode && customCode ? customCode : undefined,
				password: usePassword && password ? password : undefined,
				expiresAt: useExpiry && expiresAt ? new Date(expiresAt).toISOString() : undefined,
			};

			const link = await createShortLink(options);
			createdLink = link;
			onCreated?.(link);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Erstellen';
		} finally {
			creating = false;
		}
	}

	async function copyToClipboard(text: string) {
		await navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && visible) {
			handleClose();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if visible}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
		style="z-index: 9990;"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-white/10 px-5 py-4">
				<div class="flex items-center gap-2.5">
					<Link size={18} class="text-indigo-400" />
					<h3 class="text-base font-semibold text-white">Kurzlink erstellen</h3>
				</div>
				<button
					onclick={handleClose}
					class="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
					aria-label="Schliessen"
				>
					<X size={18} />
				</button>
			</div>

			<div class="p-5">
				{#if !createdLink}
					<!-- Create State -->
					<div class="space-y-4">
						<!-- URL Preview -->
						<div class="rounded-lg bg-white/5 px-3 py-2.5">
							<p class="text-xs text-gray-400 mb-1">Ziel-URL</p>
							<p class="text-sm text-white truncate">{url}</p>
						</div>

						{#if title}
							<div>
								<label class="block text-xs text-gray-400 mb-1">Titel</label>
								<p class="text-sm text-white">{title}</p>
							</div>
						{/if}

						<!-- Custom Code Toggle -->
						<div>
							<label class="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									bind:checked={useCustomCode}
									class="rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
								/>
								<span class="text-sm text-gray-300">Eigenen Kurzcode verwenden</span>
							</label>

							{#if useCustomCode}
								<div class="mt-2 flex items-center gap-2">
									<span class="text-sm text-gray-500">ulo.ad/</span>
									<input
										type="text"
										bind:value={customCode}
										placeholder="mein-code"
										class="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
									/>
								</div>
							{/if}
						</div>

						<!-- Advanced Options Toggle -->
						<button
							type="button"
							onclick={() => (showAdvanced = !showAdvanced)}
							class="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-300 transition-colors"
						>
							<span class="transition-transform {showAdvanced ? 'rotate-90' : ''}">&#9654;</span>
							Erweiterte Optionen
						</button>

						{#if showAdvanced}
							<div class="space-y-3 rounded-lg bg-white/5 p-3">
								<!-- Password Protection -->
								<div>
									<label class="flex items-center gap-2 cursor-pointer">
										<input
											type="checkbox"
											bind:checked={usePassword}
											class="rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
										/>
										<Lock size={14} class="text-gray-400" />
										<span class="text-sm text-gray-300">Passwortschutz</span>
									</label>
									{#if usePassword}
										<input
											type="text"
											bind:value={password}
											placeholder="Passwort eingeben"
											class="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
										/>
									{/if}
								</div>

								<!-- Expiration -->
								<div>
									<label class="flex items-center gap-2 cursor-pointer">
										<input
											type="checkbox"
											bind:checked={useExpiry}
											class="rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
										/>
										<Clock size={14} class="text-gray-400" />
										<span class="text-sm text-gray-300">Ablaufdatum</span>
									</label>
									{#if useExpiry}
										<input
											type="datetime-local"
											bind:value={expiresAt}
											class="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
										/>
									{/if}
								</div>
							</div>
						{/if}

						{#if error}
							<p class="text-sm text-red-400">{error}</p>
						{/if}

						<button
							onclick={handleCreate}
							disabled={creating}
							class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
						>
							{creating ? 'Erstelle...' : 'Kurzlink erstellen'}
						</button>
					</div>
				{:else}
					<!-- Created State -->
					<div class="space-y-4">
						<div
							class="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-center"
						>
							<p class="text-xs text-emerald-400 mb-1">Kurzlink erstellt</p>
							<p class="font-mono text-lg font-semibold text-emerald-300">
								{createdLink.shortUrl}
							</p>
						</div>

						{#if showQr}
							<div class="flex flex-col items-center gap-3">
								<div class="rounded-xl bg-white p-3">
									<img
										src={getQrCodeUrl(createdLink.shortUrl, 200)}
										alt="QR Code für {createdLink.shortCode}"
										class="h-44 w-44"
									/>
								</div>
								<button
									onclick={() => downloadQrCode(createdLink!.shortCode, getBaseUrl())}
									class="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
								>
									QR herunterladen
								</button>
							</div>
						{/if}

						<!-- Actions -->
						<div class="flex gap-2">
							<button
								onclick={() => copyToClipboard(createdLink!.shortUrl)}
								class="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-sm font-medium text-white hover:bg-white/5 transition-colors"
							>
								<Copy size={16} />
								{copied ? 'Kopiert!' : 'Kopieren'}
							</button>
							<button
								onclick={() => (showQr = !showQr)}
								class="flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-sm font-medium text-white hover:bg-white/5 transition-colors {showQr
									? 'bg-white/10'
									: ''}"
							>
								<QrCode size={16} />
								QR
							</button>
							<a
								href="/my/links"
								target="_blank"
								class="flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-sm font-medium text-white hover:bg-white/5 transition-colors"
								title="In uLoad öffnen"
							>
								<ArrowSquareOut size={16} />
							</a>
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer: Source badge + protection info -->
			<div class="border-t border-white/10 px-5 py-3">
				<div class="flex items-center gap-3 text-xs text-gray-500">
					<span>via <span class="text-gray-400">{source}</span></span>
					{#if createdLink && usePassword && password}
						<span class="flex items-center gap-1 text-amber-500">
							<Lock size={10} /> Passwortgeschützt
						</span>
					{/if}
					{#if createdLink && useExpiry && expiresAt}
						<span class="flex items-center gap-1 text-blue-400">
							<Clock size={10} /> Läuft ab
						</span>
					{/if}
					<span class="ml-auto">Sichtbar in uLoad</span>
				</div>
			</div>
		</div>
	</div>
{/if}
