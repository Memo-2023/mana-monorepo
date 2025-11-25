<script lang="ts">
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import { Text } from '@manacore/shared-ui';
	import { formatDurationFromMs, formatFileSize } from '@manacore/shared-utils';
	import type { AdditionalRecording } from '$lib/types/memo.types';

	interface Props {
		recordings: AdditionalRecording[];
		onRecordingAdd?: () => void;
		onRecordingDelete?: (recordingId: string) => void;
		onRecordingRename?: (recordingId: string, newLabel: string) => void;
		canEdit?: boolean;
	}

	let { recordings, onRecordingAdd, onRecordingDelete, onRecordingRename, canEdit = false }: Props =
		$props();

	let editingId = $state<string | null>(null);
	let editLabel = $state('');

	function formatDate(date: string): string {
		return new Date(date).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function startEditing(recording: AdditionalRecording) {
		editingId = recording.id;
		editLabel = '';
	}

	function cancelEditing() {
		editingId = null;
		editLabel = '';
	}

	function saveLabel(recordingId: string) {
		if (onRecordingRename && editLabel.trim()) {
			onRecordingRename(recordingId, editLabel.trim());
		}
		cancelEditing();
	}
</script>

{#if recordings.length > 0 || canEdit}
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<Text variant="small" weight="semibold" class="uppercase text-theme-secondary">
				Additional Recordings
			</Text>
			{#if canEdit && onRecordingAdd}
				<button
					onclick={onRecordingAdd}
					class="flex items-center gap-1 text-xs text-primary hover:underline"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					<Text variant="muted">Add Recording</Text>
				</button>
			{/if}
		</div>

		<!-- Recordings List -->
		{#if recordings.length > 0}
			<div class="space-y-3">
				{#each recordings as recording (recording.id)}
					<div class="rounded-lg border border-theme bg-content p-4">
						<!-- Header -->
						<div class="mb-3 flex items-start justify-between">
							<div class="flex-1">
								{#if editingId === recording.id}
									<!-- Edit Mode -->
									<div class="flex items-center gap-2">
										<input
											type="text"
											bind:value={editLabel}
											placeholder="Recording label..."
											class="flex-1 rounded border border-theme bg-menu px-2 py-1 text-sm text-theme focus:outline-none focus:ring-2 focus:ring-primary"
											onkeydown={(e) => {
												if (e.key === 'Enter') saveLabel(recording.id);
												if (e.key === 'Escape') cancelEditing();
											}}
										/>
										<button
											onclick={() => saveLabel(recording.id)}
											class="rounded bg-primary px-2 py-1 text-xs text-white hover:bg-primary/90"
										>
											Save
										</button>
										<button
											onclick={cancelEditing}
											class="rounded bg-menu px-2 py-1 text-xs text-theme hover:bg-menu-hover"
										>
											Cancel
										</button>
									</div>
								{:else}
									<!-- View Mode -->
									<div class="flex items-center gap-2">
										<Text variant="body" weight="semibold">
											Recording {recordings.indexOf(recording) + 1}
										</Text>
										{#if canEdit && onRecordingRename}
											<button
												onclick={() => startEditing(recording)}
												class="text-theme-secondary hover:text-primary"
												title="Rename"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
													/>
												</svg>
											</button>
										{/if}
									</div>
								{/if}

								<!-- Metadata -->
								<div class="mt-1 flex flex-wrap gap-3">
									<Text variant="muted" class="flex items-center gap-1">
										<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										{recording.duration_millis ? formatDurationFromMs(recording.duration_millis) : '--:--'}
									</Text>
									<Text variant="muted" class="flex items-center gap-1">
										<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
											/>
										</svg>
										--
									</Text>
									<Text variant="muted" class="flex items-center gap-1">
										<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
											/>
										</svg>
										{formatDate(recording.created_at)}
									</Text>
								</div>
							</div>

							<!-- Delete Button -->
							{#if canEdit && onRecordingDelete}
								<button
									onclick={() => {
										if (confirm('Delete this recording?')) {
											onRecordingDelete(recording.id);
										}
									}}
									class="text-red-500 hover:text-red-600"
									title="Delete recording"
								>
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								</button>
							{/if}
						</div>

						<!-- Audio Player -->
						<AudioPlayer src={recording.audio_url} />
					</div>
				{/each}
			</div>
		{:else if canEdit}
			<div class="rounded-lg border-2 border-dashed border-theme p-8 text-center">
				<svg
					class="mx-auto mb-3 h-12 w-12 text-theme-secondary"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
					/>
				</svg>
				<Text variant="small" class="mb-2 text-theme-secondary">No additional recordings</Text>
				<button onclick={onRecordingAdd} class="btn-secondary text-sm">
					Add additional recording
				</button>
			</div>
		{/if}
	</div>
{/if}
