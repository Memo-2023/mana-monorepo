<script lang="ts">
	import type { ContentNode } from '$lib/types/content';

	interface Props {
		worldSlug: string;
		selectedCharacters: string[];
		onSelectionChange: (selected: string[]) => void;
	}

	let { worldSlug, selectedCharacters, onSelectionChange }: Props = $props();

	let characters = $state<ContentNode[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadCharacters() {
		if (!worldSlug) return;

		try {
			const response = await fetch(`/api/nodes?kind=character&world_slug=${worldSlug}`);
			if (!response.ok) throw new Error('Failed to load characters');
			characters = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Fehler beim Laden der Charaktere';
		} finally {
			loading = false;
		}
	}

	function toggleCharacter(characterSlug: string) {
		const newSelection = selectedCharacters.includes(characterSlug)
			? selectedCharacters.filter((slug) => slug !== characterSlug)
			: [...selectedCharacters, characterSlug];

		onSelectionChange(newSelection);
	}

	$effect(() => {
		loadCharacters();
	});
</script>

<div>
	<label class="block text-sm font-medium text-theme-text-primary mb-3">
		Charaktere auswählen
	</label>

	{#if loading}
		<div class="text-sm text-theme-text-secondary">Lade Charaktere...</div>
	{:else if error}
		<div class="text-sm text-theme-error">
			{error}
		</div>
	{:else if characters.length === 0}
		<div class="text-sm text-theme-text-secondary">
			Keine Charaktere in dieser Welt gefunden.
			<a
				href="/worlds/{worldSlug}/characters/new"
				class="text-theme-primary-600 hover:text-theme-primary-500"
			>
				Ersten Charakter erstellen
			</a>
		</div>
	{:else}
		<div
			class="space-y-2 max-h-60 overflow-y-auto border border-theme-border-default rounded-md p-3"
		>
			{#each characters as character}
				<label
					class="flex items-center space-x-3 cursor-pointer hover:bg-theme-elevated p-2 rounded"
				>
					<input
						type="checkbox"
						checked={selectedCharacters.includes(character.slug)}
						onchange={() => toggleCharacter(character.slug)}
						class="rounded border-theme-border-default text-theme-primary-600 focus:ring-theme-primary-500"
					/>
					<div class="flex-1">
						<div class="flex items-center space-x-2">
							{#if character.image_url}
								<img
									src={character.image_url}
									alt={character.title}
									class="w-8 h-8 rounded-full object-cover"
								/>
							{/if}
							<div>
								<div class="text-sm font-medium text-theme-text-primary">
									{character.title}
								</div>
								<div class="text-xs text-theme-text-secondary">
									@{character.slug}
								</div>
							</div>
						</div>
						{#if character.summary}
							<div class="text-xs text-theme-text-secondary mt-1 line-clamp-1">
								{character.summary}
							</div>
						{/if}
					</div>
				</label>
			{/each}
		</div>

		{#if selectedCharacters.length > 0}
			<div class="mt-2 text-xs text-theme-text-secondary">
				Ausgewählt: {selectedCharacters.map((slug) => `@${slug}`).join(', ')}
			</div>
		{/if}
	{/if}
</div>
