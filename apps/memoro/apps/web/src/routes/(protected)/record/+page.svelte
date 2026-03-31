<script lang="ts">
	import { t } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import { recording } from '$lib/stores/recording';
	import { uploadAndProcessAudio } from '$lib/services/audioUploadService';
	import RecordingButton from '$lib/components/RecordingButton.svelte';
	import BlueprintSelector from '$lib/components/BlueprintSelector.svelte';
	import AdviceCarousel from '$lib/components/AdviceCarousel.svelte';

	// Standard blueprint ID - matches the mobile app constant
	const STANDARD_BLUEPRINT_ID = '11111111-2222-3333-4444-555555555555';

	let selectedBlueprintId = $state<string | null>(STANDARD_BLUEPRINT_ID);

	function handleSelectBlueprint(blueprintId: string | null) {
		selectedBlueprintId = blueprintId;
	}

	async function handleRecordingComplete(audioBlob: Blob) {
		if (!$user) {
			console.error('No user authenticated');
			recording.setError($t('record.user_not_authenticated'));
			return;
		}

		try {
			recording.setStatus('uploading');

			const audioDuration = $recording.duration;

			console.log('Uploading recording:', {
				blobSize: audioBlob.size,
				duration: audioDuration,
				userId: $user.id,
			});

			const result = await uploadAndProcessAudio({
				audioBlob,
				userId: $user.id,
				title: 'New Recording',
				duration: audioDuration,
				spaceId: null,
				blueprintId: selectedBlueprintId,
			});

			if (result.success) {
				console.log('Recording uploaded successfully, memo ID:', result.memoId);
				recording.reset();
			} else {
				console.error('Upload failed:', result.error);
				recording.setError(result.error || $t('record.upload_failed'));

				if (result.isNetworkError) {
					alert($t('record.network_error'));
				} else {
					alert($t('record.upload_error', { values: { error: result.error } }));
				}
			}
		} catch (error) {
			console.error('Error in handleRecordingComplete:', error);
			recording.setError(String(error));
			alert($t('record.unexpected_error'));
		}
	}
</script>

<svelte:head>
	<title>{$t('record.title')}</title>
</svelte:head>

<div class="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-page">
	<!-- Centered Recording Button -->
	<div class="relative flex flex-col items-center">
		<RecordingButton size={180} onRecordingComplete={handleRecordingComplete} />

		<!-- Recording Instruction (below button) -->
		{#if $recording.status === 'idle'}
			<div class="mt-6 flex flex-col items-center text-theme-secondary">
				<!-- Arrow pointing up -->
				<svg class="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
				</svg>
				<p class="text-center text-base font-medium">
					{$t('record.instruction')}
				</p>
			</div>
		{/if}
	</div>

	<!-- Upload Status -->
	{#if $recording.status === 'uploading'}
		<div class="absolute bottom-20 flex items-center gap-2 text-sm text-theme-secondary">
			<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
			<span>{$t('record.uploading')}</span>
		</div>
	{/if}

	<!-- Error Message -->
	{#if $recording.error}
		<div
			class="absolute bottom-24 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400"
		>
			{$recording.error}
		</div>
	{/if}

	<!-- Advice Carousel and Blueprint Selector (fixed at bottom) -->
	<div class="absolute bottom-16 left-0 right-0">
		<AdviceCarousel blueprintId={selectedBlueprintId} language="de" />
		<BlueprintSelector {selectedBlueprintId} onSelectBlueprint={handleSelectBlueprint} />
	</div>
</div>

<style>
	.bg-page {
		background-color: var(--color-page-bg);
	}
</style>
