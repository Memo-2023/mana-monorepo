<script lang="ts">
	import type { PageData } from './$types';
	import { unifiedCardService } from '$lib/services/unifiedCardService';
	import type { Card } from '$lib/components/cards/types';
	import TemplateCard from '$lib/components/templates/TemplateCard.svelte';
	import TemplatePreviewModal from '$lib/components/templates/TemplatePreviewModal.svelte';
	import { pb } from '$lib/pocketbase';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	// State - initialize with server data
	let templates = $state<Card[]>(data.templates || []);
	let loading = $state(false); // Start as false since we have initial data
	let selectedCategory = $state<string>('all');
	let searchQuery = $state('');
	let sortBy = $state<'popular' | 'recent' | 'rating'>('popular');
	let selectedTemplate = $state<Card | null>(null);
	let showPreview = $state(false);

	// Available categories from the cards collection
	const categories = [
		{ value: 'all', label: 'All Templates' },
		{ value: 'personal', label: 'Personal' },
		{ value: 'creative', label: 'Creative' },
		{ value: 'minimal', label: 'Minimal' },
		{ value: 'social', label: 'Social' },
		{ value: 'portfolio', label: 'Portfolio' },
		{ value: 'other', label: 'Other' }
	];

	// Load templates
	async function loadTemplates() {
		loading = true;
		try {
			templates = await unifiedCardService.getTemplates(
				selectedCategory === 'all' ? undefined : selectedCategory
			);
		} catch (error) {
			console.error('Error loading templates:', error);
		} finally {
			loading = false;
		}
	}

	// Filter and sort templates
	let filteredTemplates = $derived(() => {
		let filtered = templates;

		// Search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter((template) => {
				const name = template.metadata?.name?.toLowerCase() || '';
				const description = template.metadata?.description?.toLowerCase() || '';
				const tags = template.tags || [];
				return (
					name.includes(query) ||
					description.includes(query) ||
					tags.some((tag: string) => tag.toLowerCase().includes(query))
				);
			});
		}

		// Sort
		filtered = [...filtered].sort((a, b) => {
			switch (sortBy) {
				case 'popular':
					return (b.usage_count || 0) - (a.usage_count || 0);
				case 'recent':
					return new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime();
				case 'rating':
					return (b.likes_count || 0) - (a.likes_count || 0);
				default:
					return 0;
			}
		});

		return filtered;
	});

	// Use template - creates a new card from template
	async function useTemplate(template: Card) {
		if (!pb.authStore.model) {
			goto('/login');
			return;
		}

		try {
			const newCard = await unifiedCardService.createFromTemplate(template.id!);
			if (newCard) {
				goto('/my/cards');
			}
		} catch (error) {
			console.error('Error using template:', error);
			alert('Failed to use template');
		}
	}

	// Duplicate template to user's collection
	async function duplicateTemplate(template: Card) {
		if (!pb.authStore.model) {
			goto('/login');
			return;
		}

		try {
			const duplicated = await unifiedCardService.duplicateCard(template.id!);
			if (duplicated) {
				alert('Template added to your collection!');
			}
		} catch (error) {
			console.error('Error duplicating template:', error);
			alert('Failed to duplicate template');
		}
	}

	// Like/unlike template
	async function toggleLike(template: Card) {
		if (!pb.authStore.model) {
			goto('/login');
			return;
		}

		try {
			await unifiedCardService.toggleLike(template.id!);
			// Refresh templates to show updated like count
			await loadTemplates();
		} catch (error) {
			console.error('Error toggling like:', error);
		}
	}

	// Share template
	async function shareTemplate(template: Card) {
		const url = `${window.location.origin}/template-store?template=${template.id}`;
		const name = template.metadata?.name || 'Card Template';
		const description = template.metadata?.description || '';

		if (navigator.share) {
			try {
				await navigator.share({
					title: name,
					text: description || `Check out this card template: ${name}`,
					url
				});
			} catch (error) {
				console.error('Error sharing:', error);
			}
		} else {
			// Fallback to clipboard
			navigator.clipboard.writeText(url);
			alert('Template link copied to clipboard!');
		}
	}

	// Preview template
	function previewTemplate(template: Card) {
		selectedTemplate = template;
		showPreview = true;
	}

	// Load on mount
	onMount(() => {
		loadTemplates();
	});

	// Reload when category changes
	$effect(() => {
		// Only load templates on client side to avoid SSR issues
		if (typeof window !== 'undefined') {
			loadTemplates();
		}
	});
</script>

<svelte:head>
	<title>Template Store - uload</title>
	<meta name="description" content="Discover and use community-created card templates" />
</svelte:head>

<div class="min-h-screen bg-theme-background">
	<div class="container mx-auto px-4 py-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-theme-text">Template Store</h1>
			<p class="mt-2 text-theme-text-muted">Discover and use community-created card templates</p>
		</div>

		<!-- Filters and Search -->
		<div class="mb-6 space-y-4">
			<!-- Search Bar -->
			<div class="relative max-w-xl">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search templates by name, description, or tags..."
					class="w-full rounded-lg border border-theme-border bg-theme-surface px-4 py-2 pl-10 text-theme-text placeholder-theme-text-muted focus:ring-2 focus:ring-theme-accent focus:outline-none"
				/>
				<svg
					class="absolute top-2.5 left-3 h-5 w-5 text-theme-text-muted"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			</div>

			<!-- Filters Row -->
			<div class="flex flex-wrap items-center justify-between gap-4">
				<!-- Category Filter -->
				<div class="flex gap-2">
					{#each categories as category}
						<button
							onclick={() => (selectedCategory = category.value)}
							class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {selectedCategory ===
							category.value
								? 'bg-theme-primary text-white'
								: 'bg-theme-surface text-theme-text hover:bg-theme-surface-hover'}"
						>
							{category.label}
						</button>
					{/each}
				</div>

				<!-- Sort Dropdown -->
				<select
					bind:value={sortBy}
					class="rounded-lg border border-theme-border bg-theme-surface px-4 py-2 text-sm text-theme-text focus:ring-2 focus:ring-theme-accent focus:outline-none"
				>
					<option value="popular">Most Popular</option>
					<option value="recent">Most Recent</option>
					<option value="rating">Most Liked</option>
				</select>
			</div>
		</div>

		<!-- Templates Grid -->
		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div class="text-center">
					<div
						class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-theme-border border-t-theme-primary"
					></div>
					<p class="text-theme-text-muted">Loading templates...</p>
				</div>
			</div>
		{:else if filteredTemplates().length > 0}
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each filteredTemplates() as template}
					<TemplateCard
						{template}
						onUse={useTemplate}
						onPreview={previewTemplate}
						onLike={toggleLike}
						onDuplicate={duplicateTemplate}
						onShare={shareTemplate}
					/>
				{/each}
			</div>
		{:else}
			<div class="rounded-lg border border-theme-border bg-theme-surface p-12 text-center">
				<svg
					class="mx-auto mb-4 h-12 w-12 text-theme-text-muted"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
					/>
				</svg>
				<p class="text-theme-text-muted">No templates found</p>
				<p class="mt-2 text-sm text-theme-text-muted">Try adjusting your search or filters</p>
			</div>
		{/if}

		<!-- Create Template CTA -->
		{#if pb.authStore.model}
			<div
				class="mt-12 rounded-lg bg-gradient-to-r from-theme-primary to-theme-accent p-8 text-center text-white"
			>
				<h2 class="mb-2 text-2xl font-bold">Share Your Creations</h2>
				<p class="mb-4">Create and share your own card templates with the community</p>
				<a
					href="/my/cards"
					class="inline-block rounded-lg bg-white px-6 py-3 font-medium text-theme-primary hover:bg-gray-100"
				>
					Create Template
				</a>
			</div>
		{/if}
	</div>
</div>

<!-- Template Preview Modal -->
<TemplatePreviewModal
	template={selectedTemplate}
	show={showPreview}
	onClose={() => (showPreview = false)}
	onUse={useTemplate}
	onDuplicate={duplicateTemplate}
	onLike={toggleLike}
/>
