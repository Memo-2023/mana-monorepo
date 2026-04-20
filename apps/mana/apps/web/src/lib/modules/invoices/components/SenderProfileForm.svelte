<!--
  SenderProfileForm — onboarding + settings editor for the sender profile
  used on every PDF the user issues. Also carries the number-sequence state.
-->
<script lang="ts">
	import { invoiceSettingsStore } from '../stores/settings.svelte';
	import type { InvoiceSettings, Currency } from '../types';
	import { VAT_RATES_CH, VAT_RATES_DE, CURRENCIES } from '../constants';
	import { uploadLogo, logoPreviewUrl } from '../pdf/logo';

	let settings = $state<InvoiceSettings | null>(null);
	let saving = $state(false);
	let savedAt = $state<string | null>(null);
	let uploadingLogo = $state(false);
	let logoError = $state<string | null>(null);
	let logoInput: HTMLInputElement | undefined = $state();

	async function onLogoSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || !settings) return;
		uploadingLogo = true;
		logoError = null;
		try {
			const mediaId = await uploadLogo(file);
			// Persist immediately — user doesn't need to hit "Speichern" separately
			// for logo changes. The in-memory settings state stays in sync so
			// further edits don't lose the mediaId.
			await invoiceSettingsStore.update({ logoMediaId: mediaId });
			settings.logoMediaId = mediaId;
		} catch (e) {
			logoError = e instanceof Error ? e.message : 'Upload fehlgeschlagen';
		} finally {
			uploadingLogo = false;
			input.value = '';
		}
	}

	async function removeLogo() {
		if (!settings) return;
		uploadingLogo = true;
		logoError = null;
		try {
			await invoiceSettingsStore.update({ logoMediaId: null });
			settings.logoMediaId = null;
		} catch (e) {
			logoError = e instanceof Error ? e.message : 'Entfernen fehlgeschlagen';
		} finally {
			uploadingLogo = false;
		}
	}

	$effect(() => {
		invoiceSettingsStore.get().then((s) => {
			settings = s;
		});
	});

	async function save() {
		if (!settings) return;
		saving = true;
		try {
			await invoiceSettingsStore.update({
				senderName: settings.senderName,
				senderAddress: settings.senderAddress,
				senderStreet: settings.senderStreet,
				senderZip: settings.senderZip,
				senderCity: settings.senderCity,
				senderCountry: settings.senderCountry,
				senderEmail: settings.senderEmail,
				senderVatNumber: settings.senderVatNumber,
				senderIban: settings.senderIban,
				senderBic: settings.senderBic,
				footer: settings.footer,
				numberPrefix: settings.numberPrefix,
				numberPadding: settings.numberPadding,
				nextNumber: settings.nextNumber,
				defaultCurrency: settings.defaultCurrency,
				defaultVatRate: settings.defaultVatRate,
				defaultDueDays: settings.defaultDueDays,
				defaultTerms: settings.defaultTerms,
			});
			savedAt = new Date().toLocaleTimeString();
		} finally {
			saving = false;
		}
	}

	const nextPreview = $derived(
		settings
			? `${settings.numberPrefix}${String(settings.nextNumber).padStart(settings.numberPadding, '0')}`
			: '…'
	);

	const vatOptions = $derived(settings?.defaultCurrency === 'EUR' ? VAT_RATES_DE : VAT_RATES_CH);
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
			<h3>Absender</h3>
			<p class="hint">Erscheint im Kopf jeder Rechnung.</p>

			<div class="field logo-field">
				<span>Logo</span>
				<div class="logo-row">
					{#if settings.logoMediaId}
						<img
							class="logo-preview"
							src={logoPreviewUrl(settings.logoMediaId)}
							alt="Logo-Vorschau"
						/>
						<div class="logo-actions">
							<button
								type="button"
								class="btn-sm"
								onclick={() => logoInput?.click()}
								disabled={uploadingLogo}
							>
								Ersetzen
							</button>
							<button
								type="button"
								class="btn-sm btn-danger"
								onclick={removeLogo}
								disabled={uploadingLogo}
							>
								Entfernen
							</button>
						</div>
					{:else}
						<button
							type="button"
							class="logo-drop"
							onclick={() => logoInput?.click()}
							disabled={uploadingLogo}
						>
							{uploadingLogo ? 'Lädt hoch …' : '+ Logo hochladen'}
						</button>
					{/if}
					<input
						bind:this={logoInput}
						type="file"
						accept="image/png,image/jpeg"
						hidden
						onchange={onLogoSelect}
					/>
				</div>
				{#if logoError}
					<span class="hint-warn">{logoError}</span>
				{/if}
			</div>

			<label class="field">
				<span>Name *</span>
				<input type="text" bind:value={settings.senderName} required />
			</label>

			<div class="grid-2">
				<label class="field">
					<span>Strasse + Nr. *</span>
					<input
						type="text"
						placeholder="Bahnhofstrasse 1"
						value={settings.senderStreet ?? ''}
						oninput={(e) => settings && (settings.senderStreet = e.currentTarget.value || null)}
					/>
				</label>
				<label class="field">
					<span>PLZ *</span>
					<input
						type="text"
						placeholder="8000"
						value={settings.senderZip ?? ''}
						oninput={(e) => settings && (settings.senderZip = e.currentTarget.value || null)}
					/>
				</label>
			</div>

			<div class="grid-2">
				<label class="field">
					<span>Ort *</span>
					<input
						type="text"
						placeholder="Zürich"
						value={settings.senderCity ?? ''}
						oninput={(e) => settings && (settings.senderCity = e.currentTarget.value || null)}
					/>
				</label>
				<label class="field">
					<span>Land</span>
					<input
						type="text"
						placeholder="CH"
						maxlength="2"
						value={settings.senderCountry ?? 'CH'}
						oninput={(e) =>
							settings && (settings.senderCountry = e.currentTarget.value.toUpperCase() || 'CH')}
					/>
				</label>
			</div>

			<details class="legacy-address">
				<summary>Abweichende Adresse im PDF anzeigen (Freitext-Fallback)</summary>
				<p class="hint">
					Wird nur verwendet, wenn die strukturierten Felder oben leer sind. Nützlich für Postfächer
					/ c/o-Adressen, die nicht ins Strasse+PLZ+Ort-Schema passen.
				</p>
				<textarea
					rows="3"
					placeholder="Postfach 123&#10;8021 Zürich"
					bind:value={settings.senderAddress}
				></textarea>
			</details>

			<div class="grid-2">
				<label class="field">
					<span>E-Mail *</span>
					<input type="email" bind:value={settings.senderEmail} required />
				</label>
				<label class="field">
					<span>MwSt-Nummer</span>
					<input
						type="text"
						placeholder="CHE-123.456.789 MWST"
						value={settings.senderVatNumber ?? ''}
						oninput={(e) => settings && (settings.senderVatNumber = e.currentTarget.value || null)}
					/>
				</label>
			</div>

			<div class="grid-2">
				<label class="field">
					<span>IBAN *</span>
					<input
						type="text"
						placeholder="CH93 0076 2011 6238 5295 7"
						bind:value={settings.senderIban}
						required
					/>
				</label>
				<label class="field">
					<span>BIC</span>
					<input
						type="text"
						value={settings.senderBic ?? ''}
						oninput={(e) => settings && (settings.senderBic = e.currentTarget.value || null)}
					/>
				</label>
			</div>

			<label class="field">
				<span>Fußzeile</span>
				<textarea
					rows="2"
					placeholder="Ergänzung unter jeder Rechnung (z.B. rechtliche Hinweise)"
					value={settings.footer ?? ''}
					oninput={(e) => settings && (settings.footer = e.currentTarget.value || null)}
				></textarea>
			</label>
		</section>

		<section class="section">
			<h3>Nummernkreis</h3>
			<p class="hint">Nächste Rechnung: <code>{nextPreview}</code></p>

			<div class="grid-3">
				<label class="field">
					<span>Präfix</span>
					<input type="text" bind:value={settings.numberPrefix} />
				</label>
				<label class="field">
					<span>Stellen</span>
					<input type="number" min="1" max="8" bind:value={settings.numberPadding} />
				</label>
				<label class="field">
					<span>Nächste Nummer</span>
					<input type="number" min="1" bind:value={settings.nextNumber} />
				</label>
			</div>
		</section>

		<section class="section">
			<h3>Standards</h3>

			<div class="grid-3">
				<label class="field">
					<span>Währung</span>
					<select bind:value={settings.defaultCurrency}>
						{#each Object.keys(CURRENCIES) as c (c)}
							<option value={c}>{c}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					<span>MwSt.-Satz</span>
					<select
						value={settings.defaultVatRate}
						onchange={(e) => settings && (settings.defaultVatRate = Number(e.currentTarget.value))}
					>
						{#each vatOptions as o (o.value)}
							<option value={o.value}>{o.label}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					<span>Zahlungsfrist (Tage)</span>
					<input type="number" min="0" max="365" bind:value={settings.defaultDueDays} />
				</label>
			</div>

			<label class="field">
				<span>Standard-AGB / Zahlungsbedingungen</span>
				<textarea
					rows="2"
					placeholder="Zahlbar innert 30 Tagen netto."
					value={settings.defaultTerms ?? ''}
					oninput={(e) => settings && (settings.defaultTerms = e.currentTarget.value || null)}
				></textarea>
			</label>
		</section>

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

	h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.hint {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
	}

	.hint code {
		background: var(--color-surface-muted, #f1f5f9);
		padding: 0.1rem 0.35rem;
		border-radius: 0.25rem;
		font-size: 0.85rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.field > span {
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
	}

	.field input,
	.field textarea,
	.field select {
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

	.grid-3 {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 0.75rem;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.btn-primary {
		background: #059669;
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
		color: #059669;
	}

	.logo-field {
		gap: 0.4rem;
	}

	.logo-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.logo-preview {
		max-width: 140px;
		max-height: 64px;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.3rem;
		padding: 0.25rem;
		background: white;
		object-fit: contain;
	}

	.logo-actions {
		display: flex;
		gap: 0.4rem;
	}

	.logo-drop {
		display: inline-flex;
		align-items: center;
		padding: 0.75rem 1.25rem;
		border: 1px dashed var(--color-border, #e2e8f0);
		border-radius: 0.4rem;
		background: var(--color-surface-muted, #f8fafc);
		color: var(--color-text-muted, #64748b);
		cursor: pointer;
		font-size: 0.9rem;
	}

	.logo-drop:hover:not(:disabled) {
		border-color: #059669;
		color: #059669;
	}

	.logo-drop:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-sm {
		padding: 0.35rem 0.75rem;
		background: white;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.3rem;
		cursor: pointer;
		font-size: 0.85rem;
	}

	.btn-sm:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-sm.btn-danger {
		color: #b91c1c;
		border-color: #fecaca;
	}

	.hint-warn {
		font-size: 0.8rem;
		color: #92400e;
	}

	.legacy-address {
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.4rem;
		padding: 0.5rem 0.75rem;
	}

	.legacy-address summary {
		cursor: pointer;
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
	}

	.legacy-address[open] summary {
		margin-bottom: 0.5rem;
	}

	.legacy-address textarea {
		width: 100%;
		padding: 0.5rem 0.65rem;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.4rem;
		font-size: 0.95rem;
		font-family: inherit;
	}
</style>
