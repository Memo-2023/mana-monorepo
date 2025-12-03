<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { stopwatchStore, formatTime, formatLapTime } from '$lib/stores/stopwatch.svelte';
</script>

<div class="flex flex-col items-center space-y-8">
	<!-- Header -->
	<h1 class="text-2xl font-bold text-foreground">{$_('stopwatch.title')}</h1>

	<!-- Time Display -->
	<div class="digital-clock text-6xl font-light text-foreground sm:text-7xl">
		{stopwatchStore.formattedTime}
	</div>

	<!-- Controls -->
	<div class="flex gap-4">
		{#if stopwatchStore.isRunning}
			<button class="btn btn-secondary btn-xl" onclick={() => stopwatchStore.pause()}>
				{$_('stopwatch.stop')}
			</button>
			<button class="btn btn-primary btn-xl" onclick={() => stopwatchStore.lap()}>
				{$_('stopwatch.lap')}
			</button>
		{:else if stopwatchStore.elapsedTime > 0}
			<button class="btn btn-primary btn-xl" onclick={() => stopwatchStore.start()}>
				{$_('stopwatch.start')}
			</button>
			<button class="btn btn-secondary btn-xl" onclick={() => stopwatchStore.reset()}>
				{$_('stopwatch.reset')}
			</button>
		{:else}
			<button class="btn btn-primary btn-xl" onclick={() => stopwatchStore.start()}>
				{$_('stopwatch.start')}
			</button>
		{/if}
	</div>

	<!-- Laps -->
	{#if stopwatchStore.laps.length > 0}
		<div class="card w-full max-w-md">
			<h3 class="mb-3 text-sm font-medium text-muted-foreground">
				{$_('stopwatch.laps')} ({stopwatchStore.laps.length})
			</h3>
			<div class="max-h-64 overflow-y-auto">
				{#each [...stopwatchStore.laps].reverse() as lap (lap.number)}
					{@const isBest = stopwatchStore.bestLap?.number === lap.number}
					{@const isWorst = stopwatchStore.worstLap?.number === lap.number}
					<div class="lap-item" class:best={isBest} class:worst={isWorst}>
						<span class="text-sm">
							Runde {lap.number}
							{#if isBest}
								<span class="ml-1 text-xs">({$_('stopwatch.best')})</span>
							{:else if isWorst}
								<span class="ml-1 text-xs">({$_('stopwatch.worst')})</span>
							{/if}
						</span>
						<span class="font-mono text-sm">
							{formatLapTime(lap.time)}
						</span>
					</div>
				{/each}
			</div>
			<div class="mt-3 flex justify-between border-t border-border pt-3">
				<span class="text-sm font-medium">{$_('stopwatch.total')}</span>
				<span class="font-mono text-sm font-medium">
					{formatTime(stopwatchStore.elapsedTime)}
				</span>
			</div>
		</div>
	{/if}
</div>
