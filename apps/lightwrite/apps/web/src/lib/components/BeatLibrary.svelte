<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';

	interface LibraryBeat {
		id: string;
		title: string;
		artist: string | null;
		genre: string | null;
		bpm: number | null;
		duration: number | null;
		tags: string[] | null;
		license: string | null;
	}

	interface Props {
		projectId: string;
		onSelectBeat?: () => void;
	}

	let { projectId, onSelectBeat }: Props = $props();

	let beats = $state<LibraryBeat[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let isUsing = $state<string | null>(null);
	let previewingBeat = $state<string | null>(null);
	let audioElement: HTMLAudioElement | null = null;

	const backendUrl =
		(typeof window !== 'undefined' &&
			(window as unknown as { __PUBLIC_BACKEND_URL__: string }).__PUBLIC_BACKEND_URL__) ||
		'http://localhost:3010';

	onMount(async () => {
		await loadLibraryBeats();
	});

	async function loadLibraryBeats() {
		isLoading = true;
		error = null;

		try {
			const response = await fetch(`${backendUrl}/beats/library`);
			if (!response.ok) throw new Error('Failed to load library');
			const data = await response.json();
			beats = data.beats;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load beat library';
		} finally {
			isLoading = false;
		}
	}

	async function handleUseBeat(beatId: string) {
		isUsing = beatId;
		error = null;

		try {
			const response = await fetch(`${backendUrl}/beats/library/${beatId}/use`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...authStore.getAuthHeaders(),
				},
				body: JSON.stringify({ projectId }),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to use beat');
			}

			onSelectBeat?.();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to add beat to project';
		} finally {
			isUsing = null;
		}
	}

	async function togglePreview(beatId: string) {
		if (previewingBeat === beatId) {
			// Stop preview
			audioElement?.pause();
			audioElement = null;
			previewingBeat = null;
			return;
		}

		// Stop any existing preview
		audioElement?.pause();
		previewingBeat = beatId;

		try {
			const response = await fetch(`${backendUrl}/beats/library/${beatId}/download-url`);
			if (!response.ok) throw new Error('Failed to get preview URL');
			const data = await response.json();

			audioElement = new Audio(data.url);
			audioElement.play();
			audioElement.onended = () => {
				previewingBeat = null;
			};
		} catch (err) {
			console.error('Preview error:', err);
			previewingBeat = null;
		}
	}

	function formatDuration(seconds: number | null): string {
		if (!seconds) return '--:--';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}
</script>

<div class="space-y-4">
	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<div
				class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
			></div>
		</div>
	{:else if error}
		<div class="text-center py-8">
			<p class="text-red-500 mb-4">{error}</p>
			<button onclick={loadLibraryBeats} class="px-4 py-2 text-primary hover:underline">
				Try Again
			</button>
		</div>
	{:else if beats.length === 0}
		<div class="text-center py-12 text-foreground-secondary">
			<div class="w-16 h-16 mx-auto mb-4 opacity-50">
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-full h-full">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
					/>
				</svg>
			</div>
			<p>No beats available in the library yet.</p>
			<p class="text-sm mt-2">Upload your own beat instead.</p>
		</div>
	{:else}
		<div class="grid gap-3">
			{#each beats as beat}
				<div
					class="flex items-center gap-4 p-4 bg-surface rounded-lg hover:bg-surface-hover transition-colors"
				>
					<!-- Preview button -->
					<button
						onclick={() => togglePreview(beat.id)}
						class="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
						aria-label={previewingBeat === beat.id ? 'Stop preview' : 'Play preview'}
					>
						{#if previewingBeat === beat.id}
							<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
								<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
							</svg>
						{:else}
							<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
								<path d="M8 5v14l11-7z" />
							</svg>
						{/if}
					</button>

					<!-- Beat info -->
					<div class="flex-1 min-w-0">
						<h3 class="font-medium truncate">{beat.title}</h3>
						<div class="flex items-center gap-3 text-sm text-foreground-secondary">
							{#if beat.artist}
								<span>{beat.artist}</span>
							{/if}
							{#if beat.genre}
								<span class="px-2 py-0.5 bg-surface-active rounded-full text-xs">
									{beat.genre}
								</span>
							{/if}
							{#if beat.bpm}
								<span>{beat.bpm} BPM</span>
							{/if}
							<span>{formatDuration(beat.duration)}</span>
						</div>
						{#if beat.tags && beat.tags.length > 0}
							<div class="flex flex-wrap gap-1 mt-1">
								{#each beat.tags.slice(0, 3) as tag}
									<span class="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs">
										{tag}
									</span>
								{/each}
								{#if beat.tags.length > 3}
									<span class="text-xs text-foreground-secondary">
										+{beat.tags.length - 3} more
									</span>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Use button -->
					<button
						onclick={() => handleUseBeat(beat.id)}
						disabled={isUsing !== null}
						class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors shrink-0 text-sm"
					>
						{#if isUsing === beat.id}
							<span class="flex items-center gap-2">
								<div
									class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
								></div>
								Adding...
							</span>
						{:else}
							Use Beat
						{/if}
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
