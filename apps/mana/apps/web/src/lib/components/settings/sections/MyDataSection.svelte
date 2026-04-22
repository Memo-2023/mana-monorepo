<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		QrCode,
		DownloadSimple,
		UploadSimple,
		ShieldCheck,
		CurrencyCircleDollar,
		Clock,
		Warning,
		CheckCircle,
		WarningCircle,
		FolderOpen,
		FileText,
	} from '@mana/shared-icons';
	import SettingsPanel from '../SettingsPanel.svelte';
	import SettingsSectionHeader from '../SettingsSectionHeader.svelte';
	import { getApp } from '$lib/app-registry';
	import DeleteConfirmationModal from '$lib/components/my-data/DeleteConfirmationModal.svelte';
	import QRExportModal from '$lib/components/my-data/QRExportModal.svelte';
	import { myDataService, type UserDataSummary } from '$lib/api/services/my-data';
	import ExportImportPanel from '$lib/components/my-data/ExportImportPanel.svelte';
	import type { DeleteUserDataResponse } from '$lib/api/services/admin';
	import { authStore } from '$lib/stores/auth.svelte';

	let userData = $state<UserDataSummary | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let exporting = $state(false);

	let showDeleteDialog = $state(false);
	let deleting = $state(false);
	let deleteResult = $state<DeleteUserDataResponse | null>(null);
	let deleteError = $state<string | null>(null);

	let showQRDialog = $state(false);

	async function loadMyData() {
		loading = true;
		error = null;

		const result = await myDataService.getMyData();

		if (result.error) {
			error = result.error;
			userData = null;
		} else {
			userData = result.data;
		}

		loading = false;
	}

	async function handleExport() {
		exporting = true;
		try {
			await myDataService.downloadMyData();
		} catch (e) {
			console.error('Export failed:', e);
		} finally {
			exporting = false;
		}
	}

	async function handleDelete() {
		deleting = true;
		deleteError = null;

		const result = await myDataService.deleteMyData();

		if (result.error) {
			deleteError = result.error;
		} else {
			deleteResult = result.data;
		}

		deleting = false;
	}

	async function handleDeleteModalClose() {
		if (deleteResult) {
			await authStore.signOut();
			goto('/');
		} else {
			showDeleteDialog = false;
			deleteError = null;
		}
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	function formatNum(n: number): string {
		return n.toLocaleString('de-DE');
	}

	function formatRelativeTime(dateStr: string | undefined): string {
		if (!dateStr) return '—';
		const diffMs = Date.now() - new Date(dateStr).getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);
		if (diffMins < 1) return 'gerade eben';
		if (diffMins < 60) return `vor ${diffMins} Min`;
		if (diffHours < 24) return `vor ${diffHours} Std`;
		if (diffDays < 7) return `vor ${diffDays} Tagen`;
		return new Date(dateStr).toLocaleDateString('de-DE');
	}

	onMount(() => {
		loadMyData();
	});
</script>

<!-- Profil & Konto ────────────────────────────────────────── -->
<SettingsPanel id="my-data">
	<SettingsSectionHeader
		icon={FileText}
		title="Meine Daten (DSGVO)"
		description="Übersicht über alle deine gespeicherten Daten"
		tone="purple"
	>
		{#snippet action()}
			{#if userData}
				<div class="header-actions">
					<button
						type="button"
						class="btn-ghost"
						onclick={() => (showQRDialog = true)}
						title="Als QR-Code exportieren"
					>
						<QrCode size={14} />
						<span>QR</span>
					</button>
					<button type="button" class="btn-primary-sm" onclick={handleExport} disabled={exporting}>
						<DownloadSimple size={14} />
						<span>{exporting ? 'Exportiere…' : 'Exportieren'}</span>
					</button>
				</div>
			{/if}
		{/snippet}
	</SettingsSectionHeader>

	{#if loading}
		<div class="spinner-wrap"><div class="spinner"></div></div>
	{:else if error}
		<div class="error-state">
			<p class="error-text">{error}</p>
			<button type="button" class="btn-primary-sm" onclick={loadMyData}> Erneut versuchen </button>
		</div>
	{:else if userData}
		<div class="rows">
			<div class="row user-row">
				<div class="avatar">
					<span>{(userData.user.name || userData.user.email)[0].toUpperCase()}</span>
				</div>
				<div class="row-info">
					<p class="row-title">{userData.user.name || 'Kein Name'}</p>
					<p class="row-desc">{userData.user.email}</p>
				</div>
				<div class="badges">
					<span class="badge role-{userData.user.role}">{userData.user.role}</span>
					{#if userData.user.emailVerified}
						<span class="badge success">
							<CheckCircle size={12} weight="fill" />
							verifiziert
						</span>
					{:else}
						<span class="badge warn">
							<WarningCircle size={12} weight="fill" />
							nicht verifiziert
						</span>
					{/if}
				</div>
			</div>

			<div class="row">
				<div class="row-info">
					<p class="row-title">Registriert am</p>
				</div>
				<span class="row-meta">{formatDate(userData.user.createdAt)}</span>
			</div>

			<div class="row">
				<div class="row-info">
					<p class="row-title">Gesamt-Entitäten</p>
					<p class="row-desc">Datensätze über alle Apps hinweg</p>
				</div>
				<span class="value">{formatNum(userData.totals.totalEntities)}</span>
			</div>

			<div class="row">
				<div class="row-info">
					<p class="row-title">Projekte mit Daten</p>
				</div>
				<span class="value">
					{userData.totals.projectsWithData} / {userData.projects.length}
				</span>
			</div>
		</div>

		<p class="footnote">
			Keine Tracking-Cookies — anonyme Analyse via Umami. Details in der
			<a
				href="https://mana-landing.pages.dev/datenschutz"
				target="_blank"
				rel="noopener"
				class="inline-link">Datenschutzerklärung</a
			>.
		</p>
	{/if}
</SettingsPanel>

{#if userData}
	<!-- Authentifizierung ──────────────────────────────────── -->
	<SettingsPanel id="auth-data">
		<SettingsSectionHeader
			icon={ShieldCheck}
			title="Authentifizierung"
			description="Sessions, Accounts & 2FA"
			tone="blue"
		/>
		<div class="rows">
			<div class="row">
				<div class="row-info"><p class="row-title">Aktive Sessions</p></div>
				<span class="value">{userData.auth.sessionsCount}</span>
			</div>
			<div class="row">
				<div class="row-info"><p class="row-title">Verknüpfte Accounts</p></div>
				<span class="value">{userData.auth.accountsCount}</span>
			</div>
			<div class="row">
				<div class="row-info"><p class="row-title">Zwei-Faktor (2FA)</p></div>
				<span class="badge" class:success={userData.auth.has2FA}>
					{userData.auth.has2FA ? 'Aktiviert' : 'Deaktiviert'}
				</span>
			</div>
			<div class="row">
				<div class="row-info"><p class="row-title">Letzter Login</p></div>
				<span class="row-meta">
					{userData.auth.lastLoginAt ? formatDate(userData.auth.lastLoginAt) : '—'}
				</span>
			</div>
		</div>
	</SettingsPanel>

	<!-- Credits ────────────────────────────────────────────── -->
	<SettingsPanel id="credits-data">
		<SettingsSectionHeader
			icon={CurrencyCircleDollar}
			title="Credits"
			description="Guthaben & Transaktionen"
			tone="yellow"
		/>
		<div class="rows">
			<div class="row">
				<div class="row-info"><p class="row-title">Aktueller Stand</p></div>
				<span class="value emphasized">{formatNum(userData.credits.balance)}</span>
			</div>
			<div class="row">
				<div class="row-info"><p class="row-title">Gesamt verdient</p></div>
				<span class="value success-text">+{formatNum(userData.credits.totalEarned)}</span>
			</div>
			<div class="row">
				<div class="row-info"><p class="row-title">Gesamt ausgegeben</p></div>
				<span class="value danger-text">−{formatNum(userData.credits.totalSpent)}</span>
			</div>
			<div class="row">
				<div class="row-info"><p class="row-title">Transaktionen</p></div>
				<span class="value">{userData.credits.transactionsCount}</span>
			</div>
		</div>
	</SettingsPanel>

	<!-- Projektdaten ───────────────────────────────────────── -->
	<SettingsPanel id="project-data">
		<SettingsSectionHeader
			icon={FolderOpen}
			title="Projektdaten"
			description="Datensätze pro App"
		/>
		<table class="project-table">
			<thead>
				<tr>
					<th class="col-app">App</th>
					<th class="col-num">Einträge</th>
					<th class="col-time">Letzte Aktivität</th>
				</tr>
			</thead>
			<tbody>
				{#each userData.projects as project (project.projectId)}
					{@const AppIcon = getApp(project.projectId)?.icon}
					<tr class:unavailable={!project.available}>
						<td class="col-app">
							<div class="app-cell">
								<span
									class="dot"
									class:active={project.available && project.totalCount > 0}
									class:empty={project.available && project.totalCount === 0}
									class:error={!project.available}
									title={project.available
										? project.totalCount > 0
											? 'Aktiv'
											: 'Keine Daten'
										: project.error || 'Nicht verfügbar'}
								></span>
								<span class="app-icon">
									{#if AppIcon}
										<AppIcon size={16} weight="regular" />
									{:else}
										{project.icon}
									{/if}
								</span>
								<span class="app-name">{project.projectName}</span>
							</div>
						</td>
						<td class="col-num">
							{#if project.available}
								{formatNum(project.totalCount)}
							{:else}
								<span class="muted">—</span>
							{/if}
						</td>
						<td class="col-time">
							{#if project.available}
								<span class="muted">{formatRelativeTime(project.lastActivityAt)}</span>
							{:else}
								<span class="muted err">{project.error || 'nicht erreichbar'}</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</SettingsPanel>

	<!-- Aufbewahrungsfristen ───────────────────────────────── -->
	<SettingsPanel id="retention">
		<SettingsSectionHeader
			icon={Clock}
			title="Aufbewahrungsfristen"
			description="Wie lange wir deine Daten speichern"
		/>
		<div class="rows">
			<div class="row">
				<div class="row-info"><p class="row-title">Benutzerkonto & Profil</p></div>
				<span class="row-meta">Bis zur Löschung</span>
			</div>
			<div class="row">
				<div class="row-info"><p class="row-title">Sessions & Login-Historie</p></div>
				<span class="row-meta">90 Tage nach Ablauf</span>
			</div>
			<div class="row">
				<div class="row-info"><p class="row-title">Credit-Transaktionen</p></div>
				<span class="row-meta">10 Jahre (gesetzlich)</span>
			</div>
			<div class="row">
				<div class="row-info"><p class="row-title">Security-Logs</p></div>
				<span class="row-meta">1 Jahr</span>
			</div>
			<div class="row">
				<div class="row-info"><p class="row-title">Projektdaten (Chat, Todo, …)</p></div>
				<span class="row-meta">Bis zur Löschung</span>
			</div>
		</div>
	</SettingsPanel>

	<!-- Export & Import ─────────────────────────────────────── -->
	<ExportImportPanel />

	<!-- Gefahrenzone ───────────────────────────────────────── -->
	<SettingsPanel id="danger-zone">
		<SettingsSectionHeader
			icon={Warning}
			title="Gefahrenzone"
			description="Unwiderrufliche Aktionen"
			tone="red"
		/>
		<div class="rows">
			<div class="row">
				<div class="row-info">
					<p class="row-title">Alle meine Daten löschen</p>
					<p class="row-desc">
						Löscht dein Konto und alle verbundenen Daten dauerhaft aus allen Projekten. Kann nicht
						rückgängig gemacht werden.
					</p>
				</div>
				<button type="button" class="btn-danger" onclick={() => (showDeleteDialog = true)}>
					Daten löschen
				</button>
			</div>
		</div>
	</SettingsPanel>
{/if}

<DeleteConfirmationModal
	show={showDeleteDialog}
	userEmail={userData?.user.email || ''}
	{deleting}
	{deleteResult}
	{deleteError}
	onConfirm={handleDelete}
	onClose={handleDeleteModalClose}
/>

<QRExportModal show={showQRDialog} {userData} onClose={() => (showQRDialog = false)} />

<style>
	.rows {
		display: flex;
		flex-direction: column;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.row:last-child {
		border-bottom: none;
	}

	.row-info {
		min-width: 0;
		flex: 1;
	}

	.row-title {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}

	.row-desc {
		margin: 0;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.row-meta {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
	}

	.inline-link {
		color: hsl(var(--color-primary));
		text-decoration: none;
	}

	.inline-link:hover {
		text-decoration: underline;
	}

	/* User row with avatar */
	.user-row {
		gap: 0.875rem;
	}

	.avatar {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 9999px;
		background: hsl(var(--color-primary) / 0.12);
		color: hsl(var(--color-primary));
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.badges {
		display: flex;
		gap: 0.375rem;
		flex-shrink: 0;
	}

	/* Badges */
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.2rem 0.5rem;
		font-size: 0.6875rem;
		font-weight: 600;
		border-radius: 9999px;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
		text-transform: lowercase;
		letter-spacing: 0.01em;
	}

	.badge.success {
		background: hsl(142 76% 36% / 0.12);
		color: hsl(142 71% 32%);
	}

	.badge.warn {
		background: hsl(38 92% 50% / 0.15);
		color: hsl(32 80% 38%);
	}

	.badge.role-admin {
		background: hsl(0 84% 60% / 0.12);
		color: hsl(0 72% 45%);
	}

	.badge.role-user {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
	}

	/* Values */
	.value {
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}

	.value.emphasized {
		font-size: 1.125rem;
	}

	.value.success-text {
		color: hsl(142 71% 32%);
	}

	.value.danger-text {
		color: hsl(0 72% 50%);
	}

	/* Header action buttons */
	.header-actions {
		display: flex;
		gap: 0.375rem;
		align-items: center;
	}

	.btn-ghost,
	.btn-primary-sm,
	.btn-secondary-sm {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		border-radius: 0.5rem;
		border: 1px solid transparent;
		cursor: pointer;
		transition: all 0.15s;
		white-space: nowrap;
	}

	.btn-ghost {
		background: transparent;
		border-color: hsl(var(--color-border));
		color: hsl(var(--color-foreground));
	}

	.btn-ghost:hover {
		background: hsl(var(--color-surface-hover));
	}

	.btn-primary-sm {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	.btn-primary-sm:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-secondary-sm {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.btn-secondary-sm:hover:not(:disabled) {
		background: hsl(var(--color-surface-hover));
	}

	.btn-primary-sm:disabled,
	.btn-secondary-sm:disabled,
	.btn-ghost:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-danger {
		padding: 0.5rem 0.875rem;
		font-size: 0.8125rem;
		font-weight: 600;
		border-radius: 0.5rem;
		background: transparent;
		border: 1px solid hsl(0 84% 60% / 0.4);
		color: hsl(0 72% 50%);
		cursor: pointer;
		transition: all 0.15s;
		flex-shrink: 0;
	}

	.btn-danger:hover {
		background: hsl(0 84% 60% / 0.08);
	}

	/* Project table — breaks out of the panel padding edge-to-edge */
	.project-table {
		width: calc(100% + 3rem);
		margin: 0 -1.5rem;
		table-layout: fixed;
		border-collapse: collapse;
		font-size: 0.8125rem;
	}

	@media (min-width: 640px) {
		.project-table {
			width: calc(100% + 3.5rem);
			margin: 0 -1.75rem;
		}
	}

	.project-table thead th {
		text-align: left;
		padding: 0.5rem 0.5rem 0.625rem;
		font-size: 0.6875rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.04em;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.project-table tbody td {
		padding: 0.5rem;
		border-bottom: 1px solid hsl(var(--color-border));
		vertical-align: middle;
	}

	.project-table thead th:first-child,
	.project-table tbody td:first-child {
		padding-left: 1.5rem;
	}

	.project-table thead th:last-child,
	.project-table tbody td:last-child {
		padding-right: 1.5rem;
	}

	@media (min-width: 640px) {
		.project-table thead th:first-child,
		.project-table tbody td:first-child {
			padding-left: 1.75rem;
		}
		.project-table thead th:last-child,
		.project-table tbody td:last-child {
			padding-right: 1.75rem;
		}
	}

	.project-table tbody tr:last-child td {
		border-bottom: none;
	}

	.project-table tbody tr:hover {
		background: hsl(var(--color-surface-hover) / 0.5);
	}

	.project-table tr.unavailable {
		opacity: 0.55;
	}

	.col-app {
		width: auto;
	}

	.app-cell {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}

	.col-num {
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-weight: 500;
		white-space: nowrap;
		width: 5rem;
	}

	.col-time {
		text-align: right;
		white-space: nowrap;
		width: 9rem;
	}

	.project-table th.col-num,
	.project-table th.col-time {
		text-align: right;
	}

	.dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 9999px;
		background: hsl(var(--color-border));
		flex-shrink: 0;
	}

	.dot.active {
		background: hsl(142 71% 45%);
	}

	.dot.empty {
		background: hsl(var(--color-muted-foreground) / 0.35);
	}

	.dot.error {
		background: hsl(0 72% 55%);
	}

	.app-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		font-size: 1rem;
		line-height: 1;
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
	}

	.app-name {
		font-weight: 500;
		color: hsl(var(--color-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.muted {
		color: hsl(var(--color-muted-foreground));
	}

	.muted.err {
		color: hsl(0 72% 50%);
	}

	/* Import progress */
	.hidden-input {
		display: none;
	}

	.import-progress {
		margin-top: 1rem;
	}

	.progress-label {
		margin: 0 0 0.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
	}

	.progress-bar {
		height: 0.375rem;
		background: hsl(var(--color-muted));
		border-radius: 9999px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: hsl(var(--color-primary));
		transition: width 0.2s;
	}

	/* States */
	.footnote {
		margin: 1.25rem 0 0;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--color-border));
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.5;
	}

	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 2rem 1rem;
	}

	.error-text {
		margin: 0.75rem 0 0;
		font-size: 0.8125rem;
		color: hsl(0 72% 50%);
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.success-text {
		margin: 0.75rem 0 0;
		font-size: 0.8125rem;
		color: hsl(142 71% 32%);
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.spinner-wrap {
		display: flex;
		justify-content: center;
		padding: 2.5rem 0;
	}

	.spinner {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		border: 3px solid hsl(var(--color-primary));
		border-top-color: transparent;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
