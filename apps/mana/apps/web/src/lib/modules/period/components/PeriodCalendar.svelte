<!--
  Period Calendar — Month grid colored by phase, with flow markers.

  Click a day to switch the editing target. Navigate prev/next month
  with arrow buttons. Week starts on Monday (DE convention).
-->
<script lang="ts">
	import { _, locale } from 'svelte-i18n';
	import type { Period, PeriodDayLog, PeriodPhase, Flow } from '../types';
	import { FLOW_COLORS, PHASE_COLORS } from '../types';
	import { derivePhase } from '../utils/phase';

	interface Props {
		periods: Period[];
		logs: PeriodDayLog[];
		editingDate: string;
		todayIso: string;
		onSelectDay: (iso: string) => void;
	}

	const { periods, logs, editingDate, todayIso, onSelectDay }: Props = $props();

	// ─ Month state ──────────────────────────────────────────
	// svelte-ignore state_referenced_locally
	const [initialYear, initialMonth] = todayIso.split('-').map((n) => parseInt(n, 10));
	let viewYear = $state(initialYear);
	let viewMonth = $state(initialMonth); // 1..12

	// ─ Logs indexed by date for O(1) lookup ─
	const logByDate = $derived.by(() => {
		const map = new Map<string, PeriodDayLog>();
		for (const log of logs) {
			map.set(log.logDate, log);
		}
		return map;
	});

	// ─ Compute grid: 6 weeks × 7 days from Monday before the 1st ─
	interface DayCell {
		iso: string;
		dayOfMonth: number;
		inCurrentMonth: boolean;
		phase: PeriodPhase;
		flow: Flow | null;
		isToday: boolean;
		isEditing: boolean;
	}

	function isoDate(y: number, m: number, d: number): string {
		const mm = String(m).padStart(2, '0');
		const dd = String(d).padStart(2, '0');
		return `${y}-${mm}-${dd}`;
	}

	const cells = $derived.by<DayCell[]>(() => {
		const firstOfMonth = new Date(Date.UTC(viewYear, viewMonth - 1, 1));
		// JS getUTCDay: Sun=0, Mon=1..Sat=6. We want Monday as col 0.
		const dow = firstOfMonth.getUTCDay();
		const offset = (dow + 6) % 7; // Mon=0
		const start = new Date(firstOfMonth);
		start.setUTCDate(start.getUTCDate() - offset);

		const result: DayCell[] = [];
		for (let i = 0; i < 42; i++) {
			const d = new Date(start);
			d.setUTCDate(start.getUTCDate() + i);
			const y = d.getUTCFullYear();
			const m = d.getUTCMonth() + 1;
			const day = d.getUTCDate();
			const iso = isoDate(y, m, day);
			const log = logByDate.get(iso) ?? null;
			result.push({
				iso,
				dayOfMonth: day,
				inCurrentMonth: m === viewMonth,
				phase: derivePhase(iso, periods),
				flow: log && log.flow !== 'none' ? log.flow : null,
				isToday: iso === todayIso,
				isEditing: iso === editingDate,
			});
		}
		return result;
	});

	const monthLabel = $derived.by(() => {
		const d = new Date(Date.UTC(viewYear, viewMonth - 1, 1));
		const lang = ($locale ?? 'de').split('-')[0];
		return d.toLocaleDateString(lang === 'de' ? 'de-DE' : lang, {
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC',
		});
	});

	const weekdays = $derived.by(() => {
		const lang = ($locale ?? 'de').split('-')[0];
		// Build Mon..Sun labels using a reference week
		const base = new Date(Date.UTC(2024, 0, 1)); // 2024-01-01 was a Monday
		const result: string[] = [];
		for (let i = 0; i < 7; i++) {
			const d = new Date(base);
			d.setUTCDate(base.getUTCDate() + i);
			result.push(
				d.toLocaleDateString(lang === 'de' ? 'de-DE' : lang, { weekday: 'short', timeZone: 'UTC' })
			);
		}
		return result;
	});

	function prevMonth() {
		if (viewMonth === 1) {
			viewMonth = 12;
			viewYear -= 1;
		} else {
			viewMonth -= 1;
		}
	}

	function nextMonth() {
		if (viewMonth === 12) {
			viewMonth = 1;
			viewYear += 1;
		} else {
			viewMonth += 1;
		}
	}

	function goToToday() {
		const [y, m] = todayIso.split('-').map((n) => parseInt(n, 10));
		viewYear = y;
		viewMonth = m;
	}
</script>

<div class="cal">
	<div class="cal-header">
		<button
			class="cal-nav"
			type="button"
			onclick={prevMonth}
			aria-label={$_('period.calendar.prev')}>‹</button
		>
		<button class="cal-title" type="button" onclick={goToToday}>{monthLabel}</button>
		<button
			class="cal-nav"
			type="button"
			onclick={nextMonth}
			aria-label={$_('period.calendar.next')}>›</button
		>
	</div>

	<div class="cal-weekdays">
		{#each weekdays as wd}
			<div class="cal-weekday">{wd}</div>
		{/each}
	</div>

	<div class="cal-grid">
		{#each cells as cell (cell.iso)}
			<button
				type="button"
				class="cal-day"
				class:out={!cell.inCurrentMonth}
				class:today={cell.isToday}
				class:editing={cell.isEditing}
				style="--phase-color: {PHASE_COLORS[cell.phase]}"
				onclick={() => onSelectDay(cell.iso)}
				aria-label={cell.iso}
			>
				<span class="cal-num">{cell.dayOfMonth}</span>
				{#if cell.flow}
					<span class="cal-flow" style="background: {FLOW_COLORS[cell.flow]}"></span>
				{/if}
			</button>
		{/each}
	</div>
</div>

<style>
	.cal {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.cal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.cal-title {
		flex: 1;
		text-align: center;
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		background: transparent;
		border: none;
		padding: 0.25rem;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: background 0.15s;
	}
	.cal-title:hover {
		background: rgba(236, 72, 153, 0.08);
	}
	.cal-nav {
		width: 1.75rem;
		height: 1.75rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 1rem;
		line-height: 1;
		cursor: pointer;
		transition: all 0.15s;
	}
	.cal-nav:hover {
		color: #ec4899;
		border-color: #ec4899;
	}
	.cal-weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.125rem;
	}
	.cal-weekday {
		text-align: center;
		font-size: 0.5625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
		font-weight: 600;
	}
	.cal-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.125rem;
	}

	.cal-day {
		aspect-ratio: 1;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid transparent;
		border-radius: 0.375rem;
		background: color-mix(in srgb, var(--phase-color) 10%, transparent);
		color: hsl(var(--color-foreground));
		font-size: 0.6875rem;
		cursor: pointer;
		transition: all 0.15s;
		padding: 0;
		font-family: inherit;
	}
	.cal-day:hover {
		background: color-mix(in srgb, var(--phase-color) 24%, transparent);
	}
	.cal-day.out {
		opacity: 0.35;
	}
	.cal-day.today {
		font-weight: 700;
		border-color: var(--phase-color);
	}
	.cal-day.editing {
		background: color-mix(in srgb, var(--phase-color) 36%, transparent);
		border-color: var(--phase-color);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--phase-color) 30%, transparent);
	}

	.cal-num {
		position: relative;
		z-index: 1;
	}

	.cal-flow {
		position: absolute;
		bottom: 3px;
		left: 50%;
		transform: translateX(-50%);
		width: 5px;
		height: 5px;
		border-radius: 9999px;
	}
</style>
