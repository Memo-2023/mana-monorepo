<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { useLiveQuery } from '@mana/local-store/svelte';
	import { moodTable } from '$lib/modules/moodlit/collections';
	import { moodsStore } from '$lib/modules/moodlit/stores/moods.svelte';
	import type { LocalMood, Mood, AnimationType } from '$lib/modules/moodlit/types';
	import { db } from '$lib/data/database';
	import { toast } from '$lib/stores/toast.svelte';
	import { X } from '@mana/shared-icons';
	import MoodFullscreen from '$lib/modules/moodlit/components/mood/MoodFullscreen.svelte';

	const moods = useLiveQuery(() =>
		db
			.table<LocalMood>('moods')
			.toArray()
			.then((all) => all.filter((m) => !m.deletedAt))
	);

	let showCreate = $state(false);
	let newName = $state('');
	let newColors = $state(['#7c3aed', '#a78bfa', '#c4b5fd']);
	let newAnimation = $state('gradient');
	let fullscreenMood = $state<LocalMood | null>(null);

	function toMood(local: LocalMood): Mood {
		return {
			id: local.id,
			name: local.name,
			colors: local.colors,
			animationType: local.animation as AnimationType,
		};
	}

	async function createMood() {
		if (!newName) return;
		await moodsStore.createMood({
			name: newName,
			colors: newColors,
			animation: newAnimation,
		});
		toast.success(`"${newName}" erstellt`);
		newName = '';
		showCreate = false;
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

	async function deleteMood(mood: LocalMood) {
		if (mood.isDefault) {
			toast.error('Standard-Moods konnen nicht geloscht werden');
			return;
		}
		await moodsStore.deleteMood(mood.id);
		toast.success('Geloscht');
	}
</script>

<svelte:head>
	<title>Moods - Moodlit - Mana</title>
</svelte:head>

<div class="mx-auto max-w-4xl">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Moods</h1>
		<button
			onclick={() => (showCreate = !showCreate)}
			class="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700"
		>
			{showCreate ? 'Schliessen' : '+ Neues Mood'}
		</button>
	</div>

	{#if showCreate}
		<div class="mb-6 rounded-xl border border-border bg-card p-6">
			<div class="grid gap-4 md:grid-cols-2">
				<div>
					<label for="moodlit-name" class="mb-1 block text-sm font-medium text-muted-foreground"
						>Name</label
					>
					<input
						id="moodlit-name"
						type="text"
						bind:value={newName}
						placeholder="Mein Mood"
						class="w-full rounded-lg border border-border bg-input px-4 py-2 text-foreground"
					/>
				</div>
				<div>
					<label
						for="moodlit-animation"
						class="mb-1 block text-sm font-medium text-muted-foreground">Animation</label
					>
					<select
						id="moodlit-animation"
						bind:value={newAnimation}
						class="w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground"
					>
						<option value="gradient">Gradient</option>
						<option value="pulse">Pulse</option>
						<option value="wave">Wave</option>
						<option value="flicker">Flicker</option>
						<option value="aurora">Aurora</option>
					</select>
				</div>
				<div class="md:col-span-2">
					<span class="mb-1 block text-sm font-medium text-muted-foreground">Farben</span>
					<div class="flex gap-2">
						{#each newColors as color, i}
							<input
								type="color"
								bind:value={newColors[i]}
								class="h-10 w-14 cursor-pointer rounded border border-border"
							/>
						{/each}
						<button
							onclick={() => (newColors = [...newColors, '#ffffff'])}
							class="rounded border border-border px-3 text-sm text-muted-foreground hover:bg-muted"
							>+</button
						>
					</div>
				</div>
			</div>
			<div
				class="mt-2 h-4 rounded-full"
				style="background: linear-gradient(90deg, {newColors.join(', ')})"
			></div>
			<button
				onclick={createMood}
				disabled={!newName}
				class="mt-4 rounded-lg bg-purple-600 px-6 py-2 font-medium text-white hover:bg-purple-700 disabled:opacity-50"
				>{$_('common.create')}</button
			>
		</div>
	{/if}

	{#if moods.loading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="aspect-[16/10] animate-pulse rounded-2xl bg-muted"></div>
			{/each}
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each moods.value ?? [] as mood (mood.id)}
				{@const gradient =
					mood.colors.length === 1
						? mood.colors[0]
						: `linear-gradient(135deg, ${mood.colors.join(', ')})`}
				<button
					onclick={() => (fullscreenMood = mood)}
					class="mood-card group relative aspect-[16/10] w-full overflow-hidden rounded-2xl border-[3px] border-transparent transition-colors duration-200 hover:border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
					style="--mood-color: {mood.colors[0]}"
				>
					<div
						class="absolute inset-0 {getAnimClass(mood.animation)}"
						style="background: {gradient}; background-size: 400% 400%;"
					></div>
					<div
						class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
					></div>
					<div class="absolute inset-x-0 bottom-0 p-4 text-left">
						<h3 class="text-lg font-semibold text-white drop-shadow-md">{mood.name}</h3>
						<span
							class="mt-1 inline-block rounded-full bg-muted/20 px-2 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-sm capitalize"
							>{mood.animation}</span
						>
					</div>
					{#if !mood.isDefault}
						<!-- svelte-ignore node_invalid_placement_ssr -->
						<div
							role="button"
							tabindex="-1"
							onclick={(e) => {
								e.stopPropagation();
								deleteMood(mood);
							}}
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									e.stopPropagation();
									deleteMood(mood);
								}
							}}
							class="absolute right-2 top-2 rounded-full bg-black/20 p-1.5 text-foreground opacity-0 backdrop-blur-sm transition-colors hover:bg-black/40 hover:text-white group-hover:opacity-100 cursor-pointer"
						>
							<X size={14} />
						</div>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

{#if fullscreenMood}
	<MoodFullscreen mood={toMood(fullscreenMood)} minimal onClose={() => (fullscreenMood = null)} />
{/if}

<style>
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
