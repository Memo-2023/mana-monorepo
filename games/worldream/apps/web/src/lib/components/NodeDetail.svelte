<script lang="ts">
	import type { ContentNode } from '$lib/types/content';
	import type { CustomFieldSchema, CustomFieldData } from '$lib/types/customFields';
	import { goto } from '$app/navigation';
	import PromptInfo from './PromptInfo.svelte';
	import ImageGallery from './ImageGallery.svelte';
	import { extractMentions } from '$lib/utils/mentions';
	import { aiAuthorStore } from '$lib/stores/aiAuthorStore';
	import { onMount, onDestroy } from 'svelte';
	import { renderMarkdown, parseReferences as parseRefs } from '$lib/utils/markdown';
	import NodeMemory from './NodeMemory.svelte';
	import SmartMarkdown from './SmartMarkdown.svelte';
	import CustomFieldsDisplay from './customFields/CustomFieldsDisplay.svelte';
	import ImageUploadModal from './ImageUploadModal.svelte';

	interface Props {
		node: ContentNode;
		isOwner: boolean;
		onDelete: () => void;
		editPath?: string;
		backPath?: string;
	}

	let { node: initialNode, isOwner, onDelete, editPath, backPath }: Props = $props();

	// Make node reactive for AI updates
	let node = $state(initialNode);

	// Update node when initialNode changes (e.g., navigation)
	$effect(() => {
		node = initialNode;
		// Update global AI Author Bar context when node changes
		if (isOwner) {
			aiAuthorStore.setContext(node, isOwner);
		}
	});

	// Set AI Author Bar context on mount
	onMount(() => {
		console.log('🎯 NodeDetail: Setting AI context', { node: node.slug, isOwner });
		if (isOwner) {
			aiAuthorStore.setContext(node, isOwner);
		}
	});

	// Listen for node updates from AI Author Bar
	let handleNodeUpdate: (event: CustomEvent) => void;
	let handleImagesUpdate: (event: CustomEvent) => void;

	onMount(() => {
		handleNodeUpdate = (event: CustomEvent) => {
			if (event.detail.updatedNode.slug === node.slug) {
				node = event.detail.updatedNode;
				// Re-load linked objects if this is a character
				if (node.kind === 'character') {
					loadLinkedObjects();
				}
			}
		};

		handleImagesUpdate = (event: CustomEvent) => {
			if (event.detail.nodeSlug === node.slug) {
				console.log('📸 Images updated event received, reloading...');
				loadImages();
			}
		};

		window.addEventListener('node-updated', handleNodeUpdate as EventListener);
		window.addEventListener('images-updated', handleImagesUpdate as EventListener);
	});

	onDestroy(() => {
		if (handleNodeUpdate) {
			window.removeEventListener('node-updated', handleNodeUpdate as EventListener);
		}
		if (handleImagesUpdate) {
			window.removeEventListener('images-updated', handleImagesUpdate as EventListener);
		}
	});

	// State for linked objects
	let linkedObjects = $state<ContentNode[]>([]);
	let loadingObjects = $state(false);

	// State for image gallery
	let images = $state<any[]>([]);
	let loadingImages = $state(false);

	// State for tabs
	let activeTab = $state<'info' | 'memory' | 'prompt' | 'custom'>('info');

	// State for dropdown menu
	let showDropdown = $state(false);

	// State for left column metadata
	let showLeftMetadata = $state(false);

	// State for image upload modal
	let showUploadModal = $state(false);

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.dropdown-container')) {
			showDropdown = false;
		}
	}

	$effect(() => {
		if (showDropdown) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});

	function parseReferences(text: string | undefined): string {
		if (!text) return '';
		// Use the new markdown-aware parser
		return parseRefs(text);
	}

	function renderContent(text: string | undefined, isStoryLore: boolean = false): string {
		if (!text) return '';
		// For story lore, always use full markdown rendering
		if (isStoryLore) {
			return renderMarkdown(text);
		}
		// For other content, use reference parser (which auto-detects markdown)
		return parseRefs(text);
	}

	// Load objects that are in this character's inventory
	async function loadLinkedObjects() {
		if (node.kind !== 'character' || !node.content.inventory_text) return;

		loadingObjects = true;
		try {
			const mentions = extractMentions(node.content.inventory_text);
			if (mentions.length === 0) return;

			// Load all mentioned objects
			const objects = await Promise.all(
				mentions.map(async (slug) => {
					const response = await fetch(`/api/nodes/${slug}`);
					if (response.ok) {
						const obj = await response.json();
						if (obj.kind === 'object') return obj;
					}
					return null;
				})
			);

			linkedObjects = objects.filter((obj) => obj !== null) as ContentNode[];
		} catch (err) {
			console.error('Failed to load linked objects:', err);
		} finally {
			loadingObjects = false;
		}
	}

	// Load images for the gallery
	async function loadImages() {
		console.log('📸 NodeDetail: Loading images for node:', node.slug);
		loadingImages = true;
		try {
			// Use the proper attachments-based endpoint
			const response = await fetch(`/api/nodes/${node.slug}/images`);
			console.log('📸 NodeDetail: API response status:', response.status);
			if (response.ok) {
				images = await response.json();
				console.log('📸 NodeDetail: Loaded images:', images);
				console.log('📸 NodeDetail: images.length:', images.length);
			} else {
				console.error('📸 NodeDetail: API error:', response.status, response.statusText);
			}
		} catch (err) {
			console.error('📸 NodeDetail: Failed to load images:', err);
		} finally {
			loadingImages = false;
			console.log('📸 NodeDetail: loadingImages set to false');
		}
	}

	$effect(() => {
		loadLinkedObjects();
		loadImages();
	});

	function formatFieldName(key: string): string {
		return key
			.replace(/_/g, ' ')
			.replace(/text$/, '')
			.replace(/\b\w/g, (l) => l.toUpperCase());
	}

	// Get the appropriate content fields based on node kind
	function getContentFields(): Array<{ key: string; label: string }> {
		const commonFields = [
			{ key: 'appearance', label: 'Aussehen' },
			{ key: 'lore', label: 'Geschichte' },
		];

		switch (node.kind) {
			case 'world':
				return [
					...commonFields,
					{ key: 'canon_facts_text', label: 'Kanon-Fakten' },
					{ key: 'glossary_text', label: 'Glossar' },
					{ key: 'constraints', label: 'Einschränkungen' },
					{ key: 'timeline_text', label: 'Zeitleiste' },
					{ key: 'prompt_guidelines', label: 'LLM-Richtlinien' },
				];
			case 'character':
				return [
					{ key: 'state_text', label: 'Aktuelle Situation' },
					{ key: 'motivations', label: 'Motivationen' },
					...commonFields,
					{ key: 'voice_style', label: 'Sprechstil' },
					{ key: 'capabilities', label: 'Fähigkeiten' },
					{ key: 'secrets', label: 'Geheimnisse' },
					{ key: 'relationships_text', label: 'Beziehungen' },
					{ key: 'inventory_text', label: 'Inventar' },
					{ key: 'timeline_text', label: 'Zeitleiste' },
					{ key: 'constraints', label: 'Einschränkungen' },
				];
			case 'place':
				return [
					...commonFields,
					{ key: 'capabilities', label: 'Besonderheiten' },
					{ key: 'constraints', label: 'Gefahren' },
					{ key: 'secrets', label: 'Geheimnisse' },
					{ key: 'state_text', label: 'Aktueller Zustand' },
					{ key: 'timeline_text', label: 'Wichtige Ereignisse' },
				];
			case 'object':
				return [
					...commonFields,
					{ key: 'capabilities', label: 'Eigenschaften' },
					{ key: 'constraints', label: 'Einschränkungen' },
					{ key: 'secrets', label: 'Geheimnisse' },
					{ key: 'state_text', label: 'Zustand / Aufbewahrungsort' },
				];
			case 'story':
				return [
					{ key: 'lore', label: 'Story-Verlauf' },
					{ key: 'references', label: 'Referenzen' },
					{ key: 'prompt_guidelines', label: 'LLM-Richtlinien' },
				];
			default:
				return commonFields;
		}
	}

	const contentFields = getContentFields();

	// Check if layout should be side-by-side
	const isSideBySide = node.kind === 'character' || node.kind === 'object';
</script>

{#if !isSideBySide && (node.kind === 'world' || node.kind === 'place') && !loadingImages && (images.length > 0 || node.image_url)}
	<!-- Fixed Full-Width Background Image for worlds and places -->
	<div class="fixed inset-0 w-full h-full" style="z-index: -1;">
		{#if images.length > 0 && images[0]?.image_url}
			<!-- Use first image from gallery as background -->
			<div class="relative w-full h-full">
				<img
					src={images[0].image_url}
					alt={`Bild für ${node.title}`}
					class="w-full h-full object-cover"
				/>
			</div>
		{:else if node.image_url}
			<!-- Fallback: Direct image display when no images loaded via API -->
			<div class="relative w-full h-full">
				<img
					src={node.image_url}
					alt={`Bild für ${node.title}`}
					class="w-full h-full object-cover"
					onload={() => console.log('🖼️ Fallback image loaded:', node.image_url)}
					onerror={() => console.error('🚨 Fallback image failed:', node.image_url)}
				/>
			</div>
		{/if}
	</div>
{/if}

<div class="mx-auto max-w-6xl relative">
	{#if isSideBySide}
		<!-- Side-by-side layout for characters and objects -->
		<div class="flex flex-col gap-6 lg:flex-row lg:gap-8">
			<!-- Left column: Image, Title and metadata -->
			<div class="flex-shrink-0 lg:w-1/3">
				<div class="sticky top-8">
					<!-- Image -->
					{#if !loadingImages && (images.length > 0 || node.image_url)}
						{#if images.length > 0}
							<ImageGallery
								{images}
								nodeSlug={node.slug}
								nodeKind={node.kind}
								editable={isOwner}
								onImageUpdate={loadImages}
							/>
						{:else if node.image_url}
							<!-- Fallback: Direct image display when no images loaded via API -->
							<img
								src={node.image_url}
								alt={`Bild für ${node.title}`}
								class="{node.kind === 'character'
									? 'aspect-[9/16] w-full'
									: 'aspect-square w-full'} rounded-lg object-cover shadow-lg"
								onload={() => console.log('🖼️ Fallback image loaded:', node.image_url)}
								onerror={() => console.error('🚨 Fallback image failed:', node.image_url)}
							/>
						{/if}
					{/if}

					<!-- Title and metadata -->
					<div class="mt-6">
						<div class="flex items-start justify-between gap-2">
							<h1 class="text-3xl font-bold text-theme-text-primary">{node.title}</h1>
							<div class="flex gap-1 flex-shrink-0">
								<!-- Collapsible metadata button -->
								<button
									onclick={() => (showLeftMetadata = !showLeftMetadata)}
									class="p-1 rounded text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-surface transition-colors"
									title="Metadaten anzeigen"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
										/>
									</svg>
								</button>
								{#if isOwner}
									<!-- Upload button -->
									<button
										onclick={() => (showUploadModal = true)}
										class="p-1 rounded text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-surface transition-colors"
										title="Bilder hochladen"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
											/>
										</svg>
									</button>
								{/if}
							</div>
						</div>
						{#if node.summary}
							<p class="mt-2 text-base text-theme-text-secondary">{node.summary}</p>
						{/if}

						{#if showLeftMetadata}
							<div class="mt-2 flex flex-wrap items-center gap-2">
								<span
									class="inline-flex items-center rounded-full bg-theme-elevated px-2.5 py-0.5 text-xs font-medium text-theme-text-primary"
								>
									{node.visibility}
								</span>
								{#if node.world_slug}
									<a
										href="/worlds/{node.world_slug}"
										class="bg-theme-primary-100/50 dark:hover:bg-theme-primary-900/70 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-theme-primary-800 hover:bg-theme-primary-200"
									>
										🌍 {node.world_slug}
									</a>
								{/if}
								{#if node.tags && node.tags.length > 0}
									{#each node.tags as tag}
										<span
											class="bg-theme-primary-100/50 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-theme-primary-800"
										>
											{tag}
										</span>
									{/each}
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Right column: Content -->
			<div class="flex-1">
				<!-- Tab Navigation for all node types except stories -->
				{#if node.kind !== 'story'}
					<div
						class="sticky top-0 z-10 mb-4 flex items-center justify-between bg-theme-elevated rounded-lg p-1"
					>
						<div class="flex space-x-1">
							<button
								onclick={() => (activeTab = 'info')}
								class="px-4 py-2 rounded text-sm font-medium transition-colors {activeTab === 'info'
									? 'bg-theme-surface text-theme-primary-600'
									: 'text-theme-text-secondary hover:text-theme-text-primary'}"
							>
								Informationen
							</button>
							<button
								onclick={() => (activeTab = 'memory')}
								class="px-4 py-2 rounded text-sm font-medium transition-colors {activeTab ===
								'memory'
									? 'bg-theme-surface text-theme-primary-600'
									: 'text-theme-text-secondary hover:text-theme-text-primary'}"
							>
								{node.kind === 'world'
									? 'Historie'
									: node.kind === 'place'
										? 'Ereignisse'
										: node.kind === 'object'
											? 'Geschichte'
											: 'Erinnerungen'}
							</button>
							{#if node.generation_prompt}
								<button
									onclick={() => (activeTab = 'prompt')}
									class="px-4 py-2 rounded text-sm font-medium transition-colors {activeTab ===
									'prompt'
										? 'bg-theme-surface text-theme-primary-600'
										: 'text-theme-text-secondary hover:text-theme-text-primary'}"
								>
									KI-Generierung
								</button>
							{/if}
							{#if node.custom_schema && node.custom_schema.fields.length > 0}
								<button
									onclick={() => (activeTab = 'custom')}
									class="px-4 py-2 rounded text-sm font-medium transition-colors {activeTab ===
									'custom'
										? 'bg-theme-surface text-theme-primary-600'
										: 'text-theme-text-secondary hover:text-theme-text-primary'}"
								>
									Zusatzfelder
								</button>
							{/if}
						</div>
						{#if isOwner}
							<div class="relative dropdown-container mr-1">
								<button
									onclick={() => (showDropdown = !showDropdown)}
									class="p-2 rounded text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-surface transition-colors"
									title="Mehr Optionen"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
										/>
									</svg>
								</button>

								{#if showDropdown}
									<div
										class="absolute right-0 mt-1 w-48 rounded-md bg-theme-surface shadow-lg border border-theme-border-default z-50"
									>
										<div class="py-1">
											{#if editPath}
												<a
													href={editPath}
													class="flex items-center px-4 py-2 text-sm text-theme-text-primary hover:bg-theme-interactive-hover"
												>
													<svg
														class="mr-2 h-4 w-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
														/>
													</svg>
													Bearbeiten
												</a>
											{/if}
											<button
												onclick={onDelete}
												class="flex items-center w-full px-4 py-2 text-sm text-theme-error hover:bg-theme-error/10"
											>
												<svg
													class="mr-2 h-4 w-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
													/>
												</svg>
												Löschen
											</button>
										</div>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/if}

				<!-- Content fields or Memory Tab or Prompt Tab -->
				<div class="rounded-lg bg-theme-surface p-6 shadow">
					{#if node.kind !== 'story' && activeTab === 'memory'}
						<!-- Memory Tab Content -->
						<NodeMemory
							nodeSlug={node.slug}
							nodeKind={node.kind}
							memory={node.memory || null}
							editable={isOwner}
							onMemoryUpdate={(updatedMemory) => {
								node.memory = updatedMemory;
							}}
						/>
					{:else if node.kind !== 'story' && activeTab === 'prompt' && node.generation_prompt}
						<!-- Prompt Tab Content -->
						<PromptInfo {node} />
					{:else}
						<!-- Regular Content Fields -->
						<div class="space-y-6">
							{#each contentFields as field}
								{#if node.content?.[field.key]}
									<div>
										<h3 class="mb-2 text-lg font-medium text-theme-text-primary">
											{field.label}
										</h3>
										<div class="prose dark:prose-invert max-w-none text-theme-text-secondary">
											{#if field.key === 'lore' && node.kind === 'story'}
												<SmartMarkdown
													text={node.content[field.key] || ''}
													references={node.content.references}
												/>
											{:else if field.key.includes('text') || field.key === 'references'}
												{@html parseReferences(node.content[field.key])}
											{:else}
												<p class="whitespace-pre-wrap">{node.content[field.key]}</p>
											{/if}
										</div>
									</div>
								{/if}
							{/each}
						</div>

						<!-- Show linked objects for characters -->
						{#if node.kind === 'character' && linkedObjects.length > 0}
							<div class="border-t border-theme-border-subtle pt-6">
								<h3 class="mb-4 text-lg font-medium text-theme-text-primary">
									📒 Inventar-Objekte
								</h3>
								<div class="grid grid-cols-1 gap-4">
									{#each linkedObjects as obj}
										<a
											href="/worlds/{node.world_slug}/objects/{obj.slug}"
											class="block rounded-lg bg-theme-elevated p-4 transition-colors hover:bg-theme-interactive-hover"
										>
											<div class="flex items-start space-x-3">
												{#if obj.image_url}
													<img
														src={obj.image_url}
														alt={obj.title}
														class="h-12 w-12 rounded object-cover"
													/>
												{/if}
												<div class="flex-1">
													<h4 class="font-medium text-theme-text-primary">{obj.title}</h4>
													{#if obj.summary}
														<p class="mt-1 text-sm text-theme-text-secondary">{obj.summary}</p>
													{/if}
												</div>
											</div>
										</a>
									{/each}
								</div>
							</div>
						{/if}
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<!-- Traditional top-down layout for stories and worlds/places -->
		<div
			class="mx-auto max-w-4xl {node.kind === 'world' || node.kind === 'place'
				? 'relative z-20'
				: ''}"
			style={node.kind === 'world' || node.kind === 'place'
				? 'padding-top: 100vh; margin-top: -25vh;'
				: ''}
		>
			<!-- Regular Image for stories and other content without sticky -->
			{#if node.kind === 'story' && !loadingImages && (images.length > 0 || node.image_url)}
				<div class="mb-6">
					{#if images.length > 0}
						<ImageGallery
							{images}
							nodeSlug={node.slug}
							nodeKind={node.kind}
							editable={isOwner}
							onImageUpdate={loadImages}
						/>
					{:else if node.image_url}
						<!-- Fallback: Direct image display when no images loaded via API -->
						<div class="mb-6">
							<img
								src={node.image_url}
								alt={`Bild für ${node.title}`}
								class="aspect-square w-full rounded-lg object-cover shadow-lg"
								onload={() => console.log('🖼️ Fallback image loaded:', node.image_url)}
								onerror={() => console.error('🚨 Fallback image failed:', node.image_url)}
							/>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Title and metadata -->
			<div
				class="mb-6 {node.kind === 'world' || node.kind === 'place'
					? 'bg-theme-base/90 backdrop-blur-md rounded-lg p-6 shadow-lg'
					: ''}"
			>
				<h1 class="text-3xl font-bold text-theme-text-primary">{node.title}</h1>
				{#if node.summary}
					<p class="mt-2 text-lg text-theme-text-secondary">{node.summary}</p>
				{/if}
				<div class="mt-3 flex flex-wrap items-center gap-2">
					<span
						class="inline-flex items-center rounded-full bg-theme-elevated px-2.5 py-0.5 text-xs font-medium text-theme-text-primary"
					>
						{node.visibility}
					</span>
					{#if node.world_slug}
						<a
							href="/worlds/{node.world_slug}"
							class="bg-theme-primary-100/50 dark:hover:bg-theme-primary-900/70 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-theme-primary-800 hover:bg-theme-primary-200"
						>
							🌍 {node.world_slug}
						</a>
					{/if}
					{#if node.tags && node.tags.length > 0}
						{#each node.tags as tag}
							<span
								class="bg-theme-primary-100/50 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-theme-primary-800"
							>
								{tag}
							</span>
						{/each}
					{/if}
				</div>
			</div>

			<!-- Tab Navigation for all node types except stories -->
			{#if node.kind !== 'story'}
				<div class="mb-4 flex items-center justify-between bg-theme-elevated rounded-lg p-1">
					<div class="flex space-x-1">
						<button
							onclick={() => (activeTab = 'info')}
							class="px-4 py-2 rounded text-sm font-medium transition-colors {activeTab === 'info'
								? 'bg-theme-surface text-theme-primary-600'
								: 'text-theme-text-secondary hover:text-theme-text-primary'}"
						>
							Informationen
						</button>
						<button
							onclick={() => (activeTab = 'memory')}
							class="px-4 py-2 rounded text-sm font-medium transition-colors {activeTab === 'memory'
								? 'bg-theme-surface text-theme-primary-600'
								: 'text-theme-text-secondary hover:text-theme-text-primary'}"
						>
							{node.kind === 'world'
								? 'Historie'
								: node.kind === 'place'
									? 'Ereignisse'
									: node.kind === 'object'
										? 'Geschichte'
										: 'Erinnerungen'}
						</button>
						{#if node.generation_prompt}
							<button
								onclick={() => (activeTab = 'prompt')}
								class="px-4 py-2 rounded text-sm font-medium transition-colors {activeTab ===
								'prompt'
									? 'bg-theme-surface text-theme-primary-600'
									: 'text-theme-text-secondary hover:text-theme-text-primary'}"
							>
								KI-Generierung
							</button>
						{/if}
					</div>
					{#if isOwner}
						<div class="relative dropdown-container mr-1">
							<button
								onclick={() => (showDropdown = !showDropdown)}
								class="p-2 rounded text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-surface transition-colors"
								title="Mehr Optionen"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
									/>
								</svg>
							</button>

							{#if showDropdown}
								<div
									class="absolute right-0 mt-1 w-48 rounded-md bg-theme-surface shadow-lg border border-theme-border-default z-50"
								>
									<div class="py-1">
										{#if editPath}
											<a
												href={editPath}
												class="flex items-center px-4 py-2 text-sm text-theme-text-primary hover:bg-theme-interactive-hover"
											>
												<svg
													class="mr-2 h-4 w-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
													/>
												</svg>
												Bearbeiten
											</a>
										{/if}
										<button
											onclick={onDelete}
											class="flex items-center w-full px-4 py-2 text-sm text-theme-error hover:bg-theme-error/10"
										>
											<svg
												class="mr-2 h-4 w-4"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
												/>
											</svg>
											Löschen
										</button>
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Content fields or Memory Tab or Prompt Tab -->
			<div class="rounded-lg bg-theme-surface p-6 shadow">
				{#if node.kind !== 'story' && activeTab === 'memory'}
					<!-- Memory Tab Content -->
					<NodeMemory
						nodeSlug={node.slug}
						nodeKind={node.kind}
						memory={node.memory || null}
						editable={isOwner}
						onMemoryUpdate={(updatedMemory) => {
							node.memory = updatedMemory;
						}}
					/>
				{:else if node.kind !== 'story' && activeTab === 'prompt' && node.generation_prompt}
					<!-- Prompt Tab Content -->
					<PromptInfo {node} />
				{:else if node.kind !== 'story' && activeTab === 'custom'}
					<!-- Custom Fields Tab Content -->
					<CustomFieldsDisplay schema={node.custom_schema} data={node.custom_data} />
				{:else}
					<!-- Regular Content Fields -->
					<div class="space-y-6">
						{#each contentFields as field}
							{#if node.content?.[field.key]}
								<div>
									<h3 class="mb-2 text-lg font-medium text-theme-text-primary">
										{field.label}
									</h3>
									<div class="prose dark:prose-invert max-w-none text-theme-text-secondary">
										{#if field.key === 'lore' && node.kind === 'story'}
											<SmartMarkdown
												text={node.content[field.key] || ''}
												references={node.content.references}
											/>
										{:else if field.key.includes('text') || field.key === 'references'}
											{@html parseReferences(node.content[field.key])}
										{:else}
											<p class="whitespace-pre-wrap">{node.content[field.key]}</p>
										{/if}
									</div>
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Back link and bottom padding -->
	{#if backPath}
		<div
			class="mt-6 {!isSideBySide && (node.kind === 'world' || node.kind === 'place')
				? 'pb-[100vh]'
				: 'pb-20'}"
		>
			<!-- Add massive bottom padding for world/place to show full background image -->
			<a href={backPath} class="text-theme-primary-600 hover:text-theme-primary-500">
				← Zurück zur Übersicht
			</a>
		</div>
	{:else}
		<!-- Add bottom padding even without back link -->
		<div
			class={!isSideBySide && (node.kind === 'world' || node.kind === 'place')
				? 'pb-[100vh]'
				: 'pb-20'}
		></div>
	{/if}
</div>

<!-- Image Upload Modal -->
{#if showUploadModal}
	<ImageUploadModal
		show={showUploadModal}
		nodeSlug={node.slug}
		onClose={() => (showUploadModal = false)}
		onUploadComplete={loadImages}
	/>
{/if}
