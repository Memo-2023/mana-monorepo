<script lang="ts">
	import { getContext } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { clientTable } from '$lib/modules/times/collections';
	import { getTotalDuration, formatDurationCompact } from '$lib/modules/times/queries';
	import type { Client, Project, TimeEntry } from '$lib/modules/times/types';
	import { PROJECT_COLORS } from '$lib/modules/times/types';
	import { ConfirmationModal } from '@mana/shared-ui';
	import { CaretRight } from '@mana/shared-icons';

	const allClients = getContext<{ value: Client[] }>('clients');
	const allProjects = getContext<{ value: Project[] }>('projects');
	const allTimeEntries = getContext<{ value: TimeEntry[] }>('timeEntries');

	let showCreateForm = $state(false);
	let editingClientId = $state<string | null>(null);
	let showArchived = $state(false);
	let deleteConfirmId = $state<string | null>(null);

	let newName = $state('');
	let newShortCode = $state('');
	let newEmail = $state('');
	let newColor = $state(PROJECT_COLORS[4]);
	let newRate = $state(0);

	let activeClients = $derived(
		allClients.value.filter((c) => !c.isArchived).sort((a, b) => a.order - b.order)
	);
	let archivedClients = $derived(allClients.value.filter((c) => c.isArchived));

	function getClientProjects(clientId: string): Project[] {
		return allProjects.value.filter((p) => p.clientId === clientId && !p.isArchived);
	}

	function getClientHours(clientId: string): number {
		return getTotalDuration(
			allTimeEntries.value.filter((e) => e.clientId === clientId && !e.isRunning)
		);
	}

	async function handleCreate() {
		if (!newName.trim()) return;
		await clientTable.add({
			id: crypto.randomUUID(),
			name: newName.trim(),
			shortCode: newShortCode || null,
			contactId: null,
			email: newEmail || null,
			color: newColor,
			isArchived: false,
			billingRate: newRate > 0 ? { amount: newRate, currency: 'EUR', per: 'hour' } : null,
			notes: null,
			order: activeClients.length,
		});
		newName = '';
		newShortCode = '';
		newEmail = '';
		newRate = 0;
		showCreateForm = false;
	}

	async function handleArchive(id: string, archive: boolean) {
		await clientTable.update(id, { isArchived: archive });
	}

	function handleDelete(id: string) {
		deleteConfirmId = id;
	}

	async function confirmDelete() {
		if (!deleteConfirmId) return;
		await clientTable.delete(deleteConfirmId);
		editingClientId = null;
		deleteConfirmId = null;
	}

	// Edit state
	let editName = $state('');
	let editShortCode = $state('');
	let editEmail = $state('');
	let editColor = $state('');
	let editRate = $state(0);

	function startEditing(client: Client) {
		editingClientId = client.id;
		editName = client.name;
		editShortCode = client.shortCode ?? '';
		editEmail = client.email ?? '';
		editColor = client.color;
		editRate = client.billingRate?.amount ?? 0;
	}

	let editDebounce: ReturnType<typeof setTimeout> | null = null;
	function autoSave(updates: Record<string, unknown>) {
		if (!editingClientId) return;
		if (editDebounce) clearTimeout(editDebounce);
		const id = editingClientId;
		editDebounce = setTimeout(() => {
			clientTable.update(id, updates);
		}, 500);
	}
</script>

<svelte:head>
	<title>{$_('nav.clients')} | Times</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">{$_('nav.clients')}</h1>
		<button
			onclick={() => (showCreateForm = !showCreateForm)}
			class="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))]"
		>
			+ {$_('client.create')}
		</button>
	</div>

	{#if showCreateForm}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleCreate();
			}}
			class="rounded-xl border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--card))] p-4 space-y-3"
		>
			<div class="flex gap-2">
				<input
					type="text"
					bind:value={newName}
					placeholder={$_('client.name')}
					class="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
				/>
				<input
					type="text"
					bind:value={newShortCode}
					placeholder={$_('client.shortCode')}
					class="w-24 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2.5 text-sm text-[hsl(var(--foreground))]"
				/>
			</div>
			<div class="flex gap-2">
				<input
					type="email"
					bind:value={newEmail}
					placeholder={$_('client.email')}
					class="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))]"
				/>
				<div class="flex items-center gap-1">
					<input
						type="number"
						bind:value={newRate}
						min="0"
						step="5"
						placeholder="0"
						class="w-20 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2.5 text-sm text-center text-[hsl(var(--foreground))]"
					/>
					<span class="text-xs text-[hsl(var(--muted-foreground))]">/h</span>
				</div>
			</div>
			<div class="flex flex-wrap gap-2">
				{#each PROJECT_COLORS as color}
					<!-- svelte-ignore a11y_consider_explicit_label -->
					<button
						type="button"
						onclick={() => (newColor = color)}
						class="h-6 w-6 rounded-full border-2 transition-transform {newColor === color
							? 'scale-125 border-white'
							: 'border-transparent'}"
						style="background-color: {color}"
					></button>
				{/each}
			</div>
			<div class="flex gap-2">
				<button
					type="button"
					onclick={() => (showCreateForm = false)}
					class="flex-1 rounded-lg border border-[hsl(var(--border))] py-2 text-sm text-[hsl(var(--muted-foreground))]"
					>{$_('common.cancel')}</button
				>
				<button
					type="submit"
					class="flex-1 rounded-lg bg-[hsl(var(--primary))] py-2 text-sm font-medium text-[hsl(var(--primary-foreground))]"
					>{$_('common.create')}</button
				>
			</div>
		</form>
	{/if}

	{#if activeClients.length === 0 && !showCreateForm}
		<div
			class="rounded-xl border border-dashed border-[hsl(var(--border))] p-8 text-center text-[hsl(var(--muted-foreground))]"
		>
			<p>{$_('client.noClients')}</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each activeClients as client (client.id)}
				{@const projects = getClientProjects(client.id)}
				{@const hours = getClientHours(client.id)}
				<div
					class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden"
				>
					{#if editingClientId === client.id}
						<div class="p-4 space-y-3">
							<div class="flex gap-2">
								<input
									type="text"
									value={editName}
									oninput={(e) => {
										editName = (e.target as HTMLInputElement).value;
										autoSave({ name: editName });
									}}
									class="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm"
								/>
								<input
									type="text"
									value={editShortCode}
									oninput={(e) => {
										editShortCode = (e.target as HTMLInputElement).value;
										autoSave({ shortCode: editShortCode || null });
									}}
									placeholder={$_('client.shortCode')}
									class="w-24 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm"
								/>
							</div>
							<div class="flex gap-2">
								<input
									type="email"
									value={editEmail}
									oninput={(e) => {
										editEmail = (e.target as HTMLInputElement).value;
										autoSave({ email: editEmail || null });
									}}
									placeholder={$_('client.email')}
									class="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm"
								/>
								<div class="flex items-center gap-1">
									<input
										type="number"
										value={editRate}
										min="0"
										step="5"
										oninput={(e) => {
											editRate = parseInt((e.target as HTMLInputElement).value) || 0;
											autoSave({
												billingRate:
													editRate > 0 ? { amount: editRate, currency: 'EUR', per: 'hour' } : null,
											});
										}}
										class="w-20 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-center"
									/>
									<span class="text-xs text-[hsl(var(--muted-foreground))]">/h</span>
								</div>
							</div>
							<div class="flex flex-wrap gap-1.5">
								{#each PROJECT_COLORS as color}
									<!-- svelte-ignore a11y_consider_explicit_label -->
									<button
										type="button"
										onclick={() => {
											editColor = color;
											autoSave({ color });
										}}
										class="h-5 w-5 rounded-full border-2 {editColor === color
											? 'border-white scale-110'
											: 'border-transparent'}"
										style="background-color: {color}"
									></button>
								{/each}
							</div>
							<div class="flex justify-end gap-2">
								<button
									onclick={() => handleArchive(client.id, true)}
									class="text-xs text-[hsl(var(--muted-foreground))]">{$_('common.archive')}</button
								>
								<button onclick={() => handleDelete(client.id)} class="text-xs text-red-500"
									>{$_('common.delete')}</button
								>
								<button
									onclick={() => (editingClientId = null)}
									class="text-xs text-[hsl(var(--primary))]">{$_('common.close')}</button
								>
							</div>
						</div>
					{:else}
						<button
							class="flex w-full items-center gap-3 p-4 text-left"
							onclick={() => startEditing(client)}
						>
							<div
								class="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center text-white text-sm font-bold"
								style="background-color: {client.color}"
							>
								{client.shortCode || client.name.charAt(0).toUpperCase()}
							</div>
							<div class="min-w-0 flex-1">
								<p class="font-medium text-[hsl(var(--foreground))]">{client.name}</p>
								<p class="text-xs text-[hsl(var(--muted-foreground))]">
									{projects.length}
									{$_('nav.projects')}
									{#if client.billingRate}
										· {client.billingRate.amount}
										{client.billingRate.currency}/{$_('common.hours').toLowerCase().charAt(0)}
									{/if}
								</p>
							</div>
							<span class="duration-display text-sm font-medium text-[hsl(var(--foreground))]">
								{formatDurationCompact(hours)}
							</span>
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if archivedClients.length > 0}
		<div>
			<button
				onclick={() => (showArchived = !showArchived)}
				class="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]"
			>
				<CaretRight size={20} class="transition-transform {showArchived ? 'rotate-90' : ''}" />
				{$_('project.archived')} ({archivedClients.length})
			</button>
			{#if showArchived}
				<div class="mt-3 space-y-2">
					{#each archivedClients as client}
						<div
							class="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 opacity-60"
						>
							<div class="flex items-center gap-2">
								<div
									class="h-6 w-6 rounded flex items-center justify-center text-white text-xs font-bold"
									style="background-color: {client.color}"
								>
									{client.shortCode || client.name.charAt(0)}
								</div>
								<span class="text-sm">{client.name}</span>
							</div>
							<button
								onclick={() => handleArchive(client.id, false)}
								class="text-xs text-[hsl(var(--primary))]">{$_('common.unarchive')}</button
							>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<ConfirmationModal
	visible={deleteConfirmId !== null}
	title={$_('common.delete')}
	message={$_('client.deleteConfirm')}
	onConfirm={confirmDelete}
	onClose={() => (deleteConfirmId = null)}
/>
