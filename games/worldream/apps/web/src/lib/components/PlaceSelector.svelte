<script lang="ts">
	import type { ContentNode } from '$lib/types/content';

	interface Props {
		worldSlug: string;
		selectedPlace: string | null;
		onSelectionChange: (selected: string | null) => void;
	}

	let { worldSlug, selectedPlace, onSelectionChange }: Props = $props();

	let places = $state<ContentNode[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadPlaces() {
		if (!worldSlug) return;

		try {
			const response = await fetch(`/api/nodes?kind=place&world_slug=${worldSlug}`);
			if (!response.ok) throw new Error('Failed to load places');
			places = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Fehler beim Laden der Orte';
		} finally {
			loading = false;
		}
	}

	function selectPlace(placeSlug: string) {
		// Toggle selection - if already selected, deselect
		if (selectedPlace === placeSlug) {
			onSelectionChange(null);
		} else {
			onSelectionChange(placeSlug);
		}
	}

	$effect(() => {
		loadPlaces();
	});
</script>

<div>
	<label class="block text-sm font-medium text-theme-text-primary mb-3">
		📍 Ort auswählen (optional)
	</label>

	{#if loading}
		<div class="text-sm text-theme-text-secondary">Lade Orte...</div>
	{:else if error}
		<div class="text-sm text-theme-error">
			{error}
		</div>
	{:else if places.length === 0}
		<div class="text-sm text-theme-text-secondary">
			Keine Orte in dieser Welt gefunden.
			<a
				href="/worlds/{worldSlug}/places/new"
				class="text-theme-primary-600 hover:text-theme-primary-500"
			>
				Ersten Ort erstellen
			</a>
		</div>
	{:else}
		<div
			class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-theme-border-default rounded-md p-3"
		>
			{#each places as place}
				<button
					type="button"
					onclick={() => selectPlace(place.slug)}
					class="flex items-start space-x-3 p-2 rounded text-left transition-colors
						{selectedPlace === place.slug
						? 'bg-theme-primary-100 dark:bg-theme-primary-900/30 border-2 border-theme-primary-500'
						: 'hover:bg-theme-elevated border-2 border-transparent'}"
				>
					{#if place.image_url}
						<img
							src={place.image_url}
							alt={place.title}
							class="w-12 h-12 rounded object-cover flex-shrink-0"
						/>
					{:else}
						<div
							class="w-12 h-12 rounded bg-theme-elevated flex items-center justify-center flex-shrink-0"
						>
							📍
						</div>
					{/if}
					<div class="flex-1 min-w-0">
						<div class="text-sm font-medium text-theme-text-primary">
							{place.title}
						</div>
						<div class="text-xs text-theme-text-secondary">
							@{place.slug}
						</div>
						{#if place.summary}
							<div class="text-xs text-theme-text-secondary mt-1 line-clamp-2">
								{place.summary}
							</div>
						{/if}
					</div>
				</button>
			{/each}
		</div>

		{#if selectedPlace}
			<div class="mt-2 text-xs text-theme-text-secondary">
				Ausgewählt: @{selectedPlace}
			</div>
		{/if}
	{/if}
</div>
