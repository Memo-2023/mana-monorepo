<script lang="ts">
	import { onMount } from 'svelte';
	import { hashManager } from '../service/HashManager';
	import {
		getVariantContent,
		getTrustBadges,
		getFreeText,
		type VariantContent,
	} from '../config/variants';
	import { locale } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import type { PageData, ActionData } from '../../../routes/$types';

	interface Props {
		data: PageData;
		form: ActionData;
		onSubmit?: () => void;
	}

	let { data, form, onSubmit }: Props = $props();

	let variant = $state<string>('control');
	let content = $state<VariantContent>(getVariantContent('control'));
	let trustBadges = $state(getTrustBadges());
	let freeText = $state(getFreeText());
	let showDebug = $state(false);
	let isLoading = $state(true);

	onMount(() => {
		// Get variant assignment
		variant = hashManager.getVariant();
		content = getVariantContent(variant);
		trustBadges = getTrustBadges();
		freeText = getFreeText();
		showDebug = hashManager.isDebugMode();
		isLoading = false;

		// Track page view with variant
		if (typeof window !== 'undefined' && (window as any).umami) {
			(window as any).umami.track(`page_view_${variant}`);
		}

		// Log for debugging
		if (showDebug) {
			console.log('A/B Test Variant:', variant, content);
			console.log('Current Locale:', get(locale));
		}
	});

	// React to locale changes - use derived state
	$effect(() => {
		// This will re-run when locale changes
		const currentLocale = get(locale);

		// Update content based on current locale
		content = getVariantContent(variant);
		trustBadges = getTrustBadges();
		freeText = getFreeText();

		if (showDebug) {
			console.log('Locale changed to:', currentLocale);
		}
	});

	function handleCtaClick() {
		// Track CTA click
		if (typeof window !== 'undefined' && (window as any).umami) {
			(window as any).umami.track(`cta_click_${variant}`);
		}
		onSubmit?.();

		// Smooth scroll to form
		const form = document.getElementById('url-form');
		if (form) {
			form.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}
</script>

{#if showDebug}
	<div class="fixed right-4 top-20 z-50 rounded-lg bg-black/80 p-4 text-white shadow-lg">
		<div class="font-mono text-xs">
			<div class="font-bold text-green-400">A/B Test Debug</div>
			<div>Variant: <span class="text-yellow-400">{variant}</span></div>
			<div>Name: {content.name}</div>
			<div>Locale: <span class="text-blue-400">{get(locale)}</span></div>
			<div class="mt-2">
				<button
					onclick={() => {
						hashManager.reset();
						window.location.reload();
					}}
					class="rounded bg-red-600 px-2 py-1 text-xs hover:bg-red-700"
				>
					Reset & Reload
				</button>
			</div>
		</div>
	</div>
{/if}

<section
	class="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900"
>
	<!-- Background decoration -->
	<div
		class="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-purple-300 opacity-20 blur-3xl"
	></div>
	<div
		class="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-300 opacity-20 blur-3xl"
	></div>

	<div class="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
		{#if !isLoading}
			<div class="text-center">
				<!-- Headline -->
				<h1
					class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl"
				>
					{#if variant === 'b2' && content.headline.includes(',')}
						<!-- Special formatting for logos variant -->
						<span class="block">{content.headline.split(',')[0]},</span>
						<span class="block text-3xl sm:text-4xl md:text-5xl"
							>{content.headline.split(',').slice(1).join(',')}</span
						>
					{:else}
						{content.headline}
					{/if}
				</h1>

				<!-- Subheadline -->
				<p class="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
					{content.subheadline}
				</p>

				<!-- Social Proof (if present) -->
				{#if content.socialProof}
					<div class="mt-8">
						{#if content.socialProof.type === 'numbers'}
							<div
								class="flex flex-wrap justify-center gap-4 text-sm font-medium text-gray-600 dark:text-gray-400"
							>
								{#each content.socialProof.content.split('•') as stat}
									<span class="flex items-center gap-1">
										<span class="text-green-500">✓</span>
										{stat.trim()}
									</span>
								{/each}
							</div>
						{:else if content.socialProof.type === 'logos'}
							<div class="mt-4 flex flex-wrap justify-center gap-6 opacity-60 grayscale">
								{#each content.socialProof.content.split('•') as logo}
									<span class="text-lg font-semibold text-gray-700 dark:text-gray-300">
										{logo.trim()}
									</span>
								{/each}
							</div>
						{:else if content.socialProof.type === 'testimonial'}
							<div class="mt-4 text-yellow-500">
								{content.socialProof.content}
							</div>
						{/if}
					</div>
				{/if}

				<!-- Features List (if present) -->
				{#if content.features && content.features.length > 0}
					<div class="mt-8 flex flex-wrap justify-center gap-4">
						{#each content.features.slice(0, 3) as feature}
							<div
								class="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm dark:bg-gray-800/80 dark:text-gray-300"
							>
								<svg
									class="h-4 w-4 text-green-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									/>
								</svg>
								{feature}
							</div>
						{/each}
						{#if content.features.length > 3}
							{#each content.features.slice(3) as feature}
								<div
									class="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm dark:bg-gray-800/80 dark:text-gray-300"
								>
									<svg
										class="h-4 w-4 text-green-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/>
									</svg>
									{feature}
								</div>
							{/each}
						{/if}
					</div>
				{/if}

				<!-- CTA Button -->
				<div class="mx-auto mt-10 max-w-xl">
					<a
						href="#url-form"
						onclick={handleCtaClick}
						class="inline-block whitespace-nowrap rounded-lg px-8 py-4 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl {content.ctaStyle ||
							'bg-theme-primary hover:bg-theme-primary-hover'}"
					>
						{content.ctaText}
					</a>

					{#if !data.user}
						<p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
							{freeText}
						</p>
					{/if}
				</div>

				<!-- Trust Badges -->
				<div
					class="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-500 dark:text-gray-400"
				>
					{#each trustBadges as badge}
						<span class="flex items-center gap-1">
							{badge.icon}
							{badge.text}
						</span>
					{/each}
				</div>
			</div>
		{:else}
			<!-- Loading state -->
			<div class="flex min-h-[400px] items-center justify-center">
				<div class="text-gray-500">Loading...</div>
			</div>
		{/if}
	</div>
</section>
