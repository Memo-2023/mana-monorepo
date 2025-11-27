<script lang="ts">
	import GlassCard from './GlassCard.svelte';
	import StatRow from './StatRow.svelte';
	import { Text } from '@manacore/shared-ui';
	import { formatDurationWithUnits } from '@manacore/shared-utils';

	interface Props {
		todayStats: {
			memos: number;
			memories: number;
			duration: number;
			words: number;
		};
		last30DaysStats: {
			memos: number;
			memories: number;
			duration: number;
			words: number;
		};
		currentStreak: number;
		longestStreak: number;
		activestWeek: { week: string; count: number };
		activestMonth: { month: string; count: number };
	}

	let {
		todayStats,
		last30DaysStats,
		currentStreak,
		longestStreak,
		activestWeek,
		activestMonth,
	}: Props = $props();
</script>

<GlassCard>
	{#snippet children()}
		<div>
			<Text variant="large" weight="bold" class="mb-5 text-2xl">Produktivität</Text>

			<!-- Today Section -->
			<Text variant="muted" weight="semibold" class="mb-2 uppercase tracking-wide">Heute</Text>
			<div class="mb-4 -space-y-px">
				<StatRow title="Memos" value={todayStats.memos.toString()} icon="document-text-outline" />
				<StatRow title="Memories" value={todayStats.memories.toString()} icon="sparkles-outline" />
				<StatRow
					title="Aufnahmedauer"
					value={formatDurationWithUnits(todayStats.duration, 'de')}
					icon="volume-high-outline"
				/>
				<StatRow title="Wörter" value={todayStats.words.toLocaleString()} icon="text-outline" />
			</div>

			<!-- Last 30 Days Section -->
			<Text variant="muted" weight="semibold" class="mb-2 uppercase tracking-wide">
				Letzte 30 Tage
			</Text>
			<div class="mb-4 -space-y-px">
				<StatRow
					title="Memos"
					value={last30DaysStats.memos.toString()}
					icon="document-text-outline"
				/>
				<StatRow
					title="Memories"
					value={last30DaysStats.memories.toString()}
					icon="sparkles-outline"
				/>
				<StatRow
					title="Aufnahmedauer"
					value={formatDurationWithUnits(last30DaysStats.duration, 'de')}
					icon="volume-high-outline"
				/>
				<StatRow
					title="Wörter"
					value={last30DaysStats.words.toLocaleString()}
					icon="text-outline"
				/>
			</div>

			<!-- Activity Section -->
			<Text variant="muted" weight="semibold" class="mb-2 uppercase tracking-wide">Aktivität</Text>
			<div class="-space-y-px">
				<StatRow title="Aktuelle Serie" value={`${currentStreak} Tage`} icon="flame-outline" />
				<StatRow title="Längste Serie" value={`${longestStreak} Tage`} icon="trophy-outline" />
				<StatRow
					title="Aktivste Woche"
					value={`${activestWeek.count}x`}
					subtitle={activestWeek.week}
					icon="calendar-outline"
				/>
				<StatRow
					title="Aktivster Monat"
					value={`${activestMonth.count}x`}
					subtitle={activestMonth.month}
					icon="calendar-outline"
				/>
			</div>
		</div>
	{/snippet}
</GlassCard>
