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
	import PreviewTabs from '../preview/PreviewTabs.svelte';
	import { broadcastCampaignsStore } from '../stores/campaigns.svelte';
	import { broadcastSettingsStore } from '../stores/settings.svelte';
	import { sendCampaign } from '../api';
	import { useAllContacts } from '$lib/modules/contacts/queries';
	import type { Campaign, CampaignContent, AudienceDefinition, BroadcastSettings } from '../types';

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
	let settings = $state<BroadcastSettings | null>(null);

	// Load settings once for the Preflight preview. Defaults to the
	// current row so the preview reflects what the user just typed in
	// Settings without an extra reload.
	$effect(() => {
		broadcastSettingsStore.get().then((s) => {
			settings = s;
		});
	});

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

	// ─── Send ──────────────────────────────────────────────────
	const contacts$ = useAllContacts();
	const contacts = $derived(contacts$.value ?? []);
	let sendState = $state<'idle' | 'confirming' | 'sending' | 'done'>('idle');
	let sendResult = $state<{
		delivered: number;
		failed: number;
		errors: Array<{ email: string; reason: string }>;
	} | null>(null);

	async function doSend() {
		if (!existing || !settings) return;
		sendState = 'sending';
		error = null;
		try {
			// Save first so the server-side campaign row uses the latest
			// metadata + content.
			await save();
			const result = await sendCampaign(
				{
					...existing,
					subject,
					preheader: preheader || null,
					fromName,
					fromEmail,
					audience,
					content,
				},
				settings,
				contacts
			);
			await broadcastCampaignsStore.applyServerStatus(existing.id, {
				status: 'sent',
				sentAt: new Date().toISOString(),
				stats: {
					totalRecipients: result.accepted,
					sent: result.delivered,
					delivered: result.delivered,
					bounced: 0,
					opened: 0,
					clicked: 0,
					unsubscribed: 0,
					lastSyncedAt: new Date().toISOString(),
				},
			});
			sendResult = {
				delivered: result.delivered,
				failed: result.failed,
				errors: result.errors,
			};
			sendState = 'done';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Versand fehlgeschlagen';
			sendState = 'idle';
		}
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
			<!-- Preflight checks — caught early so the user can fix before M4 send. -->
			<div class="preflight-checks">
				<h3>Vor dem Versand</h3>
				<ul class="check-list">
					<li class:ok={subject.trim().length > 0} class:warn={!subject.trim()}>
						<span class="icon">{subject.trim() ? '✓' : '!'}</span>
						Betreff {subject.trim() ? 'gesetzt' : 'fehlt'}
						{#if subject.trim().length > 0}
							<small>— {subject}</small>
						{/if}
					</li>
					<li class:ok={audience.estimatedCount > 0} class:warn={audience.estimatedCount === 0}>
						<span class="icon">{audience.estimatedCount > 0 ? '✓' : '!'}</span>
						{audience.estimatedCount} Empfänger
						{#if audience.estimatedCount === 0}
							<small>— kein Empfänger matched die Filter</small>
						{/if}
					</li>
					<li class:ok={!!fromEmail && fromEmail.includes('@')} class:warn={!fromEmail}>
						<span class="icon">{fromEmail.includes('@') ? '✓' : '!'}</span>
						Absender
						<small>— {fromName} &lt;{fromEmail || '—'}&gt;</small>
					</li>
					<li
						class:ok={!!settings?.legalAddress?.trim()}
						class:warn={!settings?.legalAddress?.trim()}
					>
						<span class="icon">{settings?.legalAddress?.trim() ? '✓' : '!'}</span>
						Impressum
						{#if !settings?.legalAddress?.trim()}
							<small
								>— Pflicht laut DSGVO.
								<a href="/broadcasts/settings">In Einstellungen ergänzen →</a>
							</small>
						{/if}
					</li>
				</ul>
			</div>

			{#if settings}
				<PreviewTabs campaign={{ subject, preheader, fromName, fromEmail }} {content} {settings} />
			{:else}
				<p class="loading">Lade Einstellungen …</p>
			{/if}
		</section>
	{:else if step === 4}
		<section class="step-panel send-panel">
			{#if sendState === 'idle'}
				<div class="send-card">
					<h3>Jetzt senden</h3>
					<p>
						<strong>{audience.estimatedCount}</strong> Empfänger erhalten die Kampagne
						<strong>„{subject}"</strong>
						von <strong>{fromName}</strong>.
					</p>
					<p class="hint">
						Der Versand läuft synchron und dauert je nach Liste 10–60 Sekunden. Du siehst jede Mail
						in deinem „Gesendet"-Ordner (pro Empfänger ein Eintrag).
					</p>
					<div class="send-actions">
						<button type="button" class="btn-ghost" onclick={() => (step = 3)}>
							Zurück zum Check
						</button>
						<button
							type="button"
							class="btn-primary"
							onclick={() => (sendState = 'confirming')}
							disabled={!audienceReady || !contentReady}
						>
							Jetzt an {audience.estimatedCount} Empfänger senden
						</button>
					</div>
				</div>
			{:else if sendState === 'confirming'}
				<div class="send-card confirm-card">
					<h3>Sicher?</h3>
					<p>
						Die Kampagne geht an <strong>{audience.estimatedCount}</strong> Empfänger. Nach dem Versand
						kannst du nichts mehr ändern — wenn dir ein Fehler auffällt, musst du eine neue Kampagne als
						Korrektur schicken.
					</p>
					<div class="send-actions">
						<button type="button" class="btn-ghost" onclick={() => (sendState = 'idle')}>
							Abbrechen
						</button>
						<button type="button" class="btn-primary btn-danger" onclick={doSend}>
							Ja, {audience.estimatedCount} Mails senden
						</button>
					</div>
				</div>
			{:else if sendState === 'sending'}
				<div class="send-card sending-card">
					<div class="spinner"></div>
					<h3>Versand läuft …</h3>
					<p>
						Wir schicken {audience.estimatedCount} Mails raus. Bitte Fenster offen lassen.
					</p>
				</div>
			{:else if sendState === 'done' && sendResult}
				<div class="send-card done-card">
					<div class="done-icon">✓</div>
					<h3>Versand abgeschlossen</h3>
					<p>
						<strong>{sendResult.delivered}</strong> Mails versendet
						{#if sendResult.failed > 0}
							· <strong class="failed-count">{sendResult.failed} Fehler</strong>
						{/if}
					</p>
					{#if sendResult.errors.length > 0}
						<details class="error-details">
							<summary>Fehler anzeigen ({sendResult.errors.length})</summary>
							<ul>
								{#each sendResult.errors as err (err.email)}
									<li><code>{err.email}</code> — {err.reason}</li>
								{/each}
							</ul>
						</details>
					{/if}
					<div class="send-actions">
						<button type="button" class="btn-primary" onclick={() => goto('/broadcasts')}>
							Zur Übersicht
						</button>
					</div>
				</div>
			{/if}
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

	.preflight-checks {
		background: var(--color-surface-muted, #f8fafc);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.5rem;
		padding: 1rem 1.25rem;
	}

	.preflight-checks h3 {
		margin: 0 0 0.75rem;
		font-size: 0.95rem;
		font-weight: 600;
	}

	.check-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.check-list li {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		font-size: 0.9rem;
	}

	.check-list .icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		font-size: 0.75rem;
		font-weight: 600;
		flex-shrink: 0;
	}

	.check-list li.ok .icon {
		background: #dcfce7;
		color: #15803d;
	}

	.check-list li.warn .icon {
		background: #fef3c7;
		color: #92400e;
	}

	.check-list li.warn {
		color: #92400e;
	}

	.check-list small {
		color: var(--color-text-muted, #64748b);
		font-size: 0.85rem;
	}

	.check-list li.warn small {
		color: #92400e;
	}

	.check-list a {
		color: #6366f1;
		text-decoration: underline;
	}

	.loading {
		padding: 2rem;
		text-align: center;
		color: var(--color-text-muted, #64748b);
	}

	.send-panel {
		align-items: center;
	}

	.send-card {
		background: var(--color-surface, #fff);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.75rem;
		padding: 2rem;
		max-width: 540px;
		width: 100%;
		text-align: center;
	}

	.send-card h3 {
		margin: 0 0 0.75rem;
		font-size: 1.15rem;
		font-weight: 600;
	}

	.send-card p {
		margin: 0.5rem 0;
		color: var(--color-text-muted, #64748b);
	}

	.send-card .hint {
		font-size: 0.85rem;
		margin-top: 1rem;
	}

	.send-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		margin-top: 1.5rem;
	}

	.btn-danger {
		background: #dc2626 !important;
	}

	.confirm-card {
		border-color: #fecaca;
		background: #fef2f2;
	}

	.sending-card .spinner {
		width: 2rem;
		height: 2rem;
		border: 3px solid var(--color-border, #e2e8f0);
		border-top-color: #6366f1;
		border-radius: 50%;
		margin: 0 auto 1rem;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.done-card {
		border-color: #bbf7d0;
	}

	.done-icon {
		width: 3rem;
		height: 3rem;
		margin: 0 auto 0.75rem;
		border-radius: 50%;
		background: #22c55e;
		color: white;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.failed-count {
		color: #b91c1c;
	}

	.error-details {
		margin-top: 1rem;
		text-align: left;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 0.4rem;
		padding: 0.75rem 1rem;
	}

	.error-details summary {
		cursor: pointer;
		font-size: 0.9rem;
		color: #991b1b;
	}

	.error-details ul {
		margin: 0.75rem 0 0;
		padding-left: 1.5rem;
		font-size: 0.85rem;
	}

	.error-details code {
		background: white;
		padding: 0.1rem 0.3rem;
		border-radius: 0.2rem;
	}
</style>
