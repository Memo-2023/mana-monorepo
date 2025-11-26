<script lang="ts">
	import { t } from 'svelte-i18n';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import MemoryAccordion from '$lib/components/MemoryAccordion.svelte';
	import MemoHeader from './MemoHeader.svelte';
	import StructuredTranscriptComponent from './StructuredTranscript.svelte';
	import PhotoGallery from './PhotoGallery.svelte';
	import AdditionalRecordings from './AdditionalRecordings.svelte';
	import type { Memo } from '$lib/types/memo.types';

	interface Props {
		memo: Memo;
		audioUrl: string | null;
		isEditMode: boolean;
		editedTitle: string;
		editedIntro: string;
		editedTranscript: string;
		onTitleChange: (title: string) => void;
		onIntroChange: (intro: string) => void;
		onTranscriptChange: (transcript: string) => void;
		onAddTagPress: () => void;
	}

	let {
		memo,
		audioUrl,
		isEditMode,
		editedTitle,
		editedIntro,
		editedTranscript,
		onTitleChange,
		onIntroChange,
		onTranscriptChange,
		onAddTagPress
	}: Props = $props();
</script>

<div class="flex-1 overflow-y-auto px-8 py-6">
	<div class="mx-auto max-w-3xl">
		<!-- Header with all metadata -->
		<MemoHeader
			{memo}
			{isEditMode}
			onTitleChange={onTitleChange}
			onIntroChange={onIntroChange}
			onAddTagPress={onAddTagPress}
		/>

		<!-- Memories (AI Analysis) -->
		{#if memo.memories && memo.memories.length > 0}
			<div class="mb-6 space-y-1">
				{#each memo.memories as memory}
					<MemoryAccordion {memory} defaultExpanded={true} />
				{/each}
			</div>
		{/if}

		<!-- Photo Gallery -->
		{#if memo.photos && memo.photos.length > 0}
			<div class="mb-6">
				<PhotoGallery photos={memo.photos} />
			</div>
		{/if}

		<!-- Additional Recordings -->
		{#if memo.additional_recordings && memo.additional_recordings.length > 0}
			<div class="mb-6">
				<AdditionalRecordings recordings={memo.additional_recordings} />
			</div>
		{/if}

		<!-- Audio Player -->
		{#if audioUrl}
			<div class="mb-6">
				<AudioPlayer src={audioUrl} />
			</div>
		{/if}

		<!-- Transcript -->
		{#if memo.transcript || memo.source?.utterances}
			<div class="mb-6">
				{#if isEditMode}
					<textarea
						value={editedTranscript}
						oninput={(e) => onTranscriptChange(e.currentTarget.value)}
						class="w-full min-h-[200px] rounded-lg border border-theme bg-content p-4 text-theme focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				{:else if memo.source?.utterances && memo.source.utterances.length > 0}
					<!-- Structured Transcript with speakers and timestamps -->
					<StructuredTranscriptComponent
						segments={memo.source.utterances.map((u, i) => ({
							id: `utterance-${i}`,
							speaker: u.speakerId || 'speaker1',
							text: u.text,
							startTime: u.offset
						}))}
						speakerLabels={memo.metadata?.speakerLabels || memo.source?.speakers || {}}
					/>
				{:else}
					<!-- Plain text transcript -->
					<p class="whitespace-pre-wrap text-theme leading-relaxed">
						{memo.transcript}
					</p>
				{/if}
			</div>
		{:else}
			<div class="rounded-lg bg-white/5 p-4">
				<p class="text-theme-secondary">🔄 {$t('memo.processing_transcript')}</p>
			</div>
		{/if}
	</div>
</div>
