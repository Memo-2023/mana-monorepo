<!--
  /companion/missions — Create and review AI Missions.

  Minimal MVP: list on the left, expanded detail on the right (or below
  on narrow screens). Inline create form at the top. Clicking a mission
  shows its iteration history + controls (pause/resume/complete/delete).

  No input picker yet — missions can be created with only concept +
  objective + cadence. Linking to notes / goals / kontext is a follow-up.
-->
<script lang="ts">
	import { Sparkle, Play, Pause, Check, Trash, Plus, ArrowLeft } from '@mana/shared-icons';
	import { useMissions } from '$lib/data/ai/missions/queries';
	import {
		createMission,
		pauseMission,
		resumeMission,
		completeMission,
		deleteMission,
		addIterationFeedback,
	} from '$lib/data/ai/missions/store';
	import { runMission } from '$lib/data/ai/missions/runner';
	import { productionDeps } from '$lib/data/ai/missions/setup';
	import MissionInputPicker from '$lib/components/ai/MissionInputPicker.svelte';
	import type { Mission, MissionCadence, MissionInputRef } from '$lib/data/ai/missions/types';

	const missions = $derived(useMissions());

	let selectedId = $state<string | null>(null);
	const selected = $derived(missions.value.find((m) => m.id === selectedId) ?? null);

	// ── Create form ────────────────────────────────────────
	let showForm = $state(false);
	let formTitle = $state('');
	let formObjective = $state('');
	let formConcept = $state('');
	let formCadenceKind = $state<MissionCadence['kind']>('manual');
	let formIntervalMin = $state(60);
	let formDailyHour = $state(9);
	let formInputs = $state<MissionInputRef[]>([]);
	let creating = $state(false);

	function buildCadence(): MissionCadence {
		switch (formCadenceKind) {
			case 'manual':
				return { kind: 'manual' };
			case 'interval':
				return { kind: 'interval', everyMinutes: formIntervalMin };
			case 'daily':
				return { kind: 'daily', atHour: formDailyHour, atMinute: 0 };
			case 'weekly':
				return { kind: 'weekly', dayOfWeek: 1, atHour: formDailyHour };
			case 'cron':
				return { kind: 'cron', expression: '' };
		}
	}

	async function handleCreate() {
		if (!formTitle.trim() || !formObjective.trim()) return;
		creating = true;
		try {
			const m = await createMission({
				title: formTitle.trim(),
				objective: formObjective.trim(),
				conceptMarkdown: formConcept,
				inputs: formInputs,
				cadence: buildCadence(),
			});
			formTitle = '';
			formObjective = '';
			formConcept = '';
			formInputs = [];
			formCadenceKind = 'manual';
			showForm = false;
			selectedId = m.id;
		} finally {
			creating = false;
		}
	}

	// ── Detail actions ─────────────────────────────────────
	let runningNow = $state(false);
	async function handleRunNow(m: Mission) {
		runningNow = true;
		try {
			await runMission(m.id, productionDeps);
		} catch (err) {
			console.error(err);
		} finally {
			runningNow = false;
		}
	}

	let feedbackDraft = $state('');
	async function handleFeedback(m: Mission, iterationId: string) {
		if (!feedbackDraft.trim()) return;
		await addIterationFeedback(m.id, iterationId, feedbackDraft.trim());
		feedbackDraft = '';
	}

	function describeCadence(c: MissionCadence): string {
		switch (c.kind) {
			case 'manual':
				return 'manuell';
			case 'interval':
				return `alle ${c.everyMinutes} min`;
			case 'daily':
				return `täglich ${String(c.atHour).padStart(2, '0')}:${String(c.atMinute).padStart(2, '0')}`;
			case 'weekly':
				return `wöchentlich (Tag ${c.dayOfWeek}, ${c.atHour}:00)`;
			case 'cron':
				return `cron: ${c.expression}`;
		}
	}

	function describeState(s: Mission['state']): string {
		return { active: 'aktiv', paused: 'pausiert', done: 'abgeschlossen', archived: 'archiviert' }[
			s
		];
	}

	function formatRelative(iso: string | undefined): string {
		if (!iso) return '—';
		const d = new Date(iso);
		const deltaMs = d.getTime() - Date.now();
		const abs = Math.abs(deltaMs);
		const mins = Math.round(abs / 60_000);
		const hours = Math.round(mins / 60);
		const days = Math.round(hours / 24);
		const value = mins < 60 ? `${mins}m` : hours < 24 ? `${hours}h` : `${days}d`;
		return deltaMs < 0 ? `vor ${value}` : `in ${value}`;
	}
</script>

<svelte:head>
	<title>Missions - Companion</title>
</svelte:head>

<div class="page">
	<header class="page-header">
		<a href="/companion" class="back">
			<ArrowLeft size={16} />
			<span>Companion</span>
		</a>
		<div class="title">
			<Sparkle size={20} weight="fill" />
			<h1>AI Missions</h1>
		</div>
		<button type="button" class="primary-btn" onclick={() => (showForm = !showForm)}>
			<Plus size={16} />
			<span>{showForm ? 'Abbrechen' : 'Neue Mission'}</span>
		</button>
	</header>

	{#if showForm}
		<form class="create-form" onsubmit={(e) => (e.preventDefault(), handleCreate())}>
			<label>
				<span>Titel</span>
				<input bind:value={formTitle} placeholder="z.B. Wöchentlicher Goals-Review" required />
			</label>

			<label>
				<span>Konkretes Ziel</span>
				<input bind:value={formObjective} placeholder="Was genau soll die KI erreichen?" required />
			</label>

			<label>
				<span>Konzept (Markdown, optional)</span>
				<textarea
					bind:value={formConcept}
					placeholder="# Rahmen&#10;Erkläre der KI Kontext, Regeln, Grenzen…"
					rows="6"
				></textarea>
			</label>

			<fieldset>
				<legend>Inputs (Kontext für die KI)</legend>
				<MissionInputPicker bind:value={formInputs} />
			</fieldset>

			<fieldset>
				<legend>Cadence</legend>
				<div class="cadence-row">
					<label class="inline">
						<input type="radio" bind:group={formCadenceKind} value="manual" />
						<span>Manuell</span>
					</label>
					<label class="inline">
						<input type="radio" bind:group={formCadenceKind} value="interval" />
						<span>Intervall</span>
						{#if formCadenceKind === 'interval'}
							<input
								class="inline-num"
								type="number"
								bind:value={formIntervalMin}
								min="5"
								max="1440"
							/>
							<span>min</span>
						{/if}
					</label>
					<label class="inline">
						<input type="radio" bind:group={formCadenceKind} value="daily" />
						<span>Täglich um</span>
						{#if formCadenceKind === 'daily'}
							<input class="inline-num" type="number" bind:value={formDailyHour} min="0" max="23" />
							<span>:00</span>
						{/if}
					</label>
				</div>
			</fieldset>

			<div class="form-actions">
				<button type="submit" class="primary-btn" disabled={creating}>
					{creating ? 'Erstelle…' : 'Mission anlegen'}
				</button>
			</div>
		</form>
	{/if}

	<div class="layout">
		<aside class="list">
			{#if missions.value.length === 0}
				<p class="empty">Noch keine Missions. Starte mit "Neue Mission".</p>
			{:else}
				{#each missions.value as m (m.id)}
					<button
						type="button"
						class="list-item"
						class:selected={selectedId === m.id}
						onclick={() => (selectedId = m.id)}
					>
						<div class="row-1">
							<strong>{m.title}</strong>
							<span class="badge badge-{m.state}">{describeState(m.state)}</span>
						</div>
						<div class="row-2">
							<span>{describeCadence(m.cadence)}</span>
							{#if m.nextRunAt}
								<span>nächster Run {formatRelative(m.nextRunAt)}</span>
							{/if}
							<span>{m.iterations.length} Iteration{m.iterations.length === 1 ? '' : 'en'}</span>
						</div>
					</button>
				{/each}
			{/if}
		</aside>

		<section class="detail">
			{#if selected}
				<header class="detail-header">
					<h2>{selected.title}</h2>
					<div class="detail-actions">
						<a
							href="/companion/workbench?mission={selected.id}"
							class="workbench-link"
							title="Aktivität dieser Mission im Workbench"
						>
							Workbench →
						</a>
						<button type="button" onclick={() => handleRunNow(selected)} disabled={runningNow}>
							<Play size={14} />
							<span>{runningNow ? 'Läuft…' : 'Jetzt ausführen'}</span>
						</button>
						{#if selected.state === 'active'}
							<button type="button" onclick={() => pauseMission(selected.id)}>
								<Pause size={14} />
								<span>Pausieren</span>
							</button>
						{:else if selected.state === 'paused'}
							<button type="button" onclick={() => resumeMission(selected.id)}>
								<Play size={14} />
								<span>Fortsetzen</span>
							</button>
						{/if}
						{#if selected.state !== 'done'}
							<button type="button" onclick={() => completeMission(selected.id)}>
								<Check size={14} />
								<span>Abschließen</span>
							</button>
						{/if}
						<button
							type="button"
							class="danger"
							onclick={() => {
								if (confirm('Mission löschen?')) {
									deleteMission(selected.id);
									selectedId = null;
								}
							}}
						>
							<Trash size={14} />
						</button>
					</div>
				</header>

				<dl class="meta">
					<dt>Ziel</dt>
					<dd>{selected.objective}</dd>
					<dt>Cadence</dt>
					<dd>{describeCadence(selected.cadence)}</dd>
					<dt>Nächster Run</dt>
					<dd>{formatRelative(selected.nextRunAt)}</dd>
					<dt>Inputs</dt>
					<dd>
						{#if selected.inputs.length === 0}
							—
						{:else}
							{selected.inputs.map((i) => `${i.module}/${i.id}`).join(', ')}
						{/if}
					</dd>
				</dl>

				{#if selected.conceptMarkdown}
					<section class="concept">
						<h3>Konzept</h3>
						<pre>{selected.conceptMarkdown}</pre>
					</section>
				{/if}

				<section class="iterations">
					<h3>Iterationen</h3>
					{#if selected.iterations.length === 0}
						<p class="empty">Noch keine Iteration gelaufen.</p>
					{:else}
						{#each [...selected.iterations].reverse() as it (it.id)}
							<article class="iteration">
								<header>
									<span class="it-date">{new Date(it.startedAt).toLocaleString('de-DE')}</span>
									<span class="badge badge-status-{it.overallStatus}">{it.overallStatus}</span>
								</header>
								{#if it.summary}
									<p class="it-summary">{it.summary}</p>
								{/if}
								{#if it.plan.length > 0}
									<ul class="plan">
										{#each it.plan as step}
											<li>
												<span class="step-status">[{step.status}]</span>
												{#if step.summary}
													{step.summary}
												{:else if step.intent.kind === 'toolCall'}
													{step.intent.toolName}
												{:else}
													Notiz
												{/if}
											</li>
										{/each}
									</ul>
								{/if}
								{#if it.userFeedback}
									<blockquote class="feedback">{it.userFeedback}</blockquote>
								{:else if !it.finishedAt || it.overallStatus === 'awaiting-review'}
									<form
										class="feedback-form"
										onsubmit={(e) => (e.preventDefault(), handleFeedback(selected, it.id))}
									>
										<textarea
											bind:value={feedbackDraft}
											placeholder="Feedback für die nächste Iteration…"
											rows="2"
										></textarea>
										<button type="submit" disabled={!feedbackDraft.trim()}>Speichern</button>
									</form>
								{/if}
							</article>
						{/each}
					{/if}
				</section>
			{:else}
				<p class="empty">Wähle links eine Mission aus, oder erstelle eine neue.</p>
			{/if}
		</section>
	</div>
</div>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1.5rem;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}

	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		color: var(--color-muted, #888);
		text-decoration: none;
		font-size: 0.875rem;
	}
	.back:hover {
		color: var(--color-fg, inherit);
	}

	.title {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
	.title h1 {
		margin: 0;
		font-size: 1.5rem;
	}

	.primary-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border: 1px solid color-mix(in oklab, var(--color-primary, #6b5bff) 45%, transparent);
		border-radius: 0.375rem;
		background: color-mix(in oklab, var(--color-primary, #6b5bff) 12%, var(--color-bg, #fff));
		color: color-mix(in oklab, var(--color-primary, #6b5bff) 85%, var(--color-fg, #000));
		font-size: 0.875rem;
		cursor: pointer;
	}
	.primary-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.create-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px dashed var(--color-border, #ddd);
		border-radius: 0.5rem;
		margin-bottom: 1.25rem;
	}
	.create-form label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.875rem;
	}
	.create-form label > span {
		font-weight: 500;
	}
	.create-form input:not([type]),
	.create-form textarea {
		padding: 0.5rem 0.625rem;
		border: 1px solid var(--color-border, #ddd);
		border-radius: 0.375rem;
		font: inherit;
	}
	.create-form textarea {
		resize: vertical;
		font-family: var(--font-mono, ui-monospace, monospace);
	}
	.create-form fieldset {
		border: 1px solid var(--color-border, #ddd);
		border-radius: 0.375rem;
		padding: 0.5rem 0.75rem;
	}
	.cadence-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}
	.inline {
		flex-direction: row !important;
		align-items: center;
		gap: 0.375rem !important;
	}
	.inline-num {
		width: 4.5rem;
	}
	.form-actions {
		display: flex;
		justify-content: flex-end;
	}

	.layout {
		display: grid;
		grid-template-columns: minmax(260px, 320px) 1fr;
		gap: 1.25rem;
	}
	@media (max-width: 720px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.list-item {
		text-align: left;
		padding: 0.625rem 0.75rem;
		border: 1px solid var(--color-border, #ddd);
		border-radius: 0.375rem;
		background: var(--color-bg, #fff);
		cursor: pointer;
	}
	.list-item.selected {
		border-color: color-mix(in oklab, var(--color-primary, #6b5bff) 55%, transparent);
		background: color-mix(in oklab, var(--color-primary, #6b5bff) 6%, var(--color-bg, #fff));
	}
	.row-1 {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.25rem;
	}
	.row-2 {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		color: var(--color-muted, #888);
		font-size: 0.75rem;
	}

	.badge {
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		background: var(--color-muted-bg, #eee);
	}
	.badge-active {
		background: #d7f7e3;
		color: #1b7a3a;
	}
	.badge-paused {
		background: #fef0c9;
		color: #8a5a00;
	}
	.badge-done {
		background: #e0e5ec;
		color: #3b4252;
	}
	.badge-archived {
		background: #e8e8e8;
		color: #666;
	}
	.badge-status-running {
		background: #d7ecff;
		color: #0a548b;
	}
	.badge-status-awaiting-review {
		background: #fef0c9;
		color: #8a5a00;
	}
	.badge-status-approved {
		background: #d7f7e3;
		color: #1b7a3a;
	}
	.badge-status-rejected,
	.badge-status-failed {
		background: #f7d7d7;
		color: #8a1b1b;
	}

	.detail {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.detail-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}
	.detail-header h2 {
		margin: 0;
		font-size: 1.25rem;
	}
	.detail-actions {
		display: flex;
		gap: 0.375rem;
		flex-wrap: wrap;
		align-items: center;
	}
	.workbench-link {
		padding: 0.375rem 0.625rem;
		border: 1px solid var(--color-border, #ddd);
		border-radius: 0.375rem;
		text-decoration: none;
		font-size: 0.8125rem;
		color: var(--color-muted, #666);
	}
	.workbench-link:hover {
		color: var(--color-primary, #6b5bff);
		border-color: color-mix(in oklab, var(--color-primary, #6b5bff) 45%, transparent);
	}
	.detail-actions button {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.625rem;
		border: 1px solid var(--color-border, #ddd);
		border-radius: 0.375rem;
		background: var(--color-bg, #fff);
		cursor: pointer;
		font-size: 0.8125rem;
	}
	.detail-actions button.danger {
		color: #8a1b1b;
	}
	.detail-actions button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.meta {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.25rem 1rem;
		font-size: 0.875rem;
	}
	.meta dt {
		color: var(--color-muted, #888);
	}
	.meta dd {
		margin: 0;
	}

	.concept pre {
		white-space: pre-wrap;
		padding: 0.75rem;
		background: color-mix(in oklab, var(--color-fg, #000) 3%, transparent);
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		margin: 0.5rem 0 0;
	}

	.iterations h3,
	.concept h3 {
		margin: 0 0 0.5rem;
		font-size: 0.9375rem;
	}

	.iteration {
		border: 1px solid var(--color-border, #ddd);
		border-radius: 0.375rem;
		padding: 0.75rem 0.875rem;
		margin-bottom: 0.5rem;
	}
	.iteration header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.375rem;
	}
	.it-date {
		font-size: 0.75rem;
		color: var(--color-muted, #888);
	}
	.it-summary {
		margin: 0 0 0.5rem;
		font-size: 0.875rem;
	}
	.plan {
		list-style: none;
		padding: 0;
		margin: 0.25rem 0;
		font-size: 0.8125rem;
	}
	.plan li {
		padding: 0.125rem 0;
	}
	.step-status {
		color: var(--color-muted, #888);
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.75rem;
		margin-right: 0.375rem;
	}
	.feedback {
		margin: 0.5rem 0 0;
		padding: 0.375rem 0.625rem;
		border-left: 3px solid var(--color-border, #ddd);
		font-style: italic;
		color: var(--color-muted, #666);
		font-size: 0.8125rem;
	}
	.feedback-form {
		display: flex;
		gap: 0.375rem;
		margin-top: 0.5rem;
	}
	.feedback-form textarea {
		flex: 1;
		padding: 0.375rem 0.5rem;
		border: 1px solid var(--color-border, #ddd);
		border-radius: 0.375rem;
		font: inherit;
		resize: vertical;
	}
	.feedback-form button {
		align-self: flex-end;
		padding: 0.375rem 0.75rem;
		border: 1px solid var(--color-border, #ddd);
		border-radius: 0.375rem;
		background: var(--color-bg, #fff);
		cursor: pointer;
	}

	.empty {
		color: var(--color-muted, #888);
		font-size: 0.875rem;
		padding: 1rem 0;
	}
</style>
