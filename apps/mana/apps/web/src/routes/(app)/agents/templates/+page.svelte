<!--
  Agent-Templates Gallery — /agents/templates

  Landing page for picking a pre-configured AI agent. Three cards
  side-by-side on desktop, stacked on mobile. Clicking a card opens a
  detail panel with description + "apply" options.

  Designed as a standalone route (not an AppPage) so it can be deep-
  linked from /welcome, from in-module banners, or shared directly.
-->
<script lang="ts">
	import { ArrowLeft, Check, Play } from '@mana/shared-icons';
	import { goto } from '$app/navigation';
	import { ALL_TEMPLATES, type AgentTemplate } from '@mana/shared-ai';
	import { applyTemplate } from '$lib/data/ai/agents/apply-template';

	let selected = $state<AgentTemplate | null>(null);
	let applying = $state(false);
	let result = $state<{
		agentName: string;
		sceneCreated: boolean;
		missionCount: number;
		wasExisting: boolean;
		warnings: readonly string[];
	} | null>(null);
	let error = $state<string | null>(null);

	// Override toggles — default to the "smart" values we recommend.
	let optCreateScene = $state(true);
	let optCreateMissions = $state(true);
	let optStartActive = $state(false); // false = respect paused hint

	function openDetail(t: AgentTemplate) {
		selected = t;
		result = null;
		error = null;
		optCreateScene = t.scene !== undefined;
		optCreateMissions = t.missions !== undefined && t.missions.length > 0;
		optStartActive = false;
	}

	async function handleApply() {
		if (!selected) return;
		applying = true;
		error = null;
		try {
			const r = await applyTemplate(selected, {
				createScene: optCreateScene,
				createMissions: optCreateMissions,
				respectPauseHint: !optStartActive,
			});
			result = {
				agentName: r.agent.name,
				sceneCreated: r.sceneId !== undefined,
				missionCount: r.missionIds.length,
				wasExisting: r.wasExisting,
				warnings: r.warnings,
			};
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		} finally {
			applying = false;
		}
	}
</script>

<svelte:head>
	<title>Agent-Templates — Mana</title>
</svelte:head>

<div class="page">
	<header class="header">
		<button type="button" class="back" onclick={() => goto('/')}>
			<ArrowLeft size={14} /><span>Zurück zum Workbench</span>
		</button>
		<h1>Agent-Templates</h1>
		<p class="sub">
			Vorgefertigte AI-Agenten, die sofort loslaufen. Jedes Template legt einen Agent, eine passende
			Scene und eine Starter-Mission an — die Mission ist standardmäßig pausiert, damit du bewusst
			Play drückst.
		</p>
	</header>

	<div class="grid">
		{#each ALL_TEMPLATES as t (t.id)}
			<button
				type="button"
				class="card"
				class:selected={selected?.id === t.id}
				style="--accent: {t.color}"
				onclick={() => openDetail(t)}
			>
				<span class="avatar">{t.agent.avatar}</span>
				<span class="label">{t.label}</span>
				<span class="tagline">{t.tagline}</span>
				<span class="meta">
					{#if t.scene}<span class="chip">Scene</span>{/if}
					{#if t.missions && t.missions.length > 0}
						<span class="chip"
							>{t.missions.length} Mission{t.missions.length !== 1 ? 'en' : ''}</span
						>
					{/if}
				</span>
			</button>
		{/each}
	</div>

	{#if selected}
		<section class="detail" style="--accent: {selected.color}">
			<header class="detail-head">
				<span class="detail-avatar">{selected.agent.avatar}</span>
				<div>
					<h2>{selected.label}</h2>
					<p class="detail-role">{selected.agent.role}</p>
				</div>
			</header>

			<div class="detail-desc">{selected.description}</div>

			{#if selected.scene}
				<section class="preview">
					<h3>Scene-Layout</h3>
					<p class="preview-name">
						<strong>{selected.scene.name}</strong>
						{#if selected.scene.description}
							— {selected.scene.description}{/if}
					</p>
					<ul class="apps-preview">
						{#each selected.scene.openApps as app (app.appId)}
							<li>
								<code>{app.appId}</code>
								{#if app.widthPx}<span class="app-w">{app.widthPx}px</span>{/if}
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if selected.missions && selected.missions.length > 0}
				<section class="preview">
					<h3>Starter-Missionen</h3>
					<ul class="missions-preview">
						{#each selected.missions as m}
							<li>
								<strong>{m.title}</strong>
								<p>{m.objective}</p>
								<span class="cadence">
									{#if m.cadence.kind === 'manual'}manuell auslösen
									{:else if m.cadence.kind === 'daily'}täglich {m.cadence.atHour}:{String(
											m.cadence.atMinute
										).padStart(2, '0')}
									{:else if m.cadence.kind === 'weekly'}wöchentlich, Tag {m.cadence.dayOfWeek} um {m
											.cadence.atHour}:00
									{:else if m.cadence.kind === 'interval'}alle {m.cadence.everyMinutes} Minuten
									{:else}cron: {m.cadence.expression}
									{/if}
								</span>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			<section class="options">
				<h3>Optionen</h3>
				{#if selected.scene}
					<label class="opt">
						<input type="checkbox" bind:checked={optCreateScene} />
						<span>Scene „{selected.scene.name}" anlegen und direkt öffnen</span>
					</label>
				{/if}
				{#if selected.missions && selected.missions.length > 0}
					<label class="opt">
						<input type="checkbox" bind:checked={optCreateMissions} />
						<span>Starter-Mission(en) mit anlegen</span>
					</label>
					<label class="opt" class:disabled={!optCreateMissions}>
						<input type="checkbox" bind:checked={optStartActive} disabled={!optCreateMissions} />
						<span>Mission(en) sofort aktivieren (Standard: pausiert)</span>
					</label>
				{/if}
			</section>

			{#if result}
				<div class="result success">
					<Check size={16} />
					<div>
						<strong>
							{result.wasExisting
								? `„${result.agentName}" existierte schon — wiederverwendet.`
								: `Agent „${result.agentName}" angelegt.`}
						</strong>
						<p>
							{#if result.sceneCreated}Scene angelegt + aktiviert.{/if}
							{#if result.missionCount > 0}
								{result.missionCount} Mission{result.missionCount !== 1 ? 'en' : ''}
								{optStartActive ? 'aktiviert' : 'pausiert angelegt'}.
							{/if}
						</p>
						{#if result.warnings.length > 0}
							<ul class="warnings">
								{#each result.warnings as w}
									<li>⚠ {w}</li>
								{/each}
							</ul>
						{/if}
					</div>
				</div>
				<div class="result-actions">
					<button type="button" class="btn-ghost" onclick={() => (selected = null)}>
						Weiteres Template auswählen
					</button>
					<button type="button" class="btn-primary" onclick={() => goto('/')}>
						Zum Workbench
					</button>
				</div>
			{:else}
				{#if error}
					<div class="result error">
						<strong>Konnte Template nicht anwenden</strong>
						<p>{error}</p>
					</div>
				{/if}
				<div class="apply-row">
					<button type="button" class="btn-primary" onclick={handleApply} disabled={applying}>
						<Play size={14} />
						<span>{applying ? 'Lege an…' : `Template „${selected.label}" anwenden`}</span>
					</button>
				</div>
			{/if}
		</section>
	{/if}
</div>

<style>
	.page {
		max-width: 1080px;
		margin: 0 auto;
		padding: 2rem 1.5rem 4rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.back {
		align-self: flex-start;
		display: inline-flex;
		gap: 0.375rem;
		align-items: center;
		padding: 0.375rem 0.625rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: hsl(var(--color-surface));
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		font: inherit;
		font-size: 0.8125rem;
	}
	h1 {
		margin: 0;
		font-size: 1.75rem;
	}
	.sub {
		margin: 0;
		font-size: 0.9375rem;
		color: hsl(var(--color-muted-foreground));
		max-width: 60ch;
		line-height: 1.5;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1rem;
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 1.25rem;
		border: 2px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		background: hsl(var(--color-surface));
		color: hsl(var(--color-foreground));
		text-align: left;
		cursor: pointer;
		font: inherit;
		transition: border-color 0.15s;
	}
	.card:hover {
		border-color: var(--accent);
	}
	.card.selected {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 25%, transparent);
	}
	.avatar {
		font-size: 2.5rem;
		line-height: 1;
	}
	.label {
		font-size: 1.125rem;
		font-weight: 600;
	}
	.tagline {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.4;
	}
	.meta {
		margin-top: 0.5rem;
		display: flex;
		gap: 0.375rem;
	}
	.chip {
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		background: color-mix(in oklab, var(--accent) 15%, transparent);
		color: var(--accent);
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.02em;
	}
	.detail {
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		padding: 1.5rem;
		background: hsl(var(--color-surface));
		display: flex;
		flex-direction: column;
		gap: 1rem;
		border-top: 3px solid var(--accent);
	}
	.detail-head {
		display: flex;
		gap: 1rem;
		align-items: center;
	}
	.detail-avatar {
		font-size: 2.5rem;
		line-height: 1;
	}
	.detail-head h2 {
		margin: 0;
		font-size: 1.25rem;
	}
	.detail-role {
		margin: 0.125rem 0 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
	.detail-desc {
		white-space: pre-wrap;
		font-size: 0.9375rem;
		line-height: 1.55;
	}
	.preview {
		padding: 0.875rem 1rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-background));
	}
	.preview h3 {
		margin: 0 0 0.5rem;
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}
	.preview-name {
		margin: 0 0 0.5rem;
		font-size: 0.875rem;
	}
	.apps-preview {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
	.apps-preview li {
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		font-size: 0.75rem;
		display: inline-flex;
		gap: 0.25rem;
		align-items: center;
	}
	.apps-preview code {
		font-size: 0.75rem;
	}
	.app-w {
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
	}
	.missions-preview {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.missions-preview li strong {
		font-size: 0.875rem;
	}
	.missions-preview li p {
		margin: 0.125rem 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
	.cadence {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		font-style: italic;
	}
	.options {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.options h3 {
		margin: 0 0 0.25rem;
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}
	.opt {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}
	.opt.disabled {
		opacity: 0.5;
	}
	.apply-row {
		display: flex;
		justify-content: flex-end;
	}
	.btn-primary {
		display: inline-flex;
		gap: 0.375rem;
		align-items: center;
		padding: 0.625rem 1rem;
		border: 1px solid var(--accent);
		border-radius: 0.5rem;
		background: var(--accent);
		color: white;
		cursor: pointer;
		font: inherit;
		font-size: 0.9375rem;
		font-weight: 600;
	}
	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.btn-ghost {
		padding: 0.625rem 1rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-surface));
		color: hsl(var(--color-foreground));
		cursor: pointer;
		font: inherit;
		font-size: 0.9375rem;
	}
	.result {
		display: flex;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		border-radius: 0.5rem;
		border: 1px solid;
	}
	.result.success {
		border-color: #1b7a3a;
		background: #d7f7e3;
		color: #0f3f1d;
	}
	.result.error {
		border-color: #8a1b1b;
		background: #f7d7d7;
		color: #3f0f0f;
	}
	.result p {
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
	}
	.result strong {
		font-size: 0.9375rem;
	}
	.warnings {
		margin: 0.375rem 0 0;
		padding-left: 1rem;
		font-size: 0.8125rem;
	}
	.result-actions {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
	}
</style>
