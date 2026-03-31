<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { adminService, type UserListItem } from '$lib/api/services/admin';
	import { MagnifyingGlass } from '@manacore/shared-icons';

	let users = $state<UserListItem[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let searchQuery = $state('');
	let searchTimeout: ReturnType<typeof setTimeout>;
	let page = $state(1);
	let total = $state(0);
	const limit = 20;

	let totalPages = $derived(Math.ceil(total / limit));

	async function loadUsers() {
		loading = true;
		error = null;

		const result = await adminService.getUsers(page, limit, searchQuery || undefined);

		if (result.error) {
			error = result.error;
			users = [];
		} else if (result.data) {
			users = result.data.users;
			total = result.data.total;
		}

		loading = false;
	}

	function handleSearch() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			page = 1;
			loadUsers();
		}, 300);
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}

	function formatRelativeTime(dateStr: string | undefined): string {
		if (!dateStr) return '-';
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'gerade eben';
		if (diffMins < 60) return `vor ${diffMins} Min`;
		if (diffHours < 24) return `vor ${diffHours} Std`;
		if (diffDays < 7) return `vor ${diffDays} Tagen`;
		return formatDate(dateStr);
	}

	function viewUserData(userId: string) {
		goto(`/admin/user-data/${userId}`);
	}

	onMount(() => {
		loadUsers();
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">Nutzerdaten</h1>
			<p class="text-muted-foreground">Durchsuche und analysiere Nutzerdaten aller Projekte</p>
		</div>
	</div>

	<!-- Search -->
	<div class="flex items-center gap-4">
		<div class="relative flex-1 max-w-md">
			<MagnifyingGlass
				size={20}
				class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
			/>
			<input
				type="text"
				placeholder="Nach Email oder Name suchen..."
				bind:value={searchQuery}
				oninput={handleSearch}
				class="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
			/>
		</div>
		<span class="text-sm text-muted-foreground">
			{total} Nutzer gefunden
		</span>
	</div>

	<!-- User Table -->
	<div class="rounded-lg border bg-card shadow-sm overflow-hidden">
		<div class="p-4 border-b">
			<h3 class="text-lg font-semibold">Nutzer</h3>
		</div>
		{#if loading}
			<div class="p-4 space-y-3">
				{#each Array(5) as _}
					<div class="animate-pulse flex items-center gap-4">
						<div class="h-10 w-10 bg-muted rounded-full"></div>
						<div class="flex-1">
							<div class="h-4 bg-muted rounded w-1/4 mb-2"></div>
							<div class="h-3 bg-muted rounded w-1/3"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if error}
			<div class="p-8 text-center">
				<p class="text-red-500">{error}</p>
				<button
					onclick={() => loadUsers()}
					class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
				>
					Erneut versuchen
				</button>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-muted/50">
						<tr>
							<th
								class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
							>
								Nutzer
							</th>
							<th
								class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
							>
								Rolle
							</th>
							<th
								class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
							>
								Registriert
							</th>
							<th
								class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
							>
								Letzte Aktivitat
							</th>
							<th
								class="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
							>
								Aktionen
							</th>
						</tr>
					</thead>
					<tbody class="divide-y">
						{#each users as user}
							<tr class="hover:bg-muted/30 transition-colors">
								<td class="px-4 py-3">
									<div class="flex items-center gap-3">
										<div
											class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"
										>
											<span class="text-sm font-medium text-primary">
												{(user.name || user.email)[0].toUpperCase()}
											</span>
										</div>
										<div>
											<p class="font-medium text-sm">{user.name || '-'}</p>
											<p class="text-xs text-muted-foreground">{user.email}</p>
										</div>
									</div>
								</td>
								<td class="px-4 py-3">
									<span
										class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
										{user.role === 'admin'
											? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
											: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}"
									>
										{user.role}
									</span>
								</td>
								<td class="px-4 py-3 text-sm text-muted-foreground">
									{formatDate(user.createdAt)}
								</td>
								<td class="px-4 py-3 text-sm text-muted-foreground">
									{formatRelativeTime(user.lastActiveAt)}
								</td>
								<td class="px-4 py-3 text-right">
									<button
										onclick={() => viewUserData(user.id)}
										class="px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
									>
										Daten anzeigen
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if users.length === 0}
				<div class="p-8 text-center text-muted-foreground">Keine Nutzer gefunden</div>
			{/if}

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="p-4 border-t flex items-center justify-between">
					<button
						onclick={() => {
							page = Math.max(1, page - 1);
							loadUsers();
						}}
						disabled={page === 1}
						class="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
					>
						Zuruck
					</button>
					<span class="text-sm text-muted-foreground">
						Seite {page} von {totalPages}
					</span>
					<button
						onclick={() => {
							page = Math.min(totalPages, page + 1);
							loadUsers();
						}}
						disabled={page === totalPages}
						class="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
					>
						Weiter
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>
