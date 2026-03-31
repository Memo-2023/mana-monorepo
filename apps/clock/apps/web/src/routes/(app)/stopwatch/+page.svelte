<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { PageHeader } from '@manacore/shared-ui';
	import {
	import { Clock } from '@manacore/shared-icons';
		stopwatchesStore,
		formatTime,
		formatLapTime,
		STOPWATCH_COLORS,
		type Stopwatch,
	} from '$lib/stores/stopwatch.svelte';

	// Edit state
	let editingLabelId = $state<string | null>(null);
	let editingLabelValue = $state('');

	function handleCreateNew() {
		const id = stopwatchesStore.create();
		stopwatchesStore.start(id);
	}

	function handleFocus(id: string) {
		stopwatchesStore.setFocused(id);
	}

	function startEditLabel(sw: Stopwatch) {
		editingLabelId = sw.id;
		editingLabelValue = sw.label;
	}

	function saveLabel() {
		if (editingLabelId && editingLabelValue.trim()) {
			stopwatchesStore.updateLabel(editingLabelId, editingLabelValue.trim());
		}
		editingLabelId = null;
	}

	function handleLabelKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			saveLabel();
		} else if (e.key === 'Escape') {
			editingLabelId = null;
		}
	}

	// Derived states
	let focused = $derived(stopwatchesStore.focusedStopwatch);
	let otherStopwatches = $derived(
		stopwatchesStore.stopwatches.filter((sw) => sw.id !== stopwatchesStore.focusedId)
	);
</script>

<div class="flex items-center justify-between mb-6">
	<PageHeader title={$_('stopwatch.title')} size="md" />
	<button class="btn btn-primary btn-sm" onclick={handleCreateNew}>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-4 w-4 mr-1"
			viewBox="0 0 20 20"
			fill="currentColor"
		>
			<path
				fill-rule="evenodd"
				d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
				clip-rule="evenodd"
			/>
		</svg>
		{$_('stopwatch.new')}
	</button>
</div>

{#if stopwatchesStore.stopwatches.length === 0}
	<!-- Empty State -->
	<div class="flex flex-col items-center justify-center py-16 text-center">
		<div class="w-24 h-24 mb-6 rounded-full bg-muted flex items-center justify-center">
			<Clock size={20} class="text-muted-foreground" />
		</div>
		<h2 class="text-xl font-medium text-foreground mb-2">{$_('stopwatch.noStopwatches')}</h2>
		<p class="text-muted-foreground mb-6 max-w-sm">{$_('stopwatch.noStopwatchesDescription')}</p>
		<button class="btn btn-primary btn-lg" onclick={handleCreateNew}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 mr-2"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
					clip-rule="evenodd"
				/>
			</svg>
			{$_('stopwatch.startFirst')}
		</button>
	</div>
{:else}
	<div class="space-y-4">
		<!-- Focused Stopwatch (Large) -->
		{#if focused}
			{@const bestLap = stopwatchesStore.getBestLap(focused.id)}
			{@const worstLap = stopwatchesStore.getWorstLap(focused.id)}
			<div class="stopwatch-card-focused" style="--sw-color: {focused.color}">
				<!-- Header with Label and Delete -->
				<div class="flex items-center justify-between mb-4">
					<div class="flex items-center gap-2">
						<div
							class="w-3 h-3 rounded-full"
							class:animate-pulse={focused.isRunning}
							style="background-color: {focused.color}"
						></div>
						{#if editingLabelId === focused.id}
							<input
								type="text"
								class="bg-transparent border-b border-primary text-lg font-medium focus:outline-none"
								bind:value={editingLabelValue}
								onblur={saveLabel}
								onkeydown={handleLabelKeydown}
								autofocus
							/>
						{:else}
							<button
								class="text-lg font-medium hover:text-primary transition-colors"
								onclick={() => startEditLabel(focused)}
							>
								{focused.label}
							</button>
						{/if}
					</div>
					<button
						class="text-muted-foreground hover:text-error transition-colors p-1"
						onclick={() => stopwatchesStore.delete(focused.id)}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
				</div>

				<!-- Time Display -->
				<div class="flex flex-col items-center mb-6">
					<div
						class="digital-clock text-5xl sm:text-6xl font-light tabular-nums"
						class:text-primary={focused.isRunning}
					>
						{formatTime(focused.elapsedTime)}
					</div>
					{#if focused.laps.length > 0}
						<div class="text-sm text-muted-foreground mt-1">
							{focused.laps.length}
							{$_('stopwatch.laps')}
						</div>
					{/if}
				</div>

				<!-- Controls -->
				<div class="flex justify-center gap-3 mb-6">
					{#if focused.isRunning}
						<button
							class="btn btn-secondary btn-lg"
							onclick={() => stopwatchesStore.pause(focused.id)}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 mr-2"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
									clip-rule="evenodd"
								/>
							</svg>
							{$_('stopwatch.stop')}
						</button>
						<button class="btn btn-primary btn-lg" onclick={() => stopwatchesStore.lap(focused.id)}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 mr-2"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
									clip-rule="evenodd"
								/>
							</svg>
							{$_('stopwatch.lap')}
						</button>
					{:else if focused.elapsedTime > 0}
						<button
							class="btn btn-primary btn-lg"
							onclick={() => stopwatchesStore.start(focused.id)}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 mr-2"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
									clip-rule="evenodd"
								/>
							</svg>
							{$_('stopwatch.continue')}
						</button>
						<button
							class="btn btn-secondary btn-lg"
							onclick={() => stopwatchesStore.reset(focused.id)}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 mr-2"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
									clip-rule="evenodd"
								/>
							</svg>
							{$_('stopwatch.reset')}
						</button>
					{:else}
						<button
							class="btn btn-primary btn-lg"
							onclick={() => stopwatchesStore.start(focused.id)}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 mr-2"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
									clip-rule="evenodd"
								/>
							</svg>
							{$_('stopwatch.start')}
						</button>
					{/if}
				</div>

				<!-- Laps List -->
				{#if focused.laps.length > 0}
					<div class="border-t border-border pt-4">
						<h3 class="text-sm font-medium text-muted-foreground mb-3">
							{$_('stopwatch.laps')} ({focused.laps.length})
						</h3>
						<div class="max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
							{#each [...focused.laps].reverse() as lap (lap.number)}
								{@const isBest = bestLap?.number === lap.number}
								{@const isWorst = worstLap?.number === lap.number}
								<div class="lap-item rounded-md" class:best={isBest} class:worst={isWorst}>
									<span class="text-sm flex items-center gap-2">
										<span class="text-muted-foreground">#{lap.number}</span>
										{#if isBest}
											<span class="text-xs px-1.5 py-0.5 rounded bg-success/20 text-success"
												>{$_('stopwatch.best')}</span
											>
										{:else if isWorst}
											<span class="text-xs px-1.5 py-0.5 rounded bg-error/20 text-error"
												>{$_('stopwatch.worst')}</span
											>
										{/if}
									</span>
									<div class="text-right">
										<span class="font-mono text-sm">{formatLapTime(lap.time)}</span>
										<span class="font-mono text-xs text-muted-foreground ml-2">
											{formatTime(lap.splitTime)}
										</span>
									</div>
								</div>
							{/each}
						</div>
						<div class="flex justify-between border-t border-border mt-3 pt-3">
							<span class="text-sm font-medium">{$_('stopwatch.total')}</span>
							<span class="font-mono text-sm font-medium">
								{formatTime(focused.elapsedTime)}
							</span>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Other Stopwatches (Compact Grid) -->
		{#if otherStopwatches.length > 0}
			<div>
				<h2 class="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
					{$_('stopwatch.otherStopwatches')} ({otherStopwatches.length})
				</h2>
				<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
					{#each otherStopwatches as sw (sw.id)}
						<div
							class="stopwatch-card-compact"
							class:running={sw.isRunning}
							style="--sw-color: {sw.color}"
							onclick={() => handleFocus(sw.id)}
							onkeydown={(e) => e.key === 'Enter' && handleFocus(sw.id)}
							role="button"
							tabindex="0"
						>
							<!-- Status indicator -->
							<div class="flex items-center justify-between mb-2">
								<div
									class="w-2 h-2 rounded-full"
									class:animate-pulse={sw.isRunning}
									style="background-color: {sw.color}"
								></div>
								<button
									class="text-muted-foreground hover:text-error p-0.5 -mr-1"
									onclick={(e) => {
										e.stopPropagation();
										stopwatchesStore.delete(sw.id);
									}}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-3.5 w-3.5"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
											clip-rule="evenodd"
										/>
									</svg>
								</button>
							</div>

							<!-- Time -->
							<div class="text-xl font-light tabular-nums mb-1" class:text-primary={sw.isRunning}>
								{formatTime(sw.elapsedTime)}
							</div>

							<!-- Label -->
							<div class="text-xs text-muted-foreground truncate mb-2">
								{sw.label}
							</div>

							<!-- Quick actions -->
							<div class="flex gap-1">
								{#if sw.isRunning}
									<button
										class="btn btn-secondary btn-sm flex-1 text-xs"
										onclick={(e) => {
											e.stopPropagation();
											stopwatchesStore.pause(sw.id);
										}}
									>
										{$_('stopwatch.stop')}
									</button>
								{:else}
									<button
										class="btn btn-primary btn-sm flex-1 text-xs"
										onclick={(e) => {
											e.stopPropagation();
											stopwatchesStore.start(sw.id);
										}}
									>
										{sw.elapsedTime > 0 ? $_('stopwatch.continue') : $_('stopwatch.start')}
									</button>
								{/if}
								{#if sw.elapsedTime > 0 && !sw.isRunning}
									<button
										class="btn btn-ghost btn-sm text-xs"
										onclick={(e) => {
											e.stopPropagation();
											stopwatchesStore.reset(sw.id);
										}}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-3.5 w-3.5"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fill-rule="evenodd"
												d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
												clip-rule="evenodd"
											/>
										</svg>
									</button>
								{/if}
							</div>

							<!-- Lap badge -->
							{#if sw.laps.length > 0}
								<div class="absolute top-2 right-8 text-xs bg-muted px-1.5 py-0.5 rounded-full">
									{sw.laps.length}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.stopwatch-card-focused {
		background-color: hsl(var(--color-surface));
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		border: 2px solid var(--sw-color, hsl(var(--color-primary)));
		box-shadow: 0 0 20px
			color-mix(in srgb, var(--sw-color, hsl(var(--color-primary))) 20%, transparent);
	}

	.stopwatch-card-compact {
		position: relative;
		background-color: hsl(var(--color-surface));
		border-radius: var(--radius-md);
		padding: 0.75rem;
		border: 1px solid hsl(var(--color-border));
		transition: all var(--transition-base);
		cursor: pointer;
		text-align: left;
	}

	.stopwatch-card-compact:hover {
		border-color: var(--sw-color, hsl(var(--color-primary)));
		background-color: hsl(var(--color-muted) / 0.3);
	}

	.stopwatch-card-compact.running {
		border-color: var(--sw-color, hsl(var(--color-primary)));
		box-shadow: 0 0 10px
			color-mix(in srgb, var(--sw-color, hsl(var(--color-primary))) 15%, transparent);
	}

	.lap-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.75rem;
		background-color: hsl(var(--color-muted) / 0.3);
	}

	.lap-item.best {
		background-color: hsl(var(--color-success) / 0.1);
	}

	.lap-item.worst {
		background-color: hsl(var(--color-error) / 0.1);
	}
</style>
