<script lang="ts">
	import { matrixStore } from '$lib/matrix';
	import {
		X,
		Users,
		Settings,
		UserPlus,
		LogOut,
		Crown,
		Shield,
		Bell,
		BellOff,
		Loader2,
	} from 'lucide-svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	let activeTab = $state<'members' | 'settings'>('members');
	let inviteQuery = $state('');
	let searchResults = $state<{ userId: string; displayName?: string; avatarUrl?: string }[]>([]);
	let searching = $state(false);
	let inviting = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout>;

	let room = $derived(matrixStore.currentSimpleRoom);
	let members = $derived(matrixStore.getRoomMembers());

	function handleSearchInput() {
		clearTimeout(searchTimeout);
		if (inviteQuery.trim().length < 2) {
			searchResults = [];
			return;
		}

		searchTimeout = setTimeout(async () => {
			searching = true;
			const results = await matrixStore.searchUsers(inviteQuery);
			// Filter out existing members
			const memberIds = new Set(members.map((m) => m.userId));
			searchResults = results.filter((r) => !memberIds.has(r.userId));
			searching = false;
		}, 300);
	}

	async function inviteUser(userId: string) {
		if (!matrixStore.currentRoomId) return;

		inviting = true;
		const success = await matrixStore.inviteUser(matrixStore.currentRoomId, userId);
		inviting = false;

		if (success) {
			inviteQuery = '';
			searchResults = [];
		}
	}

	async function leaveRoom() {
		if (!matrixStore.currentRoomId) return;
		if (!confirm('Möchtest du diesen Raum wirklich verlassen?')) return;

		const success = await matrixStore.leaveRoom(matrixStore.currentRoomId);
		if (success) {
			onClose();
		}
	}

	function getPowerLevelIcon(level: number) {
		if (level >= 100) return Crown;
		if (level >= 50) return Shield;
		return null;
	}
</script>

{#if open && room}
	<!-- Slide-in Panel -->
	<div class="fixed inset-y-0 right-0 z-40 flex w-80 flex-col border-l border-base-300 bg-base-100 shadow-xl">
		<!-- Header -->
		<header class="flex items-center justify-between border-b border-base-300 px-4 py-3">
			<h2 class="font-semibold">Raum-Details</h2>
			<button class="btn btn-ghost btn-sm btn-circle" onclick={onClose}>
				<X class="h-5 w-5" />
			</button>
		</header>

		<!-- Room Info -->
		<div class="border-b border-base-300 p-4 text-center">
			<div class="avatar placeholder mx-auto mb-3">
				<div class="w-20 rounded-full bg-neutral text-neutral-content">
					{#if room.avatar}
						<img src={room.avatar} alt={room.name} />
					{:else}
						<span class="text-2xl">{room.name.charAt(0).toUpperCase()}</span>
					{/if}
				</div>
			</div>
			<h3 class="text-lg font-semibold">{room.name}</h3>
			{#if room.topic}
				<p class="mt-1 text-sm text-base-content/60">{room.topic}</p>
			{/if}
			<p class="mt-2 text-xs text-base-content/50">
				{room.memberCount} Mitglieder
				{#if room.isEncrypted}
					• Verschlüsselt
				{/if}
			</p>
		</div>

		<!-- Tabs -->
		<div class="tabs tabs-bordered">
			<button
				class="tab flex-1"
				class:tab-active={activeTab === 'members'}
				onclick={() => (activeTab = 'members')}
			>
				<Users class="mr-1 h-4 w-4" />
				Mitglieder
			</button>
			<button
				class="tab flex-1"
				class:tab-active={activeTab === 'settings'}
				onclick={() => (activeTab = 'settings')}
			>
				<Settings class="mr-1 h-4 w-4" />
				Einstellungen
			</button>
		</div>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto">
			{#if activeTab === 'members'}
				<!-- Invite User -->
				<div class="border-b border-base-300 p-3">
					<div class="relative">
						<input
							type="text"
							bind:value={inviteQuery}
							oninput={handleSearchInput}
							class="input input-bordered input-sm w-full"
							placeholder="Benutzer einladen..."
						/>
						{#if searching}
							<Loader2 class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
						{/if}
					</div>

					<!-- Search Results -->
					{#if searchResults.length > 0}
						<ul class="menu mt-2 rounded-lg bg-base-200 p-1">
							{#each searchResults as user}
								<li>
									<button
										class="flex items-center gap-2 py-1"
										onclick={() => inviteUser(user.userId)}
										disabled={inviting}
									>
										<div class="avatar placeholder">
											<div class="w-6 rounded-full bg-neutral text-neutral-content">
												<span class="text-xs">{user.displayName?.[0] || '?'}</span>
											</div>
										</div>
										<span class="flex-1 truncate text-sm">
											{user.displayName || user.userId}
										</span>
										<UserPlus class="h-4 w-4 text-primary" />
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>

				<!-- Member List -->
				<ul class="menu p-2">
					{#each members as member}
						{@const PowerIcon = getPowerLevelIcon(member.powerLevel)}
						<li>
							<div class="flex items-center gap-2 py-1">
								<div class="avatar placeholder">
									<div class="w-8 rounded-full bg-neutral text-neutral-content">
										{#if member.avatarUrl}
											<img src={member.avatarUrl} alt="" />
										{:else}
											<span class="text-xs">
												{member.displayName.charAt(0).toUpperCase()}
											</span>
										{/if}
									</div>
								</div>
								<div class="flex-1 min-w-0">
									<p class="truncate font-medium">{member.displayName}</p>
									<p class="truncate text-xs text-base-content/50">{member.userId}</p>
								</div>
								{#if PowerIcon}
									<PowerIcon class="h-4 w-4 text-warning" />
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{:else}
				<!-- Settings -->
				<div class="space-y-2 p-3">
					<!-- Notifications -->
					<button class="btn btn-ghost w-full justify-start">
						<Bell class="h-4 w-4" />
						Benachrichtigungen
						<span class="ml-auto badge badge-sm">An</span>
					</button>

					<!-- Leave Room -->
					<button class="btn btn-ghost w-full justify-start text-error" onclick={leaveRoom}>
						<LogOut class="h-4 w-4" />
						Raum verlassen
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
