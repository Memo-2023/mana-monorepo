<script lang="ts">
	import { aiAuthorStore } from '$lib/stores/aiAuthorStore';
	import AiImageGenerator from './AiImageGenerator.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { fly } from 'svelte/transition';
	import type { NodeKind } from '$lib/types/content';

	let command = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let success = $state<string | null>(null);
	let processingCommands = $state<Set<string>>(new Set());

	// Image generation state
	let imagePrompt = $state('');
	let imageUrl = $state<string | null>(null);
	let generatedPrompt = $state<string | null>(null);

	// Subscribe to store
	let aiState = $state({
		isVisible: false,
		currentNode: null as any,
		isOwner: false,
		mode: 'text' as 'text' | 'image',
		imageGenerationState: {
			loading: false,
			generatedUrl: null as string | null,
			prompt: '',
			style: 'fantasy' as any,
			error: null as string | null,
		},
	});

	let unsubscribe: (() => void) | null = null;

	onMount(() => {
		unsubscribe = aiAuthorStore.subscribe((state) => {
			console.log('🌟 GlobalAiAuthorBar: Store update', state);
			aiState = state;

			// Auto-populate image prompt from node appearance
			if (state.mode === 'image' && state.currentNode && !imagePrompt) {
				const node = state.currentNode;
				imagePrompt = node.content?.appearance || node.summary || '';
			}
		});
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	// Auto-hide success/error messages
	let successTimeout: ReturnType<typeof setTimeout>;
	let errorTimeout: ReturnType<typeof setTimeout>;

	function showSuccess(message: string) {
		success = message;
		clearTimeout(successTimeout);
		successTimeout = setTimeout(() => {
			success = null;
		}, 4000);
	}

	function showError(message: string) {
		error = message;
		clearTimeout(errorTimeout);
		errorTimeout = setTimeout(() => {
			error = null;
		}, 6000);
	}

	async function executeCommand() {
		const currentCommand = command.trim();
		if (!currentCommand || processingCommands.has(currentCommand) || !aiState.currentNode) return;

		// Add to processing queue
		processingCommands.add(currentCommand);
		processingCommands = new Set(processingCommands);

		// Clear input immediately for better UX
		command = '';
		loading = true;
		error = null;

		// Show processing feedback
		showSuccess(
			`🔄 Bearbeite: "${currentCommand.substring(0, 50)}${currentCommand.length > 50 ? '...' : ''}"`
		);

		try {
			const response = await fetch('/api/ai/edit-node', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					nodeSlug: aiState.currentNode.slug,
					command: currentCommand,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Fehler beim Bearbeiten');
			}

			if (data.success && data.updatedNode) {
				aiAuthorStore.updateNode(data.updatedNode);
				showSuccess(`✅ Erfolgreich bearbeitet: "${currentCommand.substring(0, 30)}..."`);

				// Dispatch custom event to notify components
				window.dispatchEvent(
					new CustomEvent('node-updated', {
						detail: { updatedNode: data.updatedNode },
					})
				);
			} else {
				throw new Error('Unexpected response format');
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten';
			showError(`❌ Fehler: ${errorMessage}`);
		} finally {
			// Remove from processing queue
			processingCommands.delete(currentCommand);
			processingCommands = new Set(processingCommands);
			loading = processingCommands.size > 0;
		}
	}

	async function handleImageGenerated(url: string) {
		imageUrl = url;
		aiAuthorStore.setImageState({ generatedUrl: url });
		await saveGeneratedImage();
	}

	async function saveGeneratedImage() {
		if (!imageUrl || !aiState.currentNode) return;

		loading = true;
		error = null;

		try {
			// Use the proper attachments-based endpoint to save image
			const response = await fetch(`/api/nodes/${aiState.currentNode.slug}/images`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					image_url: imageUrl,
					prompt: generatedPrompt || imagePrompt,
					is_primary: false,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Fehler beim Speichern des Bildes');
			}

			showSuccess('🖼️ Bild erfolgreich gespeichert!');

			// Reset image state
			imageUrl = null;
			generatedPrompt = null;
			aiAuthorStore.resetImageState();

			// Notify components to reload images
			window.dispatchEvent(
				new CustomEvent('images-updated', {
					detail: { nodeSlug: aiState.currentNode.slug },
				})
			);
		} catch (err) {
			showError(err instanceof Error ? err.message : 'Fehler beim Speichern');
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		// Only handle global shortcuts when author bar is focused
		if (e.target && (e.target as HTMLElement).closest('#global-ai-author-bar')) {
			if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				if (aiState.mode === 'text') {
					executeCommand();
				}
			}
		}

		// Global escape to close
		if (e.key === 'Escape' && aiState.isVisible) {
			aiAuthorStore.hide();
		}
	}

	function toggleVisibility() {
		aiAuthorStore.toggle();
		if (aiState.isVisible) {
			// Focus the textarea when shown
			setTimeout(() => {
				if (aiState.mode === 'text') {
					const textarea = document.querySelector(
						'#global-ai-command-input'
					) as HTMLTextAreaElement;
					textarea?.focus();
				}
			}, 100);
		}
	}

	function switchMode(mode: 'text' | 'image') {
		aiAuthorStore.setMode(mode);
		error = null;
		success = null;
	}

	// Command suggestions based on node type
	function getSuggestions() {
		if (!aiState.currentNode) return [];

		const suggestions = {
			character: [
				'Benenne um zu Maximilian der Große',
				'Füge zur Erscheinung hinzu: trägt einen roten Mantel',
				'Ändere die Fähigkeiten zu: Meister der Feuermagie',
				'Aktualisiere das Inventar: trägt @magisches-schwert',
			],
			place: [
				'Benenne um zu Die goldene Stadt',
				'Füge zur Geschichte hinzu: wurde vor 100 Jahren erbaut',
				'Ändere die Gefahren zu: wilde Kreaturen in der Nacht',
				'Aktualisiere den Zustand: jetzt in Ruinen',
			],
			object: [
				'Benenne um zu Schwert der Macht',
				'Füge zu den Fähigkeiten hinzu: kann Feinde blenden',
				'Ändere den Besitzer zu: gehört jetzt @aragorn',
				'Aktualisiere die Erscheinung: glänzt in blauem Licht',
			],
			world: [
				'Benenne um zu Reich der tausend Sonnen',
				'Füge zur Geschichte hinzu: geprägt von magischen Kriegen',
				'Aktualisiere die Regeln: Magie ist verboten',
				'Ändere die Zeitlinie: Das große Erwachen im Jahr 2157',
			],
			story: [
				'Benenne um zu Das letzte Abenteuer',
				'Füge zum Plot hinzu: die Helden treffen auf einen Drachen',
				'Ändere die Referenzen zu: @mira, @dunkler-turm, @zauberring',
				'Aktualisiere den Verlauf: endet mit einem Cliffhanger',
			],
		};
		return suggestions[aiState.currentNode.kind as NodeKind] || [];
	}

	let suggestions = $derived(getSuggestions());
</script>

<!-- Floating Toast Notifications -->
<div class="fixed right-4 top-20 z-50 space-y-2">
	{#if success}
		<div
			transition:fly={{ x: 100, duration: 300 }}
			class="max-w-sm rounded-lg border border-theme-border-subtle bg-theme-surface shadow-lg"
		>
			<div class="flex items-start p-4">
				<div class="flex-shrink-0">
					{#if success.includes('🔄')}
						<svg
							class="h-5 w-5 animate-spin text-theme-primary-500"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
					{:else}
						<svg class="h-5 w-5 text-theme-success" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
					{/if}
				</div>
				<p class="ml-3 text-sm text-theme-text-primary">{success}</p>
			</div>
		</div>
	{/if}

	{#if error}
		<div
			transition:fly={{ x: 100, duration: 300 }}
			class="max-w-sm rounded-lg border border-theme-error/20 bg-theme-error/10 shadow-lg"
		>
			<div class="flex items-start p-4">
				<div class="flex-shrink-0">
					<svg class="h-5 w-5 text-theme-error" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<p class="ml-3 text-sm text-theme-error">{error}</p>
			</div>
		</div>
	{/if}
</div>

<!-- Global Floating Toggle Button -->
{#if aiState.currentNode && aiState.isOwner}
	<button
		onclick={toggleVisibility}
		class="fixed bottom-4 right-4 z-40 rounded-full bg-gradient-to-br from-theme-primary-500 to-theme-primary-600 p-3 text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-110 {aiState.isVisible
			? 'rotate-45'
			: ''} {loading ? 'animate-pulse' : ''}"
		title="AI Author Bar {aiState.isVisible ? 'schließen' : 'öffnen'}"
	>
		<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
		</svg>
		{#if loading}
			<div class="absolute -right-1 -top-1 h-3 w-3">
				<span
					class="absolute inline-flex h-full w-full animate-ping rounded-full bg-theme-primary-400 opacity-75"
				></span>
				<span class="relative inline-flex h-3 w-3 rounded-full bg-theme-primary-500"></span>
			</div>
		{/if}
	</button>
{/if}

<!-- Global Author Bar -->
{#if aiState.currentNode && aiState.isOwner}
	<div
		id="global-ai-author-bar"
		class="fixed inset-x-0 bottom-0 z-50 border-t border-theme-border-default bg-theme-surface/95 backdrop-blur-md shadow-2xl transition-transform duration-300 {aiState.isVisible
			? 'translate-y-0'
			: 'translate-y-full'}"
	>
		<div class="mx-auto max-w-4xl p-4">
			<!-- Header with Tabs -->
			<div class="mb-3 flex items-center justify-between">
				<div class="flex items-center space-x-4">
					<div class="flex items-center space-x-2">
						<div class="relative">
							<div
								class="h-3 w-3 rounded-full {loading
									? 'bg-theme-primary-500 animate-pulse'
									: 'bg-theme-success'}"
							></div>
							{#if processingCommands.size > 0}
								<div
									class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-theme-primary-600 text-[10px] text-white"
								>
									{processingCommands.size}
								</div>
							{/if}
						</div>
						<h3 class="text-base font-medium text-theme-text-primary">✨ AI Author</h3>
					</div>

					<!-- Tab Navigation -->
					<div class="flex rounded-lg bg-theme-elevated p-0.5">
						<button
							onclick={() => switchMode('text')}
							class="flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {aiState.mode ===
							'text'
								? 'bg-theme-surface text-theme-text-primary shadow-sm'
								: 'text-theme-text-secondary hover:text-theme-text-primary'}"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
							<span>Text</span>
						</button>
						<button
							onclick={() => switchMode('image')}
							class="flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {aiState.mode ===
							'image'
								? 'bg-theme-surface text-theme-text-primary shadow-sm'
								: 'text-theme-text-secondary hover:text-theme-text-primary'}"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
							<span>Bild</span>
						</button>
					</div>
				</div>

				<button
					onclick={() => aiAuthorStore.hide()}
					class="p-1 text-theme-text-secondary transition-colors hover:text-theme-text-primary"
					title="Schließen (Esc)"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Content Area -->
			{#if aiState.mode === 'text'}
				<!-- Text Edit Mode -->
				<div class="space-y-3">
					<!-- Command Input -->
					<div class="relative">
						<textarea
							id="global-ai-command-input"
							bind:value={command}
							onkeydown={handleKeydown}
							placeholder="z.B. 'Benenne um zu Maximilian der Große' oder 'Füge zur Erscheinung hinzu: trägt eine goldene Krone'"
							rows="2"
							class="w-full resize-none rounded-md border border-theme-border-default bg-theme-background pr-20 text-sm shadow-sm transition-all focus:border-theme-primary-500 focus:ring-2 focus:ring-theme-primary-500/20 {loading
								? 'pl-10'
								: ''}"
						></textarea>
						{#if loading}
							<div class="absolute left-3 top-3">
								<svg
									class="h-4 w-4 animate-spin text-theme-primary-500"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
							</div>
						{/if}
						<div class="absolute bottom-1 right-2 text-xs text-theme-text-secondary">⌘+Enter</div>
					</div>

					<!-- Quick Suggestions -->
					{#if suggestions.length > 0 && !command.trim()}
						<div class="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
							{#each suggestions as suggestion}
								<button
									onclick={() => (command = suggestion)}
									class="flex-shrink-0 whitespace-nowrap rounded-full border border-theme-border-default bg-theme-elevated px-3 py-1 text-xs transition-all hover:bg-theme-interactive-hover hover:shadow-md"
								>
									{suggestion}
								</button>
							{/each}
						</div>
					{/if}

					<!-- Processing Queue Display -->
					{#if processingCommands.size > 0}
						<div class="rounded-lg bg-theme-primary-500/10 p-2">
							<p class="mb-1 text-xs font-medium text-theme-text-secondary">
								Verarbeite {processingCommands.size} Befehl{processingCommands.size !== 1
									? 'e'
									: ''}:
							</p>
							<div class="space-y-1">
								{#each Array.from(processingCommands) as cmd}
									<div class="flex items-center space-x-2 text-xs text-theme-text-secondary">
										<svg
											class="h-3 w-3 animate-spin text-theme-primary-500"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											></circle>
											<path
												class="opacity-75"
												fill="currentColor"
												d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										<span class="truncate"
											>{cmd.substring(0, 50)}{cmd.length > 50 ? '...' : ''}</span
										>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Action Buttons -->
					<div class="flex items-center justify-between">
						<div class="text-xs text-theme-text-secondary">
							<span class="inline-flex items-center">
								<span
									class="mr-1 h-2 w-2 rounded-full {loading
										? 'animate-pulse bg-theme-primary-500'
										: 'bg-theme-success'}"
								></span>
								{loading
									? `Verarbeite ${processingCommands.size} Befehl${processingCommands.size !== 1 ? 'e' : ''}...`
									: 'AI bereit'}
							</span>
						</div>
						<div class="flex space-x-2">
							<button
								onclick={() => aiAuthorStore.hide()}
								class="rounded border border-theme-border-default px-3 py-1.5 text-sm text-theme-text-primary transition-all hover:bg-theme-interactive-hover hover:shadow-md"
							>
								Schließen
							</button>
							<button
								onclick={executeCommand}
								disabled={!command.trim()}
								class="flex items-center space-x-2 rounded bg-gradient-to-r from-theme-primary-500 to-theme-primary-600 px-4 py-1.5 text-sm text-white transition-all hover:from-theme-primary-600 hover:to-theme-primary-700 hover:shadow-lg disabled:opacity-50"
							>
								<span>✨ Mit AI bearbeiten</span>
								{#if loading}
									<span class="text-xs opacity-75">({processingCommands.size})</span>
								{/if}
							</button>
						</div>
					</div>
				</div>
			{:else}
				<!-- Image Generation Mode -->
				<div class="space-y-4">
					{#if aiState.currentNode}
						<AiImageGenerator
							kind={aiState.currentNode.kind}
							title={aiState.currentNode.title}
							description={aiState.currentNode.summary}
							appearance={aiState.currentNode.content?.appearance || undefined}
							bind:imageUrl
							bind:prompt={generatedPrompt}
							onImageGenerated={handleImageGenerated}
						/>
					{/if}

					{#if imageUrl}
						<div class="flex justify-end space-x-2 border-t border-theme-border-subtle pt-3">
							<button
								onclick={() => {
									imageUrl = null;
									generatedPrompt = null;
									aiAuthorStore.resetImageState();
								}}
								class="rounded border border-theme-border-default px-3 py-1.5 text-sm text-theme-text-primary transition-colors hover:bg-theme-interactive-hover"
							>
								Verwerfen
							</button>
							<button
								onclick={saveGeneratedImage}
								disabled={loading}
								class="rounded bg-theme-primary-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-theme-primary-700 disabled:opacity-50"
							>
								{loading ? 'Speichere...' : 'Zur Galerie hinzufügen'}
							</button>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}

<svelte:window onkeydown={handleKeydown} />
