<script lang="ts">
	import type { Template, AIModel } from '@chat/types';
	import { chatService } from '$lib/services/chat';
	import { onMount } from 'svelte';

	interface Props {
		template?: Template;
		onSubmit: (data: Partial<Template>) => void;
		onCancel: () => void;
	}

	let { template, onSubmit, onCancel }: Props = $props();

	// Available colors
	const TEMPLATE_COLORS = [
		'#0A84FF', // Blue
		'#32D74B', // Green
		'#FF375F', // Red
		'#FF9F0A', // Orange
		'#5E5CE6', // Purple
		'#BF5AF2', // Pink
		'#64D2FF', // Light Blue
		'#30D158', // Green 2
		'#FF453A', // Red 2
	];

	// Form state
	let name = $state(template?.name ?? '');
	let description = $state(template?.description ?? '');
	let systemPrompt = $state(template?.systemPrompt ?? '');
	let initialQuestion = $state(template?.initialQuestion ?? '');
	let selectedColor = $state(template?.color ?? TEMPLATE_COLORS[0]);
	let selectedModelId = $state(template?.modelId ?? '');
	let documentMode = $state(template?.documentMode ?? false);

	// Models
	let models = $state<AIModel[]>([]);

	// Validation
	let errors = $state<{ name?: string; systemPrompt?: string }>({});

	const isEditMode = !!template?.id;

	onMount(async () => {
		models = await chatService.getModels();
	});

	function validateForm(): boolean {
		const newErrors: { name?: string; systemPrompt?: string } = {};

		if (!name.trim()) {
			newErrors.name = 'Bitte gib einen Namen ein.';
		}

		if (!systemPrompt.trim()) {
			newErrors.systemPrompt = 'Der System-Prompt darf nicht leer sein.';
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	function handleSubmit() {
		if (!validateForm()) return;

		onSubmit({
			id: template?.id,
			name,
			description: description.trim() || undefined,
			systemPrompt: systemPrompt,
			initialQuestion: initialQuestion.trim() || undefined,
			color: selectedColor,
			modelId: selectedModelId || undefined,
			documentMode: documentMode,
		});
	}
</script>

<div class="bg-surface p-6 rounded-xl max-w-2xl mx-auto">
	<h2 class="text-xl font-bold text-foreground mb-6">
		{isEditMode ? 'Vorlage bearbeiten' : 'Neue Vorlage erstellen'}
	</h2>

	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
		class="space-y-5"
	>
		<!-- Name -->
		<div>
			<label for="name" class="block text-sm font-medium text-foreground mb-1"> Name * </label>
			<input
				type="text"
				id="name"
				bind:value={name}
				maxlength={50}
				placeholder="Name der Vorlage"
				class="w-full px-3 py-2 border rounded-lg bg-muted
               text-foreground placeholder-muted-foreground
               {errors.name ? 'border-destructive' : 'border-border'}
               focus:ring-2 focus:ring-primary focus:border-transparent"
			/>
			{#if errors.name}
				<p class="mt-1 text-sm text-destructive">{errors.name}</p>
			{/if}
		</div>

		<!-- Description -->
		<div>
			<label for="description" class="block text-sm font-medium text-foreground mb-1">
				Beschreibung (optional)
			</label>
			<textarea
				id="description"
				bind:value={description}
				maxlength={200}
				rows={2}
				placeholder="Kurze Beschreibung dieser Vorlage"
				class="w-full px-3 py-2 border border-border rounded-lg
               bg-muted text-foreground placeholder-muted-foreground
               focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
			></textarea>
		</div>

		<!-- System Prompt -->
		<div>
			<label for="systemPrompt" class="block text-sm font-medium text-foreground mb-1">
				System-Prompt *
			</label>
			<textarea
				id="systemPrompt"
				bind:value={systemPrompt}
				rows={5}
				placeholder="System-Prompt für die KI"
				class="w-full px-3 py-2 border rounded-lg bg-muted
               text-foreground placeholder-muted-foreground
               {errors.systemPrompt ? 'border-destructive' : 'border-border'}
               focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
			></textarea>
			{#if errors.systemPrompt}
				<p class="mt-1 text-sm text-destructive">{errors.systemPrompt}</p>
			{:else}
				<p class="mt-1 text-xs text-muted-foreground">
					Der System-Prompt definiert die Rolle und das Verhalten der KI.
				</p>
			{/if}
		</div>

		<!-- Initial Question -->
		<div>
			<label for="initialQuestion" class="block text-sm font-medium text-foreground mb-1">
				Beispielfrage (optional)
			</label>
			<textarea
				id="initialQuestion"
				bind:value={initialQuestion}
				rows={2}
				placeholder="Beispiel für eine passende Frage oder Anweisung"
				class="w-full px-3 py-2 border border-border rounded-lg
               bg-muted text-foreground placeholder-muted-foreground
               focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
			></textarea>
			<p class="mt-1 text-xs text-muted-foreground">
				Diese Frage wird als Vorschlag angezeigt, wenn die Vorlage ausgewählt wird.
			</p>
		</div>

		<!-- Color -->
		<div>
			<span class="block text-sm font-medium text-foreground mb-2" id="color-label">Farbe</span>
			<div class="flex flex-wrap gap-2" role="group" aria-labelledby="color-label">
				{#each TEMPLATE_COLORS as color}
					<button
						type="button"
						onclick={() => (selectedColor = color)}
						class="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110
                   {selectedColor === color
							? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white'
							: ''}"
						style="background-color: {color}"
						aria-label="Farbe {color}"
					>
						{#if selectedColor === color}
							<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<!-- Model -->
		<div>
			<label for="model" class="block text-sm font-medium text-foreground mb-1">
				Bevorzugtes Modell (optional)
			</label>
			<select
				id="model"
				bind:value={selectedModelId}
				class="w-full px-3 py-2 border border-border rounded-lg
               bg-muted text-foreground
               focus:ring-2 focus:ring-primary focus:border-transparent"
			>
				<option value="">Kein Modell ausgewählt</option>
				{#each models as model}
					<option value={model.id}>{model.name}</option>
				{/each}
			</select>
			<p class="mt-1 text-xs text-muted-foreground">
				Falls ausgewählt, wird dieses Modell automatisch mit der Vorlage verwendet.
			</p>
		</div>

		<!-- Document Mode -->
		<div>
			<button
				type="button"
				onclick={() => (documentMode = !documentMode)}
				class="w-full flex items-center justify-between p-4 border rounded-lg transition-colors
               {documentMode ? 'border-primary bg-primary/10' : 'border-border bg-muted'}"
			>
				<div class="text-left">
					<p class="font-medium text-foreground">Dokumentmodus aktivieren</p>
					<p class="text-xs text-muted-foreground mt-0.5">
						Ermöglicht die Bearbeitung eines Dokuments während der Konversation
					</p>
				</div>
				<div
					class="w-6 h-6 rounded-full flex items-center justify-center
                 {documentMode ? 'bg-primary' : 'bg-muted-foreground'}"
				>
					{#if documentMode}
						<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					{:else}
						<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					{/if}
				</div>
			</button>
		</div>

		<!-- Buttons -->
		<div class="flex gap-3 pt-4">
			<button
				type="button"
				onclick={onCancel}
				class="flex-1 px-4 py-2.5 border border-border text-foreground
               rounded-lg font-medium hover:bg-muted transition-colors"
			>
				Abbrechen
			</button>
			<button
				type="submit"
				class="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium
               hover:bg-primary/90 transition-colors"
			>
				{isEditMode ? 'Speichern' : 'Erstellen'}
			</button>
		</div>
	</form>
</div>
