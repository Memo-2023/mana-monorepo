<!--
  SenderProfileForm — onboarding + settings editor for the sender profile
  used on every PDF the user issues. Also carries the number-sequence state.
-->
<script lang="ts">
	import { invoiceSettingsStore } from '../stores/settings.svelte';
	import type { InvoiceSettings, Currency } from '../types';
	import { VAT_RATES_CH, VAT_RATES_DE, CURRENCIES } from '../constants';

	let settings = $state<InvoiceSettings | null>(null);
	let saving = $state(false);
	let savedAt = $state<string | null>(null);

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

			<label class="field">
				<span>Name *</span>
				<input type="text" bind:value={settings.senderName} required />
			</label>

			<label class="field">
				<span>Adresse *</span>
				<textarea rows="3" bind:value={settings.senderAddress} required></textarea>
			</label>

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
</style>
