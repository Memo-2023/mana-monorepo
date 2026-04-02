<script lang="ts">
	import type { AudioArchiveStats } from '$lib/services/audioStorageService';
	import { audioStorageService } from '$lib/services/audioStorageService';
	import Text from '$lib/components/atoms/Text.svelte';

	interface Props {
		stats: AudioArchiveStats;
	}

	let { stats }: Props = $props();

	function formatFileSize(bytes: number): string {
		return audioStorageService.formatFileSize(bytes);
	}

	function formatDuration(seconds: number): string {
		return audioStorageService.formatDuration(seconds);
	}
</script>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
	<!-- Total Files -->
	<div class="rounded-lg border border-theme bg-menu p-6">
		<div class="flex items-center gap-3">
			<div class="rounded-full bg-primary/10 p-3">
				<svg
					class="h-6 w-6 text-primary"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
					/>
				</svg>
			</div>
			<div>
				<Text variant="small" class="text-theme-secondary">Aufnahmen</Text>
				<Text variant="large" weight="bold" class="text-2xl">{stats.totalCount}</Text>
			</div>
		</div>
	</div>

	<!-- Total Duration -->
	<div class="rounded-lg border border-theme bg-menu p-6">
		<div class="flex items-center gap-3">
			<div class="rounded-full bg-primary/10 p-3">
				<svg
					class="h-6 w-6 text-primary"
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
			</div>
			<div>
				<Text variant="small" class="text-theme-secondary">Gesamtdauer</Text>
				<Text variant="large" weight="bold" class="text-2xl"
					>{formatDuration(stats.totalDurationSeconds)}</Text
				>
			</div>
		</div>
	</div>

	<!-- Total Size -->
	<div class="rounded-lg border border-theme bg-menu p-6">
		<div class="flex items-center gap-3">
			<div class="rounded-full bg-primary/10 p-3">
				<svg
					class="h-6 w-6 text-primary"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
					/>
				</svg>
			</div>
			<div>
				<Text variant="small" class="text-theme-secondary">Speicherplatz</Text>
				<Text variant="large" weight="bold" class="text-2xl"
					>{formatFileSize(stats.totalSizeBytes)}</Text
				>
			</div>
		</div>
	</div>
</div>
