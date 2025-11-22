<script lang="ts">
	import GlassCard from './GlassCard.svelte';
	import StatRow from './StatRow.svelte';
	import Text from '$lib/components/atoms/Text.svelte';

	interface Props {
		mostViewedMemo: { id: string; title: string; viewCount: number } | null;
		lastViewedMemo: { id: string; title: string; lastViewed: string } | null;
		unreadMemos: number;
		memoCount: number;
	}

	let { mostViewedMemo, lastViewedMemo, unreadMemos, memoCount }: Props = $props();

	const readMemos = memoCount - unreadMemos;
	const readPercentage = memoCount > 0 ? Math.round((readMemos / memoCount) * 100) : 0;
</script>

<GlassCard>
	{#snippet children()}
		<div>
			<Text variant="large" weight="bold" class="mb-5 text-2xl">Engagement</Text>

			<!-- View Statistics -->
			<Text variant="muted" weight="semibold" class="mb-2 uppercase tracking-wide">
				Aufrufe
			</Text>
			<div class="mb-4 -space-y-px">
				{#if mostViewedMemo}
					<StatRow
						title="Meist angesehen"
						value={`${mostViewedMemo.viewCount}x`}
						subtitle={mostViewedMemo.title}
						icon="eye-outline"
					/>
				{/if}
				{#if lastViewedMemo}
					<StatRow
						title="Zuletzt angesehen"
						value={new Date(lastViewedMemo.lastViewed).toLocaleDateString('de-DE')}
						subtitle={lastViewedMemo.title}
						icon="time-outline"
					/>
				{/if}
			</div>

			<!-- Reading Statistics -->
			<Text variant="muted" weight="semibold" class="mb-2 uppercase tracking-wide">
				Lesestatus
			</Text>
			<div class="-space-y-px">
				<StatRow
					title="Ungelesene Memos"
					value={unreadMemos.toString()}
					icon="mail-unread-outline"
				/>
				<StatRow
					title="Gelesene Memos"
					value={readMemos.toString()}
					icon="checkmark-done-outline"
				/>
				<StatRow
					title="Gelesen"
					value={`${readPercentage}%`}
					subtitle={`${readMemos} von ${memoCount} Memos`}
					icon="stats-chart-outline"
				/>
			</div>

			{#if unreadMemos > 0}
				<div class="mt-4 rounded-xl bg-menu/30 p-3">
					<Text variant="small" class="text-theme-secondary">
						💡 Du hast noch {unreadMemos}
						{unreadMemos === 1 ? 'ungelesenes Memo' : 'ungelesene Memos'}
					</Text>
				</div>
			{/if}
		</div>
	{/snippet}
</GlassCard>
