<!--
  ClientPicker — picks a client and emits a snapshot the InvoiceForm freezes
  onto the invoice at send time.

  Sources:
    - Contacts module (existing CRM entries)
    - InvoiceClients (per-invoice book, optional — Phase 1.5)
    - Manual entry (no backing record — snapshot only)

  The picker ALWAYS emits a snapshot; the clientId / clientSource tell the
  downstream store which table (if any) the backing record lives in.
-->
<script lang="ts">
	import { useAllContacts } from '$lib/modules/contacts/queries';
	import { useInvoiceClients } from '../queries';
	import type { InvoiceClientSnapshot, ClientSource } from '../types';

	interface Props {
		clientId: string | null;
		clientSource: ClientSource;
		snapshot: InvoiceClientSnapshot;
	}

	let {
		clientId = $bindable(null),
		clientSource = $bindable('invoice-client'),
		snapshot = $bindable({ name: '', address: '', email: '' }),
	}: Props = $props();

	const contacts$ = useAllContacts();
	const invoiceClients$ = useInvoiceClients();
	const contacts = $derived(contacts$.value ?? []);
	const invoiceClients = $derived(invoiceClients$.value ?? []);

	let query = $state('');
	let showSuggest = $state(false);

	const suggestions = $derived.by(() => {
		const q = query.toLowerCase().trim();
		if (!q) return [];
		const fromContacts = contacts
			.filter((c) => (c.displayName ?? '').toLowerCase().includes(q))
			.map((c) => ({
				id: c.id,
				source: 'contact' as ClientSource,
				name: c.displayName ?? 'Unbenannter Kontakt',
				email: c.email,
				// Contacts already have structured fields — map them over directly
				// so picking a contact populates Strasse/PLZ/Ort without lossy
				// string-joining.
				street: c.street ?? undefined,
				zip: c.postalCode ?? undefined,
				city: c.city ?? undefined,
				country: c.country ?? undefined,
				address: undefined as string | undefined,
			}));
		const fromClients = invoiceClients
			.filter((c) => c.name.toLowerCase().includes(q))
			.map((c) => ({
				id: c.id,
				source: 'invoice-client' as ClientSource,
				name: c.name,
				email: c.email,
				street: undefined as string | undefined,
				zip: undefined as string | undefined,
				city: undefined as string | undefined,
				country: undefined as string | undefined,
				address: c.address ?? undefined,
			}));
		return [...fromContacts, ...fromClients].slice(0, 8);
	});

	function select(s: (typeof suggestions)[number]) {
		clientId = s.id;
		clientSource = s.source;
		snapshot = {
			name: s.name,
			street: s.street,
			zip: s.zip,
			city: s.city,
			country: s.country,
			address: s.address,
			email: s.email ?? undefined,
		};
		query = s.name;
		showSuggest = false;
	}

	function clearPick() {
		clientId = null;
		clientSource = 'invoice-client';
	}

	function setName(v: string) {
		query = v;
		snapshot = { ...snapshot, name: v };
		clearPick();
		showSuggest = v.length > 0;
	}
</script>

<div class="picker">
	<label class="field">
		<span class="label">Kunde *</span>
		<input
			type="text"
			placeholder="Name tippen oder aus Kontakten wählen"
			value={query || snapshot.name}
			oninput={(e) => setName(e.currentTarget.value)}
			onfocus={() => (showSuggest = query.length > 0)}
			onblur={() => setTimeout(() => (showSuggest = false), 150)}
		/>
		{#if showSuggest && suggestions.length > 0}
			<div class="suggest">
				{#each suggestions as s (s.source + ':' + s.id)}
					<button type="button" class="suggest-row" onclick={() => select(s)}>
						<span class="suggest-name">{s.name}</span>
						<span class="suggest-source">
							{s.source === 'contact' ? 'aus Kontakten' : 'aus Rechnungen'}
						</span>
					</button>
				{/each}
			</div>
		{/if}
	</label>

	<div class="address-grid">
		<label class="field street">
			<span class="label">Strasse + Nr.</span>
			<input
				type="text"
				placeholder="Bahnhofstrasse 1"
				value={snapshot.street ?? ''}
				oninput={(e) => (snapshot = { ...snapshot, street: e.currentTarget.value || undefined })}
			/>
		</label>
		<label class="field zip">
			<span class="label">PLZ</span>
			<input
				type="text"
				placeholder="8000"
				value={snapshot.zip ?? ''}
				oninput={(e) => (snapshot = { ...snapshot, zip: e.currentTarget.value || undefined })}
			/>
		</label>
		<label class="field city">
			<span class="label">Ort</span>
			<input
				type="text"
				placeholder="Zürich"
				value={snapshot.city ?? ''}
				oninput={(e) => (snapshot = { ...snapshot, city: e.currentTarget.value || undefined })}
			/>
		</label>
		<label class="field country">
			<span class="label">Land</span>
			<input
				type="text"
				placeholder="CH"
				maxlength="2"
				value={snapshot.country ?? ''}
				oninput={(e) =>
					(snapshot = { ...snapshot, country: e.currentTarget.value.toUpperCase() || undefined })}
			/>
		</label>
	</div>

	<label class="field">
		<span class="label">E-Mail</span>
		<input
			type="email"
			placeholder="kontakt@kunde.ch"
			value={snapshot.email ?? ''}
			oninput={(e) => (snapshot = { ...snapshot, email: e.currentTarget.value || undefined })}
		/>
	</label>

	<label class="field">
		<span class="label">USt-IdNr. / MwSt-Nr.</span>
		<input
			type="text"
			placeholder="CHE-123.456.789 MWST"
			value={snapshot.vatNumber ?? ''}
			oninput={(e) => (snapshot = { ...snapshot, vatNumber: e.currentTarget.value || undefined })}
		/>
	</label>
</div>

<style>
	.picker {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		position: relative;
	}

	.label {
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

	.suggest {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 20;
		background: white;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.4rem;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
		max-height: 14rem;
		overflow-y: auto;
	}

	.suggest-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: white;
		border: 0;
		border-bottom: 1px solid var(--color-border, #e2e8f0);
		cursor: pointer;
		text-align: left;
		font-size: 0.9rem;
	}

	.suggest-row:last-child {
		border-bottom: 0;
	}

	.suggest-row:hover {
		background: var(--color-surface-muted, #f1f5f9);
	}

	.suggest-name {
		font-weight: 500;
	}

	.suggest-source {
		font-size: 0.75rem;
		color: var(--color-text-muted, #64748b);
	}

	.address-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	.address-grid .street {
		grid-column: 1 / -1;
	}

	.address-grid .zip {
		grid-column: 1;
	}

	.address-grid .city {
		grid-column: 2;
	}

	.address-grid .country {
		grid-column: 1 / -1;
		max-width: 10rem;
	}
</style>
