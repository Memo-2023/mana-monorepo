<script lang="ts">
	import type { NodeKind } from '$lib/types/content';

	interface Props {
		kind?: NodeKind;
		title?: string;
		description?: string;
		appearance?: string;
		prompt?: string;
		imagePrompt?: string;
		imageUrl?: string | null;
		onImageGenerated?: (imageUrl: string) => void;
	}

	let {
		kind = 'character',
		title = '',
		description = '',
		appearance = '',
		prompt = $bindable(''),
		imagePrompt = $bindable(''),
		imageUrl = $bindable(null),
		onImageGenerated,
	}: Props = $props();

	let loading = $state(false);
	let translating = $state(false);
	let error = $state<string | null>(null);
	let generatedImageUrl = $state<string | null>(null);
	let selectedStyle = $state<'realistic' | 'fantasy' | 'anime' | 'concept-art' | 'illustration'>(
		'fantasy'
	);
	let showOptions = $state(false);

	// Extract title and description from prompt if provided
	$effect(() => {
		if (prompt) {
			const parts = prompt.split(':');
			if (parts.length > 0 && !title) {
				title = parts[0].trim();
			}
			if (parts.length > 1 && !description && !appearance) {
				description = parts.slice(1).join(':').trim();
			}
		}
	});

	// Determine aspect ratio based on kind
	function getAspectRatio() {
		switch (kind) {
			case 'world':
			case 'place':
				return '16:9'; // Widescreen for worlds and places
			case 'object':
				return '1:1'; // Square for objects
			case 'character':
				return '9:16'; // Portrait for characters
			default:
				return '1:1'; // Default to square
		}
	}

	// Get CSS class for image display based on aspect ratio
	function getImageClass() {
		const aspectRatio = getAspectRatio();
		switch (aspectRatio) {
			case '21:9':
				return 'w-full aspect-[21/9]'; // 21:9 ultrawide aspect ratio
			case '16:9':
				return 'w-full aspect-video'; // 16:9 aspect ratio
			case '9:16':
				return 'w-64 mx-auto aspect-[9/16]'; // 9:16 aspect ratio, centered
			case '1:1':
			default:
				return 'w-full max-w-md mx-auto aspect-square'; // 1:1 aspect ratio
		}
	}

	async function translateToEnglish() {
		const germanText = appearance || description;

		if (!germanText || germanText.length < 10) {
			error = 'Keine deutsche Beschreibung zum Übersetzen vorhanden';
			return;
		}

		translating = true;
		error = null;

		try {
			const response = await fetch('/api/ai/translate-image-prompt', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					germanDescription: germanText,
					kind,
					title: title || 'Unbenannt',
					style: selectedStyle,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Übersetzung fehlgeschlagen');
			}

			const data = await response.json();

			if (data.englishPrompt) {
				imagePrompt = data.englishPrompt;
			}
		} catch (err) {
			console.error('Translation error:', err);
			error = err instanceof Error ? err.message : 'Übersetzung fehlgeschlagen';
		} finally {
			translating = false;
		}
	}

	async function generateImage() {
		const effectiveTitle = title || prompt?.split(':')[0]?.trim();
		const effectiveDescription =
			description || appearance || prompt?.split(':').slice(1).join(':')?.trim();

		if (!effectiveTitle) {
			error = 'Titel ist erforderlich für die Bildgenerierung';
			return;
		}

		loading = true;
		error = null;

		try {
			const response = await fetch('/api/ai/generate-image', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					kind,
					title: effectiveTitle,
					description: imagePrompt || effectiveDescription,
					style: selectedStyle,
					aspectRatio: getAspectRatio(),
					context: {
						appearance: imagePrompt || appearance || effectiveDescription,
					},
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Bildgenerierung fehlgeschlagen');
			}

			const data = await response.json();
			console.log('Response von API:', data); // Debug-Log

			if (data.imageUrl) {
				generatedImageUrl = data.imageUrl;
				imageUrl = data.imageUrl; // Update the bound prop
				onImageGenerated?.(data.imageUrl);
				console.log('Bild-URL gesetzt:', generatedImageUrl); // Debug-Log
			}

			imagePrompt = data.prompt;
			prompt = data.prompt; // Update the bound prompt prop

			// Zeige Info-Message wenn Bild noch nicht verfügbar
			if (!data.imageUrl && data.message) {
				error = data.message;
				console.log('Kein Bild, Nachricht:', data.message); // Debug-Log
			}
		} catch (err) {
			console.error('Fehler:', err);
			error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
		} finally {
			loading = false;
		}
	}

	function resetImage() {
		generatedImageUrl = null;
		imagePrompt = null;
		error = null;
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h3 class="text-sm font-medium text-slate-900">Bild generieren</h3>
		{#if !generatedImageUrl}
			<button
				type="button"
				onclick={() => (showOptions = !showOptions)}
				class="text-sm text-violet-600 hover:text-violet-500"
			>
				{showOptions ? 'Optionen ausblenden' : 'Optionen anzeigen'}
			</button>
		{/if}
	</div>

	{#if showOptions && !generatedImageUrl}
		<div class="space-y-3 rounded-md bg-slate-50 p-3">
			<div>
				<label for="style" class="block text-sm font-medium text-slate-700"> Bildstil </label>
				<select
					id="style"
					bind:value={selectedStyle}
					class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 sm:text-sm"
				>
					<option value="fantasy">Fantasy</option>
					<option value="realistic">Realistisch</option>
					<option value="anime">Anime</option>
					<option value="concept-art">Concept Art</option>
					<option value="illustration">Illustration</option>
				</select>
			</div>

			<p class="text-xs text-slate-500">
				Das Bild wird basierend auf dem Titel und der Beschreibung generiert.
			</p>
		</div>
	{/if}

	<!-- Deutsche Beschreibung und Übersetzung -->
	{#if appearance && !generatedImageUrl}
		<div class="space-y-3 rounded-md border border-blue-200 bg-blue-50/50 p-3">
			<div>
				<h4 class="mb-2 text-sm font-medium text-slate-700">Deutsche Beschreibung:</h4>
				<p class="rounded border bg-white p-2 text-sm text-slate-600">{appearance}</p>
			</div>

			{#if !imagePrompt}
				<button
					type="button"
					onclick={translateToEnglish}
					disabled={translating}
					class="flex w-full items-center justify-center rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if translating}
						<svg
							class="-ml-1 mr-2 h-4 w-4 animate-spin text-blue-600"
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
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Übersetze...
					{:else}
						<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
							/>
						</svg>
						Ins Englische übersetzen
					{/if}
				</button>
			{:else}
				<div>
					<h4 class="mb-2 flex items-center text-sm font-medium text-green-700">
						<svg
							class="mr-2 h-4 w-4 text-green-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
						Englischer Bild-Prompt:
					</h4>
					<p class="rounded border border-green-200 bg-green-50 p-2 text-sm text-slate-600">
						{imagePrompt}
					</p>
				</div>
			{/if}
		</div>
	{/if}

	{#if generatedImageUrl}
		<div class="relative">
			<img
				src={generatedImageUrl}
				alt={`Generiertes Bild für ${title}`}
				class="{getImageClass()} rounded-lg object-cover shadow-md"
			/>
			<button
				type="button"
				onclick={resetImage}
				class="bg-theme-surface/90 absolute right-2 top-2 rounded-full p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-theme-surface"
				title="Neues Bild generieren"
			>
				<svg
					class="h-5 w-5 text-theme-text-primary"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					/>
				</svg>
			</button>
		</div>
	{:else}
		<button
			type="button"
			onclick={generateImage}
			disabled={loading || (!title && !prompt) || (appearance && !imagePrompt)}
			class="border-theme-border-default flex w-full items-center justify-center rounded-md border bg-theme-surface px-4 py-3 text-sm font-medium text-theme-text-primary shadow-sm hover:bg-theme-interactive-hover focus:outline-none focus:ring-2 focus:ring-theme-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if loading}
				<svg
					class="-ml-1 mr-3 h-5 w-5 animate-spin text-theme-text-primary"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				Generiere Bild...
			{:else if appearance && !imagePrompt}
				<svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
					/>
				</svg>
				Bitte zuerst deutsche Beschreibung übersetzen
			{:else}
				<svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
					/>
				</svg>
				Bild mit KI generieren
			{/if}
		</button>
	{/if}

	{#if error}
		<div class="rounded-md bg-yellow-50/50 p-3">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-sm text-theme-warning">{error}</p>
				</div>
			</div>
		</div>
	{/if}

	{#if imagePrompt}
		<details class="text-xs text-theme-text-secondary">
			<summary class="cursor-pointer hover:text-theme-text-primary">Verwendeter Prompt</summary>
			<p class="mt-2 rounded bg-theme-elevated p-2 font-mono text-xs text-theme-text-secondary">
				{imagePrompt}
			</p>
		</details>
	{/if}
</div>
