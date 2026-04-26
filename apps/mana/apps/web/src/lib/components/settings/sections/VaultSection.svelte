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
	import { _ } from 'svelte-i18n';
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
			zkError = $_('settings.vault.err_code_mismatch');
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
			toast.success($_('settings.vault.toast_zk_enabled'));
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
			toast.success($_('settings.vault.toast_zk_disabled'));
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
			toast.success($_('settings.vault.toast_recovery_cleared'));
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
			() => toast.success($_('settings.vault.toast_clipboard_ok')),
			() => toast.error($_('settings.vault.toast_clipboard_failed'))
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
			() => toast.success($_('settings.vault.toast_clipboard_ok')),
			() => toast.error($_('settings.vault.toast_clipboard_failed'))
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
			toast.success($_('settings.vault.toast_unlocked'));
		} else {
			toast.error($_('settings.vault.toast_unlock_failed', { values: { status: result.status } }));
		}
	}

	async function handleRotate() {
		rotating = true;
		try {
			const result = await vaultClient.rotate();
			vaultState = result;
			confirmRotate = false;
			if (result.status === 'unlocked') {
				toast.success($_('settings.vault.toast_rotated'));
			} else {
				toast.error(
					$_('settings.vault.toast_rotate_failed', { values: { status: result.status } })
				);
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
		if (s.status === 'unlocked')
			return { label: $_('settings.vault.badge_encrypted'), tone: 'green', icon: Lock };
		if (s.status === 'locked')
			return { label: $_('settings.vault.badge_locked'), tone: 'amber', icon: LockOpen };
		if (s.status === 'awaiting-recovery-code')
			return { label: $_('settings.vault.badge_recovery_required'), tone: 'amber', icon: Key };
		if (s.reason === 'auth')
			return { label: $_('settings.vault.badge_auth_required'), tone: 'red', icon: WarningCircle };
		if (s.reason === 'network')
			return { label: $_('settings.vault.badge_network_error'), tone: 'red', icon: WifiSlash };
		if (s.reason === 'server')
			return { label: $_('settings.vault.badge_server_error'), tone: 'red', icon: WarningCircle };
		return { label: $_('settings.vault.badge_unknown_error'), tone: 'red', icon: WarningCircle };
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
	title={$_('settings.vault.title')}
	description={$_('settings.vault.description')}
	tone="blue"
	action={statusBadgeSnippet}
/>

<div class="vault">
	<!-- Status body (below header) -->
	<div class="status-body">
		{#if vaultState.status === 'unlocked'}
			<p class="status-text">
				{$_('settings.vault.status_unlocked_pre')}
				<strong
					>{$_('settings.vault.status_unlocked_fields', {
						values: { count: totalEncryptedFields },
					})}</strong
				>
				<strong
					>{$_('settings.vault.status_unlocked_tables', {
						values: { count: encryptedTables.length },
					})}</strong
				>
				{$_('settings.vault.status_unlocked_post')}
			</p>
		{:else if vaultState.status === 'locked'}
			<p class="status-text">{$_('settings.vault.status_locked')}</p>
			<button class="btn btn-primary" type="button" onclick={handleUnlock}>
				{$_('settings.vault.status_load_now')}
			</button>
		{:else}
			<p class="status-text">{$_('settings.vault.status_error')}</p>
			<button class="btn" type="button" onclick={handleUnlock}
				>{$_('settings.vault.status_retry')}</button
			>
		{/if}
	</div>

	<!-- What Mana can see (threat-model disclosure, moved near top) -->
	<div class="subsection">
		<h3 class="subsection-title">{$_('settings.vault.threat_title')}</h3>
		<ul class="disclosure-list">
			<li>
				<strong>{$_('settings.vault.threat_never_label')}</strong>
				{$_('settings.vault.threat_never_body')}
			</li>
			<li>
				<strong>{$_('settings.vault.threat_could_label')}</strong>
				{$_('settings.vault.threat_could_body')}
			</li>
			<li>
				<strong>{$_('settings.vault.threat_visible_label')}</strong>
				{$_('settings.vault.threat_visible_body')}
			</li>
		</ul>
	</div>

	<!-- Encrypted fields list -->
	<div class="subsection">
		<div class="subsection-head">
			<h3 class="subsection-title">{$_('settings.vault.fields_title')}</h3>
			<span class="subsection-meta">
				{$_('settings.vault.fields_meta', {
					values: { fields: totalEncryptedFields, tables: encryptedTables.length },
				})}
			</span>
		</div>
		<p class="subsection-desc">{$_('settings.vault.fields_description')}</p>
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
				{fieldsExpanded
					? $_('settings.vault.show_less')
					: $_('settings.vault.show_more', { values: { count: hiddenTableCount } })}
			</button>
		{/if}
	</div>

	<!-- Zero-knowledge mode -->
	<div class="subsection">
		<div class="subsection-head">
			<h3 class="subsection-title">{$_('settings.vault.zk_title')}</h3>
			<span class="zk-state-pill" class:on={zkActive}>
				{zkActive ? $_('settings.vault.zk_state_active') : $_('settings.vault.zk_state_inactive')}
			</span>
		</div>
		<p class="subsection-desc">
			<strong>{$_('settings.vault.zk_desc_optional')}</strong>{$_(
				'settings.vault.zk_desc_body_pre'
			)}<em>{$_('settings.vault.zk_desc_body_em')}</em>{$_('settings.vault.zk_desc_body_post')}
		</p>
		<p class="subsection-desc">
			<strong>{$_('settings.vault.zk_pro_label')}</strong>{$_('settings.vault.zk_pro_body')}
			<strong>{$_('settings.vault.zk_con_label')}</strong>{$_('settings.vault.zk_con_body')}
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
					<span>{$_('settings.vault.zk_existing_warn')}</span>
				</div>
				<div class="actions">
					<button
						class="btn btn-primary"
						type="button"
						disabled={vaultState.status !== 'unlocked' || zkBusy}
						onclick={handleEnableZeroKnowledge}
					>
						{zkBusy ? $_('settings.vault.zk_enabling') : $_('settings.vault.zk_enable_now')}
					</button>
					<button
						class="btn"
						type="button"
						disabled={vaultState.status !== 'unlocked' || zkBusy}
						onclick={handleSetupRecoveryCode}
					>
						{$_('settings.vault.zk_generate_new')}
					</button>
					{#if !confirmClearRecovery}
						<button
							class="btn btn-ghost"
							type="button"
							disabled={zkBusy}
							onclick={() => (confirmClearRecovery = true)}
						>
							{$_('settings.vault.zk_clear')}
						</button>
					{:else}
						<button
							class="btn btn-danger"
							type="button"
							disabled={zkBusy}
							onclick={handleClearRecoveryCode}
						>
							{zkBusy ? $_('settings.vault.zk_clearing') : $_('settings.vault.zk_clear_confirm')}
						</button>
						<button
							class="btn btn-ghost"
							type="button"
							disabled={zkBusy}
							onclick={() => (confirmClearRecovery = false)}
						>
							{$_('settings.vault.cancel')}
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
						{zkBusy ? $_('settings.vault.zk_generating') : $_('settings.vault.zk_setup')}
					</button>
				</div>
			{/if}
		{/if}

		{#if zkSetupStep === 'generated' && generatedCode}
			<div class="wizard-step">
				<div class="step-head">
					<span class="step-num">1</span>
					<h4 class="step-title">{$_('settings.vault.step_1_title')}</h4>
				</div>
				<p class="subsection-desc">
					{$_('settings.vault.step_1_desc_pre')}<strong
						>{$_('settings.vault.step_1_desc_strong')}</strong
					>
				</p>
				<div class="recovery-code">{generatedCode}</div>
				<div class="actions">
					<button class="btn" type="button" onclick={handleCopyCode}>
						<Copy size={14} weight="bold" />
						{$_('settings.vault.copy')}
					</button>
					<button class="btn btn-primary" type="button" onclick={handleStartConfirm}>
						{$_('settings.vault.step_1_continue')}
					</button>
					<button class="btn btn-ghost" type="button" onclick={handleResetSetup}>
						{$_('settings.vault.cancel')}
					</button>
				</div>
			</div>
		{/if}

		{#if zkSetupStep === 'confirming'}
			<div class="wizard-step">
				<div class="step-head">
					<span class="step-num">2</span>
					<h4 class="step-title">{$_('settings.vault.step_2_title')}</h4>
				</div>
				<p class="subsection-desc">{$_('settings.vault.step_2_desc')}</p>
				<input
					class="recovery-input"
					type="text"
					bind:value={confirmCodeInput}
					placeholder={$_('settings.vault.step_2_placeholder')}
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
						{$_('settings.vault.step_2_confirm')}
					</button>
					<button class="btn btn-ghost" type="button" onclick={handleResetSetup}>
						{$_('settings.vault.cancel')}
					</button>
				</div>
			</div>
		{/if}

		{#if zkSetupStep === 'enabling'}
			<div class="wizard-step">
				<div class="step-head">
					<span class="step-num">3</span>
					<h4 class="step-title">{$_('settings.vault.step_3_title')}</h4>
				</div>
				<p class="subsection-desc">
					{$_('settings.vault.step_3_desc_pre')}<strong
						>{$_('settings.vault.step_3_desc_strong')}</strong
					>{$_('settings.vault.step_3_desc_post')}
				</p>
				<div class="inline-alert tone-red">
					<WarningCircle size={16} weight="fill" />
					<span>{$_('settings.vault.step_3_warn')}</span>
				</div>
				<div class="actions">
					<button
						class="btn btn-danger"
						type="button"
						disabled={zkBusy}
						onclick={handleEnableZeroKnowledge}
					>
						{zkBusy ? $_('settings.vault.zk_enabling') : $_('settings.vault.step_3_confirm')}
					</button>
					<button class="btn btn-ghost" type="button" disabled={zkBusy} onclick={handleResetSetup}>
						{$_('settings.vault.cancel')}
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
