<!--
	Settings → Security
	===================

	Surface for the encryption vault vaultState. Three jobs:

	  1. Show the user that their data IS encrypted (and which fields)
	     so the privacy promise is concrete and verifiable.
	  2. Provide a manual rotate button for the "I think my device was
	     compromised" recovery path. Rotating mints a fresh master key,
	     which makes every existing encrypted blob unreadable — caller
	     accepts that risk via a confirm modal.
	  3. Document what is NOT encrypted (structural metadata, indexed
	     fields) so the threat model is honest.

	The page reads from the lazy-singleton vault client and the static
	registry. It does NOT have any side effects of its own — every
	mutation goes through vaultClient.rotate() which the rest of the
	app already trusts.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		getVaultClient,
		ENCRYPTION_REGISTRY,
		isVaultUnlocked,
		type VaultUnlockState,
	} from '$lib/data/crypto';
	import { toast } from '$lib/stores/toast.svelte';

	const vaultClient = getVaultClient();

	let vaultState = $state<VaultUnlockState>(vaultClient.getState());
	let rotating = $state(false);
	let confirmRotate = $state(false);

	// Poll the vault vaultState every second so the badge reflects external
	// lock/unlock events (logout, manual lock from another tab) without
	// the user having to refresh the page. 1s is fine for a settings
	// surface — it's not a hot path.
	let pollTimer: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		vaultState = vaultClient.getState();
		pollTimer = setInterval(() => {
			const next = vaultClient.getState();
			if (next.status !== vaultState.status) vaultState = next;
		}, 1000);
	});

	onDestroy(() => {
		if (pollTimer) clearInterval(pollTimer);
	});

	// Compute the table → field listing from the registry. Filter on
	// enabled:true so the page only shows what's actually being
	// encrypted right now (registry entries with enabled:false are
	// future/skipped tables and would mislead the user).
	const encryptedTables = $derived(
		Object.entries(ENCRYPTION_REGISTRY)
			.filter(([, config]) => config.enabled)
			.map(([table, config]) => ({ table, fields: [...config.fields] }))
			.sort((a, b) => a.table.localeCompare(b.table))
	);

	const totalEncryptedFields = $derived(
		encryptedTables.reduce((sum, t) => sum + t.fields.length, 0)
	);

	async function handleUnlock() {
		const result = await vaultClient.unlock();
		vaultState = result;
		if (result.status === 'unlocked') {
			toast.success('Verschlüsselungsschlüssel geladen');
		} else {
			toast.error(`Schlüssel konnte nicht geladen werden: ${result.status}`);
		}
	}

	async function handleRotate() {
		rotating = true;
		try {
			const result = await vaultClient.rotate();
			vaultState = result;
			confirmRotate = false;
			if (result.status === 'unlocked') {
				toast.success('Schlüssel rotiert. Neue Schreibvorgänge verwenden den neuen Schlüssel.');
			} else {
				toast.error(`Rotation fehlgeschlagen: ${result.status}`);
			}
		} finally {
			rotating = false;
		}
	}

	function statusBadge(s: VaultUnlockState) {
		if (s.status === 'unlocked') return { label: '🔒 Verschlüsselt', color: 'green' };
		if (s.status === 'locked') return { label: '🔓 Gesperrt', color: 'amber' };
		if (s.status === 'awaiting-recovery-code')
			return { label: '🔑 Recovery-Code erforderlich', color: 'amber' };
		if (s.reason === 'auth') return { label: '🔑 Anmeldung erforderlich', color: 'red' };
		if (s.reason === 'network') return { label: '📡 Netzwerkfehler', color: 'red' };
		if (s.reason === 'server') return { label: '⚠️ Server-Fehler', color: 'red' };
		return { label: '❓ Unbekannter Fehler', color: 'red' };
	}

	const badge = $derived(statusBadge(vaultState));
</script>

<svelte:head>
	<title>Sicherheit · Einstellungen · Mana</title>
</svelte:head>

<div class="security-page">
	<header>
		<h1>Sicherheit</h1>
		<p class="subtitle">
			Verschlüsselung deiner Inhalte auf diesem Gerät. Sensitive Felder werden mit AES-GCM-256
			verschlüsselt, bevor sie in die lokale Datenbank geschrieben werden.
		</p>
	</header>

	<!-- Vault status card -->
	<section class="card">
		<div class="card-head">
			<h2>Status</h2>
			<span class="badge badge-{badge.color}">{badge.label}</span>
		</div>

		{#if vaultState.status === 'unlocked'}
			<p>
				Dein persönlicher Schlüssel ist auf diesem Gerät geladen. {totalEncryptedFields}
				Felder über {encryptedTables.length} Tabellen werden verschlüsselt gespeichert.
			</p>
		{:else if vaultState.status === 'locked'}
			<p>
				Dein Schlüssel ist nicht geladen. Verschlüsselte Inhalte können nicht gelesen werden, bis du
				dich erneut anmeldest oder den Schlüssel manuell lädst.
			</p>
			<button class="btn btn-primary" type="button" onclick={handleUnlock}>
				Schlüssel jetzt laden
			</button>
		{:else}
			<p>
				Es gab ein Problem beim Laden deines Verschlüsselungsschlüssels. Bitte melde dich neu an
				oder prüfe deine Internetverbindung.
			</p>
			<button class="btn" type="button" onclick={handleUnlock}>Erneut versuchen</button>
		{/if}
	</section>

	<!-- Encrypted-tables list -->
	<section class="card">
		<div class="card-head">
			<h2>Verschlüsselte Felder</h2>
			<span class="muted">{totalEncryptedFields} Felder, {encryptedTables.length} Tabellen</span>
		</div>
		<p class="muted">
			Welche Spalten in welchen Tabellen verschlüsselt am Gerät liegen. Strukturelle Metadaten (IDs,
			Zeitstempel, Status-Flags) bleiben absichtlich im Klartext, damit Indizes, Sortierungen und
			Sync weiter funktionieren.
		</p>
		<ul class="table-list">
			{#each encryptedTables as { table, fields } (table)}
				<li>
					<strong>{table}</strong>
					<span class="fields">{fields.join(', ')}</span>
				</li>
			{/each}
		</ul>
	</section>

	<!-- Rotate -->
	<section class="card danger">
		<div class="card-head">
			<h2>Schlüssel rotieren</h2>
		</div>
		<p>
			<strong>Vorsicht:</strong> Beim Rotieren wird ein neuer Schlüssel generiert. Daten, die mit
			dem alten Schlüssel verschlüsselt wurden, sind danach nicht mehr lesbar — es sei denn, sie
			wurden vorher entschlüsselt und mit dem neuen Schlüssel neu geschrieben. Mana führt diesen
			Re-Encrypt-Schritt aktuell <em>nicht automatisch</em> durch.
		</p>
		<p>
			Wann verwenden? Wenn du den Verdacht hast, dass dein Gerät kompromittiert wurde, oder als
			regelmäßige Sicherheitspraxis nach einem Login von einem unbekannten Ort.
		</p>
		{#if !confirmRotate}
			<button
				class="btn btn-danger"
				type="button"
				disabled={vaultState.status !== 'unlocked'}
				onclick={() => (confirmRotate = true)}
			>
				Schlüssel rotieren …
			</button>
		{:else}
			<div class="confirm-row">
				<button class="btn btn-danger" type="button" disabled={rotating} onclick={handleRotate}>
					{rotating ? 'Rotiere …' : 'Ja, jetzt rotieren'}
				</button>
				<button
					class="btn"
					type="button"
					disabled={rotating}
					onclick={() => (confirmRotate = false)}
				>
					Abbrechen
				</button>
			</div>
		{/if}
	</section>

	<!-- Honest disclosure -->
	<section class="card">
		<div class="card-head">
			<h2>Was Mana sehen kann</h2>
		</div>
		<p>
			Mana speichert deinen Schlüssel verschlüsselt auf dem Server (mit einer separaten
			Schlüssel-Verschlüsselungs-Schlüssel-Strategie), damit du dich von neuen Geräten anmelden
			kannst. Das bedeutet:
		</p>
		<ul>
			<li>
				<strong>Was Mana nie sieht:</strong> deine verschlüsselten Inhalte (Chat, Notizen, Träume, Memos,
				Kontaktdetails, Zyklus-Notizen, Transaktionsbeschreibungen, …). Sie verlassen dein Gerät nur als
				unleserlicher Blob.
			</li>
			<li>
				<strong>Was Mana technisch entschlüsseln könnte:</strong> deinen Master-Key, falls ein Mitarbeiter
				mit Zugriff auf den Schlüsselverschlüsselungsschlüssel aktiv darauf zugreift. In der Praxis ist
				das gegen alle realistischen Bedrohungen außer einer gerichtlich erzwungenen Offenlegung gegen
				Mana selbst geschützt.
			</li>
			<li>
				<strong>Was strukturell sichtbar bleibt:</strong> Anzahl deiner Notizen / Chats / Kontakte, Zeitstempel,
				Verbindungen zwischen Records. Die Inhalte selbst nicht.
			</li>
		</ul>
	</section>
</div>

<style>
	.security-page {
		max-width: 56rem;
		margin: 0 auto;
		padding: 2rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	header h1 {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 0.25rem 0;
	}

	.subtitle {
		color: var(--text-secondary, #6b7280);
		font-size: 0.95rem;
		max-width: 48rem;
	}

	.card {
		border: 1px solid var(--border, #e5e7eb);
		border-radius: 0.75rem;
		padding: 1.25rem 1.5rem;
		background: var(--surface, #fff);
	}
	.card.danger {
		border-color: rgba(220, 38, 38, 0.25);
	}

	.card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	h2 {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		font-size: 0.85rem;
		padding: 0.25rem 0.65rem;
		border-radius: 999px;
		font-weight: 500;
	}
	.badge-green {
		background: rgba(34, 197, 94, 0.12);
		color: rgb(21, 128, 65);
	}
	.badge-amber {
		background: rgba(245, 158, 11, 0.12);
		color: rgb(180, 83, 9);
	}
	.badge-red {
		background: rgba(239, 68, 68, 0.12);
		color: rgb(185, 28, 28);
	}

	.muted {
		color: var(--text-secondary, #6b7280);
		font-size: 0.9rem;
	}

	.table-list {
		list-style: none;
		padding: 0;
		margin: 0.75rem 0 0 0;
		display: grid;
		gap: 0.5rem;
	}
	.table-list li {
		display: flex;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		background: var(--surface-muted, #f9fafb);
		border-radius: 0.5rem;
		font-family: ui-monospace, SFMono-Regular, monospace;
		font-size: 0.85rem;
	}
	.table-list strong {
		min-width: 9rem;
		color: var(--text-primary, #111);
	}
	.table-list .fields {
		color: var(--text-secondary, #6b7280);
		word-break: break-word;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		border: 1px solid var(--border, #e5e7eb);
		background: var(--surface, #fff);
		font-size: 0.9rem;
		cursor: pointer;
		font-weight: 500;
	}
	.btn:hover:not(:disabled) {
		background: var(--surface-muted, #f3f4f6);
	}
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: var(--primary, #6366f1);
		color: white;
		border-color: transparent;
	}
	.btn-primary:hover:not(:disabled) {
		background: var(--primary-dark, #4f46e5);
	}

	.btn-danger {
		background: rgb(220, 38, 38);
		color: white;
		border-color: transparent;
	}
	.btn-danger:hover:not(:disabled) {
		background: rgb(185, 28, 28);
	}

	.confirm-row {
		display: flex;
		gap: 0.5rem;
	}

	ul {
		padding-left: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	@media (prefers-color-scheme: dark) {
		.card {
			background: var(--surface, #1f2937);
			border-color: var(--border, #374151);
		}
		.table-list li {
			background: var(--surface-muted, #111827);
		}
	}
</style>
