<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { createAuthClient } from '$lib/supabaseClient';
	import { user } from '$lib/stores/auth';
	import BlueprintCard from '$lib/components/BlueprintCard.svelte';
	import PillFilter from '$lib/components/PillFilter.svelte';
	import BlueprintModal from '$lib/components/BlueprintModal.svelte';
	import { BlueprintsPageSkeleton } from '$lib/components/skeletons';

	interface Prompt {
		id: string;
		memory_title: {
			de?: string;
			en?: string;
		};
		prompt_text: {
			de?: string;
			en?: string;
		};
		sort_order?: number;
		created_at?: string;
		updated_at?: string;
		blueprint_id?: string;
	}

	interface Blueprint {
		id: string;
		name: {
			de?: string;
			en?: string;
		};
		description?: {
			de?: string;
			en?: string;
		};
		category?: Category;
		is_public: boolean;
		created_at: string;
		updated_at: string;
		user_id: string;
		prompts?: Prompt[];
	}

	interface Category {
		id: string;
		name: {
			de?: string;
			en?: string;
		};
		description?: {
			de?: string;
			en?: string;
		};
		style?: { color?: string; [key: string]: any };
	}

	interface FilterItem {
		id: string;
		label: string;
		color?: string;
	}

	let blueprints = $state<Blueprint[]>([]);
	let filteredBlueprints = $state<Blueprint[]>([]);
	let categories = $state<Category[]>([]);
	let selectedCategoryIds = $state<string[]>([]);
	let loading = $state(true);
	let categoriesLoading = $state(true);
	let error = $state<string | null>(null);
	let categoriesError = $state<string | null>(null);

	// Search state
	let isSearchVisible = $state(false);
	let searchQuery = $state('');

	// Active blueprints (stored in localStorage for now)
	let activeBlueprints = $state<string[]>([]);

	// Modal state
	let modalVisible = $state(false);
	let selectedBlueprint = $state<Blueprint | null>(null);

	const lang = 'de'; // Can be replaced with i18n store

	onMount(() => {
		fetchBlueprints();
		loadActiveBlueprints();
	});

	async function fetchBlueprints() {
		try {
			loading = true;
			error = null;

			const supabase = await createAuthClient();

			// Fetch public blueprints (same as mobile app)
			const { data: blueprintsData, error: blueprintsError } = await supabase
				.from('blueprints')
				.select('id, name, description, is_public, created_at, updated_at, user_id, category')
				.eq('is_public', true)
				.order('created_at', { ascending: false });

			if (blueprintsError) {
				console.error('Error loading blueprints:', blueprintsError.message);
				error = 'Blueprints could not be loaded.';
				return;
			}

			// Fetch all prompt links
			const { data: allPromptLinks, error: allPromptLinksError } = await supabase
				.from('prompt_blueprints')
				.select('blueprint_id, prompt_id');

			if (allPromptLinksError) {
				console.error('Error loading prompt links:', allPromptLinksError.message);
			}

			// Fetch all prompts
			const allPromptIds = allPromptLinks?.map((link) => link.prompt_id) || [];
			const { data: allPrompts, error: allPromptsError } = await supabase
				.from('prompts')
				.select('*')
				.in('id', allPromptIds.length > 0 ? allPromptIds : ['no-prompts-found']);

			if (allPromptsError) {
				console.error('Error loading prompts:', allPromptsError.message);
			}

			// Group prompt links by blueprint ID
			const promptLinksByBlueprintId: Record<string, string[]> = {};
			if (allPromptLinks) {
				for (const link of allPromptLinks) {
					if (!promptLinksByBlueprintId[link.blueprint_id]) {
						promptLinksByBlueprintId[link.blueprint_id] = [];
					}
					promptLinksByBlueprintId[link.blueprint_id].push(link.prompt_id);
				}
			}

			// Create a lookup for prompts by ID
			const promptsById: Record<string, any> = {};
			if (allPrompts) {
				for (const prompt of allPrompts as Prompt[]) {
					promptsById[prompt.id] = prompt;
				}
			}

			// Attach prompts to blueprints
			const blueprintsWithPrompts: Blueprint[] = [];
			for (const blueprint of blueprintsData || []) {
				const promptIds = promptLinksByBlueprintId[blueprint.id] || [];
				const promptsForBlueprint = promptIds.map((id) => promptsById[id]).filter(Boolean) as Prompt[];

				blueprintsWithPrompts.push({
					id: blueprint.id,
					name: blueprint.name as { de?: string; en?: string },
					description: blueprint.description as { de?: string; en?: string } | undefined,
					category: blueprint.category as unknown as Category | undefined,
					is_public: blueprint.is_public,
					created_at: blueprint.created_at,
					updated_at: blueprint.updated_at,
					user_id: blueprint.user_id || '',
					prompts: promptsForBlueprint
				});
			}

			blueprints = blueprintsWithPrompts;
			filteredBlueprints = blueprintsWithPrompts;

			console.log('📊 Blueprints loaded:', blueprints.length);
			console.log('📋 Blueprint IDs:', blueprints.map(b => b.id));
			console.log('🏷️ Blueprints by category:', blueprints.reduce((acc, b) => {
				const catName = b.category?.name?.de || b.category?.name?.en || 'No Category';
				acc[catName] = (acc[catName] || 0) + 1;
				return acc;
			}, {} as Record<string, number>));

			// Extract unique categories
			const uniqueCategories = new Map<string, Category>();
			blueprints.forEach((blueprint) => {
				if (blueprint.category && blueprint.category.id) {
					uniqueCategories.set(blueprint.category.id, blueprint.category);
				}
			});

			categories = Array.from(uniqueCategories.values());
			categoriesLoading = false;
		} catch (err) {
			console.error('Unexpected error:', err);
			error = 'An unexpected error occurred.';
		} finally {
			loading = false;
		}
	}

	function loadActiveBlueprints() {
		if (!browser) return;
		const stored = localStorage.getItem('active-blueprints');
		if (stored) {
			try {
				activeBlueprints = JSON.parse(stored);
			} catch (e) {
				activeBlueprints = [];
			}
		}
	}

	function saveActiveBlueprints() {
		if (!browser) return;
		localStorage.setItem('active-blueprints', JSON.stringify(activeBlueprints));
	}

	async function handleToggleActive(blueprintId: string) {
		if (activeBlueprints.includes(blueprintId)) {
			activeBlueprints = activeBlueprints.filter((id) => id !== blueprintId);
		} else {
			activeBlueprints = [...activeBlueprints, blueprintId];
		}
		saveActiveBlueprints();
	}

	function handleCategorySelect(id: string) {
		if (id === 'all') {
			selectedCategoryIds = [];
		} else if (selectedCategoryIds.includes(id)) {
			selectedCategoryIds = selectedCategoryIds.filter((categoryId) => categoryId !== id);
		} else {
			selectedCategoryIds = [...selectedCategoryIds, id];
		}
	}

	function handleOpenModal(blueprintId: string) {
		const blueprint = blueprints.find((b) => b.id === blueprintId);
		if (blueprint) {
			selectedBlueprint = blueprint;
			modalVisible = true;
		}
	}

	function handleCloseModal() {
		modalVisible = false;
		selectedBlueprint = null;
	}

	// Filter blueprints by category and search query
	$effect(() => {
		let filtered = blueprints;

		// Filter by category
		if (selectedCategoryIds.length > 0) {
			filtered = filtered.filter(
				(blueprint) => blueprint.category?.id && selectedCategoryIds.includes(blueprint.category.id)
			);
		}

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter((blueprint) => {
				const name = blueprint.name[lang] || blueprint.name.en || '';
				const description = blueprint.description?.[lang] || blueprint.description?.en || '';
				return name.toLowerCase().includes(query) || description.toLowerCase().includes(query);
			});
		}

		console.log('🔍 Filter applied - Total:', blueprints.length, 'Filtered:', filtered.length,
			'Categories selected:', selectedCategoryIds.length, 'Search:', searchQuery || '(none)');

		filteredBlueprints = filtered;
	});

	// Convert categories to filter items
	const categoryFilterItems = $derived<FilterItem[]>(
		categories.map((category) => {
			let label = 'Unbenannte Kategorie';
			if (category.name) {
				if (typeof category.name === 'string') {
					try {
						const nameObj = JSON.parse(category.name);
						label = nameObj[lang] || nameObj.en || nameObj.de || label;
					} catch (e) {
						label = category.name;
					}
				} else {
					label = category.name[lang] || category.name.en || category.name.de || label;
				}
			}

			let color = '#808080';
			if (category.style) {
				if (typeof category.style === 'string') {
					try {
						const styleObj = JSON.parse(category.style);
						color = styleObj.color || '#808080';
					} catch (e) {
						// Use default color
					}
				} else {
					color = category.style.color || '#808080';
				}
			}

			return {
				id: category.id,
				label,
				color
			};
		})
	);
</script>

<svelte:head>
	<title>Blueprints - Memoro</title>
</svelte:head>

<div class="flex h-full flex-col">
	<!-- Content Area -->
	<div class="flex-1 overflow-y-auto">
		<div class="mx-auto max-w-5xl">
			<h1 class="mb-6 text-3xl font-bold">Blueprints</h1>

			<!-- Search Bar -->
			<div class="relative mb-4">
		<svg
			class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-theme-secondary"
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
		<input
			type="text"
			placeholder="Blueprints durchsuchen..."
			bind:value={searchQuery}
			class="w-full rounded-2xl border border-theme bg-content py-3 pl-11 pr-4 text-theme placeholder-theme-secondary focus:outline-none focus:ring-2 focus:ring-primary"
		/>
	</div>

			<!-- Category Filter -->
			<div class="mb-4">
				<PillFilter
					items={categoryFilterItems}
					selectedIds={selectedCategoryIds}
					onSelectItem={handleCategorySelect}
					isLoading={categoriesLoading}
					error={categoriesError}
					showAllOption={true}
					allOptionLabel="Alle"
				/>
			</div>

			<!-- Blueprints Content -->
		{#if loading}
			<BlueprintsPageSkeleton blueprintCount={9} showFilters={false} />
		{:else if error}
			<!-- Error State -->
			<div class="flex flex-col items-center justify-center py-20">
				<p class="text-center text-theme-secondary">{error}</p>
			</div>
		{:else if filteredBlueprints.length === 0}
			<!-- Empty State -->
			<div class="flex flex-col items-center justify-center py-20">
				<svg
					class="mb-4 h-16 w-16 text-theme-secondary"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
				<p class="text-center text-theme-secondary">Keine Blueprints gefunden</p>
			</div>
		{:else}
			<!-- Blueprints List -->
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
				{#each filteredBlueprints as blueprint (blueprint.id)}
					<BlueprintCard
						id={blueprint.id}
						name={blueprint.name}
						description={blueprint.description}
						category={blueprint.category}
						isPublic={blueprint.is_public}
						createdAt={blueprint.created_at}
						onPress={handleOpenModal}
						showCategory={selectedCategoryIds.length === 0}
						isActive={activeBlueprints.includes(blueprint.id)}
						onToggleActive={handleToggleActive}
					/>
				{/each}
			</div>
		{/if}
		</div>
	</div>
</div>

<!-- Blueprint Modal -->
<BlueprintModal
	visible={modalVisible}
	onClose={handleCloseModal}
	blueprint={selectedBlueprint}
	isActive={selectedBlueprint ? activeBlueprints.includes(selectedBlueprint.id) : false}
	onToggleActive={handleToggleActive}
/>
