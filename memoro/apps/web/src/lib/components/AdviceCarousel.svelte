<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { createAuthClient } from '$lib/supabaseClient';

	// Standard blueprint ID - don't show advice for this
	const STANDARD_BLUEPRINT_ID = '11111111-2222-3333-4444-555555555555';

	interface AdviceSection {
		id: string;
		content: {
			de?: string;
			en?: string;
		};
		order: number;
	}

	interface AdviceData {
		sections: AdviceSection[];
		metadata?: {
			version: string;
			lastUpdated: string;
			supportedLanguages: string[];
		};
	}

	interface Props {
		blueprintId: string | null;
		language?: string;
	}

	let { blueprintId, language = 'de' }: Props = $props();

	// Don't show advice for standard blueprint
	const isStandardBlueprint = $derived(
		!blueprintId || blueprintId === STANDARD_BLUEPRINT_ID
	);

	let advice = $state<AdviceData | null>(null);
	let loading = $state(false);
	let currentIndex = $state(0);
	let scrollContainer: HTMLDivElement | null = null;
	let isScrolling = $state(false);

	// Fetch advice when blueprintId changes
	$effect(() => {
		if (blueprintId) {
			fetchAdvice(blueprintId);
		} else {
			advice = null;
		}
	});

	async function fetchAdvice(id: string) {
		try {
			loading = true;

			const supabase = await createAuthClient();
			const { data, error } = await supabase
				.from('blueprints')
				.select('advice')
				.eq('id', id)
				.single();

			if (error) {
				console.error('Error loading advice:', error.message);
				advice = null;
				return;
			}

			if (data && data.advice) {
				advice = data.advice as AdviceData;
				currentIndex = 0; // Reset to first section
			} else {
				advice = null;
			}
		} catch (err) {
			console.error('Unexpected error:', err);
			advice = null;
		} finally {
			loading = false;
		}
	}

	function goToSection(index: number) {
		if (advice?.sections && index >= 0 && index < advice.sections.length) {
			currentIndex = index;
			scrollToIndex(index);
		}
	}

	function nextSection() {
		if (advice?.sections && currentIndex < advice.sections.length - 1) {
			currentIndex++;
			scrollToIndex(currentIndex);
		}
	}

	function prevSection() {
		if (currentIndex > 0) {
			currentIndex--;
			scrollToIndex(currentIndex);
		}
	}

	function scrollToIndex(index: number) {
		if (scrollContainer) {
			const cardWidth = scrollContainer.offsetWidth;
			scrollContainer.scrollTo({
				left: index * cardWidth,
				behavior: 'smooth'
			});
		}
	}

	function handleScroll(event: Event) {
		if (isScrolling) return;

		const container = event.target as HTMLDivElement;
		const cardWidth = container.offsetWidth;
		const scrollLeft = container.scrollLeft;
		const newIndex = Math.round(scrollLeft / cardWidth);

		if (newIndex !== currentIndex && newIndex >= 0 && newIndex < sortedSections.length) {
			currentIndex = newIndex;
		}
	}

	function handleScrollEnd() {
		isScrolling = false;
	}

	// Get sorted sections
	const sortedSections = $derived(
		advice?.sections ? [...advice.sections].sort((a, b) => a.order - b.order) : []
	);
</script>

{#if blueprintId && !isStandardBlueprint && !loading && sortedSections.length > 0}
	<div class="flex items-center justify-center gap-2 px-4 py-3">
		<!-- Previous button (outside card) - only show when can go back -->
		{#if sortedSections.length > 1 && currentIndex > 0}
			<button
				onclick={prevSection}
				class="flex-shrink-0 p-2 text-theme-muted hover:text-theme transition-colors"
				aria-label={$t('blueprints.previous_tip')}
			>
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</button>
		{:else if sortedSections.length > 1}
			<div class="w-10 flex-shrink-0"></div>
		{/if}

		<!-- Scrollable Card Container -->
		<div class="w-full max-w-lg overflow-hidden rounded-xl border border-theme bg-content shadow-lg">
			<div
				bind:this={scrollContainer}
				onscroll={handleScroll}
				onscrollend={handleScrollEnd}
				class="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar"
			>
				{#each sortedSections as section, index}
					{@const content = section?.content?.[language as 'de' | 'en'] ||
						section?.content?.en ||
						section?.content?.de ||
						''}
					{#if content}
						<div class="w-full flex-shrink-0 snap-center p-5">
							<p class="text-center text-lg font-medium text-theme leading-relaxed">
								{content}
							</p>
						</div>
					{/if}
				{/each}
			</div>

			<!-- Pagination dots -->
			{#if sortedSections.length > 1}
				<div class="flex justify-center gap-2 pb-4">
					{#each sortedSections as _, index}
						<button
							onclick={() => goToSection(index)}
							class="w-2 h-2 rounded-full transition-all {index === currentIndex
								? 'w-2.5 h-2.5 bg-theme'
								: 'bg-theme-muted opacity-30 hover:opacity-50'}"
							aria-label={$t('blueprints.go_to_tip', { values: { index: index + 1 } })}
						></button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Next button (outside card) - only show when can go forward -->
		{#if sortedSections.length > 1 && currentIndex < sortedSections.length - 1}
			<button
				onclick={nextSection}
				class="flex-shrink-0 p-2 text-theme-muted hover:text-theme transition-colors"
				aria-label={$t('blueprints.next_tip')}
			>
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		{:else if sortedSections.length > 1}
			<div class="w-10 flex-shrink-0"></div>
		{/if}
	</div>
{/if}

<style>
	.hide-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.hide-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
