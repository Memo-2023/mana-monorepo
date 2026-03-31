<script lang="ts">
	import GlassCard from './GlassCard.svelte';
	import StatRow from './StatRow.svelte';
	import Text from '$lib/components/atoms/Text.svelte';

	interface Props {
		averageAudioDuration: number;
		averageWordsPerMinute: number;
		longestRecording: number;
		totalTags: number;
		assignedTags: number;
		memosWithoutTags: number;
		averageTagsPerMemo: number;
		mostUsedTags: { name: string; count: number; color: string }[];
		topLocations: { city: string; count: number }[];
	}

	let {
		averageAudioDuration,
		averageWordsPerMinute,
		longestRecording,
		totalTags,
		assignedTags,
		memosWithoutTags,
		averageTagsPerMemo,
		mostUsedTags,
		topLocations,
	}: Props = $props();

	function formatDuration(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);

		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		} else if (minutes > 0) {
			return `${minutes}m`;
		} else {
			return `${seconds}s`;
		}
	}
</script>

<GlassCard>
	{#snippet children()}
		<div>
			<Text variant="large" weight="bold" class="mb-5 text-2xl">Insights</Text>

			<!-- Audio Insights -->
			<Text variant="muted" weight="semibold" class="mb-2 uppercase tracking-wide">Audio</Text>
			<div class="mb-4 -space-y-px">
				<StatRow
					title="Ø Aufnahmedauer"
					value={formatDuration(averageAudioDuration)}
					subtitle="pro Memo"
					icon="time-outline"
				/>
				<StatRow
					title="Ø Wörter/Minute"
					value={averageWordsPerMinute.toString()}
					subtitle="Sprechgeschwindigkeit"
					icon="speedometer-outline"
				/>
				<StatRow
					title="Längste Aufnahme"
					value={formatDuration(longestRecording)}
					icon="timer-outline"
				/>
			</div>

			<!-- Tag Analytics -->
			<Text variant="muted" weight="semibold" class="mb-2 uppercase tracking-wide">Tags</Text>
			<div class="mb-4 -space-y-px">
				<StatRow title="Gesamt Tags" value={totalTags.toString()} icon="pricetag-outline" />
				<StatRow
					title="Zugewiesene Tags"
					value={assignedTags.toString()}
					icon="checkmark-circle-outline"
				/>
				<StatRow
					title="Memos ohne Tags"
					value={memosWithoutTags.toString()}
					icon="alert-circle-outline"
				/>
				<StatRow
					title="Ø Tags/Memo"
					value={averageTagsPerMemo.toString()}
					icon="analytics-outline"
				/>

				{#if mostUsedTags.length > 0}
					<Text variant="muted" weight="medium" class="mb-2 mt-3">Meistgenutzte Tags</Text>
					{#each mostUsedTags.slice(0, 5) as tag}
						<StatRow title={tag.name} value={tag.count.toString()} icon="pricetag-outline" />
					{/each}
				{/if}
			</div>

			<!-- Location Data -->
			{#if topLocations.length > 0}
				<Text variant="muted" weight="semibold" class="mb-2 uppercase tracking-wide">
					Standorte
				</Text>
				<div class="-space-y-px">
					{#each topLocations as location}
						<StatRow title={location.city} value={`${location.count}x`} icon="location-outline" />
					{/each}
				</div>
			{/if}
		</div>
	{/snippet}
</GlassCard>
