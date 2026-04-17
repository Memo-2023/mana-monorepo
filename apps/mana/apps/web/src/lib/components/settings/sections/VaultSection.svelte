<!--
	Settings → Security → Verschlüsselung

	Surface for the encryption vault. Three jobs:
	  1. Show the user that their data IS encrypted (and which fields).
	  2. Provide a manual rotate button for the "device compromised"
	     recovery path.
	  3. Offer Zero-Knowledge opt-in with a recovery-code wizard.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		Lock,
		LockOpen,
		Key,
		WarningCircle,
		CheckCircle,
		ArrowsClockwise,
		Copy,
		WifiSlash,
	} from '@mana/shared-icons';
	import type { Component } from 'svelte';
	import { getVaultClient, ENCRYPTION_REGISTRY, type VaultUnlockState } from '$lib/data/crypto';
	import { toast } from '$lib/stores/toast.svelte';
	import SettingsSectionHeader from '../SettingsSectionHeader.svelte';

	const vaultClient = getVaultClient();

	let vaultState = $state<VaultUnlockState>(vaultClient.getState());
	let rotating = $state(false);
	let confirmRotate = $state(false);

	let zkSetupStep = $state<'idle' | 'generated' | 'confirming' | 'enabling' | 'enabled'>('idle');
	let generatedCode = $state<string | null>(null);
	let confirmCodeInput = $state('');
	let zkError = $state<string | null>(null);
	let zkBusy = $state(false);
	let confirmDisableZk = $state(false);
	let confirmClearRecovery = $state(false);
	let hasRecoveryWrap = $state(false);
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
		rotatedCode = null;
		rotateStep = 'idle';
	}

	function handleResetSetup() {
		zkSetupStep = 'idle';
		generatedCode = null;
		confirmCodeInput = '';
		zkError = null;
	}

	let pollTimer: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		vaultState = vaultClient.getState();
		pollTimer = setInterval(() => {
			const next = vaultClient.getState();
			if (next.status !== vaultState.status) vaultState = next;
		}, 1000);

		void vaultClient
			.getStatus()
			.then((status) => {
				hasRecoveryWrap = status.hasRecoveryWrap;
				if (status.zeroKnowledge) {
					zkSetupStep = 'enabled';
				}
			})
			.catch(() => {});
	});

	onDestroy(() => {
		if (pollTimer) clearInterval(pollTimer);
	});

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

	type BadgeTone = 'green' | 'amber' | 'red';
	function statusBadge(s: VaultUnlockState): {
		label: string;
		tone: BadgeTone;
		icon: Component;
	} {
		if (s.status === 'unlocked') return { label: 'Verschlüsselt', tone: 'green', icon: Lock };
		if (s.status === 'locked') return { label: 'Gesperrt', tone: 'amber', icon: LockOpen };
		if (s.status === 'awaiting-recovery-code')
			return { label: 'Recovery-Code erforderlich', tone: 'amber', icon: Key };
		if (s.reason === 'auth')
			return { label: 'Anmeldung erforderlich', tone: 'red', icon: WarningCircle };
		if (s.reason === 'network') return { label: 'Netzwerkfehler', tone: 'red', icon: WifiSlash };
		if (s.reason === 'server') return { label: 'Server-Fehler', tone: 'red', icon: WarningCircle };
		return { label: 'Unbekannter Fehler', tone: 'red', icon: WarningCircle };
	}

	const badge = $derived(statusBadge(vaultState));
	const zkActive = $derived(zkSetupStep === 'enabled');

	let fieldsExpanded = $state(false);
	const FIELDS_COLLAPSED_COUNT = 5;
	const visibleTables = $derived(
		fieldsExpanded ? encryptedTables : encryptedTables.slice(0, FIELDS_COLLAPSED_COUNT)
	);
	const hiddenTableCount = $derived(Math.max(0, encryptedTables.length - FIELDS_COLLAPSED_COUNT));
</script>

{#snippet statusBadgeSnippet()}
	<span class="status-badge tone-{badge.tone}">
		<badge.icon size={14} weight="fill" />
		<span>{badge.label}</span>
	</span>
{/snippet}

<SettingsSectionHeader
	icon={Lock}
	title="Verschlüsselung"
	description="Sensitive Felder werden mit AES-GCM-256 verschlüsselt, bevor sie in die lokale Datenbank geschrieben werden."
	tone="blue"
	action={statusBadgeSnippet}
/>

<div class="vault">
	<!-- Status body (below header) -->
	<div class="status-body">
		{#if vaultState.status === 'unlocked'}
			<p class="status-text">
				Dein persönlicher Schlüssel ist auf diesem Gerät geladen.
				<strong>{totalEncryptedFields} Felder</strong>
				über <strong>{encryptedTables.length} Tabellen</strong> werden verschlüsselt gespeichert.
			</p>
		{:else if vaultState.status === 'locked'}
			<p class="status-text">
				Dein Schlüssel ist nicht geladen. Verschlüsselte Inhalte können nicht gelesen werden, bis du
				dich erneut anmeldest oder den Schlüssel manuell lädst.
			</p>
			<button class="btn btn-primary" type="button" onclick={handleUnlock}>
				Schlüssel jetzt laden
			</button>
		{:else}
			<p class="status-text">
				Es gab ein Problem beim Laden deines Verschlüsselungsschlüssels. Bitte melde dich neu an
				oder prüfe deine Internetverbindung.
			</p>
			<button class="btn" type="button" onclick={handleUnlock}>Erneut versuchen</button>
		{/if}
	</div>

	<!-- What Mana can see (threat-model disclosure, moved near top) -->
	<div class="subsection">
		<h3 class="subsection-title">Was Mana sehen kann</h3>
		<ul class="disclosure-list">
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
	</div>

	<!-- Encrypted fields list -->
	<div class="subsection">
		<div class="subsection-head">
			<h3 class="subsection-title">Verschlüsselte Felder</h3>
			<span class="subsection-meta">
				{totalEncryptedFields} Felder · {encryptedTables.length} Tabellen
			</span>
		</div>
		<p class="subsection-desc">
			Welche Spalten in welchen Tabellen verschlüsselt am Gerät liegen. Strukturelle Metadaten (IDs,
			Zeitstempel, Status-Flags) bleiben absichtlich im Klartext, damit Indizes, Sortierungen und
			Sync weiter funktionieren.
		</p>
		<ul class="table-list">
			{#each visibleTables as { table, fields } (table)}
				<li>
					<span class="table-name">{table}</span>
					<span class="table-fields">{fields.join(', ')}</span>
				</li>
			{/each}
		</ul>
		{#if hiddenTableCount > 0}
			<button type="button" class="expand-btn" onclick={() => (fieldsExpanded = !fieldsExpanded)}>
				{fieldsExpanded ? 'Weniger anzeigen' : `${hiddenTableCount} weitere anzeigen`}
			</button>
		{/if}
	</div>

	<!-- Zero-knowledge mode -->
	<div class="subsection">
		<div class="subsection-head">
			<h3 class="subsection-title">Zero-Knowledge-Modus</h3>
			<span class="zk-state-pill" class:on={zkActive}>
				{zkActive ? 'Aktiv' : 'Nicht aktiv'}
			</span>
		</div>
		<p class="subsection-desc">
			<strong>Optional, fortgeschritten.</strong> Im Zero-Knowledge-Modus speichert Mana deinen
			Schlüssel <em>nur noch in einer Form, die wir selbst nicht entschlüsseln können</em>. Du
			brauchst dann beim Login von einem neuen Gerät deinen Recovery-Code, um deine Daten
			freizuschalten.
		</p>
		<p class="subsection-desc">
			<strong>Vorteil:</strong> selbst ein Mana-Mitarbeiter mit Vollzugriff auf den Server kann
			deine Inhalte nicht mehr lesen. <strong>Risiko:</strong> wenn du den Recovery-Code verlierst, sind
			deine Daten unwiderruflich weg — wir haben dann keinen Backup-Schlüssel mehr.
		</p>

		{#if zkError}
			<div class="inline-alert tone-red">
				<WarningCircle size={16} weight="fill" />
				<span>{zkError}</span>
			</div>
		{/if}

		{#if zkSetupStep === 'idle'}
			{#if hasRecoveryWrap}
				<div class="inline-alert tone-amber">
					<WarningCircle size={16} weight="fill" />
					<span>
						Du hast bereits einen Recovery-Code gespeichert, aber Zero-Knowledge ist noch nicht
						aktiv. Du kannst direkt aktivieren oder den Code zurücksetzen.
					</span>
				</div>
				<div class="actions">
					<button
						class="btn btn-primary"
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
				<div class="actions">
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
			<div class="wizard-step">
				<div class="step-head">
					<span class="step-num">1</span>
					<h4 class="step-title">Code sicher aufschreiben</h4>
				</div>
				<p class="subsection-desc">
					Speichere diesen Code an einem sicheren Ort (Passwort-Manager, ausgedruckt im Tresor, …). <strong
						>Wir zeigen ihn dir nur ein einziges Mal.</strong
					>
				</p>
				<div class="recovery-code">{generatedCode}</div>
				<div class="actions">
					<button class="btn" type="button" onclick={handleCopyCode}>
						<Copy size={14} weight="bold" />
						Kopieren
					</button>
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
			<div class="wizard-step">
				<div class="step-head">
					<span class="step-num">2</span>
					<h4 class="step-title">Code zurück eintippen</h4>
				</div>
				<p class="subsection-desc">
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
				<div class="actions">
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
			<div class="wizard-step">
				<div class="step-head">
					<span class="step-num">3</span>
					<h4 class="step-title">Zero-Knowledge-Modus aktivieren</h4>
				</div>
				<p class="subsection-desc">
					Wenn du jetzt aktivierst, löscht der Server seine Kopie deines Schlüssels. Ab sofort
					kannst du <strong>nur noch mit dem Recovery-Code</strong> auf deine verschlüsselten Daten zugreifen.
				</p>
				<div class="inline-alert tone-red">
					<WarningCircle size={16} weight="fill" />
					<span>
						Diese Aktion ist nicht rückgängig zu machen ohne den Recovery-Code. Wenn du deinen Code
						verlegst, sind deine Inhalte verloren.
					</span>
				</div>
				<div class="actions">
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
			<div class="zk-active-note">
				<CheckCircle size={16} weight="fill" />
				<span>
					Der Server kann deine Daten ab sofort nicht mehr entschlüsseln. Beim nächsten Login auf
					einem neuen Gerät wirst du nach deinem Recovery-Code gefragt.
				</span>
			</div>

			{#if rotateStep === 'rotated' && rotatedCode}
				<div class="wizard-step">
					<div class="step-head">
						<ArrowsClockwise size={16} weight="bold" />
						<h4 class="step-title">Neuer Recovery-Code</h4>
					</div>
					<p class="subsection-desc">
						<strong>Dein alter Code ist ab sofort ungültig.</strong> Speichere den neuen Code an einem
						sicheren Ort, bevor du diese Seite verlässt — wir zeigen ihn dir nur ein einziges Mal.
					</p>
					<div class="recovery-code">{rotatedCode}</div>
					<div class="actions">
						<button class="btn" type="button" onclick={handleCopyRotatedCode}>
							<Copy size={14} weight="bold" />
							Kopieren
						</button>
						<button class="btn btn-primary" type="button" onclick={handleFinishRotation}>
							Ich habe den neuen Code gesichert
						</button>
					</div>
				</div>
			{:else if !confirmDisableZk}
				<div class="actions">
					<button
						class="btn"
						type="button"
						disabled={vaultState.status !== 'unlocked' || zkBusy}
						onclick={handleRotateRecoveryCode}
					>
						<ArrowsClockwise size={14} weight="bold" />
						{zkBusy ? 'Rotiere …' : 'Recovery-Code rotieren'}
					</button>
					<button
						class="btn btn-ghost"
						type="button"
						disabled={vaultState.status !== 'unlocked' || zkBusy}
						onclick={() => (confirmDisableZk = true)}
					>
						Zero-Knowledge-Modus deaktivieren …
					</button>
				</div>
			{:else}
				<p class="subsection-desc">
					Damit wir den Server-Schlüssel wiederherstellen können, brauchen wir deinen aktuell
					geladenen Master-Key. Der ist gerade in deinem Browser — wir senden ihn einmal an den
					Server, der ihn dann mit dem KEK neu wrappt.
				</p>
				<div class="actions">
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
		{/if}
	</div>

	<!-- Key rotation (danger zone) -->
	<div class="subsection danger">
		<h3 class="subsection-title">Schlüssel rotieren</h3>
		<p class="subsection-desc">
			<strong>Vorsicht:</strong> Beim Rotieren wird ein neuer Schlüssel generiert. Daten, die mit
			dem alten Schlüssel verschlüsselt wurden, sind danach nicht mehr lesbar — es sei denn, sie
			wurden vorher entschlüsselt und mit dem neuen Schlüssel neu geschrieben. Mana führt diesen
			Re-Encrypt-Schritt aktuell <em>nicht automatisch</em> durch.
		</p>
		<p class="subsection-desc">
			Wann verwenden? Wenn du den Verdacht hast, dass dein Gerät kompromittiert wurde, oder als
			regelmäßige Sicherheitspraxis nach einem Login von einem unbekannten Ort.
		</p>
		{#if !confirmRotate}
			<div class="actions">
				<button
					class="btn btn-danger"
					type="button"
					disabled={vaultState.status !== 'unlocked'}
					onclick={() => (confirmRotate = true)}
				>
					Schlüssel rotieren …
				</button>
			</div>
		{:else}
			<div class="actions">
				<button class="btn btn-danger" type="button" disabled={rotating} onclick={handleRotate}>
					{rotating ? 'Rotiere …' : 'Ja, jetzt rotieren'}
				</button>
				<button
					class="btn btn-ghost"
					type="button"
					disabled={rotating}
					onclick={() => (confirmRotate = false)}
				>
					Abbrechen
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.vault {
		display: flex;
		flex-direction: column;
	}

	/* ── Status badge in header action slot ─────────────────────────── */
	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
	}
	.status-badge.tone-green {
		background: hsl(142 71% 45% / 0.12);
		color: hsl(142 71% 35%);
	}
	.status-badge.tone-amber {
		background: hsl(35 90% 50% / 0.12);
		color: hsl(35 90% 40%);
	}
	.status-badge.tone-red {
		background: hsl(0 72% 51% / 0.12);
		color: hsl(0 72% 45%);
	}

	/* ── Status body ────────────────────────────────────────────────── */
	.status-body {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding-bottom: 1rem;
	}
	.status-text {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.6;
		color: hsl(var(--color-foreground));
	}

	/* ── Subsection blocks ──────────────────────────────────────────── */
	.subsection {
		padding: 1.25rem 0;
		border-top: 1px solid hsl(var(--color-border));
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.subsection-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.subsection-title {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.subsection-meta {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.subsection-desc {
		margin: 0;
		font-size: 0.8125rem;
		line-height: 1.6;
		color: hsl(var(--color-muted-foreground));
	}

	.subsection-desc strong {
		color: hsl(var(--color-foreground));
	}

	.subsection.danger .subsection-title {
		color: hsl(0 72% 51%);
	}

	/* ── Threat-model disclosure list ───────────────────────────────── */
	.disclosure-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.disclosure-list li {
		position: relative;
		padding-left: 0.875rem;
		font-size: 0.8125rem;
		line-height: 1.6;
		color: hsl(var(--color-muted-foreground));
	}
	.disclosure-list li::before {
		content: '•';
		position: absolute;
		left: 0;
		color: hsl(var(--color-primary));
	}
	.disclosure-list strong {
		color: hsl(var(--color-foreground));
	}

	/* ── Encrypted-fields list ──────────────────────────────────────── */
	.table-list {
		margin: 0.25rem 0 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: 0.375rem;
	}
	.table-list li {
		display: grid;
		grid-template-columns: minmax(9rem, 14rem) 1fr;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		background: hsl(var(--color-muted) / 0.5);
		border-radius: 0.5rem;
		font-family: ui-monospace, SFMono-Regular, monospace;
		font-size: 0.75rem;
	}
	.table-name {
		color: hsl(var(--color-foreground));
		font-weight: 500;
	}
	.table-fields {
		color: hsl(var(--color-muted-foreground));
		word-break: break-word;
	}
	@media (max-width: 640px) {
		.table-list li {
			grid-template-columns: 1fr;
			gap: 0.25rem;
		}
	}

	.expand-btn {
		align-self: flex-start;
		margin-top: 0.375rem;
		padding: 0.25rem 0;
		background: none;
		border: none;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--color-primary));
		cursor: pointer;
	}
	.expand-btn:hover {
		color: hsl(var(--color-primary) / 0.8);
		text-decoration: underline;
	}

	/* ── ZK state pill ──────────────────────────────────────────────── */
	.zk-state-pill {
		padding: 0.1875rem 0.5625rem;
		border-radius: 9999px;
		font-size: 0.6875rem;
		font-weight: 500;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
	}
	.zk-state-pill.on {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	/* ── Inline alerts ──────────────────────────────────────────────── */
	.inline-alert {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.625rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		line-height: 1.5;
	}
	.inline-alert.tone-amber {
		background: hsl(35 90% 50% / 0.08);
		color: hsl(35 90% 35%);
	}
	.inline-alert.tone-red {
		background: hsl(0 72% 51% / 0.08);
		color: hsl(0 72% 40%);
	}
	.inline-alert :global(svg) {
		flex-shrink: 0;
		margin-top: 0.0625rem;
	}

	/* ── Wizard step ────────────────────────────────────────────────── */
	.wizard-step {
		margin-top: 0.25rem;
		padding: 0.875rem 1rem;
		background: hsl(var(--color-muted) / 0.3);
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.625rem;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.step-head {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.step-num {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.375rem;
		height: 1.375rem;
		border-radius: 50%;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.75rem;
		font-weight: 600;
	}

	.step-title {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.zk-active-note {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.625rem 0.75rem;
		background: hsl(142 71% 45% / 0.08);
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		line-height: 1.5;
		color: hsl(142 71% 30%);
	}
	.zk-active-note :global(svg) {
		flex-shrink: 0;
		color: hsl(142 71% 45%);
		margin-top: 0.0625rem;
	}

	.recovery-code {
		padding: 0.875rem 1rem;
		background: hsl(var(--color-background));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		font-family: ui-monospace, SFMono-Regular, monospace;
		font-size: 0.9375rem;
		font-weight: 500;
		letter-spacing: 0.05em;
		text-align: center;
		word-break: break-all;
		user-select: all;
		color: hsl(var(--color-foreground));
	}

	.recovery-input {
		display: block;
		width: 100%;
		padding: 0.625rem 0.875rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		font-family: ui-monospace, SFMono-Regular, monospace;
		font-size: 0.875rem;
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
	}
	.recovery-input:focus {
		outline: none;
		border-color: hsl(var(--color-primary) / 0.5);
		box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.15);
	}

	/* ── Buttons ────────────────────────────────────────────────────── */
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4375rem;
		padding: 0.4375rem 0.875rem;
		font-size: 0.8125rem;
		font-weight: 500;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s;
	}
	.btn:hover:not(:disabled) {
		background: hsl(var(--color-surface-hover, var(--color-muted)) / 0.6);
		border-color: hsl(var(--color-border-strong, var(--color-border)));
	}
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: transparent;
	}
	.btn-primary:hover:not(:disabled) {
		background: hsl(var(--color-primary) / 0.9);
		border-color: transparent;
	}

	.btn-danger {
		background: hsl(0 72% 51%);
		color: white;
		border-color: transparent;
	}
	.btn-danger:hover:not(:disabled) {
		background: hsl(0 72% 45%);
		border-color: transparent;
	}

	.btn-ghost {
		background: transparent;
		border-color: transparent;
		color: hsl(var(--color-muted-foreground));
	}
	.btn-ghost:hover:not(:disabled) {
		background: hsl(var(--color-muted) / 0.6);
		color: hsl(var(--color-foreground));
		border-color: transparent;
	}
</style>
