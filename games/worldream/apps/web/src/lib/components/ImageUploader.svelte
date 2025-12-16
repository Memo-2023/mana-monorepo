<script lang="ts">
	import type { NodeKind } from '$lib/types/content';
	import AiImageGenerator from './AiImageGenerator.svelte';

	interface Props {
		nodeSlug: string;
		nodeKind: NodeKind;
		nodeTitle: string;
		nodeDescription?: string;
		onImageAdded?: () => void;
	}

	let { nodeSlug, nodeKind, nodeTitle, nodeDescription, onImageAdded }: Props = $props();

	let showGenerator = $state(false);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let imageUrl = $state<string | null>(null);
	let generationPrompt = $state<string | null>(null);

	async function handleImageGenerated(url: string) {
		imageUrl = url;
		await saveImage();
	}

	async function saveImage() {
		if (!imageUrl) return;

		loading = true;
		error = null;

		try {
			// Use the proper attachments-based endpoint
			const response = await fetch(`/api/nodes/${nodeSlug}/images`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					image_url: imageUrl,
					prompt: generationPrompt || `${nodeTitle}: ${nodeDescription || ''}`,
					is_primary: false, // New images are not primary by default
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Fehler beim Speichern des Bildes');
			}

			// Reset and close
			imageUrl = null;
			generationPrompt = null;
			showGenerator = false;
			onImageAdded?.();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
		} finally {
			loading = false;
		}
	}

	function toggleGenerator() {
		showGenerator = !showGenerator;
		if (!showGenerator) {
			// Reset state when closing
			imageUrl = null;
			generationPrompt = null;
			error = null;
		}
	}
</script>

<div class="space-y-4">
	{#if !showGenerator}
		<button
			onclick={toggleGenerator}
			class="border-theme-border-default flex w-full items-center justify-center rounded-lg border-2 border-dashed px-4 py-3 transition-colors hover:border-theme-primary-400 hover:bg-theme-primary-50"
		>
			<svg
				class="mr-2 h-6 w-6 text-theme-text-tertiary"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			<span class="font-medium text-theme-text-secondary">Neues Bild generieren</span>
		</button>
	{:else}
		<div class="rounded-lg border border-theme-border-subtle bg-theme-surface p-6 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-medium text-theme-text-primary">Neues Bild generieren</h3>
				<button
					aria-label="Close generator"
					onclick={toggleGenerator}
					class="text-theme-text-tertiary hover:text-theme-text-primary"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			{#if error}
				<div class="mb-4 rounded-md bg-red-50/50 p-3">
					<p class="text-sm text-theme-error">{error}</p>
				</div>
			{/if}

			<AiImageGenerator
				kind={nodeKind}
				title={nodeTitle}
				description={nodeDescription}
				bind:imageUrl
				bind:prompt={generationPrompt}
				onImageGenerated={handleImageGenerated}
			/>

			{#if imageUrl}
				<div class="mt-4 flex justify-end space-x-3">
					<button
						onclick={toggleGenerator}
						class="border-theme-border-default rounded-md border bg-theme-surface px-4 py-2 text-sm font-medium text-theme-text-primary hover:bg-theme-interactive-hover"
					>
						Abbrechen
					</button>
					<button
						onclick={saveImage}
						disabled={loading}
						class="rounded-md border border-transparent bg-theme-primary-600 px-4 py-2 text-sm font-medium text-theme-inverse hover:bg-theme-primary-700 disabled:opacity-50"
					>
						{loading ? 'Speichere...' : 'Bild zur Galerie hinzufügen'}
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>
