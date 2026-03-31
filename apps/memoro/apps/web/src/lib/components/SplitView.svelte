<script lang="ts">
	import { t } from 'svelte-i18n';
	import { tabs } from '$lib/stores/tabs';
	import TabBar from '$lib/components/TabBar.svelte';
	import MemoPanel from '$lib/components/memo/MemoPanel.svelte';
	import type { Memo } from '$lib/types/memo.types';

	interface Props {
		onOpenInSplit?: (
			memo: Memo,
			direction: 'vertical' | 'horizontal',
			audioUrl: string | null
		) => void;
	}

	let { onOpenInSplit }: Props = $props();

	function handleCloseSplit(splitId: string) {
		tabs.closeSplit(splitId);
	}
</script>

{#if $tabs.splits.length === 0}
	<!-- Empty State -->
	<div class="flex h-full items-center justify-center p-4">
		<div class="text-center rounded-xl border border-theme bg-content p-8">
			<div class="mb-6 text-8xl">📝</div>
			<h2 class="mb-2 text-2xl font-bold text-theme">{$t('memo.no_memo_selected')}</h2>
			<p class="text-theme-secondary">
				{$t('memo.select_memo_hint')}
			</p>
		</div>
	</div>
{:else if $tabs.splits.length === 1}
	<!-- Single Split -->
	{@const split = $tabs.splits[0]}
	{@const activeTab = split.tabs.find((t) => t.id === split.activeTabId)}

	<div class="relative h-full w-full overflow-hidden pt-3 pl-2 pr-4">
		<!-- Floating TabBar (only show when multiple tabs) -->
		{#if split.tabs.length > 1}
			<div class="absolute top-6 left-8 right-8 z-10">
				<TabBar
					{split}
					onSplitVertical={() => {
						if (activeTab?.memo && onOpenInSplit) {
							onOpenInSplit(activeTab.memo, 'vertical', activeTab.audioUrl);
						}
					}}
					onSplitHorizontal={() => {
						if (activeTab?.memo && onOpenInSplit) {
							onOpenInSplit(activeTab.memo, 'horizontal', activeTab.audioUrl);
						}
					}}
				/>
			</div>
		{/if}
		<!-- Content -->
		<div
			class="h-full w-full overflow-hidden rounded-t-xl border border-theme border-b-0 bg-content {split
				.tabs.length > 1
				? 'pt-10'
				: ''}"
		>
			<MemoPanel memo={activeTab?.memo || null} audioUrl={activeTab?.audioUrl || null} />
		</div>
	</div>
{:else if $tabs.splits.length === 2}
	<!-- Two Splits -->
	{@const split1 = $tabs.splits[0]}
	{@const split2 = $tabs.splits[1]}
	{@const activeTab1 = split1.tabs.find((t) => t.id === split1.activeTabId)}
	{@const activeTab2 = split2.tabs.find((t) => t.id === split2.activeTabId)}

	<!-- Determine layout based on first split's direction -->
	{@const isVertical = split2.direction === 'vertical'}

	<div class="flex h-full {isVertical ? 'flex-row' : 'flex-col'} gap-4 p-4">
		<!-- Split 1 -->
		<div
			class="flex {isVertical
				? 'w-1/2'
				: 'h-1/2'} flex-col rounded-xl border border-theme bg-content overflow-hidden"
		>
			<TabBar split={split1} onCloseSplit={() => handleCloseSplit(split1.id)} />
			<div class="flex-1 overflow-hidden">
				<MemoPanel memo={activeTab1?.memo || null} audioUrl={activeTab1?.audioUrl || null} />
			</div>
		</div>

		<!-- Split 2 -->
		<div
			class="flex {isVertical
				? 'w-1/2'
				: 'h-1/2'} flex-col rounded-xl border border-theme bg-content overflow-hidden"
		>
			<TabBar split={split2} onCloseSplit={() => handleCloseSplit(split2.id)} />
			<div class="flex-1 overflow-hidden">
				<MemoPanel memo={activeTab2?.memo || null} audioUrl={activeTab2?.audioUrl || null} />
			</div>
		</div>
	</div>
{:else if $tabs.splits.length === 3}
	<!-- Three Splits (2 top, 1 bottom) -->
	<div class="flex h-full flex-col gap-4 p-4">
		<!-- Top Row -->
		<div class="flex h-1/2 gap-4">
			{#each $tabs.splits.slice(0, 2) as split}
				{@const activeTab = split.tabs.find((t) => t.id === split.activeTabId)}
				<div class="flex flex-1 flex-col rounded-xl border border-theme bg-content overflow-hidden">
					<TabBar {split} onCloseSplit={() => handleCloseSplit(split.id)} />
					<div class="flex-1 overflow-hidden">
						<MemoPanel memo={activeTab?.memo || null} audioUrl={activeTab?.audioUrl || null} />
					</div>
				</div>
			{/each}
		</div>

		<!-- Bottom Row -->
		{#if $tabs.splits[2]}
			{@const split3 = $tabs.splits[2]}
			{@const activeTab3 = split3.tabs.find((t) => t.id === split3.activeTabId)}
			<div class="flex h-1/2 flex-col rounded-xl border border-theme bg-content overflow-hidden">
				<TabBar split={split3} onCloseSplit={() => handleCloseSplit(split3.id)} />
				<div class="flex-1 overflow-hidden">
					<MemoPanel memo={activeTab3?.memo || null} audioUrl={activeTab3?.audioUrl || null} />
				</div>
			</div>
		{/if}
	</div>
{:else}
	<!-- Four Splits (2x2 Grid) -->
	<div class="grid h-full grid-cols-2 grid-rows-2 gap-4 p-4">
		{#each $tabs.splits.slice(0, 4) as split}
			{@const activeTab = split.tabs.find((t) => t.id === split.activeTabId)}
			<div class="flex flex-col rounded-xl border border-theme bg-content overflow-hidden">
				<TabBar {split} onCloseSplit={() => handleCloseSplit(split.id)} />
				<div class="flex-1 overflow-hidden">
					<MemoPanel memo={activeTab?.memo || null} audioUrl={activeTab?.audioUrl || null} />
				</div>
			</div>
		{/each}
	</div>
{/if}
