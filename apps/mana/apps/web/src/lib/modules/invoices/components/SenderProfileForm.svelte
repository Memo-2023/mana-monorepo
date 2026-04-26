<!--
  SenderProfileForm — onboarding + settings editor for the sender profile
  used on every PDF the user issues. Also carries the number-sequence state.
-->
<script lang="ts">
	import { _, locale } from 'svelte-i18n';
	import { get } from 'svelte/store';
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
			logoError = e instanceof Error ? e.message : $_('invoices.sender_form.err_upload');
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
			logoError = e instanceof Error ? e.message : $_('invoices.sender_form.err_remove');
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
			savedAt = new Date().toLocaleTimeString(get(locale) ?? 'de');
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
	<p class="loading">{$_('invoices.sender_form.loading')}</p>
{:else}
	<form
		onsubmit={(e) => {
			e.preventDefault();
			save();
		}}
		class="form"
	>
		<section class="section">
			<h3>{$_('invoices.sender_form.section_sender')}</h3>
			<p class="hint">{$_('invoices.sender_form.section_sender_hint')}</p>

			<div class="field logo-field">
				<span>{$_('invoices.sender_form.label_logo')}</span>
				<div class="logo-row">
					{#if settings.logoMediaId}
						<img
							class="logo-preview"
							src={logoPreviewUrl(settings.logoMediaId)}
							alt={$_('invoices.sender_form.logo_alt')}
						/>
						<div class="logo-actions">
							<button
								type="button"
								class="btn-sm"
								onclick={() => logoInput?.click()}
								disabled={uploadingLogo}
							>
								{$_('invoices.sender_form.logo_replace')}
							</button>
							<button
								type="button"
								class="btn-sm btn-danger"
								onclick={removeLogo}
								disabled={uploadingLogo}
							>
								{$_('invoices.sender_form.logo_remove')}
							</button>
						</div>
					{:else}
						<button
							type="button"
							class="logo-drop"
							onclick={() => logoInput?.click()}
							disabled={uploadingLogo}
						>
							{uploadingLogo
								? $_('invoices.sender_form.logo_uploading')
								: $_('invoices.sender_form.logo_drop')}
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
				<span>{$_('invoices.sender_form.label_name')}</span>
				<input type="text" bind:value={settings.senderName} required />
			</label>

			<div class="grid-2">
				<label class="field">
					<span>{$_('invoices.sender_form.label_street')}</span>
					<input
						type="text"
						placeholder={$_('invoices.sender_form.placeholder_street')}
						value={settings.senderStreet ?? ''}
						oninput={(e) => settings && (settings.senderStreet = e.currentTarget.value || null)}
					/>
				</label>
				<label class="field">
					<span>{$_('invoices.sender_form.label_zip')}</span>
					<input
						type="text"
						placeholder={$_('invoices.sender_form.placeholder_zip')}
						value={settings.senderZip ?? ''}
						oninput={(e) => settings && (settings.senderZip = e.currentTarget.value || null)}
					/>
				</label>
			</div>

			<div class="grid-2">
				<label class="field">
					<span>{$_('invoices.sender_form.label_city')}</span>
					<input
						type="text"
						placeholder={$_('invoices.sender_form.placeholder_city')}
						value={settings.senderCity ?? ''}
						oninput={(e) => settings && (settings.senderCity = e.currentTarget.value || null)}
					/>
				</label>
				<label class="field">
					<span>{$_('invoices.sender_form.label_country')}</span>
					<input
						type="text"
						placeholder={$_('invoices.sender_form.placeholder_country')}
						maxlength="2"
						value={settings.senderCountry ?? 'CH'}
						oninput={(e) =>
							settings && (settings.senderCountry = e.currentTarget.value.toUpperCase() || 'CH')}
					/>
				</label>
			</div>

			<details class="legacy-address">
				<summary>{$_('invoices.sender_form.legacy_address_summary')}</summary>
				<p class="hint">{$_('invoices.sender_form.legacy_address_hint')}</p>
				<textarea
					rows="3"
					placeholder={$_('invoices.sender_form.legacy_address_placeholder')}
					bind:value={settings.senderAddress}
				></textarea>
			</details>

			<div class="grid-2">
				<label class="field">
					<span>{$_('invoices.sender_form.label_email')}</span>
					<input type="email" bind:value={settings.senderEmail} required />
				</label>
				<label class="field">
					<span>{$_('invoices.sender_form.label_vat')}</span>
					<input
						type="text"
						placeholder={$_('invoices.sender_form.placeholder_vat')}
						value={settings.senderVatNumber ?? ''}
						oninput={(e) => settings && (settings.senderVatNumber = e.currentTarget.value || null)}
					/>
				</label>
			</div>

			<div class="grid-2">
				<label class="field">
					<span>{$_('invoices.sender_form.label_iban')}</span>
					<input
						type="text"
						placeholder={$_('invoices.sender_form.placeholder_iban')}
						bind:value={settings.senderIban}
						required
					/>
				</label>
				<label class="field">
					<span>{$_('invoices.sender_form.label_bic')}</span>
					<input
						type="text"
						value={settings.senderBic ?? ''}
						oninput={(e) => settings && (settings.senderBic = e.currentTarget.value || null)}
					/>
				</label>
			</div>

			<label class="field">
				<span>{$_('invoices.sender_form.label_footer')}</span>
				<textarea
					rows="2"
					placeholder={$_('invoices.sender_form.placeholder_footer')}
					value={settings.footer ?? ''}
					oninput={(e) => settings && (settings.footer = e.currentTarget.value || null)}
				></textarea>
			</label>
		</section>

		<section class="section">
			<h3>{$_('invoices.sender_form.section_numbering')}</h3>
			<p class="hint">
				{$_('invoices.sender_form.section_numbering_hint_pre')}<code>{nextPreview}</code>
			</p>

			<div class="grid-3">
				<label class="field">
					<span>{$_('invoices.sender_form.label_prefix')}</span>
					<input type="text" bind:value={settings.numberPrefix} />
				</label>
				<label class="field">
					<span>{$_('invoices.sender_form.label_padding')}</span>
					<input type="number" min="1" max="8" bind:value={settings.numberPadding} />
				</label>
				<label class="field">
					<span>{$_('invoices.sender_form.label_next_number')}</span>
					<input type="number" min="1" bind:value={settings.nextNumber} />
				</label>
			</div>
		</section>

		<section class="section">
			<h3>{$_('invoices.sender_form.section_defaults')}</h3>

			<div class="grid-3">
				<label class="field">
					<span>{$_('invoices.sender_form.label_currency')}</span>
					<select bind:value={settings.defaultCurrency}>
						{#each Object.keys(CURRENCIES) as c (c)}
							<option value={c}>{c}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					<span>{$_('invoices.sender_form.label_vat_rate')}</span>
					<select
						value={settings.defaultVatRate}
						onchange={(e) => settings && (settings.defaultVatRate = Number(e.currentTarget.value))}
					>
						{#each vatOptions as o (o.value)}
							<option value={o.value}>{$_(o.i18nKey)}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					<span>{$_('invoices.sender_form.label_due_days')}</span>
					<input type="number" min="0" max="365" bind:value={settings.defaultDueDays} />
				</label>
			</div>

			<label class="field">
				<span>{$_('invoices.sender_form.label_terms')}</span>
				<textarea
					rows="2"
					placeholder={$_('invoices.sender_form.placeholder_terms')}
					value={settings.defaultTerms ?? ''}
					oninput={(e) => settings && (settings.defaultTerms = e.currentTarget.value || null)}
				></textarea>
			</label>
		</section>

		<div class="actions">
			<button type="submit" class="btn-primary" disabled={saving}>
				{saving ? $_('invoices.sender_form.saving') : $_('invoices.sender_form.save')}
			</button>
			{#if savedAt}
				<span class="saved"
					>{$_('invoices.sender_form.saved_at', { values: { time: savedAt } })}</span
				>
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
