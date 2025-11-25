<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import Navigation from '$lib/components/Navigation.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import StatsBar from '$lib/components/StatsBar.svelte';
	import HeroSection from '$lib/components/landing/HeroSection.svelte';
	import TargetAudience from '$lib/components/landing/TargetAudience.svelte';
	import FeatureShowcase from '$lib/components/landing/FeatureShowcase.svelte';
	import PricingSection from '$lib/components/landing/PricingSection.svelte';
	import Testimonials from '$lib/components/landing/Testimonials.svelte';
	import TrustSignals from '$lib/components/landing/TrustSignals.svelte';
	import BlogSection from '$lib/components/landing/BlogSection.svelte';
	import { page } from '$app/stores';
	import {
		generateQRCodeURL,
		downloadQRCode,
		type QRCodeColor,
		type QRCodeFormat
	} from '$lib/qrcode';
	import * as m from '$paraglide/messages';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let copiedStates = $state<Record<string, boolean>>({});
	let isSubmitting = $state(false);
	let successMessageVisible = $state(false);
	let showQRCode = $state<string | null>(null);
	let qrColor = $state<QRCodeColor>('black');
	let qrFormat = $state<QRCodeFormat>('png');
	let showAuthModal = $state(false);
	let inputUrl = $state('');
	let showQROnly = $state(false);

	function copyToClipboard(text: string, id: string = 'main') {
		navigator.clipboard.writeText(text);
		copiedStates[id] = true;
		setTimeout(() => (copiedStates[id] = false), 2000);
	}

	function formatUrl(url: string) {
		if (typeof window === 'undefined') return url;
		return `${window.location.origin}/${url}`;
	}

	function toggleQRCode(shortCode: string) {
		if (showQRCode === shortCode) {
			showQRCode = null;
		} else {
			showQRCode = shortCode;
			qrColor = 'black';
			qrFormat = 'png';
		}
	}

	function downloadQR(shortCode: string) {
		const url = formatUrl(shortCode);
		downloadQRCode(url, `qrcode-${shortCode}`, 400, qrColor, qrFormat);
	}

	function handleLockedFieldClick() {
		if (!data.user) {
			showAuthModal = true;
		}
	}

	function handleSubmitForUnauthenticated(e: Event) {
		if (!data.user) {
			e.preventDefault();
			if (inputUrl) {
				showQROnly = true;
			}
		}
	}

	$effect(() => {
		if (form?.success) {
			successMessageVisible = true;
			setTimeout(() => (successMessageVisible = false), 5000);
		}
	});
</script>

{#if showAuthModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
			<h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
				Sign in to unlock all features
			</h3>
			<p class="mb-6 text-sm text-gray-600 dark:text-gray-400">
				This feature is only available for registered users. Sign in to:
			</p>
			<ul class="mb-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
				<li class="flex items-center gap-2">
					<span class="text-green-500">✓</span> Create short links
				</li>
				<li class="flex items-center gap-2">
					<span class="text-green-500">✓</span> Set custom titles and descriptions
				</li>
				<li class="flex items-center gap-2">
					<span class="text-green-500">✓</span> Add expiration dates
				</li>
				<li class="flex items-center gap-2">
					<span class="text-green-500">✓</span> Password protect links
				</li>
				<li class="flex items-center gap-2">
					<span class="text-green-500">✓</span> Track analytics
				</li>
			</ul>
			<div class="flex gap-3">
				<a
					href="/login"
					class="flex-1 rounded-lg bg-theme-primary px-4 py-2 text-center font-medium text-white hover:bg-theme-primary-hover"
				>
					Sign In
				</a>
				<button
					onclick={() => (showAuthModal = false)}
					class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<Navigation user={data.user} currentPath={$page.url.pathname} />

<div class="min-h-screen bg-theme-background">
	<!-- New Hero Section -->
	<HeroSection {data} {form} />

	<!-- Target Audience Section -->
	<TargetAudience />

	<!-- Feature Showcase -->
	<FeatureShowcase />

	<!-- Global Statistics Bar -->
	{#if data.globalStats}
		<div class="mx-auto max-w-4xl px-4 pt-4 sm:px-6 lg:px-8">
			<StatsBar stats={data.globalStats} />
		</div>
	{/if}

	<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
		<div
			id="url-form"
			class="mb-8 rounded-xl border border-theme-border bg-theme-surface p-6 shadow-xl sm:p-8"
		>
			<form
				method="POST"
				action="?/create"
				onsubmit={handleSubmitForUnauthenticated}
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update();
						isSubmitting = false;
					};
				}}
			>
				<div class="space-y-4">
					<div>
						<label for="url" class="mb-1 block text-sm font-medium text-theme-text">
							{!data.user ? m.home_url_label_qr() : m.home_url_label()}
						</label>
						<input
							type="url"
							id="url"
							name="url"
							required
							bind:value={inputUrl}
							placeholder="https://example.com"
							class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:ring-2 focus:ring-theme-accent focus:outline-none"
						/>
					</div>

					<div class="relative">
						<label
							for="title"
							class="mb-1 block text-sm font-medium text-theme-text {!data.user
								? 'opacity-50'
								: ''}"
						>
							{m.home_title_label()}
							{!data.user ? '🔒' : ''}
						</label>
						<div class="relative">
							<input
								type="text"
								id="title"
								name="title"
								placeholder={m.home_title_placeholder()}
								disabled={!data.user}
								onclick={handleLockedFieldClick}
								class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted {!data.user
									? 'cursor-not-allowed bg-gray-100 opacity-50 dark:bg-gray-800'
									: 'focus:ring-2 focus:ring-theme-accent focus:outline-none'}"
							/>
							{#if !data.user}
								<button
									type="button"
									class="absolute inset-0 cursor-not-allowed rounded-md"
									onclick={handleLockedFieldClick}
									aria-label="Field locked for guests"
								></button>
							{/if}
						</div>
					</div>

					<div class="relative">
						<label
							for="description"
							class="mb-1 block text-sm font-medium text-theme-text {!data.user
								? 'opacity-50'
								: ''}"
						>
							{m.home_description_label()}
							{!data.user ? '🔒' : ''}
						</label>
						<div class="relative">
							<textarea
								id="description"
								name="description"
								rows="2"
								placeholder={m.home_description_placeholder()}
								disabled={!data.user}
								onclick={handleLockedFieldClick}
								class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted {!data.user
									? 'cursor-not-allowed bg-gray-100 opacity-50 dark:bg-gray-800'
									: 'focus:ring-2 focus:ring-theme-accent focus:outline-none'}"
							></textarea>
							{#if !data.user}
								<button
									type="button"
									class="absolute inset-0 cursor-not-allowed rounded-md"
									onclick={handleLockedFieldClick}
									aria-label="Field locked for guests"
								></button>
							{/if}
						</div>
					</div>

					<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<div class="relative">
							<label
								for="expires_in"
								class="mb-1 block text-sm font-medium text-theme-text {!data.user
									? 'opacity-50'
									: ''}"
							>
								{m.home_expires_label()}
								{!data.user ? '🔒' : ''}
							</label>
							<div class="relative">
								<input
									type="number"
									id="expires_in"
									name="expires_in"
									min="1"
									placeholder={m.home_expires_placeholder()}
									disabled={!data.user}
									onclick={handleLockedFieldClick}
									class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted {!data.user
										? 'cursor-not-allowed bg-gray-100 opacity-50 dark:bg-gray-800'
										: 'focus:ring-2 focus:ring-theme-accent focus:outline-none'}"
								/>
								{#if !data.user}
									<button
										type="button"
										class="absolute inset-0 cursor-not-allowed rounded-md"
										onclick={handleLockedFieldClick}
										aria-label="Field locked for guests"
									></button>
								{/if}
							</div>
						</div>
						<div class="relative">
							<label
								for="max_clicks"
								class="mb-1 block text-sm font-medium text-theme-text {!data.user
									? 'opacity-50'
									: ''}"
							>
								{m.home_max_clicks_label()}
								{!data.user ? '🔒' : ''}
							</label>
							<div class="relative">
								<input
									type="number"
									id="max_clicks"
									name="max_clicks"
									min="1"
									placeholder={m.home_max_clicks_placeholder()}
									disabled={!data.user}
									onclick={handleLockedFieldClick}
									class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted {!data.user
										? 'cursor-not-allowed bg-gray-100 opacity-50 dark:bg-gray-800'
										: 'focus:ring-2 focus:ring-theme-accent focus:outline-none'}"
								/>
								{#if !data.user}
									<button
										type="button"
										class="absolute inset-0 cursor-not-allowed rounded-md"
										onclick={handleLockedFieldClick}
										aria-label="Field locked for guests"
									></button>
								{/if}
							</div>
						</div>
						<div class="relative">
							<label
								for="password"
								class="mb-1 block text-sm font-medium text-theme-text {!data.user
									? 'opacity-50'
									: ''}"
							>
								{m.home_password_label()}
								{!data.user ? '🔒' : ''}
							</label>
							<div class="relative">
								<input
									type="password"
									id="password"
									name="password"
									placeholder={m.home_password_placeholder()}
									disabled={!data.user}
									onclick={handleLockedFieldClick}
									class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted {!data.user
										? 'cursor-not-allowed bg-gray-100 opacity-50 dark:bg-gray-800'
										: 'focus:ring-2 focus:ring-theme-accent focus:outline-none'}"
								/>
								{#if !data.user}
									<button
										type="button"
										class="absolute inset-0 cursor-not-allowed rounded-md"
										onclick={handleLockedFieldClick}
										aria-label="Field locked for guests"
									></button>
								{/if}
							</div>
						</div>
					</div>

					{#if !data.user}
						<div
							class="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
						>
							<p class="font-medium">👋 {m.home_guest_info()}</p>
							<p class="mt-1">
								<a href="/login" class="underline hover:no-underline">{m.auth_modal_signin()}</a>
								{m.home_guest_signin_hint()}
							</p>
						</div>
					{/if}

					<button
						type="submit"
						disabled={isSubmitting || (!data.user && !inputUrl)}
						class="flex w-full items-center justify-center rounded-lg {data.user
							? 'bg-theme-primary hover:bg-theme-primary-hover'
							: 'bg-purple-600 hover:bg-purple-700'} px-4 py-3 font-medium text-white transition duration-200 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if isSubmitting}
							<svg class="mr-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							{m.home_processing()}
						{:else if !data.user}
							◳ {m.home_submit_button_qr()}
						{:else}
							{m.home_submit_button()}
						{/if}
					</button>
				</div>
			</form>

			{#if form?.error}
				<div
					class="mt-4 rounded border border-red-400 bg-red-100 p-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
				>
					{form.error}
				</div>
			{/if}

			{#if showQROnly && inputUrl && !data.user}
				<div
					class="animate-fade-in mt-4 rounded-lg border border-purple-400 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20"
				>
					<p class="mb-4 font-medium text-purple-700 dark:text-purple-400">
						◳ QR Code for your URL:
					</p>
					<div class="flex flex-col items-center gap-4">
						<img
							src={generateQRCodeURL(inputUrl, 200, qrColor, 'png')}
							alt="QR Code"
							class="rounded border-2 border-gray-300 bg-white p-2 dark:border-gray-600"
						/>

						<div class="flex gap-4">
							<div>
								<span class="mb-1 block text-xs text-gray-600 dark:text-gray-400">Color</span>
								<div class="flex gap-2" role="group" aria-label="QR Code Color">
									<button
										type="button"
										onclick={() => (qrColor = 'black')}
										class="h-8 w-8 rounded border-2 bg-black {qrColor === 'black'
											? 'border-blue-500'
											: 'border-gray-300'}"
										aria-label="Black"
									></button>
									<button
										type="button"
										onclick={() => (qrColor = 'white')}
										class="h-8 w-8 rounded border-2 bg-white {qrColor === 'white'
											? 'border-blue-500'
											: 'border-gray-300'}"
										aria-label="White"
									></button>
									<button
										type="button"
										onclick={() => (qrColor = 'gold')}
										class="h-8 w-8 rounded border-2 {qrColor === 'gold'
											? 'border-blue-500'
											: 'border-gray-300'}"
										style="background: #f8d62b"
										aria-label="Gold"
									></button>
								</div>
							</div>

							<div>
								<label
									for="qr-format-unauthenticated"
									class="mb-1 block text-xs text-gray-600 dark:text-gray-400"
								>
									Format
								</label>
								<select
									id="qr-format-unauthenticated"
									bind:value={qrFormat}
									class="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								>
									<option value="png">PNG</option>
									<option value="svg">SVG</option>
									<option value="jpg">JPG</option>
								</select>
							</div>
						</div>

						<button
							type="button"
							onclick={() => {
								const fileName = inputUrl
									.replace(/^https?:\/\//, '')
									.replace(/[^a-z0-9]/gi, '-')
									.toLowerCase();
								downloadQRCode(inputUrl, `qrcode-${fileName}`, 400, qrColor, qrFormat);
							}}
							class="rounded bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
						>
							Download as {qrFormat.toUpperCase()}
						</button>

						<div
							class="mt-2 w-full rounded-lg bg-blue-50 p-3 text-center text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
						>
							<p>
								<a href="/login" class="font-medium underline hover:no-underline">Sign in</a> to create
								a short link for this URL
							</p>
						</div>
					</div>
				</div>
			{/if}

			{#if form?.success && form?.shortUrl && successMessageVisible}
				<div
					class="animate-fade-in mt-4 rounded-lg border border-green-400 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20"
				>
					<p class="mb-2 font-medium text-green-700 dark:text-green-400">
						✅ Success! Your short URL is ready:
					</p>
					<div class="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
						<input
							type="text"
							readonly
							value={form.shortUrl}
							class="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
						/>
						<button
							onclick={() => copyToClipboard(form.shortUrl)}
							class="rounded-lg bg-neutral-900 px-6 py-2 whitespace-nowrap text-white transition duration-200 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
						>
							{copiedStates['main'] ? '✓ Copied!' : '📋 Copy'}
						</button>
						<button
							onclick={() => {
								const shortCode = form.shortUrl.split('/').pop();
								if (shortCode) {
									toggleQRCode(shortCode);
								}
							}}
							class="rounded-lg bg-purple-600 px-6 py-2 whitespace-nowrap text-white transition duration-200 hover:bg-purple-700"
						>
							{showQRCode === form.shortUrl.split('/').pop() ? '✕ Close QR' : '◳ QR Code'}
						</button>
					</div>

					{#if showQRCode === form.shortUrl.split('/').pop()}
						<div class="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
							<div class="flex flex-col items-center gap-4">
								<img
									src={generateQRCodeURL(form.shortUrl, 200, qrColor, 'png')}
									alt="QR Code"
									class="rounded border-2 border-gray-300 bg-white p-2 dark:border-gray-600"
								/>

								<div class="flex gap-4">
									<div>
										<span class="mb-1 block text-xs text-gray-600 dark:text-gray-400">Color</span>
										<div class="flex gap-2" role="group" aria-label="QR Code Color">
											<button
												onclick={() => (qrColor = 'black')}
												class="h-8 w-8 rounded border-2 bg-black {qrColor === 'black'
													? 'border-blue-500'
													: 'border-gray-300'}"
												aria-label="Black"
											></button>
											<button
												onclick={() => (qrColor = 'white')}
												class="h-8 w-8 rounded border-2 bg-white {qrColor === 'white'
													? 'border-blue-500'
													: 'border-gray-300'}"
												aria-label="White"
											></button>
											<button
												onclick={() => (qrColor = 'gold')}
												class="h-8 w-8 rounded border-2 {qrColor === 'gold'
													? 'border-blue-500'
													: 'border-gray-300'}"
												style="background: #f8d62b"
												aria-label="Gold"
											></button>
										</div>
									</div>

									<div>
										<label
											for="qr-format-success"
											class="mb-1 block text-xs text-gray-600 dark:text-gray-400"
										>
											Format
										</label>
										<select
											id="qr-format-success"
											bind:value={qrFormat}
											class="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
										>
											<option value="png">PNG</option>
											<option value="svg">SVG</option>
											<option value="jpg">JPG</option>
										</select>
									</div>
								</div>

								<button
									onclick={() => {
										const shortCode = form.shortUrl.split('/').pop();
										if (shortCode) {
											downloadQR(shortCode);
										}
									}}
									class="rounded bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
								>
									Download as {qrFormat.toUpperCase()}
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- Pricing Section -->
	<PricingSection />

	<!-- Testimonials -->
	<Testimonials />
	
	<!-- Blog Section -->
	<BlogSection posts={data.blogPosts || []} />

	<!-- Trust Signals -->
	<TrustSignals />
</div>

<Footer />
