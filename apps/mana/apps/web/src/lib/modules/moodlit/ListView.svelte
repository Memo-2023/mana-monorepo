<!--
  Moodlit — Workbench ListView
  Ambient mood selector with color preview.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { BaseListView } from '@mana/shared-ui';
	import type { LocalMood, AnimationType, Mood } from './types';
	import { ANIMATIONS } from './types';
	import { moodsStore } from './stores/moods.svelte';
	import { ContextMenu, type ContextMenuItem } from '@mana/shared-ui';
	import { useItemContextMenu } from '$lib/data/item-context-menu.svelte';
	import { Trash, Power } from '@mana/shared-icons';
	import MoodFullscreen from './components/mood/MoodFullscreen.svelte';

	const moodsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalMood>('moods').toArray();
		return all.filter((m) => !m.deletedAt);
	}, [] as LocalMood[]);

	const moods = $derived(moodsQuery.value);

	let fullscreenMood = $state<LocalMood | null>(null);

	function toMood(local: LocalMood): Mood {
		return {
			id: local.id,
			name: local.name,
			colors: local.colors,
			animationType: local.animation as AnimationType,
		};
	}

	function gradientStyle(colors: string[]): string {
		if (colors.length === 0) return 'background: hsl(var(--color-muted))';
		if (colors.length === 1) return `background: ${colors[0]}`;
		return `background: linear-gradient(135deg, ${colors.join(', ')})`;
	}

	function getAnimClass(animation: string): string {
		switch (animation) {
			case 'pulse':
			case 'breath':
				return 'anim-breath';
			case 'wave':
			case 'ocean':
				return 'anim-wave';
			case 'candle':
			case 'fire':
				return 'anim-candle';
			case 'disco':
			case 'rave':
				return 'anim-disco';
			default:
				return 'anim-gradient';
		}
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
						label: 'Aktivieren',
						icon: Power,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) fullscreenMood = target;
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
							if (target) moodsStore.deleteMood(target.id);
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
					class="relative flex h-12 items-center justify-center overflow-hidden rounded-lg"
					style={gradientStyle(newColors)}
				>
					<div
						class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"
					></div>
					<span class="relative text-xs font-medium text-white drop-shadow-md"
						>{newName || 'Vorschau'}</span
					>
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
									class="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-error text-[8px] text-white"
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
					class="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
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
			onclick={() => (fullscreenMood = mood)}
			oncontextmenu={(e) => ctxMenu.open(e, mood)}
			class="mood-card group relative aspect-[4/3] w-full select-none overflow-hidden rounded-xl border-2 border-transparent [-webkit-touch-callout:none] focus:outline-none"
			style:transition="border-color 0.2s, transform 0.2s"
			style="--mood-color: {mood.colors[0]}"
		>
			<div
				class="absolute inset-0 {getAnimClass(mood.animation)}"
				style="{gradientStyle(mood.colors)}; background-size: 400% 400%;"
			></div>
			<div
				class="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"
			></div>
			<span
				class="absolute inset-x-0 bottom-0 px-2 pb-1.5 text-[10px] font-medium text-white drop-shadow-md"
			>
				{mood.name}
			</span>
		</button>
	{/snippet}
</BaseListView>

{#if fullscreenMood}
	<MoodFullscreen mood={toMood(fullscreenMood)} minimal onClose={() => (fullscreenMood = null)} />
{/if}

<ContextMenu
	visible={ctxMenu.state.visible}
	x={ctxMenu.state.x}
	y={ctxMenu.state.y}
	items={ctxMenuItems}
	onClose={ctxMenu.close}
/>

<style>
	/* Mood cards always sit on a vivid colour gradient, so the hover ring
	   is intentionally white (brand literal, not theme-intent — see
	   packages/shared-tailwind/src/themes.css §4). */
	.mood-card:hover {
		border-color: rgba(255, 255, 255, 0.4);
	}

	.anim-gradient {
		animation: gradient-shift 8s ease infinite;
	}
	.anim-breath {
		animation: breath 4s ease-in-out infinite;
	}
	.anim-wave {
		animation: wave 3s ease-in-out infinite;
	}
	.anim-candle {
		animation: candle 0.8s ease-in-out infinite;
	}
	.anim-disco {
		animation: disco 2s linear infinite;
	}

	@keyframes gradient-shift {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}
	@keyframes breath {
		0%,
		100% {
			opacity: 0.85;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.02);
		}
	}
	@keyframes wave {
		0%,
		100% {
			background-position: 0% 50%;
			opacity: 1;
		}
		50% {
			background-position: 100% 50%;
			opacity: 0.85;
		}
	}
	@keyframes candle {
		0%,
		100% {
			filter: brightness(1);
		}
		25% {
			filter: brightness(0.92);
		}
		50% {
			filter: brightness(1.08);
		}
		75% {
			filter: brightness(0.95);
		}
	}
	@keyframes disco {
		0% {
			filter: hue-rotate(0deg) saturate(1.2);
		}
		100% {
			filter: hue-rotate(360deg) saturate(1.2);
		}
	}
</style>
