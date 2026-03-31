<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { CaretLeft, Check, Warning, CheckCircle, WarningCircle } from '@manacore/shared-icons';
	import StatCard from '$lib/components/admin/StatCard.svelte';
	import ProjectDataCard from '$lib/components/admin/ProjectDataCard.svelte';
	import {
		adminService,
		type UserDataSummary,
		type DeleteUserDataResponse,
	} from '$lib/api/services/admin';

	let userId = $derived($page.params.userId ?? '');
	let userData = $state<UserDataSummary | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Delete dialog state
	let showDeleteDialog = $state(false);
	let deleteConfirmEmail = $state('');
	let deleting = $state(false);
	let deleteResult = $state<DeleteUserDataResponse | null>(null);
	let deleteError = $state<string | null>(null);

	async function loadUserData() {
		if (!userId) {
			error = 'Keine Nutzer-ID angegeben';
			loading = false;
			return;
		}

		loading = true;
		error = null;

		const result = await adminService.getUserData(userId);

		if (result.error) {
			error = result.error;
			userData = null;
		} else {
			userData = result.data;
		}

		loading = false;
	}

	async function handleDelete() {
		if (!userData || !userId || deleteConfirmEmail !== userData.user.email) {
			return;
		}

		deleting = true;
		deleteError = null;

		const result = await adminService.deleteUserData(userId);

		if (result.error) {
			deleteError = result.error;
		} else {
			deleteResult = result.data;
		}

		deleting = false;
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
		loadUserData();
	});
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<button
			onclick={() => goto('/admin/user-data')}
			class="p-2 rounded-lg hover:bg-muted transition-colors"
			aria-label="Zuruck zur Nutzerliste"
		>
			<CaretLeft size={20} />
		</button>
		<div class="flex-1">
			<h1 class="text-2xl font-bold">Nutzerdaten</h1>
			<p class="text-muted-foreground">
				{userData?.user.email || 'Laden...'}
			</p>
		</div>
		{#if userData}
			<button
				onclick={() => (showDeleteDialog = true)}
				class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
			>
				Daten loschen
			</button>
		{/if}
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
				onclick={loadUserData}
				class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
			>
				Erneut versuchen
			</button>
		</div>
	{:else if userData}
		<!-- User Info Card -->
		<div class="rounded-lg border bg-card p-6 shadow-sm">
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

		<!-- Stats Overview -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<StatCard title="Gesamt-Entitaten" value={userData.totals.totalEntities} icon="chart" />
			<StatCard
				title="Projekte mit Daten"
				value="{userData.totals.projectsWithData} / {userData.projects.length}"
				icon="activity"
			/>
			<StatCard title="Credits" value={userData.credits.balance} icon="chart" />
			<StatCard title="Transaktionen" value={userData.credits.transactionsCount} icon="clock" />
		</div>

		<!-- Auth & Credits Details -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Auth Data -->
			<div class="rounded-lg border bg-card p-6 shadow-sm">
				<h3 class="text-lg font-semibold mb-4">Authentifizierung</h3>
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

			<!-- Credits Data -->
			<div class="rounded-lg border bg-card p-6 shadow-sm">
				<h3 class="text-lg font-semibold mb-4">Credits</h3>
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
	{/if}
</div>

<!-- Delete Confirmation Dialog -->
{#if showDeleteDialog}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-card rounded-xl shadow-xl max-w-md w-full">
			{#if deleteResult}
				<!-- Success State -->
				<div class="p-6">
					<div class="flex items-center gap-3 mb-4">
						<div
							class="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
						>
							<Check size={20} class="text-green-600" />
						</div>
						<h3 class="text-lg font-semibold">Loschung abgeschlossen</h3>
					</div>

					<p class="text-sm text-muted-foreground mb-4">
						Insgesamt wurden <strong>{deleteResult.totalDeleted}</strong> Eintrage geloscht.
					</p>

					<div class="space-y-2 mb-6">
						{#each deleteResult.deletedFromProjects as project}
							<div class="flex items-center justify-between text-sm">
								<span>{project.projectName}</span>
								{#if project.success}
									<span class="text-green-600">{project.deletedCount} geloscht</span>
								{:else}
									<span class="text-red-500">Fehler</span>
								{/if}
							</div>
						{/each}
						<div class="pt-2 border-t">
							<div class="flex items-center justify-between text-sm">
								<span>Sessions</span>
								<span>{deleteResult.deletedFromAuth.sessions}</span>
							</div>
							<div class="flex items-center justify-between text-sm">
								<span>Accounts</span>
								<span>{deleteResult.deletedFromAuth.accounts}</span>
							</div>
						</div>
					</div>

					<button
						onclick={() => goto('/admin/user-data')}
						class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
					>
						Zuruck zur Ubersicht
					</button>
				</div>
			{:else}
				<!-- Confirmation State -->
				<div class="p-6">
					<div class="flex items-center gap-3 mb-4">
						<div
							class="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
						>
							<Warning size={20} class="text-red-600" />
						</div>
						<h3 class="text-lg font-semibold text-red-600">Daten unwiderruflich loschen?</h3>
					</div>

					<p class="text-sm text-muted-foreground mb-4">
						Diese Aktion loscht <strong>alle Daten</strong> des Nutzers aus allen Projekten. Dies umfasst:
					</p>

					<ul class="text-sm text-muted-foreground mb-4 list-disc list-inside space-y-1">
						<li>Alle Projektdaten (Chat, Todo, Calendar, etc.)</li>
						<li>Alle Sessions und verknupften Accounts</li>
						<li>Credits und Transaktionshistorie</li>
						<li>Das Nutzerkonto selbst</li>
					</ul>

					<div class="mb-4">
						<label for="delete-confirm-email" class="block text-sm font-medium mb-2">
							Zur Bestätigung, geben Sie die Email-Adresse ein:
						</label>
						<input
							id="delete-confirm-email"
							type="email"
							placeholder={userData?.user.email}
							bind:value={deleteConfirmEmail}
							class="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-red-500/50"
						/>
					</div>

					{#if deleteError}
						<p class="text-sm text-red-500 mb-4">{deleteError}</p>
					{/if}

					<div class="flex gap-3">
						<button
							onclick={() => {
								showDeleteDialog = false;
								deleteConfirmEmail = '';
								deleteError = null;
							}}
							class="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
							disabled={deleting}
						>
							Abbrechen
						</button>
						<button
							onclick={handleDelete}
							disabled={deleting || deleteConfirmEmail !== userData?.user.email}
							class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{#if deleting}
								Losche...
							{:else}
								Endgültig loschen
							{/if}
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
