<!--
  /feedback/admin — Founder/Admin triage hub.

  Lives in the public /feedback route tree, but client-side gates on
  authStore.user.role === 'admin'. Lets the founder filter all feedback
  (public + private), update status, write admin responses, and toggle
  visibility.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { feedbackService } from '$lib/api/feedback';
	import {
		FEEDBACK_CATEGORY_LABELS,
		FEEDBACK_STATUS_CONFIG,
		type Feedback,
		type FeedbackCategory,
		type FeedbackStatus,
	} from '@mana/feedback';

	let isAdmin = $derived(authStore.user?.role === 'admin');

	$effect(() => {
		if (authStore.initialized && !authStore.loading && !isAdmin) {
			goto('/feedback');
		}
	});

	let items = $state<Feedback[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	let filterCategory = $state<FeedbackCategory | ''>('');
	let filterStatus = $state<FeedbackStatus | ''>('');
	let filterModule = $state('');

	async function reload() {
		if (!isAdmin) return;
		loading = true;
		error = null;
		try {
			const res = await feedbackService.adminListAll({
				category: filterCategory || undefined,
				status: filterStatus || undefined,
				moduleContext: filterModule || undefined,
				limit: 200,
			});
			items = (res.items as Feedback[]) ?? [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Laden fehlgeschlagen';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void [filterCategory, filterStatus, filterModule, isAdmin];
		if (isAdmin) reload();
	});

	async function patchItem(id: string, patch: Partial<Feedback>) {
		try {
			await feedbackService.adminPatch(id, patch as never);
			await reload();
		} catch (err) {
			console.error('[community/admin] patch failed:', err);
		}
	}

	const STATUS_OPTIONS = Object.entries(FEEDBACK_STATUS_CONFIG).map(([k, v]) => ({
		value: k as FeedbackStatus,
		label: v.label,
	}));

	function formatDate(s: string): string {
		try {
			return new Date(s).toLocaleString('de-DE');
		} catch {
			return s;
		}
	}
</script>

{#if !isAdmin}
	<div class="gate">
		<div class="gate-icon" aria-hidden="true">🔒</div>
		<h3>Nur für Admins</h3>
		<p>Diese Seite ist nicht für dich.</p>
	</div>
{:else}
	<div class="admin">
		<header class="admin-header">
			<h1>Community-Admin</h1>
			<p class="muted">
				Alle Feedback-Einträge (öffentlich + privat). Status &amp; Antworten direkt setzen.
			</p>
		</header>

		<div class="filters">
			<select bind:value={filterCategory}>
				<option value="">Alle Kategorien</option>
				{#each Object.entries(FEEDBACK_CATEGORY_LABELS) as [val, lbl] (val)}
					<option value={val}>{lbl}</option>
				{/each}
			</select>

			<select bind:value={filterStatus}>
				<option value="">Alle Status</option>
				{#each STATUS_OPTIONS as opt (opt.value)}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>

			<input type="text" bind:value={filterModule} placeholder="Modul (z.B. todo)" />
		</div>

		{#if loading && items.length === 0}
			<div class="state">Lade…</div>
		{:else if error}
			<div class="state error">{error}</div>
		{:else if items.length === 0}
			<div class="state">Keine Einträge passen.</div>
		{:else}
			<div class="grid">
				{#each items as item (item.id)}
					<article class="row" class:not-public={!item.isPublic}>
						<div class="row-meta">
							<span class="badge">{FEEDBACK_CATEGORY_LABELS[item.category]}</span>
							{#if item.moduleContext}
								<span class="badge module">{item.moduleContext}</span>
							{/if}
							{#if !item.isPublic}
								<span class="badge private">privat</span>
							{/if}
							<span class="muted">{formatDate(item.createdAt)}</span>
							<span class="muted">{item.displayName ?? item.userId}</span>
						</div>

						{#if item.title}
							<h3 class="row-title">{item.title}</h3>
						{/if}
						<p class="row-text">{item.feedbackText}</p>

						<div class="row-controls">
							<label class="ctl">
								<span>Status</span>
								<select
									value={item.status}
									onchange={(e) =>
										patchItem(item.id, {
											status: (e.currentTarget as HTMLSelectElement).value as FeedbackStatus,
										})}
								>
									{#each STATUS_OPTIONS as opt (opt.value)}
										<option value={opt.value}>{opt.label}</option>
									{/each}
								</select>
							</label>

							<label class="ctl checkbox">
								<input
									type="checkbox"
									checked={item.isPublic}
									onchange={(e) =>
										patchItem(item.id, {
											isPublic: (e.currentTarget as HTMLInputElement).checked,
										})}
								/>
								<span>öffentlich</span>
							</label>
						</div>

						<details class="response-block">
							<summary>
								Antwort {item.adminResponse
									? `(${item.adminResponse.slice(0, 30)}…)`
									: '(noch keine)'}
							</summary>
							<textarea
								rows="3"
								placeholder="Antwort vom Team…"
								value={item.adminResponse ?? ''}
								onblur={(e) => {
									const next = (e.currentTarget as HTMLTextAreaElement).value;
									if (next !== (item.adminResponse ?? '')) {
										patchItem(item.id, { adminResponse: next });
									}
								}}
							></textarea>
						</details>
					</article>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.gate {
		padding: 4rem 1rem;
		text-align: center;
		color: hsl(var(--color-muted-foreground));
	}

	.gate-icon {
		font-size: 2.5rem;
	}

	.gate h3 {
		margin: 0.5rem 0;
	}

	.admin {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.admin-header h1 {
		margin: 0 0 0.25rem 0;
		font-size: 1.5rem;
	}

	.muted {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.filters select,
	.filters input {
		padding: 0.375rem 0.625rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-surface, var(--color-background)));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
	}

	.grid {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.row {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.875rem 1rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		border-radius: 0.875rem;
	}

	.row.not-public {
		border-color: hsl(var(--color-border));
		background: hsl(var(--color-muted) / 0.25);
	}

	.row-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.6875rem;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.125rem 0.4375rem;
		border-radius: 999px;
		background: hsl(var(--color-muted) / 0.45);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.badge.module {
		background: hsl(var(--color-primary) / 0.12);
		color: hsl(var(--color-primary));
	}

	.badge.private {
		background: hsl(var(--color-error, 0 84% 60%) / 0.12);
		color: hsl(var(--color-error, 0 84% 60%));
	}

	.row-title {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 700;
	}

	.row-text {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.5;
		white-space: pre-wrap;
	}

	.row-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.875rem;
		font-size: 0.8125rem;
	}

	.ctl {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
	}

	.ctl select {
		padding: 0.25rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: hsl(var(--color-surface, var(--color-background)));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
	}

	.ctl.checkbox {
		gap: 0.25rem;
	}

	.response-block summary {
		cursor: pointer;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	.response-block textarea {
		width: 100%;
		margin-top: 0.375rem;
		padding: 0.5rem 0.625rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-surface, var(--color-background)));
		color: hsl(var(--color-foreground));
		font: inherit;
		resize: vertical;
	}

	.state {
		padding: 2rem 1rem;
		text-align: center;
		color: hsl(var(--color-muted-foreground));
	}

	.state.error {
		color: hsl(var(--color-error, 0 84% 60%));
	}
</style>
