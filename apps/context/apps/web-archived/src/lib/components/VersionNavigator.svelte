<script lang="ts">
	import { goto } from '$app/navigation';
	import { CaretLeft, CaretRight, GitBranch, Clock } from '@manacore/shared-icons';
	import { getDocumentVersions } from '$lib/services/documents';
	import type { Document } from '$lib/types';
	import { onMount } from 'svelte';

	interface Props {
		documentId: string;
	}

	let { documentId }: Props = $props();

	let versions = $state<Document[]>([]);
	let currentIndex = $state(-1);
	let loading = $state(true);

	let hasPrevious = $derived(currentIndex > 0);
	let hasNext = $derived(currentIndex < versions.length - 1);
	let currentVersion = $derived(versions[currentIndex]);
	let isOriginal = $derived(currentIndex === 0);

	onMount(() => {
		loadVersions();
	});

	async function loadVersions() {
		loading = true;
		const result = await getDocumentVersions(documentId);
		versions = result.data;
		currentIndex = versions.findIndex((v) => v.id === documentId);
		if (currentIndex === -1) currentIndex = 0;
		loading = false;
	}

	function goToPrevious() {
		if (!hasPrevious) return;
		const prevDoc = versions[currentIndex - 1];
		goto(`/documents/${prevDoc.id}`);
	}

	function goToNext() {
		if (!hasNext) return;
		const nextDoc = versions[currentIndex + 1];
		goto(`/documents/${nextDoc.id}`);
	}

	// Reload when documentId changes
	$effect(() => {
		documentId;
		loadVersions();
	});
</script>

{#if !loading && versions.length > 1}
	<div
		class="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border text-xs"
	>
		<GitBranch size={14} class="text-muted-foreground shrink-0" />

		<button
			class="p-1 rounded hover:bg-muted transition-colors disabled:opacity-30"
			disabled={!hasPrevious}
			onclick={goToPrevious}
			title="Vorherige Version"
		>
			<CaretLeft size={14} />
		</button>

		<span class="text-muted-foreground tabular-nums">
			{currentIndex + 1} / {versions.length}
		</span>

		<button
			class="p-1 rounded hover:bg-muted transition-colors disabled:opacity-30"
			disabled={!hasNext}
			onclick={goToNext}
			title="Nächste Version"
		>
			<CaretRight size={14} />
		</button>

		{#if currentVersion}
			<span class="text-muted-foreground truncate max-w-[200px]">
				{#if isOriginal}
					Original
				{:else if currentVersion.metadata?.generation_type}
					{currentVersion.metadata.generation_type === 'summary'
						? 'Zusammenfassung'
						: currentVersion.metadata.generation_type === 'continuation'
							? 'Fortsetzung'
							: currentVersion.metadata.generation_type === 'rewrite'
								? 'Umformulierung'
								: currentVersion.metadata.generation_type === 'ideas'
									? 'Ideen'
									: 'KI-Version'}
				{/if}
			</span>
			{#if currentVersion.metadata?.model_used}
				<span class="text-muted-foreground opacity-60">({currentVersion.metadata.model_used})</span>
			{/if}
		{/if}
	</div>
{/if}
