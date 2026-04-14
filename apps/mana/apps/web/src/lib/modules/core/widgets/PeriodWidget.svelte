<script lang="ts">
	/**
	 * PeriodWidget — Aktuelle Phase + Countdown bis zur nächsten Periode.
	 *
	 * Liest direkt aus der unified IndexedDB (period table) und leitet Phase
	 * + Vorhersage pro Render ab. Linkt zur /period Route.
	 */

	import { _, locale } from 'svelte-i18n';
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { derivePhase, getPeriodDayNumber } from '$lib/modules/period/utils/phase';
	import {
		daysUntilNextPeriod,
		predictNextPeriodStart,
	} from '$lib/modules/period/utils/prediction';
	import { PHASE_COLORS, type Period, type LocalPeriod } from '$lib/modules/period/types';
	import { toPeriod } from '$lib/modules/period/queries';

	let period: Period[] = $state([]);
	let loading = $state(true);

	$effect(() => {
		const sub = liveQuery(async () => {
			const locals = await db.table<LocalPeriod>('periods').toArray();
			return locals.filter((c) => !c.deletedAt && !c.isArchived).map(toPeriod);
		}).subscribe({
			next: (val) => {
				period = val;
				loading = false;
			},
			error: () => {
				loading = false;
			},
		});
		return () => sub.unsubscribe();
	});

	const todayIso = new Date().toISOString().slice(0, 10);

	const phase = $derived(derivePhase(todayIso, period));
	const currentPeriod = $derived(
		period
			.filter((c) => !c.isPredicted)
			.sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ?? null
	);
	const periodDay = $derived(currentPeriod ? getPeriodDayNumber(todayIso, currentPeriod) : null);
	const daysUntil = $derived(daysUntilNextPeriod(period));
	const nextPeriod = $derived(predictNextPeriodStart(period));

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
			{$_('dashboard.widgets.period.title')}
		</h3>
		{#if phase !== 'unknown'}
			<span
				class="rounded-full px-2.5 py-0.5 text-sm font-medium"
				style="background: color-mix(in srgb, {PHASE_COLORS[
					phase
				]} 14%, transparent); color: {PHASE_COLORS[phase]}"
			>
				{$_(`period.phase.${phase}`)}
			</span>
		{/if}
	</div>

	{#if loading}
		<div class="h-20 animate-pulse rounded bg-surface-hover"></div>
	{:else if period.length === 0}
		<div class="py-6 text-center">
			<p class="text-sm text-muted-foreground">
				{$_('dashboard.widgets.period.empty')}
			</p>
			<a
				href="/period"
				class="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
			>
				{$_('dashboard.widgets.period.open')}
			</a>
		</div>
	{:else}
		<a
			href="/period"
			class="block rounded-lg p-3 transition-colors hover:bg-surface-hover"
			style="background: color-mix(in srgb, {PHASE_COLORS[phase]} 6%, transparent);"
		>
			<div class="flex items-baseline justify-between gap-3">
				<div>
					{#if periodDay}
						<p class="text-xs text-muted-foreground">
							{$_('period.label.periodDay')}
							{periodDay}
						</p>
					{/if}
					{#if daysUntil !== null}
						<p class="text-2xl font-semibold" style="color: {PHASE_COLORS[phase]};">
							{#if daysUntil > 0}
								{daysUntil}
							{:else if daysUntil === 0}
								{$_('period.label.today')}
							{:else}
								+{Math.abs(daysUntil)}
							{/if}
						</p>
						<p class="text-xs text-muted-foreground">
							{#if daysUntil > 0}
								{$_('period.label.daysUntilPeriod')}
							{:else if daysUntil === 0}
								{$_('period.label.predicted')}
							{:else}
								{$_('period.label.daysOverdue')}
							{/if}
						</p>
					{/if}
				</div>
				{#if nextPeriod && daysUntil !== null && daysUntil >= 0}
					<div class="text-right">
						<p class="text-xs text-muted-foreground">
							{$_('period.stats.nextPeriod')}
						</p>
						<p class="text-sm font-medium">{formatShortDate(nextPeriod)}</p>
					</div>
				{/if}
			</div>
		</a>
	{/if}
</div>
