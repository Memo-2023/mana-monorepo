<!--
  ComposeView — 4-step wizard for creating / editing a campaign.

  M2 ships steps 1 (Audience) + 2 (Content) fully functional. Preflight
  and Send steps are stubbed (buttons disabled) — those land in M3/M4
  when HTML rendering and bulk-send orchestration exist.

  The wizard is state-aware: user can jump back to earlier steps, but
  step 3/4 refuse to activate if earlier steps are incomplete.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import AudienceBuilder from '../audience/AudienceBuilder.svelte';
	import Editor from '../editor/Editor.svelte';
	import { broadcastCampaignsStore } from '../stores/campaigns.svelte';
	import type { Campaign, CampaignContent, AudienceDefinition } from '../types';

	interface Props {
		existing?: Campaign;
	}

	let { existing }: Props = $props();
	// Capture once at mount — ComposeView is keyed on campaign id at the
	// route level, so prop changes remount rather than re-initialise.
	const initial = untrack(() => existing);
	const isEdit = untrack(() => Boolean(existing));

	type Step = 1 | 2 | 3 | 4;
	let step = $state<Step>(1);

	// ─── Form state (captured once at mount) ───────────────────
	let name = $state<string>(initial?.name ?? 'Neue Kampagne');
	let subject = $state<string>(initial?.subject ?? '');
	let preheader = $state<string>(initial?.preheader ?? '');
	let fromName = $state<string>(initial?.fromName ?? '');
	let fromEmail = $state<string>(initial?.fromEmail ?? '');
	let audience = $state<AudienceDefinition>(
		initial?.audience ?? { filters: [], estimatedCount: 0 }
	);
	let content = $state<CampaignContent>(
		initial?.content ?? { tiptap: { type: 'doc', content: [{ type: 'paragraph' }] } }
	);

	let saving = $state(false);
	let error = $state<string | null>(null);
	let savedAt = $state<string | null>(null);

	// ─── Save ───────────────────────────────────────────────────
	async function save() {
		if (!existing) return;
		saving = true;
		error = null;
		try {
			await broadcastCampaignsStore.updateCampaign(existing.id, {
				name,
				subject,
				preheader: preheader || null,
				fromName,
				fromEmail,
			});
			await broadcastCampaignsStore.updateAudience(existing.id, audience);
			await broadcastCampaignsStore.updateContent(existing.id, content);
			savedAt = new Date().toLocaleTimeString();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Speichern fehlgeschlagen';
		} finally {
			saving = false;
		}
	}

	// Autosave on step change — keeps content from vanishing when the
	// user clicks through the wizard without hitting an explicit save.
	async function goToStep(next: Step) {
		if (isEdit) await save();
		step = next;
	}

	const audienceReady = $derived(audience.estimatedCount > 0);
	const contentReady = $derived(subject.trim().length > 0);

	function onCancel() {
		goto(isEdit && existing ? `/broadcasts/${existing.id}` : '/broadcasts');
	}
</script>

<div class="compose">
	<header class="head">
		<input
			class="name-input"
			type="text"
			placeholder="Kampagnen-Name"
			bind:value={name}
			aria-label="Kampagnen-Name"
		/>
		<div class="head-actions">
			{#if savedAt}
				<span class="saved">Gespeichert um {savedAt}</span>
			{/if}
			<button type="button" class="btn-ghost" onclick={onCancel}>Schließen</button>
			<button type="button" class="btn-primary" onclick={save} disabled={saving || !isEdit}>
				{saving ? 'Speichert …' : 'Speichern'}
			</button>
		</div>
	</header>

	<nav class="stepper">
		<button
			type="button"
			class="step"
			class:active={step === 1}
			class:done={audienceReady && step > 1}
			onclick={() => goToStep(1)}
		>
			<span class="step-num">1</span>
			<span class="step-label">Empfänger</span>
		</button>
		<button
			type="button"
			class="step"
			class:active={step === 2}
			class:done={contentReady && step > 2}
			onclick={() => goToStep(2)}
		>
			<span class="step-num">2</span>
			<span class="step-label">Inhalt</span>
		</button>
		<button
			type="button"
			class="step"
			class:active={step === 3}
			disabled={!audienceReady || !contentReady}
			onclick={() => goToStep(3)}
		>
			<span class="step-num">3</span>
			<span class="step-label">Check</span>
		</button>
		<button
			type="button"
			class="step"
			class:active={step === 4}
			disabled={!audienceReady || !contentReady}
			onclick={() => goToStep(4)}
		>
			<span class="step-num">4</span>
			<span class="step-label">Senden</span>
		</button>
	</nav>

	{#if error}
		<div class="error">{error}</div>
	{/if}

	{#if step === 1}
		<section class="step-panel">
			<AudienceBuilder bind:audience />
		</section>
	{:else if step === 2}
		<section class="step-panel">
			<div class="meta-grid">
				<label class="field">
					<span>Betreff *</span>
					<input type="text" placeholder="Neuer Newsletter" bind:value={subject} />
				</label>
				<label class="field">
					<span>Preheader</span>
					<input
						type="text"
						placeholder="Kurzer Vorschautext, erscheint in Gmail neben dem Betreff"
						bind:value={preheader}
					/>
				</label>
				<label class="field">
					<span>Absender-Name *</span>
					<input type="text" bind:value={fromName} />
				</label>
				<label class="field">
					<span>Absender-E-Mail *</span>
					<input type="email" bind:value={fromEmail} />
				</label>
			</div>

			<Editor
				bind:content
				placeholder="Schreib deinen Newsletter. Nutze Bilder, Überschriften und Links."
			/>
		</section>
	{:else if step === 3}
		<section class="step-panel">
			<div class="placeholder">
				<h3>Preflight</h3>
				<p>Spam-Score, DNS-Checks und Empfänger-Übersicht folgen in M3/M8.</p>
				<p class="hint">
					Empfänger: <strong>{audience.estimatedCount}</strong><br />
					Betreff: <strong>{subject || '—'}</strong><br />
					Absender: <strong>{fromName} &lt;{fromEmail}&gt;</strong>
				</p>
			</div>
		</section>
	{:else if step === 4}
		<section class="step-panel">
			<div class="placeholder">
				<h3>Senden</h3>
				<p>
					Der Bulk-Send-Flow (Jetzt / Später) landet in M4 sobald mana-mail's <code>/bulk-send</code
					>-Endpoint steht.
				</p>
				<button class="btn-primary" disabled>Jetzt senden (M4)</button>
			</div>
		</section>
	{/if}
</div>

<style>
	.compose {
		max-width: 900px;
		margin: 0 auto;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.name-input {
		flex: 1;
		min-width: 18rem;
		padding: 0.55rem 0.75rem;
		border: 1px solid transparent;
		border-radius: 0.4rem;
		font-size: 1.15rem;
		font-weight: 600;
		background: transparent;
	}

	.name-input:hover,
	.name-input:focus {
		border-color: var(--color-border, #e2e8f0);
		background: white;
		outline: none;
	}

	.head-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.saved {
		font-size: 0.8rem;
		color: #6366f1;
	}

	.stepper {
		display: flex;
		gap: 0.25rem;
		background: var(--color-surface-muted, #f8fafc);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.5rem;
		padding: 0.3rem;
	}

	.step {
		flex: 1;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 0.75rem;
		background: transparent;
		border: 0;
		border-radius: 0.35rem;
		cursor: pointer;
		font-size: 0.9rem;
		justify-content: center;
	}

	.step:hover:not(:disabled) {
		background: white;
	}

	.step.active {
		background: white;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
		font-weight: 500;
	}

	.step.done .step-num {
		background: #22c55e;
		color: white;
	}

	.step:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.step-num {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.3rem;
		height: 1.3rem;
		border-radius: 50%;
		background: var(--color-border, #e2e8f0);
		color: var(--color-text-muted, #64748b);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.step.active .step-num {
		background: #6366f1;
		color: white;
	}

	.step-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.meta-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.field > span {
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
	}

	.field input {
		padding: 0.5rem 0.65rem;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.4rem;
		font-size: 0.95rem;
		font-family: inherit;
	}

	.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
		padding: 0.75rem 1rem;
		border-radius: 0.4rem;
		font-size: 0.9rem;
	}

	.placeholder {
		background: var(--color-surface-muted, #f8fafc);
		border: 1px dashed var(--color-border, #e2e8f0);
		border-radius: 0.5rem;
		padding: 2rem;
		text-align: center;
		color: var(--color-text-muted, #64748b);
	}

	.placeholder h3 {
		margin: 0 0 0.5rem;
		font-size: 1.05rem;
		color: var(--color-text, #0f172a);
	}

	.placeholder .hint {
		margin-top: 1rem;
		text-align: left;
		display: inline-block;
	}

	.btn-primary {
		background: #6366f1;
		color: white;
		padding: 0.55rem 1.25rem;
		border-radius: 0.4rem;
		border: 0;
		font-weight: 500;
		cursor: pointer;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-ghost {
		background: white;
		border: 1px solid var(--color-border, #e2e8f0);
		padding: 0.55rem 1rem;
		border-radius: 0.4rem;
		cursor: pointer;
		font-size: 0.9rem;
	}
</style>
