<script lang="ts">
	import { matrixStore } from '$lib/matrix';
	import { X, Users, ChatCircle, Lock, Globe, CircleNotch } from '@manacore/shared-icons';

	interface Props {
		open: boolean;
		onClose: () => void;
		onCreated?: (roomId: string) => void;
	}

	let { open, onClose, onCreated }: Props = $props();

	let name = $state('');
	let topic = $state('');
	let isPrivate = $state(true);
	let isDirect = $state(false);
	let inviteUserId = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);

	// User search
	let searchQuery = $state('');
	let searchResults = $state<{ userId: string; displayName?: string; avatarUrl?: string }[]>([]);
	let selectedUsers = $state<{ userId: string; displayName?: string }[]>([]);
	let searching = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout>;

	function handleSearchInput() {
		clearTimeout(searchTimeout);
		if (searchQuery.trim().length < 2) {
			searchResults = [];
			return;
		}

		searchTimeout = setTimeout(async () => {
			searching = true;
			searchResults = await matrixStore.searchUsers(searchQuery);
			searching = false;
		}, 300);
	}

	function selectUser(user: { userId: string; displayName?: string }) {
		if (!selectedUsers.find((u) => u.userId === user.userId)) {
			selectedUsers = [...selectedUsers, user];
		}
		searchQuery = '';
		searchResults = [];
	}

	function removeUser(userId: string) {
		selectedUsers = selectedUsers.filter((u) => u.userId !== userId);
	}

	async function handleCreate() {
		if (!name.trim() && !isDirect) {
			error = 'Bitte gib einen Namen ein';
			return;
		}

		if (isDirect && selectedUsers.length === 0) {
			error = 'Bitte wähle mindestens einen Benutzer';
			return;
		}

		loading = true;
		error = null;

		const roomId = await matrixStore.createRoom({
			name: isDirect ? undefined : name.trim(),
			topic: topic.trim() || undefined,
			isDirect,
			invite: selectedUsers.map((u) => u.userId),
		});

		loading = false;

		if (roomId) {
			onCreated?.(roomId);
			resetForm();
			onClose();
		} else {
			error = matrixStore.error || 'Raum konnte nicht erstellt werden';
		}
	}

	function resetForm() {
		name = '';
		topic = '';
		isPrivate = true;
		isDirect = false;
		searchQuery = '';
		searchResults = [];
		selectedUsers = [];
		error = null;
	}

	function handleClose() {
		resetForm();
		onClose();
	}
</script>

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		onclick={handleClose}
	>
		<!-- Dialog -->
		<div
			class="w-full max-w-md rounded-xl bg-base-100 shadow-xl"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-base-300 px-6 py-4">
				<h2 class="text-xl font-semibold">Neuer Chat</h2>
				<button class="btn btn-ghost btn-sm btn-circle" onclick={handleClose}>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Content -->
			<div class="space-y-4 px-6 py-4">
				<!-- Type Selection -->
				<div class="flex gap-2">
					<button
						class="btn flex-1"
						class:btn-primary={isDirect}
						class:btn-ghost={!isDirect}
						onclick={() => (isDirect = true)}
					>
						<ChatCircle class="h-4 w-4" />
						Direktnachricht
					</button>
					<button
						class="btn flex-1"
						class:btn-primary={!isDirect}
						class:btn-ghost={isDirect}
						onclick={() => (isDirect = false)}
					>
						<Users class="h-4 w-4" />
						Gruppenraum
					</button>
				</div>

				<!-- Room Name (only for groups) -->
				{#if !isDirect}
					<div class="form-control">
						<label class="label" for="room-name">
							<span class="label-text">Raumname</span>
						</label>
						<input
							id="room-name"
							type="text"
							bind:value={name}
							class="input input-bordered"
							placeholder="z.B. Team Chat"
						/>
					</div>

					<div class="form-control">
						<label class="label" for="room-topic">
							<span class="label-text">Beschreibung (optional)</span>
						</label>
						<input
							id="room-topic"
							type="text"
							bind:value={topic}
							class="input input-bordered"
							placeholder="Worum geht es in diesem Raum?"
						/>
					</div>

					<!-- Privacy -->
					<div class="form-control">
						<label class="label cursor-pointer">
							<span class="label-text flex items-center gap-2">
								{#if isPrivate}
									<Lock class="h-4 w-4" />
									Privater Raum
								{:else}
									<Globe class="h-4 w-4" />
									Öffentlicher Raum
								{/if}
							</span>
							<input type="checkbox" class="toggle" bind:checked={isPrivate} />
						</label>
						<p class="text-xs text-base-content/60 ml-1">
							{isPrivate
								? 'Nur eingeladene Benutzer können beitreten'
								: 'Jeder kann diesen Raum finden und beitreten'}
						</p>
					</div>
				{/if}

				<!-- User Search -->
				<div class="form-control">
					<label class="label" for="user-search">
						<span class="label-text">
							{isDirect ? 'Mit wem möchtest du chatten?' : 'Benutzer einladen (optional)'}
						</span>
					</label>
					<div class="relative">
						<input
							id="user-search"
							type="text"
							bind:value={searchQuery}
							oninput={handleSearchInput}
							class="input input-bordered w-full"
							placeholder="@benutzer:server.de oder Name"
						/>
						{#if searching}
							<CircleNotch class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
						{/if}
					</div>

					<!-- Search Results -->
					{#if searchResults.length > 0}
						<ul class="menu mt-2 max-h-40 overflow-y-auto rounded-lg bg-base-200 p-2">
							{#each searchResults as user}
								<li>
									<button class="flex items-center gap-2" onclick={() => selectUser(user)}>
										<div class="avatar placeholder">
											<div class="w-8 rounded-full bg-neutral text-neutral-content">
												{#if user.avatarUrl}
													<img src={user.avatarUrl} alt="" />
												{:else}
													<span class="text-xs">{user.displayName?.[0] || user.userId[1]}</span>
												{/if}
											</div>
										</div>
										<div class="flex-1 text-left">
											<p class="font-medium">{user.displayName || user.userId}</p>
											{#if user.displayName}
												<p class="text-xs text-base-content/60">{user.userId}</p>
											{/if}
										</div>
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>

				<!-- Selected Users -->
				{#if selectedUsers.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each selectedUsers as user}
							<span class="badge badge-lg gap-1">
								{user.displayName || user.userId}
								<button onclick={() => removeUser(user.userId)}>
									<X class="h-3 w-3" />
								</button>
							</span>
						{/each}
					</div>
				{/if}

				<!-- Error -->
				{#if error}
					<div class="alert alert-error">
						<span>{error}</span>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex justify-end gap-2 border-t border-base-300 px-6 py-4">
				<button class="btn btn-ghost" onclick={handleClose}>Abbrechen</button>
				<button class="btn btn-primary" onclick={handleCreate} disabled={loading}>
					{#if loading}
						<CircleNotch class="h-4 w-4 animate-spin" />
					{/if}
					{isDirect ? 'Chat starten' : 'Raum erstellen'}
				</button>
			</div>
		</div>
	</div>
{/if}
