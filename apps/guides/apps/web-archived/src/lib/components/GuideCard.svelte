<script lang="ts">
	import type { LocalGuide } from '$lib/data/local-store.js';

	interface Props {
		guide: LocalGuide;
		runCount: number;
		hasActiveRun: boolean;
	}

	let { guide, runCount, hasActiveRun }: Props = $props();

	const difficultyConfig = {
		easy: { label: 'Einfach', dot: 'bg-green-500' },
		medium: { label: 'Mittel', dot: 'bg-amber-400' },
		hard: { label: 'Schwer', dot: 'bg-red-400' },
	};

	// Run status indicator
	// ○ Neu  ◑ Aktiv  ⟳ Wiederholt (3+)  ● Abgeschlossen
	let runStatus = $derived(
		hasActiveRun ? 'active' : runCount >= 3 ? 'repeated' : runCount > 0 ? 'done' : 'new'
	);

	const statusConfig = {
		new: { icon: '○', label: 'Neu', color: 'text-muted-foreground' },
		active: { icon: '◑', label: 'Aktiv', color: 'text-primary' },
		done: { icon: '●', label: 'Abgeschlossen', color: 'text-green-500' },
		repeated: { icon: '⟳', label: `${runCount}× abgeschlossen`, color: 'text-teal-500' },
	};
</script>

<a
	href="/guide/{guide.id}"
	class="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
>
	<!-- Cover -->
	<div
		class="flex h-28 items-center justify-center"
		style="background-color: {guide.coverColor ?? '#0d9488'}18"
	>
		<span class="text-5xl transition-transform group-hover:scale-110">
			{guide.coverEmoji ?? '📖'}
		</span>
	</div>

	<!-- Content -->
	<div class="flex flex-1 flex-col p-4">
		<div class="mb-1 flex items-start justify-between gap-2">
			<h3 class="flex-1 text-sm font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary">
				{guide.title}
			</h3>
		</div>

		{#if guide.description}
			<p class="mb-3 text-xs text-muted-foreground line-clamp-2">{guide.description}</p>
		{/if}

		<div class="mt-auto flex items-center justify-between">
			<div class="flex items-center gap-2">
				<!-- Difficulty dot -->
				<div class="flex items-center gap-1">
					<span class="h-1.5 w-1.5 rounded-full {difficultyConfig[guide.difficulty].dot}"></span>
					<span class="text-xs text-muted-foreground">{difficultyConfig[guide.difficulty].label}</span>
				</div>
				{#if guide.estimatedMinutes}
					<span class="text-xs text-muted-foreground">· {guide.estimatedMinutes}min</span>
				{/if}
			</div>

			<!-- Run status -->
			<span class="text-xs {statusConfig[runStatus].color}" title={statusConfig[runStatus].label}>
				{statusConfig[runStatus].icon}
				{#if runStatus === 'repeated'}
					<span class="ml-0.5">{runCount}×</span>
				{/if}
			</span>
		</div>
	</div>
</a>
