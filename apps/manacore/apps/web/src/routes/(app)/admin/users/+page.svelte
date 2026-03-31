<script lang="ts">
	import { onMount } from 'svelte';
	import UserTable from '$lib/components/admin/UserTable.svelte';
	import { MagnifyingGlass } from '@manacore/shared-icons';

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

	// Reset to page 1 when search changes
	$effect(() => {
		searchQuery;
		currentPage = 1;
	});

	onMount(async () => {
		try {
			// TODO: Replace with actual API call
			// const response = await fetch('/api/admin/users');
			// users = await response.json();

			// Mock data for now
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
		} catch (e) {
			error = 'Failed to load users';
		} finally {
			loading = false;
		}
	});
</script>

<div class="space-y-6">
	<!-- Search & Filters -->
	<div class="flex items-center gap-4">
		<div class="relative flex-1 max-w-md">
			<MagnifyingGlass
				size={20}
				class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
			/>
			<input
				type="text"
				placeholder="Search users..."
				bind:value={searchQuery}
				class="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
			/>
		</div>
		<span class="text-sm text-muted-foreground">
			{filteredUsers.length} of {users.length} users
		</span>
	</div>

	<!-- User Table -->
	<UserTable users={paginatedUsers} {loading} />

	<!-- Pagination -->
	{#if totalPages > 1}
		<div class="flex items-center justify-between pt-4">
			<span class="text-sm text-muted-foreground">
				Seite {currentPage} von {totalPages}
			</span>
			<div class="flex gap-2">
				<button
					type="button"
					onclick={() => (currentPage = Math.max(1, currentPage - 1))}
					disabled={currentPage === 1}
					class="rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-40 hover:bg-muted"
				>
					Zuruck
				</button>
				<button
					type="button"
					onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
					disabled={currentPage === totalPages}
					class="rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-40 hover:bg-muted"
				>
					Weiter
				</button>
			</div>
		</div>
	{/if}

	{#if error}
		<div
			class="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4"
		>
			<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
		</div>
	{/if}
</div>
