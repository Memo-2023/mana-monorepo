<script lang="ts">
	import type {
		CharacterMemory,
		ShortTermMemory,
		MediumTermMemory,
		LongTermMemory,
		NodeKind,
	} from '$lib/types/content';
	import { parseReferences } from '$lib/utils/markdown';

	interface Props {
		nodeSlug: string;
		nodeKind: NodeKind;
		memory: CharacterMemory | null;
		editable?: boolean;
		onMemoryUpdate?: (memory: CharacterMemory) => void;
	}

	let {
		nodeSlug,
		nodeKind,
		memory: initialMemory,
		editable = false,
		onMemoryUpdate,
	}: Props = $props();

	// Make memory reactive with $state
	let memory = $state<CharacterMemory | null>(initialMemory);

	// Update memory when prop changes
	$effect(() => {
		memory = initialMemory;
	});

	let activeTab = $state<'short' | 'medium' | 'long'>('short');
	let showAddMemory = $state(false);
	let newMemoryContent = $state('');
	let newMemoryTier = $state<'short' | 'medium' | 'long'>('short');
	let newMemoryImportance = $state(5);
	let addingMemory = $state(false);

	// Format timestamp for display
	function formatTimestamp(timestamp: string): string {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffHours < 1) {
			return 'Gerade eben';
		} else if (diffHours < 24) {
			return `Vor ${diffHours} Stunde${diffHours === 1 ? '' : 'n'}`;
		} else if (diffDays < 7) {
			return `Vor ${diffDays} Tag${diffDays === 1 ? '' : 'en'}`;
		} else if (diffDays < 30) {
			const weeks = Math.floor(diffDays / 7);
			return `Vor ${weeks} Woche${weeks === 1 ? '' : 'n'}`;
		} else if (diffDays < 365) {
			const months = Math.floor(diffDays / 30);
			return `Vor ${months} Monat${months === 1 ? '' : 'en'}`;
		} else {
			const years = Math.floor(diffDays / 365);
			return `Vor ${years} Jahr${years === 1 ? '' : 'en'}`;
		}
	}

	// Get importance color
	function getImportanceColor(importance: number): string {
		if (importance >= 8) return 'text-theme-error';
		if (importance >= 6) return 'text-theme-warning';
		if (importance >= 4) return 'text-theme-primary-600';
		return 'text-theme-text-secondary';
	}

	// Get category emoji
	function getCategoryEmoji(category?: string): string {
		switch (category) {
			case 'trauma':
				return '😰';
			case 'triumph':
				return '🏆';
			case 'relationship':
				return '💕';
			case 'skill':
				return '📚';
			case 'secret':
				return '🤫';
			default:
				return '💭';
		}
	}

	// Add new memory
	async function addMemory() {
		if (!newMemoryContent.trim()) return;

		addingMemory = true;
		try {
			const response = await fetch(`/api/nodes/${nodeSlug}/memory`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					content: newMemoryContent,
					tier: newMemoryTier,
					importance: newMemoryImportance,
				}),
			});

			if (response.ok) {
				// Reload memory
				await loadMemory();
				// Reset form
				newMemoryContent = '';
				newMemoryImportance = 5;
				showAddMemory = false;
			}
		} catch (err) {
			console.error('Failed to add memory:', err);
		} finally {
			addingMemory = false;
		}
	}

	// Delete memory
	async function deleteMemory(memoryId: string) {
		if (!confirm('Diese Erinnerung wirklich löschen?')) return;

		try {
			const response = await fetch(`/api/nodes/${nodeSlug}/memory/${memoryId}`, {
				method: 'DELETE',
			});

			if (response.ok) {
				await loadMemory();
			}
		} catch (err) {
			console.error('Failed to delete memory:', err);
		}
	}

	// Process memories (age them)
	async function processMemories() {
		if (!confirm('Erinnerungen altern lassen? Kurzzeit → Mittelzeit → Langzeit')) return;

		try {
			const response = await fetch(`/api/nodes/${nodeSlug}/memory/process`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			});

			if (response.ok) {
				await loadMemory();
			}
		} catch (err) {
			console.error('Failed to process memories:', err);
		}
	}

	// Load memory from API
	async function loadMemory() {
		try {
			const response = await fetch(`/api/nodes/${nodeSlug}/memory`);
			if (response.ok) {
				const data = await response.json();
				memory = data;
				if (onMemoryUpdate) {
					onMemoryUpdate(data);
				}
			}
		} catch (err) {
			console.error('Failed to load memory:', err);
		}
	}

	// Count memories per tier
	let shortTermCount = $derived(memory?.short_term_memory?.length || 0);
	let mediumTermCount = $derived(memory?.medium_term_memory?.length || 0);
	let longTermCount = $derived(memory?.long_term_memory?.length || 0);

	// Get tab labels based on node kind
	function getTabLabels() {
		switch (nodeKind) {
			case 'world':
				return { short: 'Aktuelle', medium: 'Jüngere', long: 'Historie' };
			case 'place':
				return { short: 'Kürzlich', medium: 'Ereignisse', long: 'Geschichte' };
			case 'object':
				return { short: 'Aktuell', medium: 'Verlauf', long: 'Ursprung' };
			default:
				return { short: 'Kurzzeit', medium: 'Mittelzeit', long: 'Langzeit' };
		}
	}

	const tabLabels = getTabLabels();

	// Load memory on mount if not provided
	$effect(() => {
		if (!memory && nodeSlug) {
			loadMemory();
		}
	});
</script>

<div class="memory-container">
	<!-- Tab Navigation -->
	<div class="flex items-center justify-between mb-4">
		<div class="flex space-x-1 bg-theme-elevated rounded-lg p-1">
			<button
				onclick={() => (activeTab = 'short')}
				class="px-3 py-1.5 rounded text-sm font-medium transition-colors {activeTab === 'short'
					? 'bg-theme-surface text-theme-primary-600'
					: 'text-theme-text-secondary hover:text-theme-text-primary'}"
			>
				{tabLabels.short} ({shortTermCount})
			</button>
			<button
				onclick={() => (activeTab = 'medium')}
				class="px-3 py-1.5 rounded text-sm font-medium transition-colors {activeTab === 'medium'
					? 'bg-theme-surface text-theme-primary-600'
					: 'text-theme-text-secondary hover:text-theme-text-primary'}"
			>
				{tabLabels.medium} ({mediumTermCount})
			</button>
			<button
				onclick={() => (activeTab = 'long')}
				class="px-3 py-1.5 rounded text-sm font-medium transition-colors {activeTab === 'long'
					? 'bg-theme-surface text-theme-primary-600'
					: 'text-theme-text-secondary hover:text-theme-text-primary'}"
			>
				{tabLabels.long} ({longTermCount})
			</button>
		</div>

		{#if editable}
			<div class="flex space-x-2">
				<button
					onclick={() => (showAddMemory = !showAddMemory)}
					class="px-3 py-1.5 bg-theme-primary-600 text-white rounded text-sm hover:bg-theme-primary-700"
				>
					+ Neue Erinnerung
				</button>
				<button
					onclick={processMemories}
					class="px-3 py-1.5 border border-theme-border-default rounded text-sm hover:bg-theme-elevated"
				>
					⏰ Altern lassen
				</button>
			</div>
		{/if}
	</div>

	<!-- Add Memory Form -->
	{#if showAddMemory && editable}
		<div class="mb-4 p-4 bg-theme-elevated rounded-lg">
			<div class="space-y-3">
				<div>
					<label
						for="memory-content"
						class="block text-sm font-medium text-theme-text-primary mb-1"
					>
						Erinnerung
					</label>
					<textarea
						id="memory-content"
						bind:value={newMemoryContent}
						placeholder="Was ist passiert?"
						class="w-full px-3 py-2 border border-theme-border-default rounded-md bg-theme-surface text-theme-text-primary"
						rows="3"
					></textarea>
				</div>
				<div class="flex space-x-3">
					<div class="flex-1">
						<label for="memory-tier" class="block text-sm font-medium text-theme-text-primary mb-1">
							Ebene
						</label>
						<select
							id="memory-tier"
							bind:value={newMemoryTier}
							class="w-full px-3 py-2 border border-theme-border-default rounded-md bg-theme-surface text-theme-text-primary"
						>
							<option value="short">Kurzzeit (1-3 Tage)</option>
							<option value="medium">Mittelzeit (1-3 Monate)</option>
							<option value="long">Langzeit (Permanent)</option>
						</select>
					</div>
					<div class="flex-1">
						<label
							for="memory-importance"
							class="block text-sm font-medium text-theme-text-primary mb-1"
						>
							Wichtigkeit: {newMemoryImportance}
						</label>
						<input
							id="memory-importance"
							type="range"
							min="1"
							max="10"
							bind:value={newMemoryImportance}
							class="w-full"
						/>
					</div>
				</div>
				<div class="flex justify-end space-x-2">
					<button
						onclick={() => (showAddMemory = false)}
						class="px-3 py-1.5 border border-theme-border-default rounded text-sm hover:bg-theme-elevated"
					>
						Abbrechen
					</button>
					<button
						onclick={addMemory}
						disabled={addingMemory || !newMemoryContent.trim()}
						class="px-3 py-1.5 bg-theme-primary-600 text-white rounded text-sm hover:bg-theme-primary-700 disabled:opacity-50"
					>
						{addingMemory ? 'Wird gespeichert...' : 'Speichern'}
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Memory Content -->
	<div class="space-y-3">
		{#if !memory}
			<div class="text-center py-8 text-theme-text-secondary">Keine Erinnerungen vorhanden</div>
		{:else if activeTab === 'short'}
			{#if shortTermCount === 0}
				<div class="text-center py-8 text-theme-text-secondary">
					Keine Kurzzeiterinnerungen (letzte 3 Tage)
				</div>
			{:else}
				{#each memory.short_term_memory as mem}
					<div class="p-4 bg-theme-elevated rounded-lg hover:bg-theme-surface transition-colors">
						<div class="flex justify-between items-start mb-2">
							<span class="text-xs text-theme-text-secondary">
								{formatTimestamp(mem.timestamp)}
							</span>
							<div class="flex items-center space-x-2">
								<span class="{getImportanceColor(mem.importance)} text-xs">
									⭐ {mem.importance}/10
								</span>
								{#if editable}
									<button
										onclick={() => deleteMemory(mem.id)}
										class="text-theme-error hover:text-theme-error/80 text-xs"
									>
										🗑️
									</button>
								{/if}
							</div>
						</div>
						<div class="text-theme-text-primary">
							{@html parseReferences(mem.content)}
						</div>
						{#if mem.location || mem.involved?.length}
							<div class="mt-2 flex flex-wrap gap-2">
								{#if mem.location}
									<span class="text-xs bg-theme-surface px-2 py-0.5 rounded">
										📍 {mem.location}
									</span>
								{/if}
								{#each mem.involved || [] as person}
									<span class="text-xs bg-theme-surface px-2 py-0.5 rounded">
										👤 {person}
									</span>
								{/each}
							</div>
						{/if}
						{#if mem.tags?.length}
							<div class="mt-2 flex flex-wrap gap-1">
								{#each mem.tags as tag}
									<span class="text-xs text-theme-primary-600">
										{tag}
									</span>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		{:else if activeTab === 'medium'}
			{#if mediumTermCount === 0}
				<div class="text-center py-8 text-theme-text-secondary">
					Keine Mittelzeiterinnerungen (1 Woche - 3 Monate)
				</div>
			{:else}
				{#each memory.medium_term_memory as mem}
					<div class="p-4 bg-theme-elevated rounded-lg hover:bg-theme-surface transition-colors">
						<div class="flex justify-between items-start mb-2">
							<span class="text-xs text-theme-text-secondary">
								{formatTimestamp(mem.timestamp)}
							</span>
							<div class="flex items-center space-x-2">
								<span class="{getImportanceColor(mem.importance)} text-xs">
									⭐ {mem.importance}/10
								</span>
								{#if editable}
									<button
										onclick={() => deleteMemory(mem.id)}
										class="text-theme-error hover:text-theme-error/80 text-xs"
									>
										🗑️
									</button>
								{/if}
							</div>
						</div>
						<div class="text-theme-text-primary">
							{@html parseReferences(mem.content)}
						</div>
						{#if mem.context}
							<div class="mt-2 text-xs text-theme-text-secondary italic">
								Kontext: {mem.context}
							</div>
						{/if}
						{#if mem.original_details}
							<details class="mt-2">
								<summary class="text-xs text-theme-primary-600 cursor-pointer">
									Details anzeigen
								</summary>
								<div class="mt-1 text-sm text-theme-text-secondary">
									{mem.original_details}
								</div>
							</details>
						{/if}
					</div>
				{/each}
			{/if}
		{:else if activeTab === 'long'}
			{#if longTermCount === 0}
				<div class="text-center py-8 text-theme-text-secondary">
					Keine Langzeiterinnerungen (permanent)
				</div>
			{:else}
				{#each memory.long_term_memory as mem}
					<div
						class="p-4 bg-theme-elevated rounded-lg hover:bg-theme-surface transition-colors border-l-4 {mem.category ===
						'trauma'
							? 'border-theme-error'
							: mem.category === 'triumph'
								? 'border-theme-success'
								: 'border-theme-primary-600'}"
					>
						<div class="flex justify-between items-start mb-2">
							<div class="flex items-center space-x-2">
								<span class="text-lg">
									{getCategoryEmoji(mem.category)}
								</span>
								<span class="text-xs text-theme-text-secondary">
									{formatTimestamp(mem.timestamp)}
								</span>
							</div>
							<div class="flex items-center space-x-2">
								<span class="{getImportanceColor(mem.emotional_weight)} text-xs">
									💪 {mem.emotional_weight}/10
								</span>
								{#if editable && !mem.immutable}
									<button
										onclick={() => deleteMemory(mem.id)}
										class="text-theme-error hover:text-theme-error/80 text-xs"
									>
										🗑️
									</button>
								{/if}
							</div>
						</div>
						<div class="text-theme-text-primary font-medium">
							{@html parseReferences(mem.content)}
						</div>
						{#if mem.effects}
							<div class="mt-2 text-sm text-theme-warning">
								Auswirkung: {mem.effects}
							</div>
						{/if}
						{#if mem.triggers?.length}
							<div class="mt-2 flex flex-wrap gap-1">
								{#each mem.triggers as trigger}
									<span class="text-xs bg-theme-error/10 text-theme-error px-2 py-0.5 rounded">
										⚡ {trigger}
									</span>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		{/if}
	</div>

	<!-- Memory Traits -->
	{#if memory?.memory_traits}
		<div class="mt-6 p-4 bg-theme-elevated rounded-lg">
			<h4 class="text-sm font-medium text-theme-text-primary mb-2">Gedächtniseigenschaften</h4>
			<div class="space-y-1 text-xs text-theme-text-secondary">
				<div>Qualität: {memory.memory_traits.memory_quality}</div>
				{#if memory.memory_traits.trauma_filter}
					<div>⚠️ Trauma-Filter aktiv</div>
				{/if}
				{#if memory.memory_traits.selective_memory?.length}
					<div>Selektiv: {memory.memory_traits.selective_memory.join(', ')}</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
