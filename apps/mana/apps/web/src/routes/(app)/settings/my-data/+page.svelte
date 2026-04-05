<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Card, PageHeader } from '@mana/shared-ui';
	import {
		QrCode,
		DownloadSimple,
		Info,
		ShieldCheck,
		CurrencyCircleDollar,
		Clock,
		Warning,
		CheckCircle,
		WarningCircle,
	} from '@mana/shared-icons';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import StatCard from '$lib/components/admin/StatCard.svelte';
	import ProjectDataCard from '$lib/components/admin/ProjectDataCard.svelte';
	import DeleteConfirmationModal from '$lib/components/my-data/DeleteConfirmationModal.svelte';
	import QRExportModal from '$lib/components/my-data/QRExportModal.svelte';
	import { myDataService, type UserDataSummary } from '$lib/api/services/my-data';
	import type { DeleteUserDataResponse } from '$lib/api/services/admin';
	import { authStore } from '$lib/stores/auth.svelte';

	let userData = $state<UserDataSummary | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let exporting = $state(false);

	// Delete dialog state
	let showDeleteDialog = $state(false);
	let deleting = $state(false);
	let deleteResult = $state<DeleteUserDataResponse | null>(null);
	let deleteError = $state<string | null>(null);

	// QR Export dialog state
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
			// Could show toast here
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
			// After successful deletion, sign out and redirect
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

	onMount(() => {
		loadMyData();
	});
</script>

<svelte:head>
	<title>Meine Daten - Einstellungen</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between gap-4">
		<div>
			<Breadcrumbs
				items={[{ label: 'Einstellungen', href: '/settings' }, { label: 'Meine Daten' }]}
			/>
			<h1 class="text-2xl font-bold">Meine Daten</h1>
			<p class="text-muted-foreground">
				Ubersicht uber alle deine gespeicherten Daten (GDPR/DSGVO)
			</p>
		</div>
		{#if userData}
			<div class="flex items-center gap-2">
				<button
					onclick={() => (showQRDialog = true)}
					class="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
					title="Als QR-Code exportieren"
				>
					<QrCode size={16} />
					<span>QR-Code</span>
				</button>
				<button
					onclick={handleExport}
					disabled={exporting}
					class="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
				>
					{#if exporting}
						<svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
					{:else}
						<DownloadSimple size={16} />
					{/if}
					<span>{exporting ? 'Exportiere...' : 'Daten exportieren'}</span>
				</button>
			</div>
		{/if}
	</div>

	<!-- DSGVO Info Banner -->
	<div
		class="rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 p-4"
	>
		<div class="flex items-start gap-3">
			<Info size={20} class="text-blue-500 mt-0.5 shrink-0" />
			<div class="flex-1">
				<p class="text-sm text-blue-800 dark:text-blue-200">
					Hier siehst du alle Daten, die wir uber dich speichern. Mehr Informationen findest du in
					unserer
					<a
						href="https://mana-landing.pages.dev/datenschutz"
						target="_blank"
						rel="noopener"
						class="underline font-medium hover:text-blue-600"
					>
						Datenschutzerklarung
					</a>. Wir verwenden <strong>keine Tracking-Cookies</strong> – unsere Analyse erfolgt vollstandig
					anonym via Umami.
				</p>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			{#each Array(4) as _}
				<div class="rounded-lg border bg-card p-6 shadow-sm animate-pulse">
					<div class="h-4 bg-muted rounded w-20 mb-2"></div>
					<div class="h-8 bg-muted rounded w-16"></div>
				</div>
			{/each}
		</div>
	{:else if error}
		<div
			class="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-6 text-center"
		>
			<p class="text-red-600 dark:text-red-400 mb-4">{error}</p>
			<button
				onclick={loadMyData}
				class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
			>
				Erneut versuchen
			</button>
		</div>
	{:else if userData}
		<!-- User Info Card -->
		<Card>
			<div class="p-6">
				<div class="flex items-start gap-4">
					<div class="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
						<span class="text-2xl font-bold text-primary">
							{(userData.user.name || userData.user.email)[0].toUpperCase()}
						</span>
					</div>
					<div class="flex-1">
						<h2 class="text-xl font-semibold">{userData.user.name || 'Kein Name'}</h2>
						<p class="text-muted-foreground">{userData.user.email}</p>
						<div class="flex items-center gap-4 mt-2">
							<span
								class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
								{userData.user.role === 'admin'
									? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
									: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}"
							>
								{userData.user.role}
							</span>
							{#if userData.user.emailVerified}
								<span class="text-xs text-green-600 flex items-center gap-1">
									<CheckCircle size={12} weight="fill" />
									Email verifiziert
								</span>
							{:else}
								<span class="text-xs text-yellow-600 flex items-center gap-1">
									<WarningCircle size={12} weight="fill" />
									Email nicht verifiziert
								</span>
							{/if}
						</div>
						<p class="text-xs text-muted-foreground mt-2">
							Registriert am {formatDate(userData.user.createdAt)}
						</p>
					</div>
				</div>
			</div>
		</Card>

		<!-- Stats Overview -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<StatCard title="Gesamt-Entitaten" value={userData.totals.totalEntities} icon="chart" />
			<StatCard
				title="Projekte mit Daten"
				value="{userData.totals.projectsWithData} / {userData.projects.length}"
				icon="activity"
			/>
			<StatCard title="Credits" value={userData.credits.balance} icon="chart" />
			<StatCard title="Sessions" value={userData.auth.sessionsCount} icon="users" />
		</div>

		<!-- Auth & Credits Details -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Auth Data -->
			<Card>
				<div class="p-6">
					<h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
						<ShieldCheck size={20} class="text-blue-500" />
						Authentifizierung
					</h3>
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-sm text-muted-foreground">Aktive Sessions</span>
							<span class="font-mono">{userData.auth.sessionsCount}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-muted-foreground">Verknupfte Accounts</span>
							<span class="font-mono">{userData.auth.accountsCount}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-muted-foreground">2FA aktiviert</span>
							<span class={userData.auth.has2FA ? 'text-green-500' : 'text-muted-foreground'}>
								{userData.auth.has2FA ? 'Ja' : 'Nein'}
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-muted-foreground">Letzter Login</span>
							<span class="text-sm">
								{userData.auth.lastLoginAt ? formatDate(userData.auth.lastLoginAt) : '-'}
							</span>
						</div>
					</div>
				</div>
			</Card>

			<!-- Credits Data -->
			<Card>
				<div class="p-6">
					<h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
						<CurrencyCircleDollar size={20} class="text-yellow-500" />
						Credits
					</h3>
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-sm text-muted-foreground">Aktueller Stand</span>
							<span class="font-mono font-bold text-lg">{userData.credits.balance}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-muted-foreground">Gesamt verdient</span>
							<span class="font-mono text-green-600">+{userData.credits.totalEarned}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-muted-foreground">Gesamt ausgegeben</span>
							<span class="font-mono text-red-500">-{userData.credits.totalSpent}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-muted-foreground">Transaktionen</span>
							<span class="font-mono">{userData.credits.transactionsCount}</span>
						</div>
					</div>
				</div>
			</Card>
		</div>

		<!-- Project Data -->
		<div>
			<h3 class="text-lg font-semibold mb-4">Projektdaten</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each userData.projects as project}
					<ProjectDataCard {project} />
				{/each}
			</div>
		</div>

		<!-- Aufbewahrungsfristen -->
		<Card>
			<div class="p-6">
				<h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
					<Clock size={20} class="text-gray-500" />
					Aufbewahrungsfristen
				</h3>
				<p class="text-sm text-muted-foreground mb-4">So lange speichern wir deine Daten:</p>
				<div class="space-y-2 text-sm">
					<div class="flex justify-between py-2 border-b">
						<span>Benutzerkonto & Profil</span>
						<span class="text-muted-foreground">Bis zur Loschung</span>
					</div>
					<div class="flex justify-between py-2 border-b">
						<span>Sessions & Login-Historie</span>
						<span class="text-muted-foreground">90 Tage nach Ablauf</span>
					</div>
					<div class="flex justify-between py-2 border-b">
						<span>Credit-Transaktionen</span>
						<span class="text-muted-foreground">10 Jahre (gesetzlich)</span>
					</div>
					<div class="flex justify-between py-2 border-b">
						<span>Security-Logs</span>
						<span class="text-muted-foreground">1 Jahr</span>
					</div>
					<div class="flex justify-between py-2">
						<span>Projektdaten (Chat, Todo, etc.)</span>
						<span class="text-muted-foreground">Bis zur Loschung</span>
					</div>
				</div>
			</div>
		</Card>

		<!-- Danger Zone -->
		<Card>
			<div class="p-6 border-t-4 border-red-500">
				<div class="flex items-center gap-3 mb-4">
					<div
						class="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
					>
						<Warning size={20} class="text-red-600" />
					</div>
					<div>
						<h3 class="text-lg font-semibold text-red-600">Gefahrenzone</h3>
						<p class="text-sm text-muted-foreground">Diese Aktionen sind unwiderruflich</p>
					</div>
				</div>

				<div
					class="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-4"
				>
					<div class="flex items-center justify-between">
						<div>
							<p class="font-medium text-red-700 dark:text-red-400">Alle meine Daten loschen</p>
							<p class="text-sm text-muted-foreground mt-1">
								Loscht dein Konto und alle damit verbundenen Daten dauerhaft aus allen Projekten.
								Diese Aktion kann nicht ruckgangig gemacht werden.
							</p>
						</div>
						<button
							onclick={() => (showDeleteDialog = true)}
							class="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
						>
							Daten loschen
						</button>
					</div>
				</div>
			</div>
		</Card>
	{/if}
</div>

<!-- Delete Confirmation Modal -->
<DeleteConfirmationModal
	show={showDeleteDialog}
	userEmail={userData?.user.email || ''}
	{deleting}
	{deleteResult}
	{deleteError}
	onConfirm={handleDelete}
	onClose={handleDeleteModalClose}
/>

<!-- QR Export Modal -->
<QRExportModal show={showQRDialog} {userData} onClose={() => (showQRDialog = false)} />
