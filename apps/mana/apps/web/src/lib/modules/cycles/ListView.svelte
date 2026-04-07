<!--
  Cycles — Workbench ListView
  Aktueller Zyklus, heutiger Quick-Log, einfache Statistiken.
-->
<script lang="ts">
	import {
		formatLogDate,
		useAllCycles,
		useAllDayLogs,
		useAllSymptoms,
		useCurrentCycle,
	} from './queries';
	import { cyclesStore } from './stores/cycles.svelte';
	import { dayLogsStore } from './stores/dayLogs.svelte';
	import { derivePhase, getCycleDayNumber } from './utils/phase';
	import {
		computeCycleStats,
		daysUntilNextPeriod,
		predictFertileWindow,
		predictNextPeriodStart,
	} from './utils/prediction';
	import {
		FLOW_COLORS,
		FLOW_LABELS,
		MOOD_COLORS,
		MOOD_LABELS,
		PHASE_COLORS,
		PHASE_LABELS,
		type Flow,
		type Mood,
	} from './types';
	import type { ViewProps } from '$lib/app-registry';

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const _props: ViewProps = $props();

	const todayIso = new Date().toISOString().slice(0, 10);

	let cycles$ = useAllCycles();
	let logs$ = useAllDayLogs();
	let symptoms$ = useAllSymptoms();
	let current$ = useCurrentCycle();

	let cycles = $derived(cycles$.value);
	let logs = $derived(logs$.value);
	let symptoms = $derived(symptoms$.value);
	let currentCycle = $derived(current$.value);

	let phase = $derived(derivePhase(todayIso, cycles));
	let cycleDay = $derived(currentCycle ? getCycleDayNumber(todayIso, currentCycle) : null);
	let stats = $derived(computeCycleStats(cycles));
	let daysUntil = $derived(daysUntilNextPeriod(cycles));
	let nextPeriod = $derived(predictNextPeriodStart(cycles));
	let fertile = $derived(predictFertileWindow(cycles));

	const FLOWS: Flow[] = ['none', 'spotting', 'light', 'medium', 'heavy'];
	const MOODS: Mood[] = ['great', 'good', 'neutral', 'low', 'bad'];

	// ─ Editing state — defaults to today, can be switched to any past day
	let editingDate = $state(todayIso);
	let editingLog = $derived(logs.find((l) => l.logDate === editingDate) ?? null);
	let isEditingPast = $derived(editingDate !== todayIso);

	let selectedFlow = $derived(editingLog?.flow ?? 'none');
	let selectedMood = $derived(editingLog?.mood ?? null);
	let selectedSymptoms = $derived(editingLog?.symptoms ?? []);
	let temperature = $state('');
	let notesText = $state('');

	// Reset temperature/notes inputs when switching the editing target
	$effect(() => {
		// Tracking editingDate so the effect re-runs whenever the target switches
		void editingDate;
		temperature = editingLog?.temperature?.toString() ?? '';
		notesText = editingLog?.notes ?? '';
	});

	function selectDay(date: string) {
		editingDate = date;
	}

	function backToToday() {
		editingDate = todayIso;
	}

	async function setFlow(flow: Flow) {
		await dayLogsStore.logDay({ logDate: editingDate, flow });
	}

	async function setMood(mood: Mood) {
		const next = selectedMood === mood ? null : mood;
		await dayLogsStore.logDay({ logDate: editingDate, mood: next });
	}

	async function toggleSymptom(id: string) {
		const has = selectedSymptoms.includes(id);
		const next = has ? selectedSymptoms.filter((s) => s !== id) : [...selectedSymptoms, id];
		await dayLogsStore.logDay({ logDate: editingDate, symptoms: next });
	}

	async function saveTemperature() {
		const num = parseFloat(temperature);
		await dayLogsStore.logDay({
			logDate: editingDate,
			temperature: Number.isFinite(num) ? num : null,
		});
	}

	async function saveNotes() {
		await dayLogsStore.logDay({ logDate: editingDate, notes: notesText.trim() || null });
	}

	async function deleteEditingLog() {
		if (!editingLog) {
			backToToday();
			return;
		}
		const ok = confirm(
			`Tageseintrag vom ${new Date(editingDate).toLocaleDateString('de-DE')} wirklich löschen?`
		);
		if (!ok) return;
		await dayLogsStore.deleteLog(editingLog.id);
		backToToday();
	}

	async function startPeriodToday() {
		await cyclesStore.createCycle({ startDate: todayIso });
		await dayLogsStore.logDay({ logDate: todayIso, flow: 'medium' });
		backToToday();
	}

	async function endPeriodToday() {
		if (!currentCycle) return;
		await cyclesStore.setPeriodEnd(currentCycle.id, todayIso);
	}

	function formatDate(iso: string | null): string {
		if (!iso) return '—';
		return new Date(iso).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
		});
	}
</script>

<div class="app-view">
	<!-- Phase + Status Header -->
	<div class="phase-card" style="--phase-color: {PHASE_COLORS[phase]}">
		<div class="phase-top">
			<span class="phase-dot"></span>
			<div class="phase-info">
				<span class="phase-label">{PHASE_LABELS[phase]}</span>
				{#if cycleDay}
					<span class="phase-sub">Zyklustag {cycleDay}</span>
				{/if}
			</div>
			{#if daysUntil !== null}
				<div class="phase-countdown">
					{#if daysUntil > 0}
						<strong>{daysUntil}</strong>
						<span>Tage bis zur Periode</span>
					{:else if daysUntil === 0}
						<strong>Heute</strong>
						<span>vorhergesagt</span>
					{:else}
						<strong>{Math.abs(daysUntil)}</strong>
						<span>Tage überfällig</span>
					{/if}
				</div>
			{/if}
		</div>
		<div class="phase-actions">
			{#if !currentCycle || (currentCycle.periodEndDate && currentCycle.periodEndDate < todayIso && phase !== 'menstruation')}
				<button class="btn-primary" onclick={startPeriodToday}>Periode starten</button>
			{:else if currentCycle && !currentCycle.periodEndDate}
				<button class="btn-secondary" onclick={endPeriodToday}>Periode beendet</button>
			{/if}
		</div>
	</div>

	<!-- Edit-past-day Banner -->
	{#if isEditingPast}
		<div class="edit-banner">
			<span class="edit-banner-label">
				Bearbeite <strong>{new Date(editingDate).toLocaleDateString('de-DE')}</strong>
			</span>
			<div class="edit-banner-actions">
				{#if editingLog}
					<button class="banner-btn danger" onclick={deleteEditingLog}>Löschen</button>
				{/if}
				<button class="banner-btn" onclick={backToToday}>Zurück zu heute</button>
			</div>
		</div>
	{/if}

	<!-- Flow -->
	<section class="log-section">
		<h3 class="section-label">{isEditingPast ? 'Blutung' : 'Heute · Blutung'}</h3>
		<div class="row">
			{#each FLOWS as flow}
				<button
					class="flow-btn"
					class:active={selectedFlow === flow}
					style="--flow-color: {FLOW_COLORS[flow]}"
					onclick={() => setFlow(flow)}
				>
					<span class="flow-dot"></span>
					{FLOW_LABELS[flow]}
				</button>
			{/each}
		</div>
	</section>

	<!-- Today: Mood -->
	<section class="log-section">
		<h3 class="section-label">Stimmung</h3>
		<div class="row">
			{#each MOODS as mood}
				<button
					class="mood-btn"
					class:active={selectedMood === mood}
					style="--mood-color: {MOOD_COLORS[mood]}"
					onclick={() => setMood(mood)}
				>
					<span class="mood-dot"></span>
					{MOOD_LABELS[mood]}
				</button>
			{/each}
		</div>
	</section>

	<!-- Today: Symptoms -->
	{#if symptoms.length > 0}
		<section class="log-section">
			<h3 class="section-label">Symptome</h3>
			<div class="row">
				{#each symptoms as sym}
					<button
						class="sym-chip"
						class:active={selectedSymptoms.includes(sym.id)}
						style="--sym-color: {sym.color ?? '#9ca3af'}"
						onclick={() => toggleSymptom(sym.id)}
					>
						{sym.name}
						{#if sym.count > 0}<small>· {sym.count}</small>{/if}
					</button>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Temperature & Notes -->
	<section class="log-section">
		<h3 class="section-label">Basaltemperatur & Notizen</h3>
		<div class="row inputs">
			<input
				type="number"
				step="0.01"
				class="temp-input"
				placeholder="36.5 °C"
				bind:value={temperature}
				onblur={saveTemperature}
			/>
			<input
				type="text"
				class="notes-input"
				placeholder="Notiz..."
				bind:value={notesText}
				onblur={saveNotes}
			/>
		</div>
	</section>

	<!-- Stats -->
	{#if stats.total > 0}
		<section class="log-section stats">
			<h3 class="section-label">Statistik</h3>
			<div class="stats-grid">
				<div class="stat">
					<strong>{stats.avg}</strong>
					<span>Ø Tage</span>
				</div>
				<div class="stat">
					<strong>{stats.shortest}</strong>
					<span>kürzester</span>
				</div>
				<div class="stat">
					<strong>{stats.longest}</strong>
					<span>längster</span>
				</div>
				<div class="stat">
					<strong>{stats.total}</strong>
					<span>Zyklen</span>
				</div>
			</div>
			{#if nextPeriod}
				<div class="prediction">
					Nächste Periode: <strong>{formatDate(nextPeriod)}</strong>
					{#if fertile}
						· Fruchtbares Fenster: <strong>{formatDate(fertile.start)}</strong> –
						<strong>{formatDate(fertile.end)}</strong>
					{/if}
				</div>
			{/if}
		</section>
	{/if}

	<!-- Recent logs -->
	{#if logs.length > 0}
		<section class="log-section">
			<h3 class="section-label">Letzte Einträge</h3>
			<div class="log-list">
				{#each logs.slice(0, 10) as log (log.id)}
					<button
						class="log-row"
						class:active={log.logDate === editingDate}
						type="button"
						onclick={() => selectDay(log.logDate)}
					>
						<span class="log-flow" style="background: {FLOW_COLORS[log.flow]}"></span>
						<div class="log-content">
							<div class="log-top">
								<span class="log-date">{formatLogDate(log.logDate)}</span>
								{#if log.flow !== 'none'}
									<span class="log-tag">{FLOW_LABELS[log.flow]}</span>
								{/if}
								{#if log.mood}
									<span class="log-tag" style="color: {MOOD_COLORS[log.mood]}"
										>{MOOD_LABELS[log.mood]}</span
									>
								{/if}
							</div>
							{#if log.notes}
								<p class="log-note">{log.notes}</p>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		</section>
	{/if}

	{#if cycles.length === 0 && logs.length === 0}
		<p class="empty">
			Tippe oben auf eine Blutungsstärke, um deinen ersten Tag festzuhalten — oder starte direkt
			eine Periode.
		</p>
	{/if}
</div>

<style>
	.app-view {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		padding: 1rem;
		height: 100%;
		overflow-y: auto;
	}

	/* ── Phase Card ────────────────────────────── */
	.phase-card {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		padding: 0.875rem 1rem;
		border-radius: 0.75rem;
		border: 1px solid color-mix(in srgb, var(--phase-color) 30%, transparent);
		background: color-mix(in srgb, var(--phase-color) 6%, transparent);
	}
	.phase-top {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}
	.phase-dot {
		width: 12px;
		height: 12px;
		border-radius: 9999px;
		background: var(--phase-color);
	}
	.phase-info {
		display: flex;
		flex-direction: column;
		flex: 1;
	}
	.phase-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--phase-color);
	}
	.phase-sub {
		font-size: 0.6875rem;
		color: #9ca3af;
	}
	.phase-countdown {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		font-size: 0.625rem;
		color: #9ca3af;
	}
	.phase-countdown strong {
		font-size: 1rem;
		color: var(--phase-color);
	}
	.phase-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-primary,
	.btn-secondary {
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		border: 1px solid transparent;
		transition: filter 0.15s;
	}
	.btn-primary {
		background: var(--phase-color);
		color: white;
	}
	.btn-primary:hover {
		filter: brightness(1.1);
	}
	.btn-secondary {
		background: transparent;
		color: var(--phase-color);
		border-color: var(--phase-color);
	}
	.btn-secondary:hover {
		background: color-mix(in srgb, var(--phase-color) 10%, transparent);
	}

	/* ── Edit Past Day Banner ──────────────────── */
	.edit-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: rgba(236, 72, 153, 0.08);
		border: 1px dashed rgba(236, 72, 153, 0.4);
	}
	.edit-banner-label {
		font-size: 0.75rem;
		color: #ec4899;
	}
	.edit-banner-label strong {
		font-weight: 600;
	}
	.edit-banner-actions {
		display: flex;
		gap: 0.375rem;
	}
	.banner-btn {
		padding: 0.25rem 0.625rem;
		border-radius: 0.375rem;
		font-size: 0.6875rem;
		border: 1px solid rgba(236, 72, 153, 0.4);
		background: transparent;
		color: #ec4899;
		cursor: pointer;
		transition: filter 0.15s;
	}
	.banner-btn:hover {
		filter: brightness(1.1);
		background: rgba(236, 72, 153, 0.1);
	}
	.banner-btn.danger {
		border-color: rgba(239, 68, 68, 0.4);
		color: #ef4444;
	}
	.banner-btn.danger:hover {
		background: rgba(239, 68, 68, 0.1);
	}

	/* ── Sections ──────────────────────────────── */
	.log-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.section-label {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #c0bfba;
		font-weight: 600;
		margin: 0;
	}
	:global(.dark) .section-label {
		color: #6b7280;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
	.row.inputs {
		flex-wrap: wrap;
	}

	/* ── Flow / Mood / Symptom buttons ─────────── */
	.flow-btn,
	.mood-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.3125rem 0.625rem;
		border-radius: 9999px;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: transparent;
		font-size: 0.6875rem;
		color: #9ca3af;
		cursor: pointer;
		transition: all 0.15s;
	}
	:global(.dark) .flow-btn,
	:global(.dark) .mood-btn {
		border-color: rgba(255, 255, 255, 0.08);
	}
	.flow-btn .flow-dot,
	.mood-btn .mood-dot {
		width: 8px;
		height: 8px;
		border-radius: 9999px;
		background: var(--flow-color, var(--mood-color));
	}
	.flow-btn.active {
		border-color: var(--flow-color);
		color: var(--flow-color);
		background: color-mix(in srgb, var(--flow-color) 12%, transparent);
	}
	.mood-btn.active {
		border-color: var(--mood-color);
		color: var(--mood-color);
		background: color-mix(in srgb, var(--mood-color) 12%, transparent);
	}

	.sym-chip {
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: transparent;
		font-size: 0.6875rem;
		color: #9ca3af;
		cursor: pointer;
		transition: all 0.15s;
	}
	:global(.dark) .sym-chip {
		border-color: rgba(255, 255, 255, 0.08);
	}
	.sym-chip:hover {
		color: var(--sym-color);
	}
	.sym-chip.active {
		border-color: var(--sym-color);
		color: var(--sym-color);
		background: color-mix(in srgb, var(--sym-color) 12%, transparent);
	}
	.sym-chip small {
		opacity: 0.65;
		font-size: 0.6em;
	}

	/* ── Inputs ───────────────────────────────── */
	.temp-input,
	.notes-input {
		padding: 0.375rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: transparent;
		font-size: 0.75rem;
		color: #374151;
		outline: none;
		font-family: inherit;
	}
	.temp-input {
		width: 5.5rem;
	}
	.notes-input {
		flex: 1;
		min-width: 8rem;
	}
	.temp-input:focus,
	.notes-input:focus {
		border-color: #ec4899;
	}
	:global(.dark) .temp-input,
	:global(.dark) .notes-input {
		border-color: rgba(255, 255, 255, 0.08);
		color: #f3f4f6;
		color-scheme: dark;
	}

	/* ── Stats ────────────────────────────────── */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
	}
	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.5rem 0.375rem;
		border-radius: 0.375rem;
		background: rgba(236, 72, 153, 0.06);
	}
	.stat strong {
		font-size: 1rem;
		color: #ec4899;
		font-weight: 600;
	}
	.stat span {
		font-size: 0.5625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #9ca3af;
		margin-top: 0.125rem;
	}
	.prediction {
		font-size: 0.6875rem;
		color: #9ca3af;
		padding: 0.375rem 0.25rem;
	}
	.prediction strong {
		color: #ec4899;
		font-weight: 600;
	}

	/* ── Log List ─────────────────────────────── */
	.log-list {
		display: flex;
		flex-direction: column;
	}
	.log-row {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.4375rem 0.5rem;
		border: none;
		border-radius: 0.375rem;
		background: transparent;
		text-align: left;
		width: 100%;
		cursor: pointer;
		color: inherit;
		font: inherit;
		transition: background 0.15s;
	}
	.log-row:hover {
		background: rgba(0, 0, 0, 0.04);
	}
	:global(.dark) .log-row:hover {
		background: rgba(255, 255, 255, 0.05);
	}
	.log-row.active {
		background: rgba(236, 72, 153, 0.1);
	}
	.log-row.active:hover {
		background: rgba(236, 72, 153, 0.16);
	}
	.log-flow {
		width: 8px;
		height: 8px;
		border-radius: 9999px;
		flex-shrink: 0;
		margin-top: 0.4375rem;
	}
	.log-content {
		flex: 1;
		min-width: 0;
	}
	.log-top {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}
	.log-date {
		font-size: 0.75rem;
		font-weight: 500;
		color: #374151;
	}
	:global(.dark) .log-date {
		color: #e5e7eb;
	}
	.log-tag {
		font-size: 0.625rem;
		color: #9ca3af;
	}
	.log-note {
		font-size: 0.6875rem;
		color: #9ca3af;
		margin: 0.125rem 0 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: #9ca3af;
	}

	@media (max-width: 640px) {
		.app-view {
			padding: 0.75rem;
		}
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
