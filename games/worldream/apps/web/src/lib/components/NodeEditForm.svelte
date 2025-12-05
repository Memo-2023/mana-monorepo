<script lang="ts">
	import type { ContentNode, NodeKind } from '$lib/types/content';
	import { goto } from '$app/navigation';
	import AiImageGenerator from './AiImageGenerator.svelte';
	import CollapsibleOptions from './CollapsibleOptions.svelte';

	interface Props {
		node: ContentNode;
		onSave: (updatedNode: Partial<ContentNode>) => Promise<void>;
		onCancel: () => void;
		worldSlug?: string;
	}

	let { node, onSave, onCancel, worldSlug }: Props = $props();

	// Basic fields
	let title = $state(node.title);
	let slug = $state(node.slug);
	let summary = $state(node.summary || '');
	let visibility = $state(node.visibility);
	let tags = $state(node.tags.join(', '));
	let imageUrl = $state(node.image_url);

	// Content fields based on node type
	let contentFields = $state<Record<string, any>>({});

	let loading = $state(false);
	let error = $state<string | null>(null);

	// Initialize content fields based on node kind
	$effect(() => {
		const content = node.content || {};

		switch (node.kind) {
			case 'world':
				contentFields = {
					appearance: content.appearance || '',
					lore: content.lore || '',
					canon_facts_text: content.canon_facts_text || '',
					glossary_text: content.glossary_text || '',
					constraints: content.constraints || '',
					timeline_text: content.timeline_text || '',
					prompt_guidelines: content.prompt_guidelines || '',
				};
				break;

			case 'character':
				contentFields = {
					appearance: content.appearance || '',
					lore: content.lore || '',
					voice_style: content.voice_style || '',
					capabilities: content.capabilities || '',
					constraints: content.constraints || '',
					motivations: content.motivations || '',
					secrets: content.secrets || '',
					relationships_text: content.relationships_text || '',
					inventory_text: content.inventory_text || '',
					timeline_text: content.timeline_text || '',
					state_text: content.state_text || '',
				};
				break;

			case 'place':
				contentFields = {
					appearance: content.appearance || '',
					lore: content.lore || '',
					capabilities: content.capabilities || '',
					constraints: content.constraints || '',
					state_text: content.state_text || '',
					secrets: content.secrets || '',
				};
				break;

			case 'object':
				contentFields = {
					appearance: content.appearance || '',
					lore: content.lore || '',
					capabilities: content.capabilities || '',
					constraints: content.constraints || '',
					state_text: content.state_text || '',
				};
				break;

			case 'story':
				contentFields = {
					lore: content.lore || '',
					references: content.references || '',
					prompt_guidelines: content.prompt_guidelines || '',
				};
				break;
		}
	});

	function generateSlug() {
		if (title && slug === node.slug) {
			slug = title
				.toLowerCase()
				.replace(/[äöü]/g, (char) => ({ ä: 'ae', ö: 'oe', ü: 'ue' })[char] || char)
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '');
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!title || !slug) {
			error = 'Bitte füllen Sie alle Pflichtfelder aus';
			return;
		}

		loading = true;
		error = null;

		try {
			const updatedNode: Partial<ContentNode> = {
				title,
				slug,
				summary,
				visibility,
				tags: tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
				content: contentFields,
				image_url: imageUrl,
			};

			await onSave(updatedNode);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
		} finally {
			loading = false;
		}
	}

	// Get field configuration based on node kind
	function getFieldConfig() {
		const kindNames = {
			world: 'Welt',
			character: 'Charakter',
			place: 'Ort',
			object: 'Objekt',
			story: 'Story',
		};

		return {
			title: kindNames[node.kind] || 'Node',
			fields: getFieldsForKind(node.kind),
		};
	}

	function getFieldsForKind(kind: NodeKind) {
		const commonFields = [
			{ key: 'appearance', label: 'Erscheinungsbild', rows: 3 },
			{ key: 'lore', label: 'Geschichte & Bedeutung', rows: 4 },
		];

		switch (kind) {
			case 'world':
				return [
					...commonFields,
					{ key: 'canon_facts_text', label: 'Kanon-Fakten', rows: 3 },
					{ key: 'glossary_text', label: 'Glossar', rows: 3 },
					{ key: 'constraints', label: 'Regeln & Einschränkungen', rows: 3 },
					{ key: 'timeline_text', label: 'Zeitlinie', rows: 3 },
					{ key: 'prompt_guidelines', label: 'KI-Richtlinien', rows: 3, optional: true },
				];

			case 'character':
				return [
					...commonFields,
					{ key: 'voice_style', label: 'Stimme & Sprache', rows: 2 },
					{ key: 'capabilities', label: 'Fähigkeiten', rows: 3 },
					{ key: 'constraints', label: 'Einschränkungen', rows: 3 },
					{ key: 'motivations', label: 'Motivationen', rows: 3 },
					{ key: 'relationships_text', label: 'Beziehungen', rows: 3, optional: true },
					{ key: 'inventory_text', label: 'Inventar', rows: 3, optional: true },
					{ key: 'timeline_text', label: 'Zeitlinie', rows: 3, optional: true },
					{ key: 'secrets', label: 'Geheimnisse', rows: 2, optional: true },
					{ key: 'state_text', label: 'Aktueller Zustand', rows: 2, optional: true },
				];

			case 'place':
				return [
					...commonFields,
					{ key: 'capabilities', label: 'Was ist hier möglich?', rows: 3 },
					{ key: 'constraints', label: 'Gefahren & Einschränkungen', rows: 3 },
					{ key: 'state_text', label: 'Aktueller Zustand', rows: 2, optional: true },
					{ key: 'secrets', label: 'Verborgene Aspekte', rows: 2, optional: true },
				];

			case 'object':
				return [
					{ key: 'appearance', label: 'Aussehen & Material', rows: 3 },
					{ key: 'lore', label: 'Herkunft & Geschichte', rows: 4 },
					{ key: 'capabilities', label: 'Eigenschaften & Fähigkeiten', rows: 3 },
					{ key: 'constraints', label: 'Einschränkungen & Nachteile', rows: 3 },
					{ key: 'state_text', label: 'Aktueller Zustand & Besitzer', rows: 2, optional: true },
				];

			case 'story':
				return [
					{ key: 'lore', label: 'Story-Verlauf / Plot', rows: 6 },
					{ key: 'references', label: 'Referenzen', rows: 3, optional: true },
					{ key: 'prompt_guidelines', label: 'LLM-Richtlinien', rows: 3, optional: true },
				];

			default:
				return commonFields;
		}
	}

	const config = getFieldConfig();
	const fields = config.fields;
	const optionalFields = fields.filter((f) => f.optional);
	const requiredFields = fields.filter((f) => !f.optional);

	let hasOptionalContent = $derived(
		optionalFields.some((field) => contentFields[field.key]?.trim())
	);
</script>

<div class="mx-auto max-w-4xl">
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-theme-text-primary">{config.title} bearbeiten</h1>
		<p class="mt-1 text-sm text-theme-text-secondary">
			Bearbeite die Details für "{node.title}"
		</p>
	</div>

	{#if error}
		<div class="mb-4 rounded-md bg-red-50/50 p-4">
			<p class="text-sm text-theme-error">{error}</p>
		</div>
	{/if}

	<form onsubmit={handleSubmit} class="space-y-6 rounded-lg bg-theme-surface p-6 shadow">
		<!-- Basic Information -->
		<div>
			<h2 class="mb-4 text-lg font-medium text-theme-text-primary">Grundinformationen</h2>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label for="title" class="block text-sm font-medium text-theme-text-primary">Name *</label
					>
					<input
						type="text"
						id="title"
						bind:value={title}
						onblur={generateSlug}
						required
						class="border-theme-border-default mt-1 block w-full rounded-md shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 dark:bg-slate-700 dark:text-zinc-100 sm:text-sm"
					/>
				</div>

				<div>
					<label for="slug" class="block text-sm font-medium text-theme-text-primary">Slug *</label>
					<input
						type="text"
						id="slug"
						bind:value={slug}
						required
						pattern="[a-z0-9\-]+"
						class="border-theme-border-default mt-1 block w-full rounded-md shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 dark:bg-slate-700 dark:text-zinc-100 sm:text-sm"
					/>
				</div>
			</div>

			<div class="mt-4">
				<label for="summary" class="block text-sm font-medium text-theme-text-primary"
					>Zusammenfassung</label
				>
				<textarea
					id="summary"
					bind:value={summary}
					rows="2"
					class="border-theme-border-default mt-1 block w-full rounded-md shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 dark:bg-slate-700 dark:text-zinc-100 sm:text-sm"
				></textarea>
			</div>

			<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label for="visibility" class="block text-sm font-medium text-theme-text-primary"
						>Sichtbarkeit</label
					>
					<select
						id="visibility"
						bind:value={visibility}
						class="border-theme-border-default mt-1 block w-full rounded-md shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 dark:bg-slate-700 dark:text-zinc-100 sm:text-sm"
					>
						<option value="private">Privat</option>
						<option value="shared">Geteilt</option>
						<option value="public">Öffentlich</option>
					</select>
				</div>

				<div>
					<label for="tags" class="block text-sm font-medium text-theme-text-primary"
						>Tags (kommagetrennt)</label
					>
					<input
						type="text"
						id="tags"
						bind:value={tags}
						class="border-theme-border-default mt-1 block w-full rounded-md shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 dark:bg-slate-700 dark:text-zinc-100 sm:text-sm"
					/>
				</div>
			</div>
		</div>

		<!-- Image Generation -->
		{#if node.kind !== 'story'}
			<div class="border-t pt-6">
				<h2 class="mb-4 text-lg font-medium text-theme-text-primary">Bild</h2>
				<AiImageGenerator bind:imageUrl prompt={`${title}: ${contentFields.appearance}`} />
			</div>
		{/if}

		<!-- Main Content Fields -->
		<div class="border-t pt-6">
			<h2 class="mb-4 text-lg font-medium text-theme-text-primary">Details</h2>

			<div class="space-y-4">
				{#each requiredFields as field}
					<div>
						<label for={field.key} class="block text-sm font-medium text-theme-text-primary"
							>{field.label}</label
						>
						<textarea
							id={field.key}
							bind:value={contentFields[field.key]}
							rows={field.rows}
							class="border-theme-border-default mt-1 block w-full rounded-md shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 dark:bg-slate-700 dark:text-zinc-100 sm:text-sm"
						></textarea>
					</div>
				{/each}
			</div>
		</div>

		<!-- Optional Fields -->
		{#if optionalFields.length > 0}
			<CollapsibleOptions title="Erweiterte Optionen" hasContent={hasOptionalContent}>
				{#snippet children()}
					{#each optionalFields as field}
						<div>
							<label for={field.key} class="block text-sm font-medium text-theme-text-primary"
								>{field.label}</label
							>
							<textarea
								id={field.key}
								bind:value={contentFields[field.key]}
								rows={field.rows}
								class="border-theme-border-default mt-1 block w-full rounded-md shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 dark:bg-slate-700 dark:text-zinc-100 sm:text-sm"
							></textarea>
							{#if field.key === 'inventory_text'}
								<p class="mt-1 text-xs text-theme-text-secondary">
									Verwende @objekt-slug um Objekte zu verlinken
								</p>
							{:else if field.key === 'state_text' && node.kind === 'object'}
								<p class="mt-1 text-xs text-theme-text-secondary">
									z.B. 'Im Besitz von @charakter-slug'
								</p>
							{/if}
						</div>
					{/each}
				{/snippet}
			</CollapsibleOptions>
		{/if}

		<!-- Actions -->
		<div class="flex justify-end space-x-3">
			<button
				type="button"
				onclick={onCancel}
				class="border-theme-border-default rounded-md border bg-white px-4 py-2 text-sm font-medium text-theme-text-primary shadow-sm hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600"
			>
				Abbrechen
			</button>
			<button
				type="submit"
				disabled={loading}
				class="rounded-md border border-transparent bg-theme-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-theme-primary-700 disabled:opacity-50"
			>
				{loading ? 'Speichere...' : 'Änderungen speichern'}
			</button>
		</div>
	</form>
</div>
