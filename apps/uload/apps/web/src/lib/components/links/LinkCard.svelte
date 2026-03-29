<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		generateQRCodeURL,
		downloadQRCode,
		type QRCodeColor,
		type QRCodeFormat,
		type QRCodeRotation,
	} from '$lib/qrcode';
	import TagBadge from '$lib/components/TagBadge.svelte';
	import Button from '$lib/components/Button.svelte';
	import Dropdown from '$lib/components/Dropdown.svelte';
	import { trackEvent, trackLinkClick, EVENTS } from '$lib/analytics';
	import type { Tag } from '$lib/pocketbase';
	import { toastMessages } from '$lib/services/toast';

	interface Link {
		id: string;
		short_code: string;
		original_url: string;
		title?: string;
		description?: string;
		clicks: number;
		is_active: boolean;
		expires_at?: string;
		max_clicks?: number;
		password?: string;
		created: string;
		// use_username removed - now handled by short_code format
		folder?: string;
		expand?: {
			folder?: {
				id: string;
				name: string;
				display_name: string;
				icon: string;
				color: string;
			};
			'link_tags(link_id)'?: Array<{
				expand?: {
					tag_id?: Tag;
				};
			}>;
		};
	}

	interface Props {
		link: Link;
		username?: string;
		onCopy?: (text: string, id: string, shortCode?: string) => void;
		copiedStates?: Record<string, boolean>;
	}

	let { link, username, onCopy = () => {}, copiedStates = {} }: Props = $props();

	let showQRCode = $state(false);
	let qrColor: QRCodeColor = $state('black');
	let qrFormat: QRCodeFormat = $state('png');
	let qrRotation: QRCodeRotation = $state(0);

	const isExpired = link.expires_at ? new Date(link.expires_at) < new Date() : false;
	const isNearLimit = link.max_clicks ? link.clicks >= link.max_clicks * 0.8 : false;

	function formatUrl(shortCode: string) {
		if (typeof window === 'undefined') return shortCode;
		// Short codes with slashes are already username-prefixed custom codes
		// Random codes don't have slashes
		return `${window.location.origin}/${shortCode}`;
	}

	function copyToClipboard(text: string, id: string, shortCode?: string) {
		navigator.clipboard.writeText(text);
		onCopy(text, id, shortCode);
		toastMessages.linkCopied();
	}

	function toggleQRCode() {
		if (showQRCode) {
			showQRCode = false;
		} else {
			showQRCode = true;
			qrColor = 'black';
			qrFormat = 'png';
			qrRotation = 0;
			trackEvent(EVENTS.LINK_QR_GENERATED, { short_code: link.short_code });
		}
	}

	function downloadQR() {
		const url = formatUrl(link.short_code);
		downloadQRCode(url, `qrcode-${link.short_code}`, 400, qrColor, qrFormat, qrRotation);
		trackEvent(EVENTS.LINK_QR_DOWNLOADED, {
			short_code: link.short_code,
			format: qrFormat,
			color: qrColor,
			rotation: qrRotation,
		});
	}

	function rotateQR(degrees: QRCodeRotation) {
		qrRotation = degrees;
	}
</script>

<div
	class="hover:from-theme-surface/50 group relative p-6 transition-all duration-200 hover:bg-gradient-to-br hover:to-transparent"
>
	<div class="flex flex-col gap-4">
		<!-- Header with Title and Actions -->
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0 flex-1">
				<h3 class="truncate text-lg font-semibold text-theme-text">
					{link.title || link.short_code}
				</h3>
				{#if link.description}
					<p class="mt-1 line-clamp-2 text-sm text-theme-text-muted">{link.description}</p>
				{/if}
			</div>

			<!-- Action Buttons -->
			<div class="flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
				<Dropdown
					items={[
						{
							label: 'Copy Link',
							icon: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>',
							color: '#6366f1',
							action: () => {
								copyToClipboard(formatUrl(link.short_code), link.id, link.short_code);
							},
						},
						{
							label: 'QR Code',
							icon: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h8m-4 0v8m-4-8h.01M8 8h8M4 20h2m0-4v4m12-4v4" /></svg>',
							color: '#10b981',
							action: toggleQRCode,
						},
						{
							label: 'Analytics',
							href: `/my/analytics/${link.short_code}`,
							icon: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>',
							color: '#2563eb',
						},
						{
							label: 'Edit',
							icon: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>',
							color: '#9333ea',
							action: () => {
								window.dispatchEvent(new CustomEvent('edit-link', { detail: link }));
							},
						},
						{
							label: link.is_active ? 'Deactivate' : 'Activate',
							type: 'form',
							formAction: '?/toggle',
							formData: { id: link.id, is_active: String(link.is_active) },
							icon: link.is_active
								? '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'
								: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
							color: link.is_active ? '#ea580c' : '#16a34a',
						},
						{
							divider: true,
						},
						{
							label: 'Delete',
							icon: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>',
							color: '#dc2626',
							type: 'form',
							formAction: '?/delete',
							formData: { id: link.id },
							enhanceOptions: () => {
								return async ({ update, result, cancel }) => {
									if (!confirm('Möchtest du diesen Link wirklich löschen?')) {
										cancel();
										return;
									}
									await update();
									if (result.type === 'success') {
										trackEvent(EVENTS.LINK_DELETED, {
											short_code: link.short_code,
										});
										toastMessages.linkDeleted();
									}
								};
							},
						},
					]}
					buttonClass="!p-2"
				/>
			</div>
		</div>

		<!-- URL Display Box -->
		<div
			class="border-theme-border/50 rounded-lg border bg-gradient-to-r from-blue-50/50 to-purple-50/50 p-3 dark:from-blue-950/20 dark:to-purple-950/20"
		>
			<div class="flex items-center justify-between gap-2">
				<div class="min-w-0 flex-1">
					<p class="mb-1 text-[10px] font-medium uppercase tracking-wider text-theme-text-muted">
						Short URL
					</p>
					{#if link.short_code.includes('/')}
						<a
							href="/{link.short_code}"
							target="_blank"
							class="block truncate font-mono text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
							onclick={() =>
								trackLinkClick({
									shortCode: link.short_code,
									username: link.short_code.split('/')[0],
									hasPassword: !!link.password,
									isExpiring: !!link.expires_at,
								})}
						>
							ulo.ad/{link.short_code}
						</a>
					{:else}
						<a
							href="/{link.short_code}"
							target="_blank"
							class="block truncate font-mono text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
							onclick={() =>
								trackLinkClick({
									shortCode: link.short_code,
									username: 'direct',
									hasPassword: !!link.password,
									isExpiring: !!link.expires_at,
								})}
						>
							ulo.ad/{link.short_code}
						</a>
					{/if}
				</div>
				<button
					onclick={() => {
						const url = formatUrl(link.short_code);
						copyToClipboard(url, `${link.id}-url`, link.short_code);
					}}
					class="rounded-md p-1.5 transition-colors hover:bg-white/50 dark:hover:bg-black/20"
					title="Copy URL"
				>
					<svg
						class="h-4 w-4 {copiedStates[`${link.id}-url`]
							? 'text-green-600'
							: 'text-theme-text-muted'}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						{#if copiedStates[`${link.id}-url`]}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						{:else}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
							/>
						{/if}
					</svg>
				</button>
			</div>
		</div>

		<!-- Original URL -->
		<div class="truncate text-xs text-theme-text-muted">
			<span class="font-medium">Destination:</span>
			<a
				href={link.original_url}
				target="_blank"
				rel="noopener noreferrer"
				class="ml-1 hover:text-blue-600"
			>
				{link.original_url}
			</a>
		</div>

		<!-- Tags and Badges -->
		<div class="flex flex-wrap items-center gap-2">
			{#if link.expand?.folder}
				<span
					class="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium shadow-sm"
					style="background-color: {link.expand.folder.color}15; color: {link.expand.folder
						.color}; border: 1px solid {link.expand.folder.color}30"
				>
					<span class="text-sm">{link.expand.folder.icon}</span>
					{link.expand.folder.display_name}
				</span>
			{/if}
			{#if link.expand?.['link_tags(link_id)'] && link.expand['link_tags(link_id)'].length > 0}
				{#each link.expand['link_tags(link_id)'] as linkTag}
					{#if linkTag.expand?.tag_id}
						<TagBadge tag={linkTag.expand.tag_id} size="sm" />
					{/if}
				{/each}
			{/if}
			{#if !link.is_active}
				<span
					class="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-500/20"
				>
					<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 8 8"
						><circle cx="4" cy="4" r="3" /></svg
					>
					Inactive
				</span>
			{/if}
			{#if isExpired}
				<span
					class="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/10 dark:bg-orange-900/20 dark:text-orange-400 dark:ring-orange-500/20"
				>
					<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="3"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					Expired
				</span>
			{/if}
			{#if link.password}
				<span
					class="inline-flex items-center gap-1 rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/10 dark:bg-yellow-900/20 dark:text-yellow-400 dark:ring-yellow-500/20"
				>
					<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="3"
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
						/>
					</svg>
					Protected
				</span>
			{/if}
		</div>

		<!-- Stats Bar -->
		<div class="border-theme-border/30 flex flex-wrap items-center gap-4 border-t pt-3">
			<div class="flex items-center gap-1.5">
				<svg
					class="h-3.5 w-3.5 text-theme-text-muted"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
					/>
				</svg>
				<span class="text-xs font-medium {isNearLimit ? 'text-orange-600' : 'text-theme-text'}">
					{link.clicks || 0}
				</span>
				<span class="text-xs text-theme-text-muted">clicks</span>
			</div>

			{#if link.max_clicks}
				<div class="flex items-center gap-1.5">
					<svg
						class="h-3.5 w-3.5 text-theme-text-muted"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span class="text-xs font-medium {isNearLimit ? 'text-orange-600' : 'text-purple-600'}">
						{link.max_clicks}
					</span>
					<span class="text-xs text-theme-text-muted">max</span>
				</div>
			{/if}

			{#if link.expires_at}
				<div class="flex items-center gap-1.5">
					<svg
						class="h-3.5 w-3.5 text-theme-text-muted"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span class="text-xs font-medium {isExpired ? 'text-red-600' : 'text-orange-600'}">
						{new Date(link.expires_at).toLocaleDateString('de-DE', {
							day: '2-digit',
							month: '2-digit',
							year: '2-digit',
						})}
					</span>
				</div>
			{/if}

			<div class="ml-auto flex items-center gap-1.5">
				<svg
					class="h-3.5 w-3.5 text-theme-text-muted"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
					/>
				</svg>
				<span class="text-xs text-theme-text-muted">
					{new Date(link.created).toLocaleDateString('de-DE', {
						day: '2-digit',
						month: '2-digit',
						year: 'numeric',
					})}
				</span>
			</div>
		</div>
	</div>

	{#if showQRCode}
		<div class="border-theme-border/50 mt-4 rounded-lg border bg-theme-surface p-4">
			<div class="flex flex-col items-center gap-4">
				<div
					class="relative rounded border-2 border-theme-border p-4"
					style="background: {qrColor === 'white' ? '#000' : qrColor === 'gold' ? '#000' : '#fff'}"
				>
					<img
						src={generateQRCodeURL(formatUrl(link.short_code), 200, qrColor, 'png')}
						alt="QR Code for {link.short_code}"
						style="transform: rotate({qrRotation}deg); transition: transform 0.3s ease;"
					/>
				</div>

				<div class="flex flex-wrap justify-center gap-4">
					<div>
						<label class="mb-1 block text-xs text-theme-text">Color</label>
						<div class="flex gap-2">
							<button
								onclick={() => (qrColor = 'black')}
								class="h-8 w-8 rounded border-2 bg-black {qrColor === 'black'
									? 'border-blue-500'
									: 'border-theme-border'}"
								title="Black"
							></button>
							<button
								onclick={() => (qrColor = 'white')}
								class="h-8 w-8 rounded border-2 bg-white {qrColor === 'white'
									? 'border-blue-500'
									: 'border-theme-border'}"
								title="White"
							></button>
							<button
								onclick={() => (qrColor = 'gold')}
								class="h-8 w-8 rounded border-2 {qrColor === 'gold'
									? 'border-blue-500'
									: 'border-theme-border'}"
								style="background: #f8d62b"
								title="Gold"
							></button>
						</div>
					</div>

					<div>
						<label class="mb-1 block text-xs text-theme-text">Format</label>
						<select
							bind:value={qrFormat}
							class="rounded border border-theme-border px-2 py-1 text-sm"
						>
							<option value="png">PNG</option>
							<option value="svg">SVG</option>
							<option value="jpg">JPG</option>
						</select>
					</div>

					<div>
						<label class="mb-1 block text-xs text-theme-text">Rotation</label>
						<div class="flex gap-1">
							{#each [0, 45, 90, 135, 180, 225, 270, 315] as angle}
								<button
									onclick={() => rotateQR(angle)}
									class="h-8 w-8 rounded border-2 text-xs font-bold {qrRotation === angle
										? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
										: 'border-theme-border'}"
									title="{angle}°"
								>
									{angle}°
								</button>
							{/each}
						</div>
					</div>
				</div>

				<div class="flex flex-wrap justify-center gap-2">
					<Button onclick={downloadQR} variant="primary" size="lg">
						Download{qrRotation !== 0 ? ` (${qrRotation}°)` : ''} as {qrFormat.toUpperCase()}
					</Button>
					<Button
						onclick={() => copyToClipboard(formatUrl(link.short_code), 'qr-copy', link.short_code)}
						variant="secondary"
						size="lg"
					>
						Copy URL
					</Button>
				</div>
			</div>
		</div>
	{/if}
</div>
