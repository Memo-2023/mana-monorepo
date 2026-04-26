<!--
  Comic module root — Tab-Switcher zwischen Stories und Characters.
  Stories sind das primäre Output-Artefakt, Characters die
  wiederverwendbaren Identity-Anchors. Tab-State ist lokal und
  bleibt erhalten solange ListView gemountet ist (SvelteKit hält
  uns gemountet bei Navigation innerhalb /comic).

  Face-Ref-Banner (oben, oberhalb der Tabs) übernimmt das Wardrobe-
  Pattern 1:1 — wenn der aktive Space kein face-ref hat, kann der
  User das Bild direkt hier inline droppen statt in Profil → Bilder
  navigieren zu müssen. Banner zeigt sich für beide Tabs (Stories
  UND Characters brauchen ein Face-Ref) und blendet sich nach
  erfolgreichem Upload mit einem 2.5s Success-Card aus.
-->
<script lang="ts">
	import { fade } from 'svelte/transition';
	import { CheckCircle, SpinnerGap, UserCircle } from '@mana/shared-icons';
	import { useImageByPrimary } from '$lib/modules/profile/queries';
	import MeImageUploadZone from '$lib/modules/profile/components/MeImageUploadZone.svelte';
	import { ingestMeImageFile } from '$lib/modules/profile/api/me-images';
	import StoriesView from './views/ListView.svelte';
	import CharactersView from './views/CharactersView.svelte';
	import { useAllCharacters } from './queries';

	type Tab = 'stories' | 'characters';

	let activeTab = $state<Tab>('stories');

	const characters$ = useAllCharacters();
	const characterCount = $derived(characters$.value?.length ?? 0);

	const TABS: { key: Tab; label: string; count?: number }[] = $derived([
		{ key: 'stories', label: 'Stories' },
		{ key: 'characters', label: 'Characters', count: characterCount },
	]);

	// Face-ref banner — same UX as Wardrobe's ListView. Without a
	// face-ref no Comic-Panel and no Comic-Character can render
	// (they all flow through /picture/generate-with-reference with
	// face/body refs as required inputs). Banner sits at the
	// module root above the tabs so both sub-views see it.
	const face$ = useImageByPrimary('face-ref');
	const face = $derived(face$.value);

	type UploadPhase = 'idle' | 'uploading' | 'success';
	let uploadPhase = $state<UploadPhase>('idle');
	let uploadedPreviewUrl = $state<string | null>(null);
	let faceUploadError = $state<string | null>(null);
	let successTimeout: ReturnType<typeof setTimeout> | null = null;

	const showBanner = $derived(!face$.loading && (!face || uploadPhase === 'success'));

	async function handleFaceUpload(files: File[]) {
		if (files.length === 0) return;
		if (successTimeout) {
			clearTimeout(successTimeout);
			successTimeout = null;
		}
		uploadPhase = 'uploading';
		faceUploadError = null;
		try {
			const image = await ingestMeImageFile(files[0], {
				kind: 'face',
				claimSlot: 'face-ref',
			});
			uploadedPreviewUrl = image.thumbnailUrl ?? image.publicUrl ?? null;
			uploadPhase = 'success';
			// Hold the success card visible briefly so the user sees the
			// confirmation, then let the banner unmount and the active
			// tab take over as the next step.
			successTimeout = setTimeout(() => {
				uploadPhase = 'idle';
				uploadedPreviewUrl = null;
				successTimeout = null;
			}, 2500);
		} catch (err) {
			faceUploadError = err instanceof Error ? err.message : 'Upload fehlgeschlagen';
			uploadPhase = 'idle';
		}
	}

	function dismissSuccess() {
		if (successTimeout) {
			clearTimeout(successTimeout);
			successTimeout = null;
		}
		uploadPhase = 'idle';
		uploadedPreviewUrl = null;
	}
</script>

<div class="comic-root">
	<nav class="comic-tabs" aria-label="Ansicht wechseln">
		{#each TABS as tab (tab.key)}
			<button
				type="button"
				class="comic-tab"
				class:active={activeTab === tab.key}
				aria-pressed={activeTab === tab.key}
				onclick={() => (activeTab = tab.key)}
			>
				{tab.label}
				{#if tab.count !== undefined && tab.count > 0}
					<span class="comic-tab-count">{tab.count}</span>
				{/if}
			</button>
		{/each}
	</nav>

	{#if showBanner}
		<div
			class="face-banner space-y-3 rounded-xl border border-dashed p-4"
			class:face-banner-success={uploadPhase === 'success'}
			transition:fade={{ duration: 250 }}
		>
			{#if uploadPhase === 'success'}
				<div class="flex items-center gap-3" role="status" aria-live="polite">
					{#if uploadedPreviewUrl}
						<img
							src={uploadedPreviewUrl}
							alt=""
							class="h-12 w-12 flex-shrink-0 rounded-full border border-primary/30 object-cover"
						/>
					{:else}
						<span
							class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
						>
							<CheckCircle size={24} weight="fill" />
						</span>
					{/if}
					<div class="flex-1 space-y-0.5">
						<p class="flex items-center gap-1.5 text-sm font-medium text-foreground">
							<CheckCircle size={14} weight="fill" class="text-primary" />
							Gesichtsbild gespeichert
						</p>
						<p class="text-xs text-muted-foreground">
							Perfekt — als nächstes baust du deinen ersten Comic-Character oder legst direkt eine
							Story an.
						</p>
					</div>
					<button
						type="button"
						onclick={dismissSuccess}
						class="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
					>
						Schließen
					</button>
				</div>
			{:else}
				<div class="flex items-start gap-3 text-sm">
					<UserCircle size={18} weight="regular" class="mt-0.5 flex-shrink-0 text-primary" />
					<div class="space-y-1">
						<p class="font-medium text-foreground">Lade ein Gesichtsbild hoch</p>
						<p class="text-xs text-muted-foreground">
							Wir brauchen dich auf Bild, damit Comic-Panels und Charakter-Varianten von dir
							gerendert werden können. Das Bild bleibt lokal und wird nur für deine eigenen
							Generierungen genutzt.
						</p>
					</div>
				</div>
				<div class="relative">
					<MeImageUploadZone
						variant="compact"
						label={uploadPhase === 'uploading' ? 'Wird hochgeladen…' : 'Gesichtsbild hochladen'}
						hint="Kopf + Schulter, möglichst neutrale Beleuchtung"
						disabled={uploadPhase === 'uploading'}
						onFiles={handleFaceUpload}
					/>
					{#if uploadPhase === 'uploading'}
						<span
							class="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
							role="status"
							aria-live="polite"
						>
							<SpinnerGap size={12} class="spinner" weight="bold" />
							Lade…
						</span>
					{/if}
				</div>
				{#if faceUploadError}
					<div
						class="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-xs text-error"
						role="alert"
					>
						{faceUploadError}
					</div>
				{/if}
			{/if}
		</div>
	{/if}

	<div class="comic-body">
		{#if activeTab === 'stories'}
			<StoriesView />
		{:else}
			<CharactersView />
		{/if}
	</div>
</div>

<style>
	.comic-root {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		height: 100%;
		padding: 0.5rem 0.75rem 0.75rem;
		container-type: inline-size;
	}
	.comic-tabs {
		display: flex;
		gap: 0.25rem;
		border-bottom: 1px solid hsl(var(--color-border));
		flex-shrink: 0;
	}
	.comic-tab {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		margin-bottom: -1px;
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		font: inherit;
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition:
			color 0.15s,
			border-color 0.15s;
	}
	.comic-tab:hover {
		color: hsl(var(--color-foreground));
	}
	.comic-tab.active {
		color: hsl(var(--color-foreground));
		border-bottom-color: hsl(var(--color-primary));
	}
	.comic-tab-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.25rem;
		height: 1.25rem;
		padding: 0 0.375rem;
		border-radius: 9999px;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
		font-size: 0.6875rem;
		font-weight: 600;
	}
	.comic-body {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}
	.face-banner {
		border-color: hsl(var(--color-border));
		background: hsl(var(--color-background) / 0.5);
		transition:
			background-color 0.25s,
			border-color 0.25s;
	}
	.face-banner-success {
		border-style: solid;
		border-color: hsl(var(--color-primary) / 0.4);
		background: hsl(var(--color-primary) / 0.06);
	}
	/* Spinner reaches into Phosphor's child SVG via :global(). */
	.face-banner :global(.spinner) {
		animation: comic-spin 0.9s linear infinite;
	}
	@keyframes comic-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
	@container (min-width: 640px) {
		.comic-root {
			padding: 0.75rem 1rem 1rem;
			gap: 1rem;
		}
	}
</style>
