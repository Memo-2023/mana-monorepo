<script lang="ts">
	interface User {
		id: string;
		email: string;
		name?: string;
		createdAt: string;
		lastActiveAt?: string;
		role: string;
	}

	interface Props {
		users: User[];
		loading?: boolean;
	}

	let { users, loading = false }: Props = $props();

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
</script>

<div class="rounded-lg border bg-card shadow-sm overflow-hidden">
	<div class="p-4 border-b">
		<h3 class="text-lg font-semibold">Benutzer</h3>
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
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-muted/50">
					<tr>
						<th
							class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
						>
							Benutzer
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
							Letzte Aktivität
						</th>
					</tr>
				</thead>
				<tbody class="divide-y">
					{#each users as user}
						<tr class="hover:bg-muted/30 transition-colors">
							<td class="px-4 py-3">
								<div class="flex items-center gap-3">
									<div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
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
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		{#if users.length === 0}
			<div class="p-8 text-center text-muted-foreground">Keine Benutzer gefunden</div>
		{/if}
	{/if}
</div>
