<script lang="ts">
	import type { HelpPageProps, HelpSection } from '../types.js';
	import type { SearchResult } from '@manacore/shared-help-types';
	import HelpSearch from '../components/HelpSearch.svelte';
	import FAQSection from '../components/FAQSection.svelte';
	import FeaturesOverview from '../components/FeaturesOverview.svelte';
	import KeyboardShortcuts from '../components/KeyboardShortcuts.svelte';
	import GettingStartedGuide from '../components/GettingStartedGuide.svelte';
	import ChangelogSection from '../components/ChangelogSection.svelte';
	import ContactSection from '../components/ContactSection.svelte';

	let {
		content,
		appName,
		appId: _appId,
		translations,
		searchEnabled = true,
		showFAQ = true,
		showFeatures = true,
		showShortcuts = true,
		showGettingStarted = true,
		showChangelog = true,
		showContact = true,
		defaultSection = 'faq',
		showBackButton = false,
		onBack,
		onSectionChange,
		onSearch,
	}: HelpPageProps = $props();

	let activeSection = $state<HelpSection>(defaultSection);

	const sections: { id: HelpSection; label: string; show: boolean }[] = $derived([
		{ id: 'faq', label: translations.sections.faq, show: showFAQ && content.faq.length > 0 },
		{
			id: 'features',
			label: translations.sections.features,
			show: showFeatures && content.features.length > 0,
		},
		{
			id: 'shortcuts',
			label: translations.sections.shortcuts,
			show: showShortcuts && content.shortcuts.length > 0,
		},
		{
			id: 'getting-started',
			label: translations.sections.gettingStarted,
			show: showGettingStarted && content.gettingStarted.length > 0,
		},
		{
			id: 'changelog',
			label: translations.sections.changelog,
			show: showChangelog && content.changelog.length > 0,
		},
		{ id: 'contact', label: translations.sections.contact, show: showContact && !!content.contact },
	]);

	const visibleSections = $derived(sections.filter((s) => s.show));

	function setActiveSection(section: HelpSection) {
		activeSection = section;
		onSectionChange?.(section);
	}

	function handleSearchResultSelect(result: SearchResult) {
		// Navigate to the appropriate section based on result type
		switch (result.type) {
			case 'faq':
				setActiveSection('faq');
				break;
			case 'feature':
				setActiveSection('features');
				break;
			case 'guide':
				setActiveSection('getting-started');
				break;
			case 'changelog':
				setActiveSection('changelog');
				break;
		}
		onSearch?.(result.title, [result]);
	}
</script>

<div class="mx-auto max-w-4xl px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		{#if showBackButton}
			<button
				type="button"
				class="mb-4 flex items-center gap-1 text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
				onclick={onBack}
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
				{translations.common.back}
			</button>
		{/if}

		<h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
			{translations.title}
		</h1>
		{#if translations.subtitle}
			<p class="mt-1 text-gray-600 dark:text-gray-400">
				{translations.subtitle} - {appName}
			</p>
		{/if}
	</div>

	<!-- Search -->
	{#if searchEnabled}
		<div class="mb-8">
			<HelpSearch
				{content}
				{translations}
				placeholder={translations.searchPlaceholder}
				onResultSelect={handleSearchResultSelect}
			/>
		</div>
	{/if}

	<!-- Navigation Tabs -->
	{#if visibleSections.length > 1}
		<div class="mb-6 border-b border-gray-200 dark:border-gray-700">
			<nav class="-mb-px flex space-x-4 overflow-x-auto" aria-label="Help sections">
				{#each visibleSections as section (section.id)}
					<button
						type="button"
						class="whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors"
						class:border-primary-500={activeSection === section.id}
						class:text-primary-600={activeSection === section.id}
						class:dark:text-primary-400={activeSection === section.id}
						class:border-transparent={activeSection !== section.id}
						class:text-gray-500={activeSection !== section.id}
						class:hover:text-gray-700={activeSection !== section.id}
						class:dark:text-gray-400={activeSection !== section.id}
						class:dark:hover:text-gray-300={activeSection !== section.id}
						onclick={() => setActiveSection(section.id)}
					>
						{section.label}
					</button>
				{/each}
			</nav>
		</div>
	{/if}

	<!-- Content -->
	<div class="min-h-[400px]">
		{#if activeSection === 'faq' && showFAQ}
			<FAQSection items={content.faq} {translations} expandFirst />
		{:else if activeSection === 'features' && showFeatures}
			<FeaturesOverview items={content.features} {translations} />
		{:else if activeSection === 'shortcuts' && showShortcuts}
			<KeyboardShortcuts items={content.shortcuts} {translations} />
		{:else if activeSection === 'getting-started' && showGettingStarted}
			<GettingStartedGuide items={content.gettingStarted} {translations} />
		{:else if activeSection === 'changelog' && showChangelog}
			<ChangelogSection items={content.changelog} {translations} />
		{:else if activeSection === 'contact' && showContact}
			<ContactSection contact={content.contact} {translations} />
		{/if}
	</div>
</div>
