<script lang="ts">
	import type { PromptTemplate, NodeKind } from '$lib/types/content';
	import { currentWorld } from '$lib/stores/worldContext';

	let {
		kind,
		onSelect,
		class: className = '',
	}: {
		kind: NodeKind;
		onSelect: (template: PromptTemplate | null) => void;
		class?: string;
	} = $props();

	let templates = $state<PromptTemplate[]>([]);
	let loading = $state(true);
	let selectedTemplateId = $state<string>('');

	async function loadTemplates() {
		try {
			// Lade eigene und öffentliche Templates
			const response = await fetch(`/api/prompt-templates?kind=${kind}`);
			if (response.ok) {
				templates = await response.json();
			}
		} catch (err) {
			console.error('Failed to load templates:', err);
		} finally {
			loading = false;
		}
	}

	function handleSelection(e: Event) {
		const select = e.target as HTMLSelectElement;
		const template = templates.find((t) => t.id === select.value);
		onSelect(template || null);
	}

	function applyVariables(template: string): string {
		let result = template;
		if ($currentWorld) {
			result = result.replace(/{world_name}/g, $currentWorld.title);
		}
		return result;
	}

	$effect(() => {
		loadTemplates();
	});
</script>

<div class="prompt-template-selector {className}">
	<label for="template-select" class="mb-1 block text-sm font-medium text-theme-text-primary">
		Prompt-Vorlage (optional)
	</label>

	<select
		id="template-select"
		bind:value={selectedTemplateId}
		onchange={handleSelection}
		disabled={loading}
		class="w-full rounded-md border border-theme-border-default bg-theme-surface text-theme-text-primary shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
	>
		<option value="">-- Keine Vorlage --</option>

		{#if loading}
			<option disabled>Lade Vorlagen...</option>
		{:else}
			<optgroup label="Meine Vorlagen">
				{#each templates.filter((t) => t.owner_id) as template}
					<option value={template.id}>
						{template.title}
						{#if template.usage_count > 0}
							({template.usage_count}x verwendet)
						{/if}
					</option>
				{/each}
			</optgroup>

			<optgroup label="Community-Vorlagen">
				{#each templates.filter((t) => t.is_public && !t.owner_id) as template}
					<option value={template.id}>
						{template.title}
						{#if template.usage_count > 0}
							({template.usage_count}x verwendet)
						{/if}
					</option>
				{/each}
			</optgroup>
		{/if}
	</select>
</div>
