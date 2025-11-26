<script lang="ts">
	interface TranscriptSegment {
		id: string;
		speaker: string;
		speakerName?: string;
		text: string;
		startTime?: number;
		endTime?: number;
	}

	interface Props {
		segments: TranscriptSegment[];
		showTimestamps?: boolean;
		speakerLabels?: Record<string, string>;
	}

	let {
		segments,
		showTimestamps = true,
		speakerLabels = {}
	}: Props = $props();

	function formatTime(ms?: number): string {
		if (ms === undefined) return '';

		const totalSeconds = Math.floor(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const secs = totalSeconds % 60;

		return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	function getSpeakerColor(speaker: string): string {
		const colors = [
			'text-blue-400',
			'text-green-400',
			'text-orange-400',
			'text-red-400',
			'text-purple-400',
			'text-teal-400'
		];

		// Generate consistent color based on speaker label
		const index = parseInt(speaker.replace(/\D/g, '')) || 0;
		return colors[index % colors.length];
	}

	function getSpeakerName(speaker: string): string {
		if (speakerLabels[speaker]) {
			return speakerLabels[speaker];
		}
		// Extract number from speaker ID and format as "Sprecher X"
		const num = parseInt(speaker.replace(/\D/g, '')) || 1;
		return `Sprecher ${num}`;
	}
</script>

<div class="space-y-4">
	{#each segments as segment (segment.id)}
		<div class="utterance">
			<!-- Speaker Header: Name & Timestamp -->
			<div class="mb-1 flex items-center justify-between">
				<span class="text-sm font-semibold {getSpeakerColor(segment.speaker)}">
					{getSpeakerName(segment.speaker)}
				</span>

				{#if showTimestamps && segment.startTime !== undefined}
					<span class="text-xs text-theme-muted">{formatTime(segment.startTime)}</span>
				{/if}
			</div>

			<!-- Transcript Text -->
			<p class="text-theme leading-relaxed whitespace-pre-wrap">
				{segment.text}
			</p>
		</div>
	{/each}

	{#if segments.length === 0}
		<div class="rounded-lg bg-black/5 dark:bg-white/5 p-8 text-center">
			<svg
				class="mx-auto mb-3 h-12 w-12 text-theme-muted"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
				/>
			</svg>
			<p class="text-theme-secondary">Kein strukturiertes Transkript verfügbar</p>
			<p class="text-theme-muted mt-1 text-sm">
				Dieses Transkript muss möglicherweise mit aktivierter Sprechererkennung neu verarbeitet werden.
			</p>
		</div>
	{/if}
</div>
