<!--
  SettingsForm — sender defaults, legal address, default footer.

  Mirrors the invoices SenderProfileForm pattern (singleton-settings,
  immediate save). Legal address is Pflicht (DSGVO / Impressumspflicht)
  — the form flags it in red until filled in and the send step in
  ComposeView blocks without it.
-->
<script lang="ts">
	import { broadcastSettingsStore } from '../stores/settings.svelte';
	import type { BroadcastSettings } from '../types';

	let settings = $state<BroadcastSettings | null>(null);
	let saving = $state(false);
	let savedAt = $state<string | null>(null);
	let error = $state<string | null>(null);

	$effect(() => {
		broadcastSettingsStore.get().then((s) => {
			settings = s;
		});
	});

	async function save() {
		if (!settings) return;
		saving = true;
		error = null;
		try {
			await broadcastSettingsStore.update({
				defaultFromName: settings.defaultFromName,
				defaultFromEmail: settings.defaultFromEmail,
				defaultReplyTo: settings.defaultReplyTo,
				defaultFooter: settings.defaultFooter,
				legalAddress: settings.legalAddress,
				unsubscribeLandingCopy: settings.unsubscribeLandingCopy,
			});
			savedAt = new Date().toLocaleTimeString();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Speichern fehlgeschlagen';
		} finally {
			saving = false;
		}
	}

	const legalMissing = $derived(!settings?.legalAddress?.trim());
</script>

{#if !settings}
	<p class="loading">Lade Einstellungen …</p>
{:else}
	<form
		onsubmit={(e) => {
			e.preventDefault();
			save();
		}}
		class="form"
	>
		<section class="section">
			<h3>Absender-Standard</h3>
			<p class="hint">
				Wird als Vorbelegung für jede neue Kampagne gesetzt. Du kannst's pro Kampagne überschreiben.
			</p>

			<div class="grid-2">
				<label class="field">
					<span>Name *</span>
					<input type="text" bind:value={settings.defaultFromName} required />
				</label>
				<label class="field">
					<span>E-Mail *</span>
					<input
						type="email"
						placeholder="newsletter@deine-domain.ch"
						bind:value={settings.defaultFromEmail}
						required
					/>
				</label>
			</div>

			<label class="field">
				<span>Reply-To</span>
				<input
					type="email"
					placeholder="Optional — sonst geht die Antwort an die Absender-Adresse"
					value={settings.defaultReplyTo ?? ''}
					oninput={(e) => settings && (settings.defaultReplyTo = e.currentTarget.value || null)}
				/>
			</label>
		</section>

		<section class="section" class:section-warn={legalMissing}>
			<h3>Impressum *</h3>
			<p class="hint">
				<strong>Pflicht</strong> in jedem Newsletter (DSGVO / §5 TMG / Art. 13 DSG). Erscheint im Footer
				jeder Kampagne.
			</p>

			<label class="field">
				<span>Legal-Adresse *</span>
				<textarea
					rows="4"
					placeholder="Till Beispiel AG&#10;Bahnhofstrasse 1&#10;8000 Zürich&#10;CHE-123.456.789 MWST"
					bind:value={settings.legalAddress}
					required
				></textarea>
			</label>
		</section>

		<section class="section">
			<h3>Standard-Footer</h3>
			<p class="hint">
				Optional — ergänzt den Abmelde-Link + das Impressum am Ende jeder Kampagne.
			</p>

			<label class="field">
				<span>Footer-Text</span>
				<textarea
					rows="3"
					placeholder="Danke, dass du dabei bist — bis zum nächsten Newsletter."
					value={settings.defaultFooter ?? ''}
					oninput={(e) => settings && (settings.defaultFooter = e.currentTarget.value || null)}
				></textarea>
			</label>
		</section>

		{#if error}
			<div class="error">{error}</div>
		{/if}

		<div class="actions">
			<button type="submit" class="btn-primary" disabled={saving}>
				{saving ? 'Speichert …' : 'Speichern'}
			</button>
			{#if savedAt}
				<span class="saved">Gespeichert um {savedAt}</span>
			{/if}
		</div>
	</form>
{/if}

<style>
	.loading {
		padding: 2rem;
		text-align: center;
		color: var(--color-text-muted, #64748b);
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section-warn {
		padding: 1rem;
		background: #fffbeb;
		border: 1px solid #fde68a;
		border-radius: 0.5rem;
	}

	.section h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.hint {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
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

	.field input,
	.field textarea {
		padding: 0.5rem 0.65rem;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.4rem;
		font-size: 0.95rem;
		font-family: inherit;
	}

	.grid-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.btn-primary {
		background: #6366f1;
		color: white;
		padding: 0.55rem 1.25rem;
		border: 0;
		border-radius: 0.4rem;
		font-weight: 500;
		cursor: pointer;
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.saved {
		font-size: 0.85rem;
		color: #6366f1;
	}

	.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
		padding: 0.75rem 1rem;
		border-radius: 0.4rem;
		font-size: 0.9rem;
	}
</style>
