<script lang="ts">
	import type { ContentNode, NodeKind } from '$lib/types/content';
	import type { CreateNodeRequest, UpdateNodeRequest } from '$lib/services/nodeService';
	import type { CustomFieldSchema, CustomFieldData } from '$lib/types/customFields';
	import { NodeService } from '$lib/services/nodeService';
	import AiPromptField from '$lib/components/AiPromptField.svelte';
	import AiImageGenerator from '$lib/components/AiImageGenerator.svelte';
	import CollapsibleOptions from '$lib/components/CollapsibleOptions.svelte';
	import CharacterSelector from '$lib/components/CharacterSelector.svelte';
	import PlaceSelector from '$lib/components/PlaceSelector.svelte';
	import CustomFieldsManager from '$lib/components/customFields/CustomFieldsManager.svelte';
	import { currentWorld } from '$lib/stores/worldContext';
	import { loadingStore } from '$lib/stores/loadingStore';

	interface Props {
		mode: 'create' | 'edit';
		kind: NodeKind;
		initialData?: Partial<ContentNode>;
		worldSlug?: string;
		worldTitle?: string;
		onSubmit: (data: ContentNode) => Promise<void>;
		onCancel: () => void;
	}

	let { mode, kind, initialData = {}, worldSlug, worldTitle, onSubmit, onCancel }: Props = $props();

	// Basic fields
	let title = $state(initialData.title || '');
	let slug = $state(initialData.slug || '');
	let summary = $state(initialData.summary || '');
	let visibility = $state(initialData.visibility || 'private');
	let tags = $state(initialData.tags?.join(', ') || '');
	let imageUrl = $state(initialData.image_url || null);
	let generationPrompt = $state<string | null>(null);
	let generationContext = $state<any | null>(null);

	// Content fields based on node type
	let contentFields = $state<Record<string, any>>({});

	// Custom fields
	let customSchema = $state<CustomFieldSchema | undefined>(initialData.custom_schema);
	let customData = $state<CustomFieldData>(initialData.custom_data || {});

	// Story Builder fields (only for stories)
	let selectedCharacters = $state<string[]>([]);
	let selectedPlace = $state<string | null>(null);
	let objectsInput = $state('');
	let suggestions = $state<{ characters: string[]; places: string[]; objects: string[] }>({
		characters: [],
		places: [],
		objects: [],
	});

	let loading = $state(false);
	let error = $state<string | null>(null);
	let showFormSections = $state(mode === 'edit');
	let autoCreating = $state(false); // Neuer State für automatische Erstellung

	// Initialize content fields based on node kind
	$effect(() => {
		const content = initialData.content || {};

		switch (kind) {
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

	// Auto-generate slug when title changes
	function generateSlug() {
		if (title && (mode === 'create' || slug === initialData.slug)) {
			slug = NodeService.generateSlug(title);
		}
	}

	// Handle AI generation
	async function handleAiGenerated(generated: any, prompt: string) {
		title = generated.title;
		summary = generated.summary;
		tags = generated.tags.join(', ');
		generationPrompt = prompt;
		generationContext = generated.generationContext;

		// Apply generated content
		Object.keys(generated.content).forEach((key) => {
			if (contentFields.hasOwnProperty(key)) {
				contentFields[key] = generated.content[key];
			}
		});

		generateSlug();
		showFormSections = true;

		// Automatisch erstellen nach AI-Generierung
		if (mode === 'create') {
			autoCreating = true;
			// Kurze Verzögerung damit UI aktualisiert wird
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Direkt submitten
			await handleSubmitDirect();
			autoCreating = false;
		}
	}

	// Neue Funktion für direktes Submit ohne Event
	async function handleSubmitDirect() {
		if (!title || !slug) {
			error = 'Bitte füllen Sie alle Pflichtfelder aus';
			return;
		}

		loading = true;
		error = null;

		try {
			// For stories, merge Story Builder references if no manual references provided
			let finalContentFields = { ...contentFields };
			if (kind === 'story' && !contentFields.references?.trim()) {
				finalContentFields.references = buildReferences();
			}

			const createData: CreateNodeRequest = {
				kind,
				slug,
				title,
				summary,
				visibility,
				world_slug: worldSlug,
				tags: tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
				content: finalContentFields,
				generation_prompt: generationPrompt || undefined,
				generation_model: generationPrompt ? 'gpt-5-mini' : undefined,
				generation_date: generationPrompt ? new Date().toISOString() : undefined,
				generation_context: generationContext || undefined,
			};

			const created = await NodeService.create(createData);

			// Nächster Schritt: Bild generieren
			loadingStore.nextStep('Node erfolgreich erstellt');

			// Nach Erstellung: Bild automatisch generieren
			if (created && (kind !== 'story' || contentFields.lore)) {
				// Bild-Generierung im Hintergrund starten
				await generateImageInBackground(created);
			}

			// Letzter Schritt: Fertigstellung
			loadingStore.nextStep('Bild wird generiert');
			loadingStore.complete('Erfolgreich erstellt!');

			await onSubmit(created);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
			loading = false;
		}
	}

	// Funktion für Hintergrund-Bildgenerierung
	async function generateImageInBackground(node: ContentNode) {
		try {
			// Bestimme den richtigen Prompt basierend auf Node-Typ
			let imagePrompt = '';
			if (kind === 'story') {
				imagePrompt = `${node.title}: ${contentFields.lore || ''}`;
			} else {
				imagePrompt = `${node.title}: ${contentFields.appearance || ''}`;
			}

			// Übersetze deutschen Text ins Englische
			console.log(`Generiere Bild für ${kind} mit Aspect Ratio:`, getAspectRatio(kind));
			const translateResponse = await fetch('/api/ai/translate-image-prompt', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					germanDescription: contentFields.appearance || contentFields.lore || '',
					kind,
					title: node.title,
					style: 'fantasy',
				}),
			});

			if (!translateResponse.ok) {
				console.error('Übersetzung für Bild fehlgeschlagen');
				return;
			}

			const translateData = await translateResponse.json();
			const englishPrompt = translateData.englishPrompt;

			// Generiere das Bild
			const imageResponse = await fetch('/api/ai/generate-image', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					kind,
					title: node.title,
					description: englishPrompt,
					style: 'fantasy',
					aspectRatio: getAspectRatio(kind),
					context: {
						appearance: englishPrompt,
					},
				}),
			});

			if (!imageResponse.ok) {
				console.error('Bildgenerierung fehlgeschlagen');
				return;
			}

			const imageData = await imageResponse.json();

			if (imageData.imageUrl) {
				// Update die Node mit der Bild-URL
				await NodeService.update(node.slug, {
					image_url: imageData.imageUrl,
				});
			}
		} catch (err) {
			console.error('Fehler bei Hintergrund-Bildgenerierung:', err);
		}
	}

	// Helper-Funktion für Aspect Ratio
	function getAspectRatio(kind: NodeKind): string {
		switch (kind) {
			case 'world':
			case 'place':
				return '21:9';
			case 'character':
				return '9:16';
			case 'object':
			default:
				return '1:1';
		}
	}

	// Check if any content exists
	let hasAnyContent = $derived(
		title ||
			summary ||
			tags ||
			Object.values(contentFields).some((value) => value?.trim()) ||
			(kind === 'story' && (selectedCharacters.length > 0 || selectedPlace || objectsInput))
	);

	// Check optional fields for collapsible section
	let hasOptionalContent = $derived(
		getFieldsForKind(kind)
			.filter((f) => 'optional' in f && f.optional)
			.some((field) => contentFields[field.key]?.trim())
	);

	// Auto-show form when AI generates content
	$effect(() => {
		if (hasAnyContent && !showFormSections && mode === 'create') {
			showFormSections = true;
		}
	});

	// Story Builder functions
	async function loadSuggestions() {
		if (kind !== 'story' || !worldSlug) return;

		try {
			const [charactersRes, placesRes, objectsRes] = await Promise.all([
				fetch(`/api/nodes?kind=character&world_slug=${worldSlug}`),
				fetch(`/api/nodes?kind=place&world_slug=${worldSlug}`),
				fetch(`/api/nodes?kind=object&world_slug=${worldSlug}`),
			]);

			if (charactersRes.ok) {
				const chars = await charactersRes.json();
				suggestions.characters = chars.map((c: any) => c.slug);
			}
			if (placesRes.ok) {
				const places = await placesRes.json();
				suggestions.places = places.map((p: any) => p.slug);
			}
			if (objectsRes.ok) {
				const objs = await objectsRes.json();
				suggestions.objects = objs.map((o: any) => o.slug);
			}
		} catch (err) {
			console.error('Failed to load suggestions:', err);
		}
	}

	function buildReferences(): string {
		if (kind !== 'story') return '';

		let refs = [];

		if (selectedCharacters.length > 0) {
			const cast = selectedCharacters.map((s) => `@${s}`).join(', ');
			refs.push(`cast: ${cast}`);
		}

		if (selectedPlace) {
			refs.push(`places: @${selectedPlace}`);
		}

		if (objectsInput.trim()) {
			const objects = objectsInput
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
				.map((s) => `@${s}`)
				.join(', ');
			refs.push(`objects: ${objects}`);
		}

		return refs.join('\n');
	}

	// Load suggestions for story builder
	$effect(() => {
		if (kind === 'story' && mode === 'create') {
			loadSuggestions();
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!title || !slug) {
			error = 'Bitte füllen Sie alle Pflichtfelder aus';
			return;
		}

		loading = true;
		error = null;

		try {
			// For stories, merge Story Builder references if no manual references provided
			let finalContentFields = { ...contentFields };
			if (kind === 'story' && !contentFields.references?.trim()) {
				finalContentFields.references = buildReferences();
			}

			if (mode === 'create') {
				const createData: CreateNodeRequest = {
					kind,
					slug,
					title,
					summary,
					visibility,
					world_slug: worldSlug,
					tags: tags
						.split(',')
						.map((t) => t.trim())
						.filter(Boolean),
					content: finalContentFields,
					custom_schema: customSchema,
					custom_data: customData,
					image_url: imageUrl || undefined,
					generation_prompt: generationPrompt || undefined,
					generation_model: generationPrompt ? 'gpt-5-mini' : undefined,
					generation_date: generationPrompt ? new Date().toISOString() : undefined,
					generation_context: generationContext || undefined,
				};

				const created = await NodeService.create(createData);
				await onSubmit(created);
			} else {
				const updateData: UpdateNodeRequest = {
					title,
					slug,
					summary,
					visibility,
					tags: tags
						.split(',')
						.map((t) => t.trim())
						.filter(Boolean),
					content: contentFields,
					custom_schema: customSchema,
					custom_data: customData,
					image_url: imageUrl || undefined,
				};

				const updated = await NodeService.update(initialData.slug!, updateData);
				await onSubmit(updated);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
		} finally {
			loading = false;
		}
	}

	// Get field configuration based on node kind
	function getKindConfig() {
		const kindNames = {
			world: 'Welt',
			character: 'Charakter',
			place: 'Ort',
			object: 'Objekt',
			story: 'Story',
		};

		return {
			title: kindNames[kind] || 'Node',
			fields: getFieldsForKind(kind),
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

	const config = getKindConfig();
	const fields = config.fields;
	const optionalFields = fields.filter((f) => 'optional' in f && f.optional);
	const requiredFields = fields.filter((f) => !('optional' in f) || !f.optional);
</script>

<div class="mx-auto max-w-4xl">
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-theme-text-primary">
			{mode === 'create' ? `Neuer ${config.title}` : `${config.title} bearbeiten`}
		</h1>
		<p class="mt-1 text-sm text-theme-text-secondary">
			{#if mode === 'create'}
				{#if worldTitle}
					Erstelle einen neuen {config.title.toLowerCase()} in
					<span class="font-semibold">{worldTitle}</span>
				{:else}
					Erstelle einen neuen {config.title.toLowerCase()}
				{/if}
			{:else}
				Bearbeite die Details für "{initialData.title}"
			{/if}
		</p>
	</div>

	{#if error}
		<div class="mb-4 rounded-md bg-theme-error/10 border border-theme-error/20 p-4">
			<p class="text-sm text-theme-error">{error}</p>
		</div>
	{/if}

	<form onsubmit={handleSubmit} class="space-y-6 rounded-lg bg-theme-surface p-6 shadow">
		<!-- Story Elements Selection (only for stories) -->
		{#if kind === 'story' && mode === 'create'}
			<div class="space-y-4">
				<CharacterSelector
					worldSlug={worldSlug || ''}
					{selectedCharacters}
					onSelectionChange={(selected) => (selectedCharacters = selected)}
				/>

				<PlaceSelector
					worldSlug={worldSlug || ''}
					{selectedPlace}
					onSelectionChange={(selected) => (selectedPlace = selected)}
				/>
			</div>
		{/if}

		<!-- AI Generation Field (only for create mode) -->
		{#if mode === 'create'}
			<div>
				<AiPromptField
					{kind}
					context={{ world: worldTitle, worldData: $currentWorld }}
					selectedCharacters={kind === 'story' ? selectedCharacters : undefined}
					selectedPlace={kind === 'story' ? selectedPlace : undefined}
					onGenerated={handleAiGenerated}
				/>
			</div>

			{#if !showFormSections}
				<div class="text-center">
					<button
						type="button"
						onclick={() => (showFormSections = true)}
						class="inline-flex items-center px-4 py-2 text-sm font-medium text-violet-600 hover:text-violet-500"
					>
						<svg class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6v6m0 0v6m0-6h6m-6 0H6"
							/>
						</svg>
						Mehr anzeigen
					</button>
				</div>
			{/if}
		{/if}

		{#if showFormSections}
			<!-- Basic Information -->
			<div class={mode === 'create' ? 'border-t pt-6' : ''}>
				<h2 class="mb-4 text-lg font-medium text-theme-text-primary">Grundinformationen</h2>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<label for="title" class="block text-sm font-medium text-theme-text-primary"
							>Name *</label
						>
						<input
							type="text"
							id="title"
							bind:value={title}
							onblur={generateSlug}
							required
							class="mt-1 block w-full rounded-md border border-theme-border-default bg-theme-surface text-theme-text-primary shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
						/>
					</div>

					<div>
						<label for="slug" class="block text-sm font-medium text-theme-text-primary"
							>Slug *</label
						>
						<input
							type="text"
							id="slug"
							bind:value={slug}
							required
							pattern="[a-z0-9\-]+"
							class="mt-1 block w-full rounded-md border border-theme-border-default bg-theme-surface text-theme-text-primary shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
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
						class="mt-1 block w-full rounded-md border border-theme-border-default bg-theme-surface text-theme-text-primary shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
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
							class="mt-1 block w-full rounded-md border border-theme-border-default bg-theme-surface text-theme-text-primary shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
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
							class="mt-1 block w-full rounded-md border border-theme-border-default bg-theme-surface text-theme-text-primary shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
						/>
					</div>
				</div>
			</div>

			<!-- Story Builder - Additional Elements (only for stories) -->
			{#if kind === 'story' && mode === 'create'}
				<div class="border-t pt-6">
					<h2 class="mb-4 text-lg font-medium text-theme-text-primary">Weitere Story-Elemente</h2>
					<p class="mb-4 text-sm text-theme-text-secondary">
						Ergänze deine Story mit Objekten aus dieser Welt.
					</p>

					<div class="space-y-4">
						<div>
							<label for="objects" class="block text-sm font-medium text-theme-text-primary">
								Objekte (kommagetrennt)
							</label>
							<input
								type="text"
								id="objects"
								bind:value={objectsInput}
								placeholder="magisches-amulett, altes-buch"
								class="mt-1 block w-full rounded-md border border-theme-border-default bg-theme-surface text-theme-text-primary shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
							/>
							{#if suggestions.objects.length > 0}
								<p class="mt-1 text-xs text-theme-text-secondary">
									Verfügbar: {suggestions.objects.slice(0, 5).join(', ')}{suggestions.objects
										.length > 5
										? '...'
										: ''}
								</p>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<!-- Image Generation -->
			{#if kind === 'story'}
				<div class="border-t pt-6">
					<h2 class="mb-4 text-lg font-medium text-theme-text-primary">Story-Bild</h2>
					<AiImageGenerator {kind} bind:imageUrl prompt={`${title}: ${contentFields.lore || ''}`} />
				</div>
			{:else}
				<div class="border-t pt-6">
					<h2 class="mb-4 text-lg font-medium text-theme-text-primary">Bild</h2>
					<AiImageGenerator {kind} bind:imageUrl prompt={`${title}: ${contentFields.appearance}`} />
				</div>
			{/if}

			<!-- Main Content Fields -->
			<div class="border-t pt-6">
				<h2 class="mb-4 text-lg font-medium text-theme-text-primary">
					{kind === 'story' ? 'Story-Inhalt' : 'Details'}
				</h2>

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
								class="mt-1 block w-full rounded-md border border-theme-border-default bg-theme-surface text-theme-text-primary shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
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
									class="mt-1 block w-full rounded-md border border-theme-border-default bg-theme-surface text-theme-text-primary shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
								></textarea>
								{#if field.key === 'inventory_text'}
									<p class="mt-1 text-xs text-theme-text-secondary">
										Verwende @objekt-slug um Objekte zu verlinken
									</p>
								{:else if field.key === 'state_text' && kind === 'object'}
									<p class="mt-1 text-xs text-theme-text-secondary">
										z.B. 'Im Besitz von @charakter-slug'
									</p>
								{:else if field.key === 'relationships_text'}
									<p class="mt-1 text-xs text-theme-text-secondary">
										Verwende @slug für Referenzen zu anderen Charakteren
									</p>
								{:else if field.key === 'references' && kind === 'story'}
									<p class="mt-1 text-xs text-theme-text-secondary">
										Leer lassen, um die Story Builder Auswahl zu verwenden
									</p>
								{/if}
							</div>
						{/each}
					{/snippet}
				</CollapsibleOptions>
			{/if}

			<!-- Custom Fields -->
			<div class="border-t pt-6">
				<h2 class="mb-4 text-lg font-medium text-theme-text-primary">Benutzerdefinierte Felder</h2>
				<CustomFieldsManager
					node={initialData as ContentNode}
					nodeSlug={initialData?.slug}
					nodeKind={kind}
					{worldSlug}
					onSchemaChange={(schema) => (customSchema = schema)}
					onDataChange={(data) => (customData = data)}
				/>
			</div>
		{/if}

		<!-- Actions -->
		<div class="flex justify-end space-x-3">
			<button
				type="button"
				onclick={onCancel}
				disabled={autoCreating}
				class="border-theme-border-default rounded-md border bg-theme-surface px-4 py-2 text-sm font-medium text-theme-text-primary shadow-sm hover:bg-theme-interactive-hover disabled:opacity-50"
			>
				Abbrechen
			</button>
			<button
				type="submit"
				disabled={loading || autoCreating}
				class="rounded-md border border-transparent bg-theme-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-theme-primary-700 disabled:opacity-50"
			>
				{autoCreating
					? 'Automatische Erstellung läuft...'
					: loading
						? mode === 'create'
							? 'Wird erstellt...'
							: 'Speichere...'
						: mode === 'create'
							? `${config.title} erstellen`
							: 'Änderungen speichern'}
			</button>
		</div>
	</form>
</div>
