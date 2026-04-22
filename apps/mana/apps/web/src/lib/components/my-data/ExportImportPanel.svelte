<!--
  ExportImportPanel — Settings-Section für .mana v2 Ex/Import.

  Client-getrieben: liest lokale Dexie-Tables, entschlüsselt per-field,
  packt als .mana-Archiv (optional passphrase-gesealed). Beim Import
  re-encrypten wir pro-field mit dem aktuellen Vault-Key → cross-account-
  Migration funktioniert transparent.
-->
<script lang="ts">
	import { DownloadSimple, UploadSimple, CheckCircle, WarningCircle } from '@mana/shared-icons';
	import SettingsPanel from '$lib/components/settings/SettingsPanel.svelte';
	import SettingsSectionHeader from '$lib/components/settings/SettingsSectionHeader.svelte';
	import { MODULE_CONFIGS } from '$lib/data/module-registry';
	import { MANA_APPS } from '@mana/shared-branding';
	import {
		buildClientBackup,
		type ExportProgress,
		type ExportResult,
	} from '$lib/data/backup/v2/export';
	import {
		applyClientBackup,
		type ImportProgress,
		type ImportResult,
	} from '$lib/data/backup/v2/import';
	import { readBackup, type BackupManifestV2 } from '$lib/data/backup/v2/format';
	import { PassphraseError } from '$lib/data/backup/v2/passphrase';

	// ─── Module-Auswahl ────────────────────────────────────
	//
	// Label-Lookup aus der App-Registry, Fallback auf appId wenn kein
	// Display-Name bekannt ist. Core-AppIds (mana, tags, links, timeblocks)
	// bekommen ein festes Label weil sie nicht in MANA_APPS stehen.
	const CORE_LABELS: Record<string, string> = {
		mana: 'Kern (User-Settings, Dashboard)',
		tags: 'Tags',
		links: 'Cross-Module-Links',
		timeblocks: 'Zeitblöcke',
		ai: 'KI-Missionen',
	};

	interface AppOption {
		appId: string;
		label: string;
	}

	const options: AppOption[] = MODULE_CONFIGS.map((mod) => {
		const app = MANA_APPS.find((a) => a.id === mod.appId);
		const label = app?.name ?? CORE_LABELS[mod.appId] ?? mod.appId;
		return { appId: mod.appId, label };
	}).sort((a, b) => a.label.localeCompare(b.label, 'de'));

	let allSelected = $state(true);
	let selectedIds = $state<Set<string>>(new Set(options.map((o) => o.appId)));

	function toggleAll() {
		allSelected = !allSelected;
		selectedIds = new Set(allSelected ? options.map((o) => o.appId) : []);
	}

	function toggleOne(id: string) {
		const next = new Set(selectedIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedIds = next;
		allSelected = next.size === options.length;
	}

	// ─── Passphrase-Toggle (Export) ─────────────────────────
	let usePassphrase = $state(false);
	let exportPassphrase = $state('');
	let exportPassphraseConfirm = $state('');

	const passphraseError = $derived.by(() => {
		if (!usePassphrase) return null;
		if (exportPassphrase.length < 12) return 'Mindestens 12 Zeichen';
		if (exportPassphrase !== exportPassphraseConfirm) return 'Passphrasen stimmen nicht überein';
		return null;
	});

	// ─── Export ─────────────────────────────────────────────
	let exportBusy = $state(false);
	let exportError = $state<string | null>(null);
	let exportProgress = $state<ExportProgress | null>(null);
	let exportResult = $state<ExportResult | null>(null);

	async function handleExport() {
		if (exportBusy) return;
		if (selectedIds.size === 0) {
			exportError = 'Mindestens ein Modul auswählen';
			return;
		}
		if (usePassphrase && passphraseError) {
			exportError = passphraseError;
			return;
		}

		exportBusy = true;
		exportError = null;
		exportResult = null;
		exportProgress = null;

		try {
			const result = await buildClientBackup({
				appIds: allSelected ? undefined : [...selectedIds],
				passphrase: usePassphrase ? exportPassphrase : undefined,
				onProgress: (p) => (exportProgress = p),
			});
			exportResult = result;
			triggerDownload(result.blob, result.filename);
			exportPassphrase = '';
			exportPassphraseConfirm = '';
		} catch (e) {
			exportError = e instanceof Error ? e.message : 'Export fehlgeschlagen';
		} finally {
			exportBusy = false;
		}
	}

	function triggerDownload(blob: Blob, filename: string) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	// ─── Import ─────────────────────────────────────────────
	let importInput = $state<HTMLInputElement | null>(null);
	let importBusy = $state(false);
	let importError = $state<string | null>(null);
	let importProgress = $state<ImportProgress | null>(null);
	let importResult = $state<ImportResult | null>(null);

	/** Wenn das File passphrase-gesealed ist, halten wir es hier zwischen
	 *  User-Auswahl und Passphrase-Eingabe. */
	let pendingSealedFile = $state<File | null>(null);
	let pendingSealedManifest = $state<BackupManifestV2 | null>(null);
	let importPassphrase = $state('');

	async function handleImportFile(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;

		importBusy = true;
		importError = null;
		importResult = null;
		importProgress = null;

		try {
			// Peek into the manifest before running the full apply — if
			// sealed, we need to collect a passphrase first.
			const parsed = await readBackup(file);
			if ('sealedData' in parsed) {
				pendingSealedFile = file;
				pendingSealedManifest = parsed.manifest;
				importBusy = false;
				return;
			}
			await runImport(file);
		} catch (e) {
			importError = e instanceof Error ? e.message : 'Import fehlgeschlagen';
			importBusy = false;
		}
	}

	async function runImport(file: File, passphrase?: string) {
		importBusy = true;
		importError = null;
		try {
			const result = await applyClientBackup(file, {
				passphrase,
				onProgress: (p) => (importProgress = p),
			});
			importResult = result;
			pendingSealedFile = null;
			pendingSealedManifest = null;
			importPassphrase = '';
		} catch (e) {
			if (e instanceof PassphraseError) {
				importError = e.message;
			} else {
				importError = e instanceof Error ? e.message : 'Import fehlgeschlagen';
			}
		} finally {
			importBusy = false;
		}
	}

	async function confirmSealedImport() {
		if (!pendingSealedFile || !importPassphrase) return;
		await runImport(pendingSealedFile, importPassphrase);
	}

	function cancelSealedImport() {
		pendingSealedFile = null;
		pendingSealedManifest = null;
		importPassphrase = '';
		importBusy = false;
	}

	function labelForExportPhase(p: ExportProgress): string {
		switch (p.phase) {
			case 'collecting':
				return p.currentTable
					? `Sammle Daten (${p.tablesProcessed}/${p.totalTables}) — ${p.currentTable}`
					: `Sammle Daten (${p.tablesProcessed}/${p.totalTables})`;
			case 'packaging':
				return 'Packe Archiv…';
			case 'sealing':
				return 'Verschlüssele mit Passphrase…';
			case 'done':
				return 'Fertig.';
		}
	}

	function labelForImportPhase(p: ImportProgress): string {
		switch (p.phase) {
			case 'parsing':
				return 'Archiv wird entpackt…';
			case 'unsealing':
				return 'Entschlüssele mit Passphrase…';
			case 'applying':
				return p.currentTable
					? `Wende Daten an (${p.tablesProcessed}/${p.totalTables}) — ${p.currentTable}`
					: `Wende Daten an (${p.tablesProcessed}/${p.totalTables})`;
			case 'done':
				return 'Fertig.';
		}
	}
</script>

<SettingsPanel id="export-import">
	<SettingsSectionHeader
		icon={DownloadSimple}
		title="Export & Import"
		description="Deine Daten als portable .mana-Datei — alles oder einzelne Module, optional mit Passphrase"
		tone="indigo"
	/>

	<!-- Modul-Auswahl -->
	<div class="section">
		<div class="section-head">
			<h4>Module</h4>
			<button type="button" class="link-btn" onclick={toggleAll}>
				{allSelected ? 'Alles abwählen' : 'Alles wählen'}
			</button>
		</div>
		<div class="chip-grid">
			{#each options as opt (opt.appId)}
				<label class="chip" class:active={selectedIds.has(opt.appId)}>
					<input
						type="checkbox"
						checked={selectedIds.has(opt.appId)}
						onchange={() => toggleOne(opt.appId)}
					/>
					<span>{opt.label}</span>
				</label>
			{/each}
		</div>
	</div>

	<!-- Passphrase -->
	<div class="section">
		<label class="toggle-row">
			<input type="checkbox" bind:checked={usePassphrase} />
			<span>Mit Passphrase verschlüsseln</span>
		</label>
		{#if usePassphrase}
			<div class="passphrase-fields">
				<input
					type="password"
					class="text-input"
					placeholder="Passphrase (min. 12 Zeichen)"
					bind:value={exportPassphrase}
					disabled={exportBusy}
					autocomplete="new-password"
				/>
				<input
					type="password"
					class="text-input"
					placeholder="Bestätigen"
					bind:value={exportPassphraseConfirm}
					disabled={exportBusy}
					autocomplete="new-password"
				/>
			</div>
			<p class="hint">
				Ohne Passphrase enthält die Datei die Daten im Klartext — bequem durchsuchbar, behandle sie
				wie persönliche Dokumente. Mit Passphrase wird der Inhalt AES-GCM-verschlüsselt
				(PBKDF2-SHA256, 600k Iterationen).
			</p>
			{#if passphraseError}
				<p class="error-text">{passphraseError}</p>
			{/if}
		{/if}
	</div>

	<!-- Actions -->
	<div class="actions">
		<button
			type="button"
			class="btn-primary"
			onclick={handleExport}
			disabled={exportBusy || selectedIds.size === 0 || (usePassphrase && passphraseError !== null)}
		>
			<DownloadSimple size={16} weight="bold" />
			<span>{exportBusy ? 'Exportiere…' : 'Exportieren'}</span>
		</button>
		<button
			type="button"
			class="btn-secondary"
			onclick={() => importInput?.click()}
			disabled={importBusy}
		>
			<UploadSimple size={16} weight="bold" />
			<span>Datei importieren…</span>
		</button>
	</div>

	<input
		bind:this={importInput}
		type="file"
		accept=".mana,application/zip,application/octet-stream"
		onchange={handleImportFile}
		disabled={importBusy}
		class="hidden-input"
	/>

	<!-- Export-Progress + Error + Result -->
	{#if exportProgress}
		<div class="progress-block">
			<p class="progress-label">{labelForExportPhase(exportProgress)}</p>
			{#if exportProgress.totalTables > 0}
				<div class="progress-bar">
					<div
						class="progress-fill"
						style="width: {Math.min(
							100,
							Math.round((exportProgress.tablesProcessed / exportProgress.totalTables) * 100)
						)}%"
					></div>
				</div>
			{/if}
		</div>
	{/if}
	{#if exportError}
		<p class="error-text">
			<WarningCircle size={14} weight="fill" />
			{exportError}
		</p>
	{/if}
	{#if exportResult && !exportBusy}
		<p class="success-text">
			<CheckCircle size={14} weight="fill" />
			{Object.values(exportResult.rowCounts)
				.reduce((a, b) => a + b, 0)
				.toLocaleString('de-DE')} Rows aus {Object.keys(exportResult.rowCounts).length} Tabellen exportiert
			—
			{exportResult.filename}
		</p>
	{/if}

	<!-- Passphrase-Prompt bei gesealtem Import -->
	{#if pendingSealedFile && pendingSealedManifest}
		<div class="seal-prompt">
			<p class="seal-headline">Passphrase-geschützes Archiv</p>
			<p class="seal-desc">
				Diese Datei wurde mit einer Passphrase verschlüsselt. Gib sie ein um mit dem Import
				fortzufahren.
			</p>
			<input
				type="password"
				class="text-input"
				placeholder="Passphrase"
				bind:value={importPassphrase}
				disabled={importBusy}
				onkeydown={(e) => {
					if (e.key === 'Enter' && importPassphrase) confirmSealedImport();
				}}
			/>
			<div class="seal-actions">
				<button
					type="button"
					class="btn-primary"
					onclick={confirmSealedImport}
					disabled={importBusy || !importPassphrase}
				>
					{importBusy ? 'Entschlüssele…' : 'Entschlüsseln & Importieren'}
				</button>
				<button
					type="button"
					class="btn-secondary"
					onclick={cancelSealedImport}
					disabled={importBusy}
				>
					Abbrechen
				</button>
			</div>
		</div>
	{/if}

	<!-- Import-Progress + Error + Result -->
	{#if importProgress}
		<div class="progress-block">
			<p class="progress-label">{labelForImportPhase(importProgress)}</p>
			{#if importProgress.totalTables > 0}
				<div class="progress-bar">
					<div
						class="progress-fill"
						style="width: {Math.min(
							100,
							Math.round((importProgress.tablesProcessed / importProgress.totalTables) * 100)
						)}%"
					></div>
				</div>
			{/if}
		</div>
	{/if}
	{#if importError}
		<p class="error-text">
			<WarningCircle size={14} weight="fill" />
			{importError}
		</p>
	{/if}
	{#if importResult && !importBusy}
		<p class="success-text">
			<CheckCircle size={14} weight="fill" />
			{importResult.totalApplied.toLocaleString('de-DE')} Rows aus {Object.keys(
				importResult.appliedPerTable
			).length} Tabellen eingespielt{#if importResult.skippedTables.length > 0}
				· {importResult.skippedTables.length} Tabelle(n) übersprungen (nicht im aktuellen Build)
			{/if}
		</p>
	{/if}
</SettingsPanel>

<style>
	.section {
		margin: 1rem 0;
	}
	.section-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 0.5rem;
	}
	.section-head h4 {
		margin: 0;
		font-size: 0.88rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.link-btn {
		background: transparent;
		border: none;
		color: hsl(var(--color-primary));
		cursor: pointer;
		font-size: 0.82rem;
		padding: 0;
	}
	.link-btn:hover {
		text-decoration: underline;
	}
	.chip-grid {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface) / 0.6);
		color: hsl(var(--color-foreground));
		font-size: 0.85rem;
		cursor: pointer;
	}
	.chip:hover {
		border-color: hsl(var(--color-border) / 1);
	}
	.chip.active {
		background: hsl(var(--color-primary) / 0.12);
		border-color: hsl(var(--color-primary) / 0.5);
		color: hsl(var(--color-primary));
	}
	.chip input {
		/* Checkbox visuell unterdrücken — das Chip-Styling erfüllt die Affordance. */
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	.toggle-row {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		cursor: pointer;
		font-size: 0.92rem;
	}
	.passphrase-fields {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		margin-top: 0.6rem;
	}
	.text-input {
		padding: 0.5rem 0.75rem;
		border-radius: 0.45rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		color: hsl(var(--color-foreground));
		font: inherit;
		font-size: 0.92rem;
	}
	.text-input:focus {
		outline: 2px solid hsl(var(--color-primary) / 0.5);
		outline-offset: 1px;
	}
	.hint {
		margin: 0.5rem 0 0 0;
		font-size: 0.82rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.5;
	}
	.actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
		flex-wrap: wrap;
	}
	.btn-primary,
	.btn-secondary {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font: inherit;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 120ms ease;
	}
	.btn-primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border: 1px solid hsl(var(--color-primary));
	}
	.btn-primary:hover:not(:disabled) {
		background: hsl(var(--color-primary) / 0.9);
	}
	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.btn-secondary {
		background: transparent;
		color: hsl(var(--color-foreground));
		border: 1px solid hsl(var(--color-border));
	}
	.btn-secondary:hover:not(:disabled) {
		border-color: hsl(var(--color-foreground) / 0.35);
	}
	.btn-secondary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.hidden-input {
		display: none;
	}
	.progress-block {
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-surface) / 0.5);
		border: 1px solid hsl(var(--color-border));
	}
	.progress-label {
		margin: 0 0 0.4rem 0;
		font-size: 0.85rem;
		color: hsl(var(--color-muted-foreground));
	}
	.progress-bar {
		height: 4px;
		background: hsl(var(--color-border));
		border-radius: 999px;
		overflow: hidden;
	}
	.progress-fill {
		height: 100%;
		background: hsl(var(--color-primary));
		transition: width 200ms ease;
	}
	.error-text {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-top: 0.75rem;
		color: hsl(var(--color-error));
		font-size: 0.88rem;
	}
	.success-text {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-top: 0.75rem;
		color: hsl(var(--color-success));
		font-size: 0.88rem;
	}
	.seal-prompt {
		margin-top: 1rem;
		padding: 1rem;
		border-radius: 0.6rem;
		border: 1px solid hsl(var(--color-primary) / 0.4);
		background: hsl(var(--color-primary) / 0.06);
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.seal-headline {
		margin: 0;
		font-weight: 600;
		font-size: 0.95rem;
	}
	.seal-desc {
		margin: 0;
		font-size: 0.85rem;
		color: hsl(var(--color-muted-foreground));
	}
	.seal-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
</style>
