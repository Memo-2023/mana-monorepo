<!--
  /research-lab/keys — per-user BYO API-Key management for every research
  provider. Keys land in research.provider_configs, masked on read, and
  bypass mana-credits at call time (no charge for BYO-mode).
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import * as api from '$lib/modules/research-lab/api';
	import type { ProviderConfigDto } from '$lib/modules/research-lab/api';
	import type { ProviderInfo, ProvidersCatalog } from '$lib/modules/research-lab/types';
	import { RoutePage } from '$lib/components/shell';

	let catalog = $state<ProvidersCatalog | null>(null);
	let configs = $state<ProviderConfigDto[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let savingFor = $state<string | null>(null);

	type FormState = {
		apiKey: string;
		dailyBudget: string;
		monthlyBudget: string;
		enabled: boolean;
	};

	const forms = $state<Record<string, FormState>>({});

	function flatProviders(): ProviderInfo[] {
		if (!catalog) return [];
		return [...catalog.search, ...catalog.extract, ...catalog.agent].filter(
			(p) => p.requiresApiKey
		);
	}

	function refreshForms(providers: ProviderInfo[], existing: ProviderConfigDto[]) {
		const byProvider = new Map(existing.map((c) => [c.providerId, c] as const));
		for (const p of providers) {
			const match = byProvider.get(p.id);
			if (!forms[p.id]) {
				forms[p.id] = {
					apiKey: '',
					dailyBudget: match?.dailyBudgetCredits?.toString() ?? '',
					monthlyBudget: match?.monthlyBudgetCredits?.toString() ?? '',
					enabled: match?.enabled ?? true,
				};
			} else {
				// keep user-typed apiKey untouched; refresh budget/enabled from server
				forms[p.id].dailyBudget = match?.dailyBudgetCredits?.toString() ?? '';
				forms[p.id].monthlyBudget = match?.monthlyBudgetCredits?.toString() ?? '';
				forms[p.id].enabled = match?.enabled ?? true;
			}
		}
	}

	async function load() {
		loading = true;
		error = null;
		try {
			const [cat, cfgs] = await Promise.all([api.getProviders(), api.listProviderConfigs()]);
			catalog = cat;
			configs = cfgs.configs;
			refreshForms(flatProviders(), configs);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Laden fehlgeschlagen';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void load();
	});

	function configFor(providerId: string): ProviderConfigDto | undefined {
		return configs.find((c) => c.providerId === providerId);
	}

	async function save(providerId: string) {
		const f = forms[providerId];
		if (!f) return;
		savingFor = providerId;
		error = null;
		try {
			const updated = await api.upsertProviderConfig({
				providerId,
				apiKey: f.apiKey.trim() || undefined,
				enabled: f.enabled,
				dailyBudgetCredits: f.dailyBudget.trim() === '' ? null : Number(f.dailyBudget),
				monthlyBudgetCredits: f.monthlyBudget.trim() === '' ? null : Number(f.monthlyBudget),
			});
			configs = configs.some((c) => c.providerId === providerId)
				? configs.map((c) => (c.providerId === providerId ? updated : c))
				: [...configs, updated];
			// Clear the typed key from the form so the mask is visible
			forms[providerId] = { ...f, apiKey: '' };
		} catch (err) {
			error = err instanceof Error ? err.message : 'Speichern fehlgeschlagen';
		} finally {
			savingFor = null;
		}
	}

	async function remove(providerId: string) {
		if (!confirm(`Konfiguration für ${providerId} wirklich löschen?`)) return;
		savingFor = providerId;
		try {
			await api.deleteProviderConfig(providerId);
			configs = configs.filter((c) => c.providerId !== providerId);
			if (forms[providerId]) {
				forms[providerId] = {
					apiKey: '',
					dailyBudget: '',
					monthlyBudget: '',
					enabled: true,
				};
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Löschen fehlgeschlagen';
		} finally {
			savingFor = null;
		}
	}
</script>

<svelte:head>
	<title>Research Keys · Mana</title>
</svelte:head>

<RoutePage appId="research-lab" backHref="/research-lab">
	<div class="page">
		<header class="header">
			<button type="button" class="back" onclick={() => void goto('/research-lab')}>
				← Zurück zum Lab
			</button>
			<div class="title">
				<h1>Research-Keys</h1>
				<p class="subtitle">
					Eigene API-Keys hinterlegen — deine Aufrufe gehen direkt an den Anbieter, ohne Credits zu
					verbrauchen. Leer lassen, um den Server-Key (falls konfiguriert) weiter zu nutzen.
				</p>
			</div>
		</header>

		{#if error}
			<div class="error">{error}</div>
		{/if}

		{#if loading}
			<p class="loading">Lade …</p>
		{:else}
			{#each flatProviders() as provider (provider.id)}
				{@const cfg = configFor(provider.id)}
				{@const form = forms[provider.id]}
				<section class="row">
					<div class="provider-info">
						<h3>{provider.id}</h3>
						<span class="badge badge-{provider.category}">{provider.category}</span>
						{#if cfg?.hasKey}
							<span class="mask" title="Hinterlegter Key">{cfg.maskedKey}</span>
						{:else}
							<span class="mask mask-empty">kein eigener Key</span>
						{/if}
					</div>

					{#if form}
						<div class="field">
							<label>
								API-Key
								<input
									type="password"
									autocomplete="new-password"
									placeholder={cfg?.hasKey ? 'Leer lassen zum Beibehalten' : 'sk-…'}
									bind:value={form.apiKey}
								/>
							</label>
						</div>
						<div class="field narrow">
							<label>
								Tagesbudget (¢)
								<input
									type="number"
									min="0"
									step="10"
									placeholder="unbegrenzt"
									bind:value={form.dailyBudget}
								/>
							</label>
						</div>
						<div class="field narrow">
							<label>
								Monatsbudget (¢)
								<input
									type="number"
									min="0"
									step="100"
									placeholder="unbegrenzt"
									bind:value={form.monthlyBudget}
								/>
							</label>
						</div>
						<div class="field toggle">
							<label>
								<input type="checkbox" bind:checked={form.enabled} />
								Aktiv
							</label>
						</div>
						<div class="actions">
							<button
								type="button"
								class="primary"
								disabled={savingFor === provider.id}
								onclick={() => void save(provider.id)}
							>
								{savingFor === provider.id ? 'Speichere…' : 'Speichern'}
							</button>
							{#if cfg}
								<button
									type="button"
									class="danger"
									disabled={savingFor === provider.id}
									onclick={() => void remove(provider.id)}
								>
									Löschen
								</button>
							{/if}
						</div>
					{/if}
				</section>
			{/each}
		{/if}
	</div>
</RoutePage>

<style>
	.page {
		max-width: 60rem;
		margin: 0 auto;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
	}
	.header {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
	}
	.back {
		padding: 0.375rem 0.75rem;
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		color: hsl(var(--color-foreground));
		cursor: pointer;
		font-size: 0.8125rem;
	}
	.back:hover {
		background: hsl(var(--color-surface-hover));
	}
	.title h1 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}
	.subtitle {
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		max-width: 48rem;
	}

	.loading {
		color: hsl(var(--color-muted-foreground));
	}

	.error {
		padding: 0.625rem 0.875rem;
		background: hsl(var(--color-error, 0 84% 60%) / 0.1);
		border: 1px solid hsl(var(--color-error, 0 84% 60%) / 0.4);
		color: hsl(var(--color-error, 0 84% 40%));
		border-radius: 0.375rem;
	}

	.row {
		display: grid;
		grid-template-columns: minmax(14rem, 1fr) minmax(14rem, 1.4fr) auto auto auto auto;
		gap: 0.75rem;
		padding: 0.875rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-surface));
		align-items: end;
	}

	.provider-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.provider-info h3 {
		margin: 0;
		font-family: ui-monospace, SFMono-Regular, monospace;
		font-size: 0.9375rem;
	}
	.badge {
		display: inline-block;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		width: fit-content;
	}
	.badge-search {
		background: hsl(200 80% 50% / 0.15);
		color: hsl(200 80% 40%);
	}
	.badge-extract {
		background: hsl(270 60% 55% / 0.15);
		color: hsl(270 60% 45%);
	}
	.badge-agent {
		background: hsl(30 90% 55% / 0.15);
		color: hsl(30 90% 40%);
	}
	.mask {
		font-family: ui-monospace, SFMono-Regular, monospace;
		font-size: 0.75rem;
		color: hsl(var(--color-foreground));
	}
	.mask-empty {
		color: hsl(var(--color-muted-foreground));
		font-style: italic;
	}

	.field label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.field input[type='password'],
	.field input[type='number'] {
		padding: 0.375rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.25rem;
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
	}
	.field.narrow input {
		width: 8rem;
	}
	.field.toggle label {
		flex-direction: row;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
	}

	.actions {
		display: flex;
		gap: 0.375rem;
	}
	.actions button {
		padding: 0.375rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s;
	}
	.actions .primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground, 0 0% 10%));
		border-color: transparent;
	}
	.actions .primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.actions .danger {
		background: transparent;
		color: hsl(var(--color-error, 0 84% 40%));
		border-color: hsl(var(--color-error, 0 84% 60%) / 0.4);
	}
	.actions .danger:hover {
		background: hsl(var(--color-error, 0 84% 60%) / 0.08);
	}

	@media (max-width: 900px) {
		.row {
			grid-template-columns: 1fr;
		}
		.field.narrow input {
			width: 100%;
		}
	}
</style>
