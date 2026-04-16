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

	// ─── Phase 9: Recovery code + Zero-knowledge ─────────────
	//
	// The setup flow has three steps:
	//   1. Generate: client mints a fresh recovery secret + posts the
	//      sealed wrap to /recovery-wrap → returns the formatted code
	//   2. Confirm: user has to type the code back in to prove they
	//      backed it up. We don't move to step 3 until this matches.
	//   3. Enable: client posts /zero-knowledge { enable: true } and
	//      the server NULLs out the KEK wrap. Irreversible without the
	//      recovery code.
	//
	// The disable flow needs an unlocked vault that came in via the
	// recovery code path (so the cached MK bytes are populated). We
	// don't expose disable from the lock screen — only from this page
	// while already unlocked.

	let zkSetupStep = $state<'idle' | 'generated' | 'confirming' | 'enabling' | 'enabled'>('idle');
	let generatedCode = $state<string | null>(null);
	let confirmCodeInput = $state('');
	let zkError = $state<string | null>(null);
	let zkBusy = $state(false);
	let confirmDisableZk = $state(false);
	let confirmClearRecovery = $state(false);
	/** True iff a recovery wrap is stored on the server, regardless of
	 *  whether ZK is currently active. Hydrated from getStatus() on
	 *  mount so the UI can show "Recovery-Code entfernen" without
	 *  walking through the setup flow again. */
	let hasRecoveryWrap = $state(false);
	/** Side flow for rotating the recovery code from the active state.
	 *  'idle'    — show "Code rotieren" button
	 *  'rotated' — show the new code + Copy + Done button
	 *  Independent of zkSetupStep so the user can rotate without
	 *  leaving the active-mode UI. */
	let rotateStep = $state<'idle' | 'rotated'>('idle');
	let rotatedCode = $state<string | null>(null);

	async function handleSetupRecoveryCode() {
		zkError = null;
		zkBusy = true;
		try {
			const result = await vaultClient.setupRecoveryCode();
			generatedCode = result.formattedCode;
			zkSetupStep = 'generated';
			hasRecoveryWrap = true;
		} catch (e) {
			zkError = (e as Error).message;
		} finally {
			zkBusy = false;
		}
	}

	function handleStartConfirm() {
		zkSetupStep = 'confirming';
		confirmCodeInput = '';
		zkError = null;
	}

	function handleConfirmCode() {
		zkError = null;
		// Strip whitespace + dashes from both sides for the comparison so
		// the user doesn't get punished for inconsistent dash placement.
		const expected = (generatedCode ?? '').replace(/[\s-]/g, '').toUpperCase();
		const actual = confirmCodeInput.replace(/[\s-]/g, '').toUpperCase();
		if (actual !== expected) {
			zkError = 'Der eingegebene Code stimmt nicht mit dem angezeigten überein.';
			return;
		}
		zkSetupStep = 'enabling';
	}

	async function handleEnableZeroKnowledge() {
		zkError = null;
		zkBusy = true;
		try {
			await vaultClient.enableZeroKnowledge();
			zkSetupStep = 'enabled';
			// Wipe the displayed code from memory now that the user has
			// confirmed they backed it up. The DOM still has it until the
			// next render cycle, but our reference goes away.
			generatedCode = null;
			confirmCodeInput = '';
			toast.success('Zero-Knowledge-Modus aktiviert');
		} catch (e) {
			zkError = (e as Error).message;
		} finally {
			zkBusy = false;
		}
	}

	async function handleDisableZeroKnowledge() {
		zkError = null;
		zkBusy = true;
		try {
			await vaultClient.disableZeroKnowledge();
			toast.success('Zero-Knowledge-Modus deaktiviert');
			confirmDisableZk = false;
			zkSetupStep = 'idle';
		} catch (e) {
			zkError = (e as Error).message;
		} finally {
			zkBusy = false;
		}
	}

	async function handleClearRecoveryCode() {
		zkError = null;
		zkBusy = true;
		try {
			await vaultClient.clearRecoveryCode();
			toast.success('Recovery-Code entfernt');
			confirmClearRecovery = false;
			zkSetupStep = 'idle';
			hasRecoveryWrap = false;
		} catch (e) {
			zkError = (e as Error).message;
		} finally {
			zkBusy = false;
		}
	}

	function handleCopyCode() {
		if (!generatedCode) return;
		navigator.clipboard.writeText(generatedCode).then(
			() => toast.success('Code in die Zwischenablage kopiert'),
			() => toast.error('Konnte Code nicht kopieren')
		);
	}

	async function handleRotateRecoveryCode() {
		zkError = null;
		zkBusy = true;
		try {
			const result = await vaultClient.rotateRecoveryCode();
			rotatedCode = result.formattedCode;
			rotateStep = 'rotated';
		} catch (e) {
			zkError = (e as Error).message;
		} finally {
			zkBusy = false;
		}
	}

	function handleCopyRotatedCode() {
		if (!rotatedCode) return;
		navigator.clipboard.writeText(rotatedCode).then(
			() => toast.success('Code in die Zwischenablage kopiert'),
			() => toast.error('Konnte Code nicht kopieren')
		);
	}

	function handleFinishRotation() {
		// User has acknowledged they backed up the new code. Wipe the
		// reference (the DOM still shows it until the next render
		// cycle, but our state goes away).
		rotatedCode = null;
		rotateStep = 'idle';
	}

	function handleResetSetup() {
		zkSetupStep = 'idle';
		generatedCode = null;
		confirmCodeInput = '';
		zkError = null;
	}

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

		// Hydrate the ZK section from the server's actual vault state
		// so a reload after enabling zero-knowledge doesn't drop the
		// user back into the setup flow. Best-effort: failures leave
		// zkSetupStep at 'idle' which is the safe default.
		void vaultClient
			.getStatus()
			.then((status) => {
				hasRecoveryWrap = status.hasRecoveryWrap;
				if (status.zeroKnowledge) {
					zkSetupStep = 'enabled';
				}
			})
			.catch(() => {
				// Status fetch failed (network, auth, server). Stay on the
				// idle default — the user can still run the setup flow,
				// and the server-side error handling will catch any
				// inconsistencies.
			});
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

<div class="security-page">
	<header>
		<h2>Verschlüsselung</h2>
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

	<!-- Phase 9: Recovery code + Zero-knowledge mode -->
	<section class="card">
		<div class="card-head">
			<h2>Zero-Knowledge-Modus</h2>
		</div>
		<p>
			<strong>Optional, fortgeschritten.</strong> Im Zero-Knowledge-Modus speichert Mana deinen
			Schlüssel <em>nur noch in einer Form, die wir selbst nicht entschlüsseln können</em>. Du
			brauchst dann beim Login von einem neuen Gerät deinen Recovery-Code, um deine Daten
			freizuschalten.
		</p>
		<p class="muted">
			<strong>Vorteil:</strong> selbst ein Mana-Mitarbeiter mit Vollzugriff auf den Server kann
			deine Inhalte nicht mehr lesen. <strong>Risiko:</strong> wenn du den Recovery-Code verlierst, sind
			deine Daten unwiderruflich weg — wir haben dann keinen Backup-Schlüssel mehr.
		</p>

		{#if zkError}
			<div class="zk-error">⚠️ {zkError}</div>
		{/if}

		{#if zkSetupStep === 'idle'}
			{#if hasRecoveryWrap}
				<div class="zk-info">
					ℹ️ Du hast bereits einen Recovery-Code gespeichert, aber Zero-Knowledge ist noch nicht
					aktiv. Du kannst direkt aktivieren oder den Code zurücksetzen.
				</div>
				<div class="zk-actions">
					<button
						class="btn btn-danger"
						type="button"
						disabled={vaultState.status !== 'unlocked' || zkBusy}
						onclick={handleEnableZeroKnowledge}
					>
						{zkBusy ? 'Aktiviere …' : 'Zero-Knowledge jetzt aktivieren'}
					</button>
					<button
						class="btn"
						type="button"
						disabled={vaultState.status !== 'unlocked' || zkBusy}
						onclick={handleSetupRecoveryCode}
					>
						Neuen Recovery-Code generieren
					</button>
					{#if !confirmClearRecovery}
						<button
							class="btn btn-ghost"
							type="button"
							disabled={zkBusy}
							onclick={() => (confirmClearRecovery = true)}
						>
							Recovery-Code entfernen
						</button>
					{:else}
						<button
							class="btn btn-danger"
							type="button"
							disabled={zkBusy}
							onclick={handleClearRecoveryCode}
						>
							{zkBusy ? 'Entferne …' : 'Ja, entfernen'}
						</button>
						<button
							class="btn btn-ghost"
							type="button"
							disabled={zkBusy}
							onclick={() => (confirmClearRecovery = false)}
						>
							Abbrechen
						</button>
					{/if}
				</div>
			{:else}
				<div class="zk-actions">
					<button
						class="btn btn-primary"
						type="button"
						disabled={vaultState.status !== 'unlocked' || zkBusy}
						onclick={handleSetupRecoveryCode}
					>
						{zkBusy ? 'Generiere …' : 'Recovery-Code einrichten'}
					</button>
				</div>
			{/if}
		{/if}

		{#if zkSetupStep === 'generated' && generatedCode}
			<div class="zk-step">
				<h3>Schritt 1 von 3 — Code sicher aufschreiben</h3>
				<p>
					Speichere diesen Code an einem sicheren Ort (Passwort-Manager, ausgedruckt im Tresor, …).
					<strong>Wir zeigen ihn dir nur ein einziges Mal.</strong>
				</p>
				<div class="recovery-code">{generatedCode}</div>
				<div class="zk-actions">
					<button class="btn" type="button" onclick={handleCopyCode}>📋 Kopieren</button>
					<button class="btn btn-primary" type="button" onclick={handleStartConfirm}>
						Ich habe den Code gesichert →
					</button>
					<button class="btn btn-ghost" type="button" onclick={handleResetSetup}>
						Abbrechen
					</button>
				</div>
			</div>
		{/if}

		{#if zkSetupStep === 'confirming'}
			<div class="zk-step">
				<h3>Schritt 2 von 3 — Code zurück eintippen</h3>
				<p>
					Tippe (oder paste) den Code, den du gerade gespeichert hast. So stellen wir sicher, dass
					der Backup wirklich vollständig ist.
				</p>
				<input
					class="recovery-input"
					type="text"
					bind:value={confirmCodeInput}
					placeholder="1A2B-3C4D-5E6F-..."
					autocomplete="off"
					spellcheck="false"
				/>
				<div class="zk-actions">
					<button
						class="btn btn-primary"
						type="button"
						disabled={!confirmCodeInput.trim()}
						onclick={handleConfirmCode}
					>
						Code bestätigen
					</button>
					<button class="btn btn-ghost" type="button" onclick={handleResetSetup}>
						Abbrechen
					</button>
				</div>
			</div>
		{/if}

		{#if zkSetupStep === 'enabling'}
			<div class="zk-step">
				<h3>Schritt 3 von 3 — Zero-Knowledge-Modus aktivieren</h3>
				<p>
					Wenn du jetzt aktivierst, löscht der Server seine Kopie deines Schlüssels. Ab sofort
					kannst du <strong>nur noch mit dem Recovery-Code</strong> auf deine verschlüsselten Daten zugreifen.
				</p>
				<p class="warn">
					⚠️ Diese Aktion ist nicht rückgängig zu machen ohne den Recovery-Code. Wenn du deinen Code
					verlegst, sind deine Inhalte verloren.
				</p>
				<div class="zk-actions">
					<button
						class="btn btn-danger"
						type="button"
						disabled={zkBusy}
						onclick={handleEnableZeroKnowledge}
					>
						{zkBusy ? 'Aktiviere …' : 'Ja, Zero-Knowledge-Modus aktivieren'}
					</button>
					<button class="btn btn-ghost" type="button" disabled={zkBusy} onclick={handleResetSetup}>
						Abbrechen
					</button>
				</div>
			</div>
		{/if}

		{#if zkSetupStep === 'enabled'}
			<div class="zk-step">
				<h3>✅ Zero-Knowledge-Modus aktiv</h3>
				<p>
					Der Server kann deine Daten ab sofort nicht mehr entschlüsseln. Beim nächsten Login auf
					einem neuen Gerät wirst du nach deinem Recovery-Code gefragt.
				</p>

				{#if rotateStep === 'rotated' && rotatedCode}
					<div class="zk-step">
						<h3>🔁 Neuer Recovery-Code</h3>
						<p>
							<strong>Dein alter Code ist ab sofort ungültig.</strong> Speichere den neuen Code an einem
							sicheren Ort, bevor du diese Seite verlässt — wir zeigen ihn dir nur ein einziges Mal.
						</p>
						<div class="recovery-code">{rotatedCode}</div>
						<div class="zk-actions">
							<button class="btn" type="button" onclick={handleCopyRotatedCode}>
								📋 Kopieren
							</button>
							<button class="btn btn-primary" type="button" onclick={handleFinishRotation}>
								Ich habe den neuen Code gesichert
							</button>
						</div>
					</div>
				{:else if !confirmDisableZk}
					<div class="zk-actions">
						<button
							class="btn"
							type="button"
							disabled={vaultState.status !== 'unlocked' || zkBusy}
							onclick={handleRotateRecoveryCode}
						>
							{zkBusy ? 'Rotiere …' : '🔁 Recovery-Code rotieren'}
						</button>
						<button
							class="btn"
							type="button"
							disabled={vaultState.status !== 'unlocked' || zkBusy}
							onclick={() => (confirmDisableZk = true)}
						>
							Zero-Knowledge-Modus wieder deaktivieren …
						</button>
					</div>
				{:else}
					<p class="muted">
						Damit wir den Server-Schlüssel wiederherstellen können, brauchen wir deinen aktuell
						geladenen Master-Key. Der ist gerade in deinem Browser — wir senden ihn einmal an den
						Server, der ihn dann mit dem KEK neu wrappt.
					</p>
					<div class="zk-actions">
						<button
							class="btn btn-danger"
							type="button"
							disabled={zkBusy}
							onclick={handleDisableZeroKnowledge}
						>
							{zkBusy ? 'Deaktiviere …' : 'Ja, deaktivieren'}
						</button>
						<button
							class="btn btn-ghost"
							type="button"
							disabled={zkBusy}
							onclick={() => (confirmDisableZk = false)}
						>
							Abbrechen
						</button>
					</div>
				{/if}
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
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		padding: 1.25rem 1.5rem;
		background: hsl(var(--color-surface));
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
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
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
		background: hsl(var(--color-primary));
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

	/* ─── Phase 9: Zero-knowledge UI ─────────────────────── */

	.zk-error {
		margin-top: 0.75rem;
		padding: 0.75rem 1rem;
		background: rgba(239, 68, 68, 0.08);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: rgb(185, 28, 28);
	}

	.zk-info {
		margin-top: 0.75rem;
		padding: 0.75rem 1rem;
		background: rgba(245, 158, 11, 0.08);
		border: 1px solid rgba(245, 158, 11, 0.3);
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: rgb(180, 83, 9);
	}

	.zk-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.zk-step {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--color-border));
	}

	.zk-step h3 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
	}

	.zk-step p {
		margin: 0.5rem 0;
		font-size: 0.9rem;
	}

	.zk-step p.warn {
		color: rgb(185, 28, 28);
		font-weight: 500;
	}

	.recovery-code {
		margin: 1rem 0;
		padding: 1rem 1.25rem;
		background: var(--surface-muted, #f9fafb);
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		font-family: ui-monospace, SFMono-Regular, monospace;
		font-size: 1rem;
		font-weight: 500;
		letter-spacing: 0.05em;
		text-align: center;
		word-break: break-all;
		user-select: all;
	}

	.recovery-input {
		display: block;
		width: 100%;
		margin: 0.75rem 0;
		padding: 0.75rem 1rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		font-family: ui-monospace, SFMono-Regular, monospace;
		font-size: 0.95rem;
		background: hsl(var(--color-surface));
	}

	.recovery-input:focus {
		outline: 2px solid hsl(var(--color-primary));
		outline-offset: 1px;
	}

	.btn-ghost {
		background: transparent;
		border-color: transparent;
	}

	@media (prefers-color-scheme: dark) {
		.card {
			background: hsl(var(--color-surface));
			border-color: hsl(var(--color-border));
		}
		.table-list li {
			background: var(--surface-muted, #111827);
		}
		.recovery-code,
		.recovery-input {
			background: var(--surface-muted, #111827);
			border-color: hsl(var(--color-border));
		}
	}
</style>
