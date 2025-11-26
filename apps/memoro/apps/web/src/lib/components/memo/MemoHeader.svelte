<script lang="ts">
	import type { Memo } from '$lib/types/memo.types';
	import { formatDuration, getMemooDuration, formatTimestamp } from '$lib/utils/formatters';
	import TagBadge from '$lib/components/TagBadge.svelte';
	import { Text } from '@manacore/shared-ui';

	interface Props {
		memo: Memo;
		isEditMode?: boolean;
		onTitleChange?: (title: string) => void;
		onIntroChange?: (intro: string) => void;
		onAddTagPress?: () => void;
	}

	let {
		memo,
		isEditMode = false,
		onTitleChange,
		onIntroChange,
		onAddTagPress
	}: Props = $props();

	let editTitle = $state(memo.title || '');
	let editIntro = $state(memo.intro || '');
	let showAllMetadata = $state(false);

	// Computed metadata
	const viewCount = $derived(memo.metadata?.stats?.viewCount || 0);
	const wordCount = $derived(memo.metadata?.stats?.wordCount || calculateWordCount());
	const speakerCount = $derived(
		memo.source?.speakers ? Object.keys(memo.source.speakers).length : 0
	);

	function calculateWordCount(): number {
		if (!memo.transcript) return 0;
		return memo.transcript.trim().split(/\s+/).length;
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'completed':
				return 'status-completed';
			case 'processing':
				return 'status-processing';
			case 'failed':
				return 'status-failed';
			default:
				return 'status-default';
		}
	}

	function handleTitleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		editTitle = target.value;
		onTitleChange?.(editTitle);
	}

	function handleIntroInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		editIntro = target.value;
		onIntroChange?.(editIntro);
	}

	// Update local state when memo changes
	$effect(() => {
		editTitle = memo.title || '';
		editIntro = memo.intro || '';
	});
</script>

<div class="mb-6 mt-10 space-y-4">
	<!-- Metadata Section -->
	<div class="mb-6">
		<button
			onclick={() => (showAllMetadata = !showAllMetadata)}
			class="w-full text-left cursor-pointer focus:outline-none"
		>
			<!-- Primary Metadata Row (always visible) -->
			<div class="flex items-center gap-2 text-sm text-theme-secondary">
				<span>{formatTimestamp(memo.created_at)}</span>
				<span>·</span>
				<span>{formatDuration(getMemooDuration(memo))}</span>
				<span class="ml-3 text-theme-secondary hover:text-theme transition-colors">
					{showAllMetadata ? 'Weniger anzeigen' : 'Mehr anzeigen'}
				</span>
			</div>
		</button>

		<!-- Expanded Metadata (conditional) -->
		{#if showAllMetadata}
			<div class="mt-4 max-w-xs border border-theme rounded-lg overflow-hidden">
				<table class="w-full text-sm">
					<tbody>
						<!-- Duration -->
						<tr class="border-b border-theme">
							<td class="px-3 py-2 bg-menu">
								<div class="flex items-center gap-2 text-theme-secondary">
									<svg
										class="h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									<span>Dauer</span>
								</div>
							</td>
							<td class="px-3 py-2 text-theme text-right">{formatDuration(getMemooDuration(memo))}</td>
						</tr>

						<!-- View Count -->
						<tr class="border-b border-theme">
							<td class="px-3 py-2 bg-menu">
								<div class="flex items-center gap-2 text-theme-secondary">
									<svg
										class="h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
										/>
									</svg>
									<span>Ansichten</span>
								</div>
							</td>
							<td class="px-3 py-2 text-theme text-right">{viewCount}</td>
						</tr>

						<!-- Word Count -->
						{#if wordCount > 0}
							<tr class="border-b border-theme">
								<td class="px-3 py-2 bg-menu">
									<div class="flex items-center gap-2 text-theme-secondary">
										<svg
											class="h-4 w-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
											/>
										</svg>
										<span>Wörter</span>
									</div>
								</td>
								<td class="px-3 py-2 text-theme text-right">{wordCount.toLocaleString('de-DE')}</td>
							</tr>
						{/if}

						<!-- Language -->
						{#if memo.language}
							<tr class="border-b border-theme">
								<td class="px-3 py-2 bg-menu">
									<div class="flex items-center gap-2 text-theme-secondary">
										<svg
											class="h-4 w-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
											/>
										</svg>
										<span>Sprache</span>
									</div>
								</td>
								<td class="px-3 py-2 text-theme text-right">{memo.language.toUpperCase()}</td>
							</tr>
						{/if}

						<!-- Speaker Count -->
						{#if speakerCount > 0}
							<tr class="border-b border-theme">
								<td class="px-3 py-2 bg-menu">
									<div class="flex items-center gap-2 text-theme-secondary">
										<svg
											class="h-4 w-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
											/>
										</svg>
										<span>Sprecher</span>
									</div>
								</td>
								<td class="px-3 py-2 text-theme text-right">{speakerCount}</td>
							</tr>
						{/if}

						<!-- Location -->
						{#if memo.location && (memo.location.address || memo.location.coordinates)}
							<tr class="border-b border-theme">
								<td class="px-3 py-2 bg-menu">
									<div class="flex items-center gap-2 text-theme-secondary">
										<svg
											class="h-4 w-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
											/>
										</svg>
										<span>Ort</span>
									</div>
								</td>
								<td class="px-3 py-2 text-theme text-right">
									<span class="truncate max-w-[300px] inline-block">
										{memo.location.address ||
											`${memo.location.coordinates.latitude.toFixed(4)}, ${memo.location.coordinates.longitude.toFixed(4)}`}
									</span>
								</td>
							</tr>
						{/if}

						<!-- Processing Status -->
						<tr>
							<td class="px-3 py-2 bg-menu">
								<div class="flex items-center gap-2 text-theme-secondary">
									<svg
										class="h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									<span>Status</span>
								</div>
							</td>
							<td class="px-3 py-2 text-right">
								<span class="rounded-full px-2 py-0.5 text-xs {getStatusColor(memo.processing_status)}">
									{memo.processing_status}
								</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<!-- Title Section -->
	<div>
		{#if isEditMode}
			<!-- Edit Mode: Title Input -->
			<input
				type="text"
				value={editTitle}
				oninput={handleTitleInput}
				placeholder="Untitled Memo"
				class="w-full text-2xl font-bold bg-transparent border-b-2 border-primary text-theme focus:outline-none"
			/>
		{:else}
			<!-- View Mode: Title Display -->
			<h1 class="text-2xl font-bold text-theme">
				{memo.title || 'Untitled Memo'}
			</h1>
		{/if}
	</div>

	<!-- Intro Section -->
	{#if isEditMode}
		<!-- Edit Mode: Intro Textarea -->
		<textarea
			value={editIntro}
			oninput={handleIntroInput}
			placeholder="Add an intro..."
			rows="2"
			class="w-full bg-transparent border-b border-theme text-theme-secondary focus:outline-none resize-none"
		></textarea>
	{:else if memo.intro}
		<!-- View Mode: Intro Display -->
		<p class="text-theme-secondary">
			{memo.intro}
		</p>
	{/if}

	<!-- Tags Section -->
	{#if !isEditMode}
		<div class="mt-4 flex flex-wrap items-center gap-2">
			<!-- Add Tag Button -->
			{#if onAddTagPress}
				<button
					onclick={onAddTagPress}
					class="inline-flex items-center gap-1.5 rounded-full border border-theme bg-secondary-button px-3 py-1 text-sm font-medium text-theme transition-all hover:brightness-110"
					title="Tag hinzufügen"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					<span>Tag hinzufügen</span>
				</button>
			{/if}

			<!-- Display Tags -->
			{#if memo.tags && memo.tags.length > 0}
				{#each memo.tags as tag (tag.id)}
					<TagBadge {tag} clickable={false} removable={false} />
				{/each}
			{/if}
		</div>
	{/if}
</div>
