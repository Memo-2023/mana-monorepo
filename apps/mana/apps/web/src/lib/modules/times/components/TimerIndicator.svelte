<script lang="ts">
	import { getContext } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { timerStore } from '$lib/modules/times/stores/timer.svelte';
	import { formatDuration } from '$lib/modules/times/queries';
	import { Stop } from '@mana/shared-icons';
	import type { Project } from '$lib/modules/times/types';

	const allProjects = getContext<{ value: Project[] }>('projects');

	let project = $derived(
		timerStore.runningEntry?.projectId
			? allProjects.value.find((p) => p.id === timerStore.runningEntry!.projectId)
			: undefined
	);

	let formattedTime = $derived(formatDuration(timerStore.elapsedSeconds));

	async function handleStop() {
		await timerStore.stop();
	}
</script>

{#if timerStore.isRunning}
	<div
		class="flex items-center gap-2 rounded-lg bg-[hsl(var(--primary)/0.1)] px-3 py-1.5 border border-[hsl(var(--primary)/0.2)]"
	>
		<!-- Pulsing dot -->
		<div class="relative flex h-2 w-2">
			<span
				class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--primary))] opacity-75"
			></span>
			<span class="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--primary))]"></span>
		</div>

		<!-- Project dot + Description -->
		{#if project}
			<div
				class="h-2.5 w-2.5 rounded-full shrink-0"
				style="background-color: {project.color}"
			></div>
		{/if}
		<span class="hidden sm:inline max-w-[120px] truncate text-xs text-[hsl(var(--foreground))]">
			{timerStore.runningEntry?.description || $_('timer.running')}
		</span>

		<!-- Elapsed time -->
		<span class="duration-display text-xs font-medium text-[hsl(var(--primary))]">
			{formattedTime}
		</span>

		<!-- Stop button -->
		<button
			onclick={handleStop}
			class="flex h-5 w-5 items-center justify-center rounded bg-red-500 text-white transition-colors hover:bg-red-600"
			title={$_('timer.stop')}
		>
			<Stop size={10} weight="fill" />
		</button>
	</div>
{/if}
