<!--
  Admin → Users tab.
  Mock user search + paginated table (swap in adminService.getUsers once
  a dedicated role-update endpoint ships).
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import UserTable from '$lib/components/admin/UserTable.svelte';
	import { MagnifyingGlass } from '@mana/shared-icons';

	interface User {
		id: string;
		email: string;
		name?: string;
		createdAt: string;
		lastActiveAt?: string;
		role: string;
	}

	let users = $state<User[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let searchQuery = $state('');
	let currentPage = $state(1);
	const pageSize = 20;

	let filteredUsers = $derived(
		searchQuery
			? users.filter(
					(u) =>
						u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
						u.name?.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: users
	);

	let totalPages = $derived(Math.max(1, Math.ceil(filteredUsers.length / pageSize)));
	let paginatedUsers = $derived(
		filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	$effect(() => {
		searchQuery;
		currentPage = 1;
	});

	onMount(async () => {
		try {
			await new Promise((resolve) => setTimeout(resolve, 500));
			users = [
				{
					id: '1',
					email: 'admin@mana.how',
					name: 'Admin User',
					createdAt: '2024-01-15T10:00:00Z',
					lastActiveAt: new Date().toISOString(),
					role: 'admin',
				},
				{
					id: '2',
					email: 'user1@example.com',
					name: 'Max Mustermann',
					createdAt: '2024-06-20T14:30:00Z',
					lastActiveAt: new Date(Date.now() - 3600000).toISOString(),
					role: 'user',
				},
				{
					id: '3',
					email: 'user2@example.com',
					name: 'Erika Musterfrau',
					createdAt: '2024-09-01T08:15:00Z',
					lastActiveAt: new Date(Date.now() - 86400000).toISOString(),
					role: 'user',
				},
				{
					id: '4',
					email: 'user3@example.com',
					createdAt: '2024-12-10T16:45:00Z',
					lastActiveAt: new Date(Date.now() - 172800000).toISOString(),
					role: 'user',
				},
				{
					id: '5',
					email: 'newuser@example.com',
					name: 'New User',
					createdAt: new Date(Date.now() - 86400000).toISOString(),
					role: 'user',
				},
			];
		} catch {
			error = 'Failed to load users';
		} finally {
			loading = false;
		}
	});
</script>

<div class="users-tab">
	<div class="bar">
		<div class="title">
			<strong>Users</strong>
			<span class="sub">{filteredUsers.length} / {users.length}</span>
		</div>
		<div class="search">
			<MagnifyingGlass size={16} />
			<input type="text" placeholder="Suche…" bind:value={searchQuery} />
		</div>
	</div>

	<UserTable users={paginatedUsers} {loading} />

	{#if totalPages > 1}
		<div class="pagination">
			<span>Seite {currentPage} von {totalPages}</span>
			<div class="buttons">
				<button
					type="button"
					onclick={() => (currentPage = Math.max(1, currentPage - 1))}
					disabled={currentPage === 1}>Zurück</button
				>
				<button
					type="button"
					onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
					disabled={currentPage === totalPages}>Weiter</button
				>
			</div>
		</div>
	{/if}

	{#if error}
		<p class="error">{error}</p>
	{/if}
</div>

<style>
	.users-tab {
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

	.pagination {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 0.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	.pagination .buttons {
		display: flex;
		gap: 0.5rem;
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

	.error {
		padding: 0.75rem 1rem;
		border: 1px solid hsl(0 70% 55% / 0.3);
		background: hsl(0 70% 55% / 0.08);
		border-radius: 8px;
		color: hsl(0 70% 55%);
		font-size: 0.8125rem;
	}
</style>
