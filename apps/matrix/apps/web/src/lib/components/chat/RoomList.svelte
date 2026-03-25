<script lang="ts">
	import { matrixStore } from '$lib/matrix';
	import RoomItem from './RoomItem.svelte';
	import { Plus, Users, ChatCircle, Envelope, Check, X } from '@manacore/shared-icons';

	interface Props {
		onCreateRoom?: () => void;
		onSelectRoom?: (roomId: string) => void;
		search?: string;
	}

	let { onCreateRoom, onSelectRoom, search = '' }: Props = $props();

	function handleSelectRoom(roomId: string) {
		if (onSelectRoom) {
			onSelectRoom(roomId);
		} else {
			matrixStore.selectRoom(roomId);
		}
	}

	let filteredDirectRooms = $derived(
		matrixStore.directRooms.filter((room) => room.name.toLowerCase().includes(search.toLowerCase()))
	);

	let filteredGroupRooms = $derived(
		matrixStore.groupRooms.filter((room) => room.name.toLowerCase().includes(search.toLowerCase()))
	);

	let filteredInvites = $derived(
		matrixStore.invitedRooms.filter((room) =>
			room.name.toLowerCase().includes(search.toLowerCase())
		)
	);

	async function acceptInvite(roomId: string) {
		await matrixStore.joinRoom(roomId);
	}

	async function declineInvite(roomId: string) {
		await matrixStore.leaveRoom(roomId);
	}
</script>

<div class="flex h-full flex-col">
	<!-- Room List with Sections -->
	<div class="chat-scrollbar flex-1 overflow-y-auto px-3">
		<!-- New Chat action row -->
		<div class="flex items-center justify-between px-2 py-2 mb-1">
			<span
				class="text-xs font-semibold uppercase text-muted-foreground tracking-wide flex items-center gap-2"
			>
				<Users class="h-3.5 w-3.5" />
				Räume
				<span class="px-1.5 py-0.5 rounded-full bg-muted text-[10px]">
					{matrixStore.directRooms.length + matrixStore.groupRooms.length}
				</span>
			</span>
			<button
				class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
				       bg-gradient-to-r from-violet-500 to-purple-600 text-white
				       shadow-sm hover:shadow-md hover:-translate-y-px transition-all duration-200"
				onclick={onCreateRoom}
				title="Neuer Chat"
			>
				<Plus class="h-3.5 w-3.5" />
				Neu
			</button>
		</div>

		<!-- Invites Section -->
		{#if filteredInvites.length > 0}
			<div class="mb-4">
				<div
					class="flex items-center gap-2 px-2 py-2 text-xs font-semibold uppercase text-muted-foreground"
				>
					<Envelope class="h-3.5 w-3.5" />
					Einladungen
					<span
						class="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px]"
					>
						{filteredInvites.length}
					</span>
				</div>
				{#each filteredInvites as room (room.id)}
					<div
						class="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20"
					>
						<!-- Avatar -->
						<div
							class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm"
						>
							<span class="text-sm font-semibold">
								{room.name
									.split(' ')
									.map((w) => w[0])
									.join('')
									.substring(0, 2)
									.toUpperCase()}
							</span>
						</div>
						<!-- Info -->
						<div class="flex-1 min-w-0">
							<p class="font-medium text-foreground truncate">{room.name}</p>
							{#if room.inviter}
								<p class="text-xs text-muted-foreground truncate">
									Eingeladen von {room.inviter}
								</p>
							{/if}
						</div>
						<!-- Actions -->
						<div class="flex gap-1.5">
							<button
								class="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
								title="Annehmen"
								onclick={() => acceptInvite(room.id)}
							>
								<Check class="h-4 w-4" weight="bold" />
							</button>
							<button
								class="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
								title="Ablehnen"
								onclick={() => declineInvite(room.id)}
							>
								<X class="h-4 w-4" weight="bold" />
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Direct Messages Section -->
		{#if matrixStore.directRooms.length > 0}
			<div class="mb-2">
				<div
					class="flex items-center gap-2 px-2 py-2 text-xs font-semibold uppercase text-muted-foreground"
				>
					<ChatCircle class="h-3.5 w-3.5" />
					Direktnachrichten
					<span class="px-1.5 py-0.5 rounded-full bg-muted text-[10px]">
						{matrixStore.directRooms.length}
					</span>
				</div>
				{#each filteredDirectRooms as room (room.id)}
					<RoomItem
						{room}
						selected={room.id === matrixStore.currentRoomId}
						onclick={() => handleSelectRoom(room.id)}
					/>
				{/each}
			</div>
		{/if}

		<!-- Group Rooms Section -->
		{#if matrixStore.groupRooms.length > 0}
			<div class="mb-2">
				<div
					class="flex items-center gap-2 px-2 py-2 text-xs font-semibold uppercase text-muted-foreground"
				>
					<Users class="h-3.5 w-3.5" />
					Gruppen
					<span class="px-1.5 py-0.5 rounded-full bg-muted text-[10px]">
						{matrixStore.groupRooms.length}
					</span>
				</div>
				{#each filteredGroupRooms as room (room.id)}
					<RoomItem
						{room}
						selected={room.id === matrixStore.currentRoomId}
						onclick={() => handleSelectRoom(room.id)}
					/>
				{/each}
			</div>
		{/if}

		<!-- No search results -->
		{#if search && filteredDirectRooms.length === 0 && filteredGroupRooms.length === 0 && filteredInvites.length === 0 && (matrixStore.directRooms.length > 0 || matrixStore.groupRooms.length > 0 || matrixStore.invitedRooms.length > 0)}
			<div class="flex flex-col items-center justify-center p-8 text-muted-foreground">
				<p class="text-sm">Keine Ergebnisse für "{search}"</p>
			</div>
		{/if}
	</div>
</div>
