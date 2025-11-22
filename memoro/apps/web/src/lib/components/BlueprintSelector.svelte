<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { createAuthClient } from '$lib/supabaseClient';

	// Standard blueprint ID - matches the mobile app constant
	const STANDARD_BLUEPRINT_ID = '11111111-2222-3333-4444-555555555555';

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
		is_public: boolean;
	}

	interface Props {
		selectedBlueprintId: string | null;
		onSelectBlueprint: (blueprintId: string | null) => void;
	}

	let { selectedBlueprintId, onSelectBlueprint }: Props = $props();

	let blueprints = $state<Blueprint[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	const lang = 'de'; // Can be replaced with i18n store

	onMount(async () => {
		await fetchActiveBlueprints();
	});

	async function fetchActiveBlueprints() {
		try {
			loading = true;
			error = null;

			// Get active blueprint IDs from localStorage
			const stored = localStorage.getItem('active-blueprints');
			let activeIds: string[] = [];
			if (stored) {
				try {
					activeIds = JSON.parse(stored);
				} catch (e) {
					activeIds = [];
				}
			}

			if (activeIds.length === 0) {
				// No active blueprints, show only Standard option
				blueprints = [];
				loading = false;
				return;
			}

			// Fetch active blueprints from Supabase
			const supabase = await createAuthClient();
			const { data, error: fetchError } = await supabase
				.from('blueprints')
				.select('id, name, description, is_public')
				.in('id', activeIds)
				.order('created_at', { ascending: false });

			if (fetchError) {
				console.error('Error loading blueprints:', fetchError.message);
				error = $t('blueprints.load_error');
				return;
			}

			blueprints = data || [];
		} catch (err) {
			console.error('Unexpected error:', err);
			error = $t('errors.unexpected');
		} finally {
			loading = false;
		}
	}

	function handleSelectBlueprint(id: string) {
		if (id === 'standard') {
			onSelectBlueprint(STANDARD_BLUEPRINT_ID);
		} else {
			onSelectBlueprint(id);
		}
	}

	// Check if Standard is selected (null or STANDARD_BLUEPRINT_ID)
	const isStandardSelected = $derived(
		!selectedBlueprintId || selectedBlueprintId === STANDARD_BLUEPRINT_ID
	);
</script>

<div class="w-full bg-transparent py-3">
	<div class="hide-scrollbar flex justify-center gap-2 overflow-x-auto px-4">
		<!-- Add blueprints icon/button -->
		<a
			href="/blueprints"
			class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-theme bg-content text-theme-secondary transition-colors hover:bg-menu-hover hover:text-theme"
			title={$t('blueprints.manage')}
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
		</a>

		<!-- Standard option -->
		<button
			onclick={() => handleSelectBlueprint('standard')}
			class="flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors {isStandardSelected
				? 'bg-primary text-black'
				: 'border border-theme bg-content text-theme'}"
		>
			{$t('blueprints.standard')}
		</button>

		{#if loading}
			{#each Array(3) as _, i}
				<div
					class="h-9 w-20 flex-shrink-0 animate-pulse rounded-full bg-content"
					style="animation-delay: {i * 100}ms"
				></div>
			{/each}
		{:else if error}
			<span class="flex items-center text-sm text-red-500">{error}</span>
		{:else}
			{#each blueprints as blueprint}
				{@const isSelected = selectedBlueprintId === blueprint.id}
				{@const label = blueprint.name?.[lang] || blueprint.name?.en || 'Unbenannt'}
				<button
					onclick={() => handleSelectBlueprint(blueprint.id)}
					class="flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors {isSelected
						? 'bg-primary text-black'
						: 'border border-theme bg-content text-theme'}"
					title={blueprint.description?.[lang] || blueprint.description?.en || ''}
				>
					{label}
				</button>
			{/each}
		{/if}

		{#if !loading && blueprints.length === 0 && !error}
			<a
				href="/blueprints"
				class="flex flex-shrink-0 items-center gap-1 rounded-full border border-dashed border-theme px-4 py-2 text-sm text-theme-secondary transition-colors hover:bg-menu-hover hover:text-theme"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				{$t('blueprints.activate')}
			</a>
		{/if}
	</div>
</div>

<style>
	.hide-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.hide-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
