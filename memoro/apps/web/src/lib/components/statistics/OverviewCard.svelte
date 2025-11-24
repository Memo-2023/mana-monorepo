<script lang="ts">
	import GlassCard from './GlassCard.svelte';
	import StatRow from './StatRow.svelte';
	import { Text } from '@manacore/shared-ui';

	interface Props {
		memoCount: number;
		memoryCount: number;
		totalDuration: number;
		totalWords: number;
		currentStreak: number;
		averageWordCount: number;
	}

	let { memoCount, memoryCount, totalDuration, totalWords, currentStreak, averageWordCount }: Props = $props();

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
		<Text variant="large" weight="bold" class="mb-5 text-2xl">Überblick</Text>
		<!-- Responsive Grid: 1 col mobile, 2 cols tablet, 3 cols desktop -->
		<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
			<!-- Main Stats -->
			<div class="-space-y-px">
				<StatRow title="Memos" value={memoCount.toString()} icon="document-text-outline" />
				<StatRow title="Memories" value={memoryCount.toString()} icon="sparkles-outline" />
			</div>
			<div class="-space-y-px">
				<StatRow
					title="Aufnahmedauer"
					value={formatDuration(totalDuration)}
					icon="volume-high-outline"
				/>
				<StatRow title="Wörter" value={totalWords.toLocaleString()} icon="text-outline" />
			</div>
			<div class="-space-y-px">
				<StatRow
					title="Aktuelle Serie"
					value={`${currentStreak} Tage`}
					icon="flame-outline"
				/>
				<StatRow
					title="Ø Wörter/Memo"
					value={averageWordCount.toString()}
					icon="analytics-outline"
				/>
			</div>
		</div>
	{/snippet}
</GlassCard>
