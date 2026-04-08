<!--
  Moodlit — Workbench ListView
  Ambient mood selector with color preview.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { BaseListView } from '@mana/shared-ui';
	import type { LocalMood } from './types';
	import { moodsStore } from './stores/moods.svelte';
	import { ContextMenu, type ContextMenuItem } from '@mana/shared-ui';
	import { Trash, Power } from '@mana/shared-icons';

	const moodsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalMood>('moods').toArray();
		return all.filter((m) => !m.deletedAt);
	}, [] as LocalMood[]);

	const moods = $derived(moodsQuery.value);

	let activeMoodId = $state<string | null>(null);
	const activeMood = $derived(moods.find((m) => m.id === activeMoodId));

	function gradientStyle(colors: string[]): string {
		if (colors.length === 0) return 'background: #333';
		if (colors.length === 1) return `background: ${colors[0]}`;
		return `background: linear-gradient(135deg, ${colors.join(', ')})`;
	}

	// Context menu
	let ctxMenu = $state<{ visible: boolean; x: number; y: number; mood: LocalMood | null }>({
		visible: false,
		x: 0,
		y: 0,
		mood: null,
	});

	function handleItemContextMenu(e: MouseEvent, mood: LocalMood) {
		e.preventDefault();
		ctxMenu = { visible: true, x: e.clientX, y: e.clientY, mood };
	}

	let ctxMenuItems = $derived<ContextMenuItem[]>(
		ctxMenu.mood
			? [
					{
						id: 'activate',
						label: activeMoodId === ctxMenu.mood.id ? 'Deaktivieren' : 'Aktivieren',
						icon: Power,
						action: () => {
							if (ctxMenu.mood)
								activeMoodId = activeMoodId === ctxMenu.mood.id ? null : ctxMenu.mood.id;
						},
					},
					{ id: 'div', label: '', type: 'divider' as const },
					{
						id: 'delete',
						label: 'Löschen',
						icon: Trash,
						variant: 'danger' as const,
						action: () => {
							if (ctxMenu.mood) {
								if (activeMoodId === ctxMenu.mood.id) activeMoodId = null;
								moodsStore.deleteMood(ctxMenu.mood.id);
							}
						},
					},
				]
			: []
	);
</script>

<BaseListView
	items={moods}
	getKey={(m) => m.id}
	emptyTitle="Keine Moods"
	class="gap-4"
	listClass="grid grid-cols-2 sm:grid-cols-3 gap-2 content-start"
>
	{#snippet toolbar()}
		<!-- Active mood preview -->
		{#if activeMood}
			<div
				class="flex h-24 items-center justify-center rounded-lg"
				style={gradientStyle(activeMood.colors)}
			>
				<p class="text-sm font-medium text-white drop-shadow">{activeMood.name}</p>
			</div>
		{:else}
			<div class="flex h-24 items-center justify-center rounded-lg bg-white/5">
				<p class="text-sm text-white/30">Kein Mood aktiv</p>
			</div>
		{/if}
	{/snippet}

	{#snippet item(mood)}
		<button
			onclick={() => (activeMoodId = activeMoodId === mood.id ? null : mood.id)}
			oncontextmenu={(e) => handleItemContextMenu(e, mood)}
			class="group flex flex-col items-center gap-1.5 rounded-lg p-2 transition-colors hover:bg-white/5
				{activeMoodId === mood.id ? 'ring-1 ring-white/30' : ''}"
		>
			<div class="h-10 w-10 rounded-full" style={gradientStyle(mood.colors)}></div>
			<span class="text-[10px] text-white/50 group-hover:text-white/70">{mood.name}</span>
		</button>
	{/snippet}
</BaseListView>

<ContextMenu
	visible={ctxMenu.visible}
	x={ctxMenu.x}
	y={ctxMenu.y}
	items={ctxMenuItems}
	onClose={() => (ctxMenu = { ...ctxMenu, visible: false, mood: null })}
/>
