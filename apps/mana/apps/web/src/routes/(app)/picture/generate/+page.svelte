<script lang="ts">
	import { goto } from '$app/navigation';
	import { Sparkle, Lightning, Image as ImageIcon } from '@mana/shared-icons';
	import { getManaApiUrl } from '$lib/api/config';
	import { authStore } from '$lib/stores/auth.svelte';
	import { imagesStore } from '$lib/modules/picture/stores/images.svelte';
	import type { LocalImage } from '$lib/modules/picture/types';
	import { ModuleShell } from '$lib/components/shell';

	type ProviderOption = {
		id: string;
		label: string;
		description: string;
		supportsQuality: boolean;
	};

	const PROVIDERS: ProviderOption[] = [
		{
			id: 'openai/gpt-image-2',
			label: 'GPT-Image-2',
			description: 'OpenAI · Text im Bild, Reasoning, hohe Detailtreue',
			supportsQuality: true,
		},
		{
			id: 'black-forest-labs/flux-schnell',
			label: 'Flux Schnell',
			description: 'Replicate · schnell und günstig',
			supportsQuality: false,
		},
	];

	type AspectRatio = { id: string; label: string; width: number; height: number };
	const ASPECT_RATIOS: AspectRatio[] = [
		{ id: 'square', label: 'Quadrat (1:1)', width: 1024, height: 1024 },
		{ id: 'landscape', label: 'Landschaft (3:2)', width: 1536, height: 1024 },
		{ id: 'portrait', label: 'Portrait (2:3)', width: 1024, height: 1536 },
	];

	let prompt = $state('');
	let negativePrompt = $state('');
	let modelId = $state<string>(PROVIDERS[0].id);
	let quality = $state<'low' | 'medium' | 'high'>('medium');
	let aspectId = $state<string>(ASPECT_RATIOS[0].id);
	let batchCount = $state<1 | 2 | 4>(1);
	let isGenerating = $state(false);
	let generationError = $state('');
	let lastImageUrls = $state<string[]>([]);

	const currentProvider = $derived(PROVIDERS.find((p) => p.id === modelId) ?? PROVIDERS[0]);
	const currentAspect = $derived(ASPECT_RATIOS.find((a) => a.id === aspectId) ?? ASPECT_RATIOS[0]);
	const supportsBatch = $derived(currentProvider.id.startsWith('openai/'));
	const effectiveBatch = $derived(supportsBatch ? batchCount : 1);
	const creditsPerImage = $derived(quality === 'low' ? 3 : quality === 'high' ? 25 : 10);
	const totalCredits = $derived(
		currentProvider.supportsQuality ? creditsPerImage * effectiveBatch : 10
	);

	async function handleGenerate() {
		if (!prompt.trim()) return;

		isGenerating = true;
		generationError = '';
		lastImageUrls = [];

		try {
			const token = await authStore.getValidToken();
			if (!token) throw new Error('Nicht angemeldet');

			const res = await fetch(`${getManaApiUrl()}/api/v1/picture/generate`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					prompt: prompt.trim(),
					negativePrompt: negativePrompt.trim() || undefined,
					model: modelId,
					quality: currentProvider.supportsQuality ? quality : undefined,
					width: currentAspect.width,
					height: currentAspect.height,
					n: effectiveBatch,
				}),
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				if (res.status === 402)
					throw new Error(`Nicht genug Credits (${body.required ?? '?'} erforderlich)`);
				throw new Error(body.error || `Fehler ${res.status}`);
			}

			const data = (await res.json()) as {
				images?: Array<{ imageUrl: string; mediaId?: string; thumbnailUrl?: string }>;
				imageUrl?: string;
				mediaId?: string;
				thumbnailUrl?: string;
				prompt: string;
				model: string;
			};
			const images =
				data.images && data.images.length > 0
					? data.images
					: data.imageUrl
						? [{ imageUrl: data.imageUrl, mediaId: data.mediaId, thumbnailUrl: data.thumbnailUrl }]
						: [];
			if (images.length === 0) throw new Error('Keine Bilder zurückgegeben');

			const now = new Date().toISOString();
			for (const img of images) {
				const local: LocalImage = {
					id: crypto.randomUUID(),
					prompt: data.prompt,
					negativePrompt: negativePrompt.trim() || null,
					model: data.model,
					publicUrl: img.imageUrl,
					storagePath: img.mediaId ?? img.imageUrl,
					filename: `generated-${Date.now()}.png`,
					format: 'png',
					width: currentAspect.width,
					height: currentAspect.height,
					isPublic: false,
					isFavorite: false,
					downloadCount: 0,
					createdAt: now,
					updatedAt: now,
				};
				await imagesStore.insert(local);
			}
			lastImageUrls = images.map((i) => i.imageUrl);
		} catch (e) {
			generationError = e instanceof Error ? e.message : 'Generierung fehlgeschlagen';
		} finally {
			isGenerating = false;
		}
	}

	const PROMPT_SUGGESTIONS = [
		'Ein traumhafter Sonnenuntergang über dem Bodensee',
		'Futuristisches Stadtbild in Neonfarben, cyberpunk',
		'Aquarell eines ruhigen japanischen Gartens',
		'Abstrakte Kunst in lebhaften Blau- und Goldtönen',
		'Photorealistisches Portrait einer Katze als Ritter',
	];
</script>

<svelte:head>
	<title>Generieren - Picture - Mana</title>
</svelte:head>

<ModuleShell
	variant="fill"
	title="Bild generieren"
	icon={ImageIcon}
	color="#8B5CF6"
	backHref="/picture"
>
	{#snippet actions()}
		<span
			class="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
			title="Kosten für diesen Run"
		>
			<Lightning size={12} weight="fill" class="text-primary" />
			{totalCredits}
		</span>
	{/snippet}

	<div class="mx-auto max-w-2xl space-y-5 p-4 sm:p-6">
		<!-- Prompt section -->
		<section class="space-y-3">
			<div>
				<label for="prompt" class="mb-1.5 block text-sm font-medium text-foreground">
					Prompt
				</label>
				<textarea
					id="prompt"
					bind:value={prompt}
					placeholder="Beschreibe das Bild, das du erstellen möchtest..."
					rows="4"
					required
					class="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
				></textarea>
			</div>

			<div class="flex flex-wrap gap-1.5">
				{#each PROMPT_SUGGESTIONS as suggestion}
					<button
						type="button"
						onclick={() => (prompt = suggestion)}
						class="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
					>
						{suggestion}
					</button>
				{/each}
			</div>

			<div>
				<label for="negative-prompt" class="mb-1.5 block text-sm font-medium text-foreground">
					Negativ-Prompt <span class="text-muted-foreground">(optional)</span>
				</label>
				<input
					id="negative-prompt"
					type="text"
					bind:value={negativePrompt}
					placeholder="unscharf, verzerrt, niedrige Qualität…"
					class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
				/>
			</div>
		</section>

		<!-- Settings section -->
		<section class="space-y-3 rounded-lg border border-border bg-background/50 p-3">
			<h2 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
				Einstellungen
			</h2>

			<div class="grid gap-3 sm:grid-cols-2">
				<div>
					<label for="model" class="mb-1.5 block text-sm font-medium text-foreground">
						Modell
					</label>
					<select
						id="model"
						bind:value={modelId}
						class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
					>
						{#each PROVIDERS as p}
							<option value={p.id}>{p.label}</option>
						{/each}
					</select>
					<p class="mt-1 text-xs text-muted-foreground">{currentProvider.description}</p>
				</div>

				<div>
					<label for="aspect" class="mb-1.5 block text-sm font-medium text-foreground">
						Seitenverhältnis
					</label>
					<select
						id="aspect"
						bind:value={aspectId}
						class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
					>
						{#each ASPECT_RATIOS as a}
							<option value={a.id}>{a.label}</option>
						{/each}
					</select>
				</div>
			</div>

			{#if currentProvider.supportsQuality}
				<div>
					<span class="mb-1.5 block text-sm font-medium text-foreground">Qualität</span>
					<div class="inline-flex w-full overflow-hidden rounded-md border border-border">
						{#each ['low', 'medium', 'high'] as const as q, i}
							<button
								type="button"
								onclick={() => (quality = q)}
								class="flex-1 px-3 py-1.5 text-sm transition-colors {i > 0
									? 'border-l border-border'
									: ''} {quality === q
									? 'bg-primary text-primary-foreground'
									: 'bg-background text-muted-foreground hover:text-foreground'}"
							>
								{q === 'low' ? 'Niedrig' : q === 'medium' ? 'Mittel' : 'Hoch'}
								<span class="ml-1 text-xs opacity-70">
									{q === 'low' ? '3' : q === 'medium' ? '10' : '25'}
								</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			{#if supportsBatch}
				<div>
					<span class="mb-1.5 block text-sm font-medium text-foreground">Varianten</span>
					<div class="inline-flex w-full overflow-hidden rounded-md border border-border">
						{#each [1, 2, 4] as const as c, i}
							<button
								type="button"
								onclick={() => (batchCount = c)}
								class="flex-1 px-3 py-1.5 text-sm transition-colors {i > 0
									? 'border-l border-border'
									: ''} {batchCount === c
									? 'bg-primary text-primary-foreground'
									: 'bg-background text-muted-foreground hover:text-foreground'}"
							>
								{c}×
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</section>

		<!-- Generate button + error -->
		<div class="space-y-3">
			<button
				type="button"
				onclick={handleGenerate}
				disabled={!prompt.trim() || isGenerating}
				class="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if isGenerating}
					<div
						class="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
					></div>
					Generiere…
				{:else}
					<Sparkle size={16} weight="fill" />
					Bild generieren · {totalCredits} Credits
				{/if}
			</button>

			{#if generationError}
				<div
					class="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error"
					role="alert"
				>
					{generationError}
				</div>
			{/if}
		</div>

		<!-- Results -->
		{#if lastImageUrls.length > 0}
			<section class="space-y-3">
				<div class="flex items-center justify-between">
					<h2 class="text-sm font-semibold text-foreground">
						{lastImageUrls.length === 1 ? 'Ergebnis' : `${lastImageUrls.length} Ergebnisse`}
					</h2>
					<button
						type="button"
						onclick={() => goto('/picture')}
						class="text-xs font-medium text-primary hover:underline"
					>
						Zur Galerie →
					</button>
				</div>
				<div class="grid gap-3 {lastImageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}">
					{#each lastImageUrls as url}
						<img src={url} alt={prompt} class="w-full rounded-md border border-border bg-card" />
					{/each}
				</div>
			</section>
		{/if}
	</div>
</ModuleShell>
