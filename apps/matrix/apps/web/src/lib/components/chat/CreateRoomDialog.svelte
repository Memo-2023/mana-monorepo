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
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
		onclick={handleClose}
	>
		<!-- Dialog -->
		<div
			class="w-full max-w-md rounded-xl bg-surface-elevated shadow-xl max-h-[90vh] overflow-y-auto"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-border px-6 py-4">
				<h2 class="text-xl font-semibold text-foreground">Neuer Chat</h2>
				<button
					class="p-2 rounded-lg hover:bg-surface-hover transition-colors"
					onclick={handleClose}
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Content -->
			<div class="space-y-4 px-6 py-4">
				<!-- Type Selection -->
				<div class="flex gap-2">
					<button
						class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors
						       {isDirect
							? 'bg-primary text-primary-foreground'
							: 'bg-surface hover:bg-surface-hover text-foreground border border-border'}"
						onclick={() => (isDirect = true)}
					>
						<ChatCircle class="h-4 w-4" />
						Direktnachricht
					</button>
					<button
						class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors
						       {!isDirect
							? 'bg-primary text-primary-foreground'
							: 'bg-surface hover:bg-surface-hover text-foreground border border-border'}"
						onclick={() => (isDirect = false)}
					>
						<Users class="h-4 w-4" />
						Gruppenraum
					</button>
				</div>

				<!-- Room Name (only for groups) -->
				{#if !isDirect}
					<div class="space-y-1.5">
						<label class="text-sm font-medium text-foreground" for="room-name">Raumname</label>
						<input
							id="room-name"
							type="text"
							bind:value={name}
							class="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-foreground
							       focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
							placeholder="z.B. Team Chat"
						/>
					</div>

					<div class="space-y-1.5">
						<label class="text-sm font-medium text-foreground" for="room-topic"
							>Beschreibung (optional)</label
						>
						<input
							id="room-topic"
							type="text"
							bind:value={topic}
							class="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-foreground
							       focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
							placeholder="Worum geht es in diesem Raum?"
						/>
					</div>

					<!-- Privacy -->
					<div class="flex items-center justify-between p-3 rounded-lg bg-muted">
						<span class="flex items-center gap-2 text-sm text-foreground">
							{#if isPrivate}
								<Lock class="h-4 w-4" />
								Privater Raum
							{:else}
								<Globe class="h-4 w-4" />
								Öffentlicher Raum
							{/if}
						</span>
						<button
							class="relative w-11 h-6 rounded-full transition-colors {isPrivate
								? 'bg-primary'
								: 'bg-muted-foreground/30'}"
							onclick={() => (isPrivate = !isPrivate)}
						>
							<span
								class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform
								       {isPrivate ? 'translate-x-5' : 'translate-x-0'}"
							></span>
						</button>
					</div>
					<p class="text-xs text-muted-foreground">
						{isPrivate
							? 'Nur eingeladene Benutzer können beitreten'
							: 'Jeder kann diesen Raum finden und beitreten'}
					</p>
				{/if}

				<!-- User Search -->
				<div class="space-y-1.5">
					<label class="text-sm font-medium text-foreground" for="user-search">
						{isDirect ? 'Mit wem möchtest du chatten?' : 'Benutzer einladen (optional)'}
					</label>
					<div class="relative">
						<input
							id="user-search"
							type="text"
							bind:value={searchQuery}
							oninput={handleSearchInput}
							class="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-foreground
							       focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
							placeholder="@benutzer:server.de oder Name"
						/>
						{#if searching}
							<CircleNotch class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
						{/if}
					</div>

					<!-- Search Results -->
					{#if searchResults.length > 0}
						<div
							class="mt-2 rounded-lg bg-surface border border-border overflow-hidden max-h-40 overflow-y-auto"
						>
							{#each searchResults as user}
								<button
									class="flex items-center gap-3 w-full px-3 py-2 hover:bg-surface-hover transition-colors"
									onclick={() => selectUser(user)}
								>
									<div
										class="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm"
									>
										{#if user.avatarUrl}
											<img src={user.avatarUrl} alt="" class="w-8 h-8 rounded-full object-cover" />
										{:else}
											{user.displayName?.[0] || user.userId[1]}
										{/if}
									</div>
									<div class="flex-1 text-left min-w-0">
										<p class="font-medium text-foreground truncate">
											{user.displayName || user.userId}
										</p>
										{#if user.displayName}
											<p class="text-xs text-muted-foreground truncate">{user.userId}</p>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Selected Users -->
				{#if selectedUsers.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each selectedUsers as user}
							<span
								class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm"
							>
								{user.displayName || user.userId}
								<button
									class="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
									onclick={() => removeUser(user.userId)}
								>
									<X class="h-3 w-3" />
								</button>
							</span>
						{/each}
					</div>
				{/if}

				<!-- Error -->
				{#if error}
					<div class="px-4 py-3 rounded-lg bg-error/10 text-error text-sm">
						{error}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex justify-end gap-2 border-t border-border px-6 py-4">
				<button
					class="px-4 py-2.5 rounded-lg hover:bg-surface-hover text-foreground font-medium transition-colors"
					onclick={handleClose}
				>
					Abbrechen
				</button>
				<button
					class="px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors
					       disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
					onclick={handleCreate}
					disabled={loading}
				>
					{#if loading}
						<CircleNotch class="h-4 w-4 animate-spin" />
					{/if}
					{isDirect ? 'Chat starten' : 'Raum erstellen'}
				</button>
			</div>
		</div>
	</div>
{/if}
