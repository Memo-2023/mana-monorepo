<script lang="ts">
	import type { NodeKind, PromptTemplate } from '$lib/types/content';
	import PromptTemplateSelector from './PromptTemplateSelector.svelte';
	import { currentWorld } from '$lib/stores/worldContext';
	import { loadingStore } from '$lib/stores/loadingStore';

	interface Props {
		kind: NodeKind;
		onGenerated: (data: any, prompt: string) => void;
		context?: any;
		selectedCharacters?: string[];
		selectedPlace?: string | null;
		placeholder?: string;
	}

	let { kind, onGenerated, context, selectedCharacters, selectedPlace, placeholder }: Props =
		$props();

	let prompt = $state('');
	let generating = $state(false);
	let error = $state<string | null>(null);
	let showSaveTemplateDialog = $state(false);
	let templateTitle = $state('');
	let templateDescription = $state('');

	const defaultPlaceholders: Record<NodeKind, string> = {
		character:
			'Z.B. "Ein weiser alter Magier mit einem dunklen Geheimnis" oder "Eine mutige Kriegerin aus dem Norden"',
		world:
			'Z.B. "Eine düstere Cyberpunk-Welt mit magischen Elementen" oder "Ein friedliches Königreich am Meer"',
		place:
			'Z.B. "Ein mysteriöser Wald, in dem die Zeit anders verläuft" oder "Eine schwimmende Stadt in den Wolken"',
		object:
			'Z.B. "Ein Amulett, das seinem Träger besondere Kräfte verleiht" oder "Ein verfluchtes Schwert"',
		story:
			'Z.B. "Eine Heldenreise, bei der ungleiche Gefährten zusammenfinden" oder "Ein Krimi in einer magischen Stadt"',
	};

	function handleTemplateSelect(template: PromptTemplate | null) {
		if (template) {
			let appliedPrompt = template.prompt_template;
			// Variablen ersetzen
			if ($currentWorld) {
				appliedPrompt = appliedPrompt.replace(/{world_name}/g, $currentWorld.title);
			}
			prompt = appliedPrompt;
		}
	}

	// Load character details for AI context
	let characterDetails = $state<any[]>([]);
	let placeDetails = $state<any | null>(null);

	async function loadCharacterDetails() {
		if (!selectedCharacters || selectedCharacters.length === 0) {
			characterDetails = [];
			return;
		}

		try {
			const details = await Promise.all(
				selectedCharacters.map(async (slug) => {
					const response = await fetch(`/api/nodes/${slug}`);
					if (response.ok) {
						return await response.json();
					}
					return null;
				})
			);
			characterDetails = details.filter(Boolean);
		} catch (err) {
			console.error('Failed to load character details:', err);
		}
	}

	async function loadPlaceDetails() {
		if (!selectedPlace) {
			placeDetails = null;
			return;
		}

		try {
			const response = await fetch(`/api/nodes/${selectedPlace}`);
			if (response.ok) {
				placeDetails = await response.json();
			}
		} catch (err) {
			console.error('Failed to load place details:', err);
		}
	}

	$effect(() => {
		loadCharacterDetails();
		loadPlaceDetails();
	});

	async function handleGenerate() {
		if (!prompt.trim() || generating) return;

		generating = true;
		error = null;

		// Start loading indicator für kompletten Prozess
		loadingStore.startCompleteCreation(kind);

		// Build enhanced context with character and place details
		// Bei Welt-Erstellung: Keinen worldData Context mitschicken!
		let enhancedContext =
			kind === 'world' ? { ...context, worldData: undefined, world: undefined } : { ...context };

		if (characterDetails.length > 0) {
			enhancedContext.selectedCharacters = characterDetails.map((char) => ({
				name: char.title,
				slug: char.slug,
				summary: char.summary,
				appearance: char.content?.appearance,
				voice_style: char.content?.voice_style,
				motivations: char.content?.motivations,
				capabilities: char.content?.capabilities,
			}));
		}
		if (placeDetails) {
			enhancedContext.selectedPlace = {
				name: placeDetails.title,
				slug: placeDetails.slug,
				summary: placeDetails.summary,
				appearance: placeDetails.content?.appearance,
				capabilities: placeDetails.content?.capabilities,
				constraints: placeDetails.content?.constraints,
				secrets: placeDetails.content?.secrets,
			};
		}

		try {
			const response = await fetch('/api/ai/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					kind,
					prompt,
					context: enhancedContext,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Generierung fehlgeschlagen');
			}

			const result = await response.json();

			// Wechsel zum nächsten Schritt (Erstellen)
			loadingStore.nextStep('KI-Generierung abgeschlossen');

			onGenerated(result, prompt); // Prompt mitgeben für Speicherung
			prompt = '';

			// Loading wird in NodeForm fortgesetzt
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
			loadingStore.setError(error || 'Generierung fehlgeschlagen');
		} finally {
			generating = false;
		}
	}

	async function saveAsTemplate() {
		if (!templateTitle.trim() || !prompt.trim()) return;

		try {
			const response = await fetch('/api/prompt-templates', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					kind,
					title: templateTitle,
					prompt_template: prompt,
					description: templateDescription,
					world_slug: $currentWorld?.slug,
					is_public: false,
				}),
			});

			if (response.ok) {
				showSaveTemplateDialog = false;
				templateTitle = '';
				templateDescription = '';
			}
		} catch (err) {
			console.error('Failed to save template:', err);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleGenerate();
		}
	}
</script>

<div class="space-y-4">
	<!-- Template Selector with Save Button -->
	<div class="flex items-end gap-3">
		<div class="flex-1">
			<PromptTemplateSelector {kind} onSelect={handleTemplateSelect} />
		</div>
		<button
			type="button"
			onclick={() => (showSaveTemplateDialog = true)}
			disabled={!prompt.trim()}
			class="border-theme-border-default rounded border bg-theme-surface px-3 py-1.5 text-sm font-medium text-theme-text-primary transition-colors hover:bg-theme-interactive-hover focus:outline-none focus:ring-2 focus:ring-theme-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
			title="Aktuellen Prompt als Vorlage speichern"
		>
			Als Vorlage speichern
		</button>
	</div>

	<!-- Prompt Input -->
	<div class="relative">
		<label for="ai-prompt" class="mb-2 block text-sm font-medium text-theme-text-primary">
			<span class="inline-flex items-center">
				<svg
					class="mr-1.5 h-4 w-4 text-theme-primary-600"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 10V3L4 14h7v7l9-11h-7z"
					/>
				</svg>
				KI-Prompt
			</span>
		</label>
		<div class="relative">
			<textarea
				id="ai-prompt"
				bind:value={prompt}
				onkeydown={handleKeydown}
				disabled={generating}
				rows="3"
				placeholder={placeholder || defaultPlaceholders[kind]}
				class="block w-full resize-none rounded border border-theme-border-default bg-theme-surface pr-20 text-sm text-theme-text-primary shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 disabled:opacity-50"
			></textarea>
			<button
				type="button"
				onclick={handleGenerate}
				disabled={generating || !prompt.trim()}
				class="absolute bottom-1.5 right-1.5 inline-flex items-center rounded px-3 py-1.5 text-sm font-medium text-white {generating
					? 'bg-orange-600'
					: 'bg-theme-primary-600 hover:bg-theme-primary-700'} transition-colors focus:outline-none focus:ring-2 focus:ring-theme-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{generating ? 'Generiert...' : 'Generieren'}
			</button>
		</div>
		<p class="mt-2 text-xs text-theme-text-secondary">
			Beschreibe was du erstellen möchtest und drücke Enter oder klicke auf Generieren.
		</p>
	</div>

	{#if error}
		<div class="flex items-center rounded border border-theme-error bg-theme-error/10 p-2">
			<svg class="mr-1 h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
					clip-rule="evenodd"
				/>
			</svg>
			<p class="text-sm text-red-800 dark:text-red-400">{error}</p>
		</div>
	{/if}

	{#if showSaveTemplateDialog}
		<div class="border-theme-border-default rounded border bg-theme-surface p-4 shadow-sm">
			<h4 class="mb-3 text-sm font-medium text-theme-text-primary">Prompt als Vorlage speichern</h4>
			<div class="space-y-3">
				<div>
					<label
						for="template-title"
						class="mb-1 block text-xs font-medium text-theme-text-primary"
					>
						Name der Vorlage *
					</label>
					<input
						id="template-title"
						type="text"
						bind:value={templateTitle}
						placeholder="z.B. Cyberpunk-Welt mit Magie"
						class="block w-full rounded border border-theme-border-default bg-theme-surface text-sm text-theme-text-primary shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500"
					/>
				</div>
				<div>
					<label for="template-desc" class="mb-1 block text-xs font-medium text-theme-text-primary">
						Beschreibung (optional)
					</label>
					<textarea
						id="template-desc"
						bind:value={templateDescription}
						placeholder="Wofür ist diese Vorlage gedacht?"
						rows="2"
						class="block w-full resize-none rounded border border-theme-border-default bg-theme-surface text-sm text-theme-text-primary shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500"
					></textarea>
				</div>
				<div>
					<label class="mb-1 block text-xs font-medium text-theme-text-primary">
						Zu speichernder Prompt:
					</label>
					<div
						class="rounded border border-theme-border-subtle bg-theme-surface p-2 text-sm text-theme-text-secondary"
					>
						{prompt}
					</div>
				</div>
				<div class="flex justify-end space-x-2 pt-2">
					<button
						type="button"
						onclick={() => {
							showSaveTemplateDialog = false;
							templateTitle = '';
							templateDescription = '';
						}}
						class="border-theme-border-default rounded border bg-theme-surface px-3 py-1.5 text-sm font-medium text-theme-text-primary transition-colors hover:bg-theme-interactive-hover"
					>
						Abbrechen
					</button>
					<button
						type="button"
						onclick={saveAsTemplate}
						disabled={!templateTitle.trim()}
						class="rounded bg-theme-primary-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-theme-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Speichern
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
