<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';

	interface Speaker {
		id: string;
		label: string;
		name?: string;
		segmentCount: number;
	}

	interface Props {
		visible: boolean;
		speakers: Speaker[];
		onClose: () => void;
		onSave: (speakers: { id: string; name: string }[]) => void;
		isSaving?: boolean;
	}

	let { visible, speakers, onClose, onSave, isSaving = false }: Props = $props();

	let editedSpeakers = $state<Map<string, string>>(new Map());
	let hasChanges = $state(false);

	// Initialize edited speakers when modal opens
	$effect(() => {
		if (visible) {
			const newMap = new Map<string, string>();
			speakers.forEach((speaker) => {
				newMap.set(speaker.id, speaker.name || '');
			});
			editedSpeakers = newMap;
			checkForChanges();
		}
	});

	function checkForChanges() {
		hasChanges = speakers.some((speaker) => {
			const edited = editedSpeakers.get(speaker.id) || '';
			const original = speaker.name || '';
			return edited !== original;
		});
	}

	function handleNameChange(speakerId: string, name: string) {
		editedSpeakers.set(speakerId, name);
		editedSpeakers = new Map(editedSpeakers);
		checkForChanges();
	}

	function handleSave() {
		const updates = speakers
			.map((speaker) => ({
				id: speaker.id,
				name: editedSpeakers.get(speaker.id) || '',
			}))
			.filter((update) => {
				const original = speakers.find((s) => s.id === update.id);
				return update.name !== (original?.name || '');
			});

		onSave(updates);
	}

	function handleReset() {
		const newMap = new Map<string, string>();
		speakers.forEach((speaker) => {
			newMap.set(speaker.id, speaker.name || '');
		});
		editedSpeakers = newMap;
		checkForChanges();
	}

	function getAvatarColor(index: number): string {
		const colors = [
			'bg-blue-500',
			'bg-green-500',
			'bg-purple-500',
			'bg-orange-500',
			'bg-pink-500',
			'bg-teal-500',
			'bg-red-500',
			'bg-indigo-500',
		];
		return colors[index % colors.length];
	}
</script>

<Modal {visible} {onClose} title="Manage Speakers" maxWidth="lg">
	{#snippet children()}
		<div class="space-y-4">
			<!-- Description -->
			<p class="text-sm text-theme-secondary">
				Assign names to speakers in your transcript. These names will appear in the structured
				transcript view.
			</p>

			<!-- Speaker List -->
			<div class="space-y-3">
				{#each speakers as speaker, index (speaker.id)}
					<div class="rounded-lg border border-theme bg-content p-4">
						<div class="flex items-center gap-3">
							<!-- Avatar -->
							<div
								class="{getAvatarColor(
									index
								)} flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white font-semibold"
							>
								{speaker.label}
							</div>

							<!-- Input -->
							<div class="flex-1">
								<input
									type="text"
									value={editedSpeakers.get(speaker.id) || ''}
									oninput={(e) =>
										handleNameChange(speaker.id, (e.target as HTMLInputElement).value)}
									placeholder="Enter speaker name..."
									disabled={isSaving}
									class="w-full rounded-lg border border-theme bg-menu px-3 py-2 text-theme placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
								/>
							</div>

							<!-- Segment Count -->
							<div class="flex flex-col items-end text-xs text-theme-secondary">
								<span class="font-semibold">{speaker.segmentCount}</span>
								<span>segments</span>
							</div>
						</div>

						<!-- Current Label -->
						{#if speaker.name}
							<div class="mt-2 text-xs text-theme-muted">
								Current: <span class="font-medium text-theme-secondary">{speaker.name}</span>
							</div>
						{/if}
					</div>
				{/each}
			</div>

			<!-- Info Box -->
			<div class="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3">
				<div class="flex items-start gap-2">
					<svg
						class="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-500"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<div class="flex-1">
						<p class="text-sm font-medium text-blue-800 dark:text-blue-200">Speaker labels</p>
						<p class="text-xs text-blue-700 dark:text-blue-300 mt-1">
							Speaker labels (S1, S2, etc.) are automatically detected from your transcript. Assign
							meaningful names to make conversations easier to follow.
						</p>
					</div>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet footer()}
		<div class="flex justify-between">
			<button
				onclick={handleReset}
				disabled={!hasChanges || isSaving}
				class="btn-secondary disabled:opacity-50"
			>
				Reset
			</button>
			<div class="flex gap-3">
				<button onclick={onClose} disabled={isSaving} class="btn-secondary">Cancel</button>
				<button
					onclick={handleSave}
					disabled={!hasChanges || isSaving}
					class="btn-primary disabled:opacity-50"
				>
					{#if isSaving}
						<svg
							class="h-4 w-4 animate-spin"
							fill="none"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							/>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
						<span>Saving...</span>
					{:else}
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
						<span>Save Names</span>
					{/if}
				</button>
			</div>
		</div>
	{/snippet}
</Modal>
