<!--
  Admin → User Data tab.
  Real API-backed user browser (adminService.getUsers). The per-user
  detail route /admin/user-data/[userId] stays route-based.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { adminService, type UserListItem } from '$lib/api/services/admin';
	import { MagnifyingGlass } from '@mana/shared-icons';

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
		return new Date(dateStr).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}

	function formatRelativeTime(dateStr: string | undefined): string {
		if (!dateStr) return '-';
		const date = new Date(dateStr);
		const diffMs = Date.now() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'gerade eben';
		if (diffMins < 60) return `vor ${diffMins} Min`;
		if (diffHours < 24) return `vor ${diffHours} Std`;
		if (diffDays < 7) return `vor ${diffDays} Tagen`;
		return formatDate(dateStr);
	}

	onMount(() => {
		loadUsers();
	});
</script>

<div class="user-data-tab">
	<div class="bar">
		<div class="title">
			<strong>Nutzerdaten</strong>
			<span class="sub">{total} Nutzer</span>
		</div>
		<div class="search">
			<MagnifyingGlass size={16} />
			<input
				type="text"
				placeholder="Email oder Name…"
				bind:value={searchQuery}
				oninput={handleSearch}
			/>
		</div>
	</div>

	<div class="panel">
		{#if loading}
			<div class="loading">
				{#each Array(5) as _}
					<div class="loading-row">
						<div class="avatar-skel"></div>
						<div class="meta-skel">
							<div class="bar-skel short"></div>
							<div class="bar-skel"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if error}
			<div class="error-box">
				<p>{error}</p>
				<button type="button" onclick={() => loadUsers()}>Erneut versuchen</button>
			</div>
		{:else if users.length === 0}
			<p class="empty">Keine Nutzer gefunden.</p>
		{:else}
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Nutzer</th>
							<th>Rolle</th>
							<th>Registriert</th>
							<th>Letzte Aktivität</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each users as user}
							<tr>
								<td>
									<div class="user-cell">
										<div class="avatar">
											{(user.name || user.email)[0].toUpperCase()}
										</div>
										<div>
											<p class="user-name">{user.name || '—'}</p>
											<p class="user-email">{user.email}</p>
										</div>
									</div>
								</td>
								<td>
									<span class="role-badge" class:role-admin={user.role === 'admin'}>
										{user.role}
									</span>
								</td>
								<td class="muted">{formatDate(user.createdAt)}</td>
								<td class="muted">{formatRelativeTime(user.lastActiveAt)}</td>
								<td class="action-cell">
									<button
										type="button"
										onclick={() => goto(`/admin/user-data/${user.id}`)}
										class="view-btn"
									>
										Daten anzeigen
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if totalPages > 1}
				<div class="pagination">
					<button
						type="button"
						onclick={() => {
							page = Math.max(1, page - 1);
							loadUsers();
						}}
						disabled={page === 1}>Zurück</button
					>
					<span>Seite {page} von {totalPages}</span>
					<button
						type="button"
						onclick={() => {
							page = Math.min(totalPages, page + 1);
							loadUsers();
						}}
						disabled={page === totalPages}>Weiter</button
					>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.user-data-tab {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.bar .title strong {
		font-size: 1rem;
		font-weight: 600;
	}

	.bar .sub {
		margin-left: 0.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	.search {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 8px;
		background: hsl(var(--color-input, var(--color-background, var(--color-card))));
		color: hsl(var(--color-muted-foreground));
		min-width: 14rem;
	}

	.search input {
		flex: 1;
		background: transparent;
		border: 0;
		outline: none;
		color: hsl(var(--color-foreground));
		font: inherit;
		font-size: 0.875rem;
	}

	.panel {
		border: 1px solid hsl(var(--color-border));
		border-radius: 10px;
		background: hsl(var(--color-card));
		overflow: hidden;
	}

	.loading {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.loading-row {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.avatar-skel {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		background: hsl(var(--color-muted));
		animation: pulse 1.5s ease-in-out infinite;
	}

	.meta-skel {
		flex: 1;
	}

	.bar-skel {
		height: 0.625rem;
		background: hsl(var(--color-muted));
		border-radius: 3px;
		animation: pulse 1.5s ease-in-out infinite;
	}

	.bar-skel + .bar-skel {
		margin-top: 0.5rem;
	}

	.bar-skel.short {
		width: 25%;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.error-box {
		padding: 2rem;
		text-align: center;
	}

	.error-box p {
		color: hsl(0 70% 55%);
		margin: 0 0 1rem;
	}

	.error-box button {
		padding: 0.5rem 1rem;
		background: var(--pill-primary-color, hsl(var(--color-primary, 230 80% 55%)));
		color: hsl(var(--color-primary-foreground, 0 0% 100%));
		border: 0;
		border-radius: 8px;
		font: inherit;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.empty {
		padding: 2rem;
		text-align: center;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
	}

	.table-wrap {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	thead {
		background: hsl(var(--color-muted));
	}

	th {
		text-align: left;
		font-size: 0.6875rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.625rem 1rem;
	}

	td {
		padding: 0.625rem 1rem;
		border-top: 1px solid hsl(var(--color-border) / 0.5);
		font-size: 0.875rem;
	}

	tbody tr:hover {
		background: hsl(var(--color-muted) / 0.3);
	}

	.user-cell {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.avatar {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--pill-primary-color, hsl(var(--color-primary, 230 80% 55%)));
		color: hsl(var(--color-primary-foreground, 0 0% 100%));
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.user-name {
		font-weight: 500;
		margin: 0;
	}

	.user-email {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}

	.role-badge {
		display: inline-block;
		padding: 0.125rem 0.5rem;
		font-size: 0.6875rem;
		font-weight: 500;
		border-radius: 9999px;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.role-badge.role-admin {
		background: hsl(0 84% 60% / 0.12);
		color: hsl(0 84% 45%);
	}

	.muted {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
	}

	.action-cell {
		text-align: right;
	}

	.view-btn {
		padding: 0.25rem 0.625rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 6px;
		background: transparent;
		color: hsl(var(--color-foreground));
		font: inherit;
		font-size: 0.75rem;
		cursor: pointer;
		transition: background 120ms ease;
	}

	.view-btn:hover {
		background: hsl(var(--color-muted) / 0.5);
	}

	.pagination {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-top: 1px solid hsl(var(--color-border));
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	.pagination button {
		padding: 0.375rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 6px;
		background: transparent;
		color: hsl(var(--color-foreground));
		font: inherit;
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.pagination button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
