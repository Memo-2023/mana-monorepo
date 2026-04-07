<script lang="ts">
	/**
	 * CyclesWidget — Aktuelle Phase + Countdown bis zur nächsten Periode.
	 *
	 * Liest direkt aus der unified IndexedDB (cycles table) und leitet Phase
	 * + Vorhersage pro Render ab. Linkt zur /cycles Route.
	 */

	import { _, locale } from 'svelte-i18n';
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { derivePhase, getCycleDayNumber } from '$lib/modules/cycles/utils/phase';
	import {
		daysUntilNextPeriod,
		predictNextPeriodStart,
	} from '$lib/modules/cycles/utils/prediction';
	import { PHASE_COLORS, type Cycle, type LocalCycle } from '$lib/modules/cycles/types';
	import { toCycle } from '$lib/modules/cycles/queries';

	let cycles: Cycle[] = $state([]);
	let loading = $state(true);

	$effect(() => {
		const sub = liveQuery(async () => {
			const locals = await db.table<LocalCycle>('cycles').toArray();
			return locals.filter((c) => !c.deletedAt && !c.isArchived).map(toCycle);
		}).subscribe({
			next: (val) => {
				cycles = val;
				loading = false;
			},
			error: () => {
				loading = false;
			},
		});
		return () => sub.unsubscribe();
	});

	const todayIso = new Date().toISOString().slice(0, 10);

	const phase = $derived(derivePhase(todayIso, cycles));
	const currentCycle = $derived(
		cycles
			.filter((c) => !c.isPredicted)
			.sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ?? null
	);
	const cycleDay = $derived(currentCycle ? getCycleDayNumber(todayIso, currentCycle) : null);
	const daysUntil = $derived(daysUntilNextPeriod(cycles));
	const nextPeriod = $derived(predictNextPeriodStart(cycles));

	const dateLocale = $derived.by(() => {
		const l = $locale ?? 'de';
		return l === 'de' ? 'de-DE' : l;
	});

	function formatShortDate(iso: string | null): string {
		if (!iso) return '—';
		return new Date(iso).toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit' });
	}
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			{$_('dashboard.widgets.cycles.title')}
		</h3>
		{#if phase !== 'unknown'}
			<span
				class="rounded-full px-2.5 py-0.5 text-sm font-medium"
				style="background: color-mix(in srgb, {PHASE_COLORS[
					phase
				]} 14%, transparent); color: {PHASE_COLORS[phase]}"
			>
				{$_(`cycles.phase.${phase}`)}
			</span>
		{/if}
	</div>

	{#if loading}
		<div class="h-20 animate-pulse rounded bg-surface-hover"></div>
	{:else if cycles.length === 0}
		<div class="py-6 text-center">
			<p class="text-sm text-muted-foreground">
				{$_('dashboard.widgets.cycles.empty')}
			</p>
			<a
				href="/cycles"
				class="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
			>
				{$_('dashboard.widgets.cycles.open')}
			</a>
		</div>
	{:else}
		<a
			href="/cycles"
			class="block rounded-lg p-3 transition-colors hover:bg-surface-hover"
			style="background: color-mix(in srgb, {PHASE_COLORS[phase]} 6%, transparent);"
		>
			<div class="flex items-baseline justify-between gap-3">
				<div>
					{#if cycleDay}
						<p class="text-xs text-muted-foreground">
							{$_('cycles.label.cycleDay')}
							{cycleDay}
						</p>
					{/if}
					{#if daysUntil !== null}
						<p class="text-2xl font-semibold" style="color: {PHASE_COLORS[phase]};">
							{#if daysUntil > 0}
								{daysUntil}
							{:else if daysUntil === 0}
								{$_('cycles.label.today')}
							{:else}
								+{Math.abs(daysUntil)}
							{/if}
						</p>
						<p class="text-xs text-muted-foreground">
							{#if daysUntil > 0}
								{$_('cycles.label.daysUntilPeriod')}
							{:else if daysUntil === 0}
								{$_('cycles.label.predicted')}
							{:else}
								{$_('cycles.label.daysOverdue')}
							{/if}
						</p>
					{/if}
				</div>
				{#if nextPeriod && daysUntil !== null && daysUntil >= 0}
					<div class="text-right">
						<p class="text-xs text-muted-foreground">
							{$_('cycles.stats.nextPeriod')}
						</p>
						<p class="text-sm font-medium">{formatShortDate(nextPeriod)}</p>
					</div>
				{/if}
			</div>
		</a>
	{/if}
</div>
