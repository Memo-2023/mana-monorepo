<!--
  AI Agents app — workbench card.

  Master-detail inline (list ↔ create ↔ detail) in a single panel,
  mirroring the ai-missions module. Detail view exposes:
    - role + name rename
    - avatar (emoji)
    - system-prompt + memory (both are encrypted at rest via the
      crypto registry)
    - policy editor (coarse: defaultForAi + a few per-module overrides)
    - budget + concurrency
    - archive / delete

  Policy is intentionally exposed in a coarse form for v1 — per-tool
  overrides are powerful but noisy. The defaultForAi radio gives users
  a one-click "careful vs aggressive" switch; per-module overrides
  handle the common "let the agent touch todo but not calendar" case.
-->
<script lang="ts">
	import { ArrowLeft, Plus, Pause, Play, Archive, Trash, Sparkle } from '@mana/shared-icons';
	import { goto } from '$app/navigation';
	import { useAgents } from '$lib/data/ai/agents/queries';
	import { DEFAULT_AGENT_ID } from '@mana/shared-ai';
	import {
		createAgent,
		updateAgent,
		archiveAgent,
		pauseAgent,
		resumeAgent,
		deleteAgent,
		DuplicateAgentNameError,
	} from '$lib/data/ai/agents/store';
	import { DEFAULT_AI_POLICY } from '$lib/data/ai/policy';
	import type { Agent } from '$lib/data/ai/agents/types';
	import type { AiPolicy, PolicyDecision } from '@mana/shared-ai';
	import { TagSelector } from '@mana/shared-ui';
	import { useAllTags } from '@mana/shared-stores';

	const agents = $derived(useAgents());
	const allTags = $derived(useAllTags());

	let mode = $state<'list' | 'create' | 'detail'>('list');
	let selectedId = $state<string | null>(null);
	const selected = $derived<Agent | null>(
		selectedId ? (agents.value.find((a) => a.id === selectedId) ?? null) : null
	);

	// ── Create form ─────────────────────────────────────────
	let formName = $state('');
	let formAvatar = $state('🤖');
	let formRole = $state('');
	let formError = $state<string | null>(null);
	let creating = $state(false);

	async function handleCreate() {
		if (!formName.trim() || !formRole.trim()) return;
		formError = null;
		creating = true;
		try {
			const a = await createAgent({
				name: formName.trim(),
				avatar: formAvatar || undefined,
				role: formRole.trim(),
			});
			formName = '';
			formAvatar = '🤖';
			formRole = '';
			selectedId = a.id;
			mode = 'detail';
		} catch (err) {
			if (err instanceof DuplicateAgentNameError) {
				formError = `Agent-Name „${err.name}" ist bereits vergeben.`;
			} else {
				formError = err instanceof Error ? err.message : String(err);
			}
		} finally {
			creating = false;
		}
	}

	// ── Detail edits ────────────────────────────────────────
	let editName = $state('');
	let editAvatar = $state('');
	let editRole = $state('');
	let editSystemPrompt = $state('');
	let editMemory = $state('');
	let editMaxConcurrent = $state(1);
	let editMaxTokensPerDay = $state<number | null>(null);
	let editScopeTagIds = $state<string[]>([]);
	let lastSyncedId = $state<string | null>(null);
	let saveError = $state<string | null>(null);
	let saving = $state(false);

	$effect(() => {
		if (selected && selected.id !== lastSyncedId) {
			editName = selected.name;
			editAvatar = selected.avatar ?? '';
			editRole = selected.role;
			editSystemPrompt = selected.systemPrompt ?? '';
			editMemory = selected.memory ?? '';
			editMaxConcurrent = selected.maxConcurrentMissions;
			editMaxTokensPerDay = selected.maxTokensPerDay ?? null;
			editScopeTagIds = [...(selected.scopeTagIds ?? [])];
			lastSyncedId = selected.id;
			saveError = null;
		}
	});

	async function handleSave(agent: Agent) {
		saveError = null;
		saving = true;
		try {
			await updateAgent(agent.id, {
				name: editName.trim() !== agent.name ? editName.trim() : undefined,
				avatar: editAvatar || undefined,
				role: editRole.trim(),
				systemPrompt: editSystemPrompt || undefined,
				memory: editMemory || undefined,
				maxConcurrentMissions: editMaxConcurrent,
				maxTokensPerDay: editMaxTokensPerDay ?? undefined,
				scopeTagIds: editScopeTagIds.length > 0 ? editScopeTagIds : undefined,
			});
		} catch (err) {
			if (err instanceof DuplicateAgentNameError) {
				saveError = `Agent-Name „${err.name}" ist bereits vergeben.`;
			} else {
				saveError = err instanceof Error ? err.message : String(err);
			}
		} finally {
			saving = false;
		}
	}

	// ── Policy editor ───────────────────────────────────────
	// We expose a compact form of AiPolicy: the global default +
	// per-module overrides for the handful of modules that matter.
	// Per-tool overrides are a power-user knob that can come later.
	const POLICY_MODULES = ['todo', 'calendar', 'notes', 'kontext', 'finance', 'drink', 'food'];
	const POLICY_CHOICES: PolicyDecision[] = ['auto', 'propose', 'deny'];
	const POLICY_LABEL: Record<PolicyDecision, string> = {
		auto: 'Automatisch',
		propose: 'Vorschlag',
		deny: 'Verboten',
	};

	async function setDefaultForAi(agent: Agent, value: PolicyDecision) {
		await updateAgent(agent.id, {
			policy: { ...agent.policy, defaultForAi: value },
		});
	}

	async function setModuleDefault(agent: Agent, moduleName: string, value: PolicyDecision) {
		const current = agent.policy.defaultsByModule ?? {};
		await updateAgent(agent.id, {
			policy: {
				...agent.policy,
				defaultsByModule: { ...current, [moduleName]: value },
			},
		});
	}

	async function clearModuleDefault(agent: Agent, moduleName: string) {
		const current = { ...(agent.policy.defaultsByModule ?? {}) };
		delete current[moduleName];
		await updateAgent(agent.id, {
			policy: { ...agent.policy, defaultsByModule: current },
		});
	}

	function moduleDecisionOrDefault(policy: AiPolicy, moduleName: string): PolicyDecision | '' {
		return (policy.defaultsByModule?.[moduleName] ?? '') as PolicyDecision | '';
	}

	// ── Templates ───────────────────────────────────────────
	const TEMPLATES: Array<{ key: string; label: string; policy: AiPolicy }> = [
		{
			key: 'standard',
			label: 'Standard (Vorschlag für alles)',
			policy: DEFAULT_AI_POLICY,
		},
		{
			key: 'cautious',
			label: 'Vorsichtig (alles Vorschlag, Schreiben verboten)',
			policy: {
				...DEFAULT_AI_POLICY,
				tools: Object.fromEntries(
					Object.entries(DEFAULT_AI_POLICY.tools).map(([k, v]) => [
						k,
						v === 'auto' ? 'auto' : ('propose' as PolicyDecision),
					])
				),
				defaultForAi: 'propose',
			},
		},
		{
			key: 'aggressive',
			label: 'Aggressiv (gleichartige Schreibvorgänge automatisch)',
			policy: {
				...DEFAULT_AI_POLICY,
				defaultsByModule: { drink: 'auto', food: 'auto' },
			},
		},
	];

	async function applyTemplate(agent: Agent, key: string) {
		const t = TEMPLATES.find((x) => x.key === key);
		if (!t) return;
		await updateAgent(agent.id, { policy: t.policy });
	}

	// ── Lifecycle helpers ───────────────────────────────────
	function openDetail(id: string) {
		selectedId = id;
		mode = 'detail';
	}

	async function handleDelete(agent: Agent) {
		if (!confirm(`Agent „${agent.name}" löschen? Missionen laufen orphan weiter.`)) return;
		await deleteAgent(agent.id);
		mode = 'list';
		selectedId = null;
	}
</script>

{#if mode === 'list'}
	{@const onlyDefaultAgent = agents.value.length === 1 && agents.value[0].id === DEFAULT_AGENT_ID}
	<div class="pane">
		<header class="bar">
			<button type="button" class="primary" onclick={() => goto('/agents/templates')}>
				<Sparkle size={14} /><span>Aus Template</span>
			</button>
			<button type="button" class="secondary" onclick={() => (mode = 'create')}>
				<Plus size={14} /><span>Eigener Agent</span>
			</button>
		</header>

		{#if onlyDefaultAgent}
			<button type="button" class="promo" onclick={() => goto('/agents/templates')}>
				<span class="promo-icon"><Sparkle size={16} weight="fill" /></span>
				<span class="promo-body">
					<strong>Starte mit einem Template</strong>
					<span class="promo-sub">
						Recherche · Kontext · Today — vorgefertigte Agenten mit passender Scene und
						Starter-Mission.
					</span>
				</span>
			</button>
		{/if}

		{#if agents.value.length === 0}
			<p class="empty">
				Noch keine Agenten. Ein Default-Agent „Mana" wird beim ersten Login automatisch angelegt;
				für weitere persona-basierte Agenten klicke auf „Aus Template" oder „Eigener Agent".
			</p>
		{:else}
			<ul class="m-list">
				{#each agents.value as a (a.id)}
					<li>
						<button type="button" class="m-item" onclick={() => openDetail(a.id)}>
							<span class="m-title">
								<span class="avatar">{a.avatar ?? '🤖'}</span>
								<span class="m-name">{a.name}</span>
								<span class="dot dot-{a.state}" title={a.state}></span>
							</span>
							<span class="m-meta">
								<span>{a.role}</span>
							</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{:else if mode === 'create'}
	<form class="create" onsubmit={(e) => (e.preventDefault(), handleCreate())}>
		<button type="button" class="back-btn" onclick={() => (mode = 'list')}>
			<ArrowLeft size={14} /><span>Abbrechen</span>
		</button>
		<label>
			<span class="lbl">Name</span>
			<input bind:value={formName} placeholder="z.B. Travel Planner" required />
		</label>
		<label>
			<span class="lbl">Avatar (Emoji)</span>
			<input bind:value={formAvatar} maxlength="4" />
		</label>
		<label>
			<span class="lbl">Rolle / Aufgabe</span>
			<input bind:value={formRole} placeholder="Was macht dieser Agent für dich?" required />
		</label>
		{#if formError}
			<p class="form-error">{formError}</p>
		{/if}
		<div class="form-actions">
			<button type="submit" class="primary" disabled={creating}>
				{creating ? 'Erstelle…' : 'Agent anlegen'}
			</button>
		</div>
	</form>
{:else if selected}
	<div class="detail">
		<button type="button" class="back-btn" onclick={() => (mode = 'list')}>
			<ArrowLeft size={14} /><span>Liste</span>
		</button>
		<h2 class="detail-title">
			<span class="avatar">{selected.avatar ?? '🤖'}</span>
			<span>{selected.name}</span>
			<span class="state-pill state-{selected.state}">{selected.state}</span>
		</h2>
		<div class="detail-actions">
			{#if selected.state === 'active'}
				<button type="button" onclick={() => pauseAgent(selected.id)}>
					<Pause size={12} /><span>Pause</span>
				</button>
			{:else if selected.state === 'paused'}
				<button type="button" onclick={() => resumeAgent(selected.id)}>
					<Play size={12} /><span>Fortsetzen</span>
				</button>
			{/if}
			{#if selected.state !== 'archived'}
				<button type="button" onclick={() => archiveAgent(selected.id)}>
					<Archive size={12} /><span>Archivieren</span>
				</button>
			{/if}
			<button type="button" class="danger" onclick={() => handleDelete(selected)}>
				<Trash size={12} />
			</button>
		</div>

		<section class="block">
			<h3>Profil</h3>
			<label>
				<span class="lbl">Name</span>
				<input bind:value={editName} />
			</label>
			<label>
				<span class="lbl">Avatar (Emoji)</span>
				<input bind:value={editAvatar} maxlength="4" />
			</label>
			<label>
				<span class="lbl">Rolle</span>
				<input bind:value={editRole} />
			</label>
		</section>

		<section class="block">
			<h3>Verhalten</h3>
			<label>
				<span class="lbl">System-Anweisung (verschlüsselt)</span>
				<textarea
					bind:value={editSystemPrompt}
					rows="3"
					placeholder="Prepends auf jeden Planner-Prompt dieses Agents."
				></textarea>
			</label>
			<label>
				<span class="lbl">Gedächtnis (verschlüsselt)</span>
				<textarea
					bind:value={editMemory}
					rows="5"
					placeholder="Was der Agent dauerhaft über dich wissen soll."
				></textarea>
			</label>
		</section>

		<section class="block">
			<h3>Bereiche (Tag-Scope)</h3>
			<p class="hint">Der Agent sieht nur Records mit diesen Tags. Leer = alles sichtbar.</p>
			<TagSelector
				tags={allTags.value}
				selectedTags={allTags.value.filter((t) => editScopeTagIds.includes(t.id))}
				onTagsChange={(tags) => {
					editScopeTagIds = tags.map((t) => t.id);
				}}
				placeholder="Bereiche wählen…"
				addTagLabel="Bereich hinzufügen"
			/>
		</section>

		<section class="block">
			<h3>Grenzen</h3>
			<label class="inline-field">
				<span class="lbl">Parallele Missionen</span>
				<input type="number" min="1" max="10" bind:value={editMaxConcurrent} />
			</label>
			<label class="inline-field">
				<span class="lbl">Token-Budget / Tag</span>
				<input
					type="number"
					min="0"
					bind:value={editMaxTokensPerDay}
					placeholder="leer = unbegrenzt"
				/>
			</label>
		</section>

		<div class="save-row">
			{#if saveError}
				<span class="form-error">{saveError}</span>
			{/if}
			<button type="button" class="primary" disabled={saving} onclick={() => handleSave(selected)}>
				{saving ? 'Speichere…' : 'Speichern'}
			</button>
		</div>

		<section class="block">
			<h3>Policy</h3>
			<p class="hint">
				Entscheidet pro Modul was der Agent autonom darf. Tool-spezifische Feinheiten kommen später.
			</p>

			<div class="policy-row">
				<span class="lbl">Template übernehmen</span>
				<select onchange={(e) => applyTemplate(selected, (e.target as HTMLSelectElement).value)}>
					<option value="">—</option>
					{#each TEMPLATES as t (t.key)}
						<option value={t.key}>{t.label}</option>
					{/each}
				</select>
			</div>

			<div class="policy-row">
				<span class="lbl">Global: wenn kein Modul passt</span>
				<div class="radio-group">
					{#each POLICY_CHOICES as c}
						<label class="radio">
							<input
								type="radio"
								name="defaultForAi"
								value={c}
								checked={selected.policy.defaultForAi === c}
								onchange={() => setDefaultForAi(selected, c)}
							/>
							<span>{POLICY_LABEL[c]}</span>
						</label>
					{/each}
				</div>
			</div>

			<table class="policy-table">
				<thead>
					<tr>
						<th>Modul</th>
						<th>Entscheidung</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each POLICY_MODULES as mod}
						{@const current = moduleDecisionOrDefault(selected.policy, mod)}
						<tr>
							<td><code>{mod}</code></td>
							<td>
								<select
									value={current}
									onchange={(e) => {
										const v = (e.target as HTMLSelectElement).value;
										if (!v) clearModuleDefault(selected, mod);
										else setModuleDefault(selected, mod, v as PolicyDecision);
									}}
								>
									<option value="">Global-Default</option>
									{#each POLICY_CHOICES as c}
										<option value={c}>{POLICY_LABEL[c]}</option>
									{/each}
								</select>
							</td>
							<td></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>
	</div>
{/if}

<style>
	.pane,
	.create,
	.detail {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		padding: 0.75rem 1rem 1.5rem;
	}
	.bar {
		display: flex;
		justify-content: flex-end;
		gap: 0.375rem;
	}
	.primary {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border: 1px solid color-mix(in oklab, hsl(var(--color-primary)) 45%, transparent);
		border-radius: 0.375rem;
		background: color-mix(in oklab, hsl(var(--color-primary)) 12%, hsl(var(--color-surface)));
		color: hsl(var(--color-primary));
		cursor: pointer;
		font: inherit;
		font-size: 0.8125rem;
	}
	.primary:disabled {
		opacity: 0.5;
	}
	.secondary {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: hsl(var(--color-surface));
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		font: inherit;
		font-size: 0.8125rem;
	}
	.promo {
		display: flex;
		gap: 0.625rem;
		align-items: center;
		width: 100%;
		padding: 0.75rem 0.875rem;
		border: 1px dashed color-mix(in oklab, hsl(var(--color-primary)) 50%, transparent);
		border-radius: 0.5rem;
		background: color-mix(in oklab, hsl(var(--color-primary)) 6%, hsl(var(--color-surface)));
		color: hsl(var(--color-foreground));
		text-align: left;
		cursor: pointer;
		font: inherit;
	}
	.promo:hover {
		background: color-mix(in oklab, hsl(var(--color-primary)) 10%, hsl(var(--color-surface)));
	}
	.promo-icon {
		color: hsl(var(--color-primary));
		flex-shrink: 0;
	}
	.promo-body {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.promo-body strong {
		font-size: 0.875rem;
	}
	.promo-sub {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.empty {
		padding: 1.5rem 1rem;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
		text-align: center;
	}
	.m-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.m-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.625rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-surface));
		text-align: left;
		cursor: pointer;
		width: 100%;
		font: inherit;
		color: hsl(var(--color-foreground));
	}
	.m-item:hover {
		border-color: hsl(var(--color-primary));
	}
	.m-title {
		display: inline-flex;
		gap: 0.5rem;
		align-items: center;
		font-weight: 600;
		font-size: 0.9375rem;
	}
	.m-name {
		flex: 1;
	}
	.avatar {
		display: inline-block;
		font-size: 1rem;
	}
	.dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 999px;
	}
	.dot-active {
		background: #22c55e;
	}
	.dot-paused {
		background: #f59e0b;
	}
	.dot-archived {
		background: #6b7280;
	}
	.m-meta {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.back-btn {
		align-self: flex-start;
		display: inline-flex;
		gap: 0.25rem;
		align-items: center;
		padding: 0.25rem 0.5rem;
		border: none;
		background: none;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		font-size: 0.8125rem;
	}
	.create label,
	.block label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.lbl {
		font-size: 0.6875rem;
		text-transform: uppercase;
		font-weight: 600;
		letter-spacing: 0.04em;
		color: hsl(var(--color-muted-foreground));
	}
	input,
	textarea,
	select {
		padding: 0.375rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		font: inherit;
		background: hsl(var(--color-surface));
		color: hsl(var(--color-foreground));
	}
	textarea {
		font-family: var(--font-mono, ui-monospace, monospace);
		resize: vertical;
	}
	.form-actions {
		display: flex;
		justify-content: flex-end;
	}
	.form-error {
		color: hsl(var(--color-error));
		font-size: 0.8125rem;
	}
	.detail-title {
		display: inline-flex;
		gap: 0.5rem;
		align-items: center;
		margin: 0;
		font-size: 1.125rem;
	}
	.state-pill {
		margin-left: auto;
		padding: 0.0625rem 0.375rem;
		border-radius: 999px;
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
	}
	.state-active {
		background: #d7f7e3;
		color: #1b7a3a;
	}
	.state-paused {
		background: #fde7c8;
		color: #8a4f00;
	}
	.state-archived {
		background: hsl(var(--color-surface));
		color: hsl(var(--color-muted-foreground));
		border: 1px solid hsl(var(--color-border));
	}
	.detail-actions {
		display: flex;
		gap: 0.25rem;
	}
	.detail-actions button {
		display: inline-flex;
		gap: 0.25rem;
		align-items: center;
		padding: 0.25rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: hsl(var(--color-surface));
		font: inherit;
		font-size: 0.75rem;
		cursor: pointer;
	}
	.detail-actions .danger {
		color: hsl(var(--color-error));
	}
	.block {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
	}
	.block h3 {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		color: hsl(var(--color-muted-foreground));
	}
	.inline-field {
		flex-direction: row !important;
		gap: 0.5rem !important;
		align-items: center;
	}
	.inline-field input {
		width: 6rem;
	}
	.save-row {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 0.5rem;
	}
	.hint {
		margin: 0;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.policy-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		justify-content: space-between;
	}
	.radio-group {
		display: inline-flex;
		gap: 0.5rem;
	}
	.radio {
		flex-direction: row !important;
		gap: 0.25rem !important;
		align-items: center;
		font-size: 0.8125rem;
	}
	.policy-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8125rem;
	}
	.policy-table th,
	.policy-table td {
		text-align: left;
		padding: 0.25rem 0.375rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}
	.policy-table th {
		font-weight: 600;
		font-size: 0.6875rem;
		text-transform: uppercase;
		color: hsl(var(--color-muted-foreground));
	}
	.policy-table code {
		font-size: 0.75rem;
	}
</style>
