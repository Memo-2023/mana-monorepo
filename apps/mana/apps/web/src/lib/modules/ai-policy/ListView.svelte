<!--
  AI Policy app — per-tool 3-way toggle (auto / propose / deny).
  Overrides stored in localStorage, merged into DEFAULT_AI_POLICY.
-->
<script lang="ts">
	import { getTools } from '$lib/data/tools/registry';
	import { DEFAULT_AI_POLICY, setAiPolicy, getAiPolicy } from '$lib/data/ai/policy';
	import type { PolicyDecision, AiPolicy } from '$lib/data/ai/policy';

	const STORAGE_KEY = 'ai:policyOverrides';

	function loadOverrides(): Record<string, PolicyDecision> {
		if (typeof localStorage === 'undefined') return {};
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return {};
			return JSON.parse(raw) as Record<string, PolicyDecision>;
		} catch {
			return {};
		}
	}
	function saveOverrides(overrides: Record<string, PolicyDecision>): void {
		if (typeof localStorage === 'undefined') return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
		} catch {
			// ignore
		}
	}
	function applyPolicy(overrides: Record<string, PolicyDecision>): void {
		const nextPolicy: AiPolicy = {
			...DEFAULT_AI_POLICY,
			tools: { ...DEFAULT_AI_POLICY.tools, ...overrides },
		};
		setAiPolicy(nextPolicy);
	}

	let overrides = $state<Record<string, PolicyDecision>>(loadOverrides());
	$effect(() => {
		applyPolicy(overrides);
		saveOverrides(overrides);
	});

	const tools = getTools();
	type ToolEntry = (typeof tools)[number];
	const grouped = $derived.by(() => {
		const byModule = new Map<string, ToolEntry[]>();
		for (const t of tools) {
			if (!byModule.has(t.module)) byModule.set(t.module, []);
			byModule.get(t.module)!.push(t);
		}
		return [...byModule.entries()].sort(([a], [b]) => a.localeCompare(b));
	});

	function decide(toolName: string): PolicyDecision {
		if (overrides[toolName]) return overrides[toolName];
		return getAiPolicy().tools[toolName] ?? getAiPolicy().defaultForAi;
	}
	function setDecision(toolName: string, d: PolicyDecision): void {
		const dflt = DEFAULT_AI_POLICY.tools[toolName] ?? DEFAULT_AI_POLICY.defaultForAi;
		if (d === dflt) {
			const { [toolName]: _, ...rest } = overrides;
			overrides = rest;
		} else {
			overrides = { ...overrides, [toolName]: d };
		}
	}
	function resetAll() {
		if (!confirm('Alle Policy-Überschreibungen zurücksetzen?')) return;
		overrides = {};
	}
	const hasOverrides = $derived(Object.keys(overrides).length > 0);
</script>

<div class="policy">
	<header class="info">
		<p>
			Pro Tool festlegen was passiert wenn die KI es aufruft.
			<strong>auto</strong> führt sofort aus, <strong>propose</strong> stagt als Vorschlag,
			<strong>deny</strong> sperrt das Tool komplett.
		</p>
		{#if hasOverrides}
			<button type="button" class="reset" onclick={resetAll}>
				Zurücksetzen ({Object.keys(overrides).length})
			</button>
		{/if}
	</header>

	{#each grouped as [mod, list] (mod)}
		<section>
			<h3>{mod}</h3>
			<ul>
				{#each list as t (t.name)}
					{@const current = decide(t.name)}
					{@const overridden = overrides[t.name] !== undefined}
					<li class:overridden>
						<div class="t-info">
							<span class="t-name">{t.name}</span>
							<span class="t-desc">{t.description}</span>
						</div>
						<div class="t-picker" role="radiogroup" aria-label={t.name}>
							{#each ['auto', 'propose', 'deny'] as PolicyDecision[] as d}
								<button
									type="button"
									class="pill pill-{d}"
									class:active={current === d}
									onclick={() => setDecision(t.name, d)}
									aria-checked={current === d}
									role="radio"
								>
									{d}
								</button>
							{/each}
						</div>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<style>
	.policy {
		padding: 0.75rem 1rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.info {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}
	.info p {
		margin: 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.45;
	}
	.reset {
		flex-shrink: 0;
		padding: 0.375rem 0.625rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: hsl(var(--color-surface));
		cursor: pointer;
		font: inherit;
		font-size: 0.75rem;
	}
	section h3 {
		margin: 0 0 0.375rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: hsl(var(--color-muted-foreground));
	}
	section ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	section li {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.75rem;
		align-items: center;
		padding: 0.5rem 0.625rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
	}
	section li.overridden {
		border-left: 3px solid hsl(var(--color-primary));
	}
	.t-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.t-name {
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.8125rem;
	}
	.t-desc {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.t-picker {
		display: inline-flex;
		border: 1px solid hsl(var(--color-border));
		border-radius: 999px;
		overflow: hidden;
	}
	.pill {
		border: none;
		padding: 0.25rem 0.625rem;
		background: hsl(var(--color-surface));
		color: hsl(var(--color-muted-foreground));
		font: inherit;
		font-size: 0.75rem;
		cursor: pointer;
	}
	.pill + .pill {
		border-left: 1px solid hsl(var(--color-border));
	}
	.pill.active.pill-auto {
		background: #d7f7e3;
		color: #1b7a3a;
	}
	.pill.active.pill-propose {
		background: #fef0c9;
		color: #8a5a00;
	}
	.pill.active.pill-deny {
		background: #f7d7d7;
		color: #8a1b1b;
	}
</style>
