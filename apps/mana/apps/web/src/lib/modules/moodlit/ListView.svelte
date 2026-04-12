<!--
  Moodlit — Workbench ListView
  Ambient mood selector with color preview.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { BaseListView } from '@mana/shared-ui';
	import type { LocalMood, AnimationType } from './types';
	import { ANIMATIONS } from './types';
	import { moodsStore } from './stores/moods.svelte';
	import { ContextMenu, type ContextMenuItem } from '@mana/shared-ui';
	import { useItemContextMenu } from '$lib/data/item-context-menu.svelte';
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

	// ── Inline create ──────────────────────────────────────
	let creating = $state(false);
	let newName = $state('');
	let newColors = $state<string[]>(['#667eea', '#764ba2']);
	let newAnimation = $state<AnimationType>('gradient');

	function addColor() {
		if (newColors.length < 8) {
			const hex =
				'#' +
				Math.floor(Math.random() * 16777215)
					.toString(16)
					.padStart(6, '0');
			newColors = [...newColors, hex];
		}
	}

	function removeColor(index: number) {
		if (newColors.length > 1) {
			newColors = newColors.filter((_, i) => i !== index);
		}
	}

	async function handleCreate() {
		const name = newName.trim();
		if (!name || newColors.length === 0) return;
		await moodsStore.createMood({ name, colors: newColors, animation: newAnimation });
		newName = '';
		newColors = ['#667eea', '#764ba2'];
		newAnimation = 'gradient';
		creating = false;
	}

	const ctxMenu = useItemContextMenu<LocalMood>();

	let ctxMenuItems = $derived<ContextMenuItem[]>(
		ctxMenu.state.target
			? [
					{
						id: 'activate',
						label: activeMoodId === ctxMenu.state.target.id ? 'Deaktivieren' : 'Aktivieren',
						icon: Power,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) activeMoodId = activeMoodId === target.id ? null : target.id;
						},
					},
					{ id: 'div', label: '', type: 'divider' as const },
					{
						id: 'delete',
						label: 'Löschen',
						icon: Trash,
						variant: 'danger' as const,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) {
								if (activeMoodId === target.id) activeMoodId = null;
								moodsStore.deleteMood(target.id);
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
			<div
				class="flex h-24 items-center justify-center rounded-lg bg-[hsl(var(--color-foreground)/0.05)]"
			>
				<p class="text-sm text-[hsl(var(--color-muted-foreground))]">Kein Mood aktiv</p>
			</div>
		{/if}

		<!-- Create toggle -->
		<div class="flex items-center justify-between">
			<span class="text-xs text-[hsl(var(--color-muted-foreground))]">{moods.length} Moods</span>
			<button
				type="button"
				class="text-xs text-[hsl(var(--color-muted-foreground))] transition-colors hover:text-[hsl(var(--color-foreground))]"
				onclick={() => (creating = !creating)}
			>
				{creating ? 'Abbrechen' : '+ Neues Mood'}
			</button>
		</div>

		{#if creating}
			<div class="flex flex-col gap-2 rounded-lg bg-[hsl(var(--color-foreground)/0.05)] p-3">
				<!-- Preview -->
				<div
					class="flex h-12 items-center justify-center rounded-md"
					style={gradientStyle(newColors)}
				>
					<span class="text-xs font-medium text-white drop-shadow">{newName || 'Vorschau'}</span>
				</div>

				<!-- Name -->
				<input
					type="text"
					bind:value={newName}
					placeholder="Mood-Name"
					class="rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-foreground)/0.05)] px-3 py-1.5 text-sm text-[hsl(var(--color-foreground))] placeholder:text-[hsl(var(--color-muted-foreground)/0.5)] focus:border-[hsl(var(--color-border))] focus:outline-none"
				/>

				<!-- Colors -->
				<div class="flex flex-wrap items-center gap-1.5">
					{#each newColors as color, i}
						<div class="relative">
							<input
								type="color"
								value={color}
								onchange={(e) => {
									newColors = newColors.map((c, j) => (j === i ? e.currentTarget.value : c));
								}}
								class="h-8 w-8 cursor-pointer rounded-md border border-[hsl(var(--color-border))]"
							/>
							{#if newColors.length > 1}
								<button
									type="button"
									class="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] text-white"
									onclick={() => removeColor(i)}>x</button
								>
							{/if}
						</div>
					{/each}
					{#if newColors.length < 8}
						<button
							type="button"
							class="flex h-8 w-8 items-center justify-center rounded-md border border-dashed border-[hsl(var(--color-border))] text-[hsl(var(--color-muted-foreground))] transition-colors hover:text-[hsl(var(--color-foreground))]"
							onclick={addColor}>+</button
						>
					{/if}
				</div>

				<!-- Animation -->
				<select
					bind:value={newAnimation}
					class="rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-foreground)/0.05)] px-3 py-1.5 text-sm text-[hsl(var(--color-foreground))] focus:border-[hsl(var(--color-border))] focus:outline-none"
				>
					{#each ANIMATIONS as anim (anim.id)}
						<option value={anim.id}>{anim.name}</option>
					{/each}
				</select>

				<!-- Save -->
				<button
					type="button"
					class="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
					disabled={!newName.trim() || newColors.length === 0}
					onclick={handleCreate}
				>
					Mood erstellen
				</button>
			</div>
		{/if}
	{/snippet}

	{#snippet item(mood)}
		<button
			onclick={() => (activeMoodId = activeMoodId === mood.id ? null : mood.id)}
			oncontextmenu={(e) => ctxMenu.open(e, mood)}
			class="group flex flex-col items-center gap-1.5 rounded-lg p-2 transition-colors hover:bg-[hsl(var(--color-foreground)/0.05)]
				{activeMoodId === mood.id ? 'ring-1 ring-[hsl(var(--color-border))]' : ''}"
		>
			<div class="h-10 w-10 rounded-full" style={gradientStyle(mood.colors)}></div>
			<span
				class="text-[10px] text-[hsl(var(--color-muted-foreground))] group-hover:text-[hsl(var(--color-foreground))]"
				>{mood.name}</span
			>
		</button>
	{/snippet}
</BaseListView>

<ContextMenu
	visible={ctxMenu.state.visible}
	x={ctxMenu.state.x}
	y={ctxMenu.state.y}
	items={ctxMenuItems}
	onClose={ctxMenu.close}
/>
