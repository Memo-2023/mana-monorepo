<!--
  SharedLinkControls — UI for managing a record's unlisted share-link.

  Shown below the VisibilityPicker in a module's DetailView when
  `visibility === 'unlisted'` and a token exists. Dumb — owner (the
  module DetailView) passes the token + handlers; this component only
  renders the URL, manages copy-to-clipboard, and dispatches
  regenerate/revoke/expiry actions.

  QR-code rendering is a later polish (M8.5) — currently stubbed as
  a button that disables itself. Expiry-picker is present but
  minimal — datetime-local input, no fancy picker.

  See docs/plans/unlisted-sharing.md §7.
-->
<script lang="ts">
	let {
		/** The 32-char token — used only for display fallback. */
		token,
		/** Full share URL (e.g. https://mana.how/share/AbC…). */
		url,
		/** Current expiry (ISO string) or null if the link never expires. */
		expiresAt = null,
		/** Called when the user clicks "Neu erzeugen". Caller should
		 *  revoke-then-republish and update the URL in response. */
		onRegenerate,
		/** Called when the user clicks "Widerrufen". Caller flips the
		 *  record's visibility away from 'unlisted' (which triggers the
		 *  revoke on the server). */
		onRevoke,
		/** Called when the user picks a new expiry or clears it. Caller
		 *  re-publishes with the new `expiresAt`. */
		onExpiryChange,
		/** When the caller is in the middle of a publish/revoke, we
		 *  disable buttons to avoid racing. */
		disabled = false,
	}: {
		token: string;
		url: string;
		expiresAt?: string | null;
		onRegenerate: () => Promise<void> | void;
		onRevoke: () => Promise<void> | void;
		onExpiryChange?: (expiresAt: Date | null) => Promise<void> | void;
		disabled?: boolean;
	} = $props();

	let copied = $state(false);
	let showConfirmRegenerate = $state(false);
	let editingExpiry = $state(false);

	// datetime-local wants YYYY-MM-DDTHH:MM (no seconds, no zone).
	const expiryInputValue = $derived.by(() => {
		if (!expiresAt) return '';
		const d = new Date(expiresAt);
		if (Number.isNaN(d.getTime())) return '';
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
			d.getHours()
		)}:${pad(d.getMinutes())}`;
	});

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(url);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch {
			// Clipboard API blocked (Safari private mode, unsecure origin).
			// Fall back to a selection prompt so the user can copy manually.
			// eslint-disable-next-line no-alert
			prompt('Link kopieren:', url);
		}
	}

	async function confirmRegenerate() {
		showConfirmRegenerate = false;
		await onRegenerate();
	}

	async function handleExpiryChange(e: Event) {
		if (!onExpiryChange) return;
		const value = (e.target as HTMLInputElement).value;
		if (!value) {
			await onExpiryChange(null);
			return;
		}
		await onExpiryChange(new Date(value));
	}

	async function clearExpiry() {
		if (!onExpiryChange) return;
		await onExpiryChange(null);
	}
</script>

<div class="slc">
	<div class="slc__label">Geteilter Link</div>

	<div class="slc__row">
		<input
			class="slc__url"
			type="text"
			readonly
			value={url}
			aria-label="Share-URL"
			onfocus={(e) => (e.currentTarget as HTMLInputElement).select()}
		/>
		<button
			type="button"
			class="slc__btn slc__btn--primary"
			onclick={copyToClipboard}
			{disabled}
			title="Link kopieren"
		>
			{copied ? '✓ Kopiert' : '📋 Kopieren'}
		</button>
	</div>

	<div class="slc__actions">
		<button
			type="button"
			class="slc__btn"
			onclick={() => (showConfirmRegenerate = true)}
			{disabled}
			title="Neu erzeugen (alter Link wird sofort ungültig)"
		>
			🔄 Neu erzeugen
		</button>
		<button
			type="button"
			class="slc__btn slc__btn--danger"
			onclick={onRevoke}
			{disabled}
			title="Link widerrufen"
		>
			🗑 Widerrufen
		</button>
	</div>

	{#if onExpiryChange}
		<div class="slc__expiry">
			{#if editingExpiry || expiresAt}
				<label class="slc__expiry-label">
					<span>Läuft ab:</span>
					<input
						type="datetime-local"
						class="slc__expiry-input"
						value={expiryInputValue}
						onchange={handleExpiryChange}
						{disabled}
					/>
				</label>
				{#if expiresAt}
					<button
						type="button"
						class="slc__btn slc__btn--ghost"
						onclick={clearExpiry}
						{disabled}
						title="Ablauf entfernen — Link gilt dann dauerhaft"
					>
						✕
					</button>
				{/if}
			{:else}
				<button
					type="button"
					class="slc__btn slc__btn--ghost"
					onclick={() => (editingExpiry = true)}
					{disabled}
				>
					+ Ablauf setzen
				</button>
			{/if}
		</div>
	{/if}

	<!-- Fallback token display if url rendering fails (rare). -->
	<p class="slc__token" aria-label="Token zum Debuggen">Token: {token.slice(0, 8)}…</p>
</div>

{#if showConfirmRegenerate}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="slc__backdrop"
		onclick={() => (showConfirmRegenerate = false)}
		role="presentation"
	></div>
	<div class="slc__dialog" role="dialog" aria-modal="true">
		<p>Alter Link wird <strong>sofort ungültig</strong>. Weiter?</p>
		<div class="slc__dialog-actions">
			<button type="button" class="slc__btn slc__btn--primary" onclick={confirmRegenerate}>
				Ja, neuen Link erzeugen
			</button>
			<button type="button" class="slc__btn" onclick={() => (showConfirmRegenerate = false)}>
				Abbrechen
			</button>
		</div>
	</div>
{/if}

<style>
	.slc {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.03);
		font-size: 0.8125rem;
	}
	.slc__label {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.6;
	}
	.slc__row {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
	.slc__url {
		flex: 1 1 auto;
		min-width: 0;
		padding: 0.35rem 0.55rem;
		font-family: ui-monospace, monospace;
		font-size: 0.75rem;
		background: rgba(0, 0, 0, 0.18);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.375rem;
		color: inherit;
	}
	.slc__actions {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}
	.slc__btn {
		padding: 0.35rem 0.7rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 0.375rem;
		background: transparent;
		color: inherit;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
	}
	.slc__btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.06);
		border-color: rgba(255, 255, 255, 0.22);
	}
	.slc__btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.slc__btn--primary {
		background: rgba(99, 102, 241, 0.15);
		border-color: rgba(99, 102, 241, 0.45);
	}
	.slc__btn--primary:hover:not(:disabled) {
		background: rgba(99, 102, 241, 0.25);
	}
	.slc__btn--danger:hover:not(:disabled) {
		background: rgba(248, 113, 113, 0.15);
		border-color: rgba(248, 113, 113, 0.5);
		color: rgb(248, 113, 113);
	}
	.slc__btn--ghost {
		border-color: transparent;
		opacity: 0.7;
	}
	.slc__btn--ghost:hover:not(:disabled) {
		opacity: 1;
	}
	.slc__expiry {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
	.slc__expiry-label {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.75rem;
		opacity: 0.8;
	}
	.slc__expiry-input {
		padding: 0.25rem 0.45rem;
		background: rgba(0, 0, 0, 0.18);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.375rem;
		color: inherit;
		font-size: 0.75rem;
	}
	.slc__token {
		margin: 0;
		font-family: ui-monospace, monospace;
		font-size: 0.65rem;
		opacity: 0.35;
	}

	.slc__backdrop {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: rgba(0, 0, 0, 0.5);
	}
	.slc__dialog {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 101;
		min-width: 18rem;
		max-width: 22rem;
		padding: 1rem;
		border-radius: 0.5rem;
		background: rgb(20, 24, 32);
		border: 1px solid rgba(255, 255, 255, 0.12);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
	}
	.slc__dialog p {
		margin: 0 0 0.75rem;
		font-size: 0.875rem;
	}
	.slc__dialog-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}
</style>
