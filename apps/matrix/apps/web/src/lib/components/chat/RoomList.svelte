<script lang="ts">
	import { matrixStore } from '$lib/matrix';
	import RoomItem from './RoomItem.svelte';
	import { Search, Plus, Users, MessageCircle } from 'lucide-svelte';

	interface Props {
		onCreateRoom?: () => void;
	}

	let { onCreateRoom }: Props = $props();

	let search = $state('');
	let showDMs = $state(true);

	let filteredRooms = $derived(
		(showDMs ? matrixStore.directRooms : matrixStore.groupRooms).filter((room) =>
			room.name.toLowerCase().includes(search.toLowerCase())
		)
	);
</script>

<div class="flex h-full flex-col">
	<!-- Search -->
	<div class="p-3">
		<div class="relative">
			<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/50" />
			<input
				type="text"
				bind:value={search}
				placeholder="Search rooms..."
				class="input input-bordered input-sm w-full pl-10"
			/>
		</div>
	</div>

	<!-- Tabs -->
	<div class="tabs tabs-boxed mx-3 mb-2">
		<button class="tab flex-1" class:tab-active={showDMs} onclick={() => (showDMs = true)}>
			<MessageCircle class="mr-1 h-4 w-4" />
			Direct
			{#if matrixStore.directRooms.length > 0}
				<span class="badge badge-sm ml-1">{matrixStore.directRooms.length}</span>
			{/if}
		</button>
		<button class="tab flex-1" class:tab-active={!showDMs} onclick={() => (showDMs = false)}>
			<Users class="mr-1 h-4 w-4" />
			Rooms
			{#if matrixStore.groupRooms.length > 0}
				<span class="badge badge-sm ml-1">{matrixStore.groupRooms.length}</span>
			{/if}
		</button>
	</div>

	<!-- Room List -->
	<div class="chat-scrollbar flex-1 overflow-y-auto">
		{#each filteredRooms as room (room.id)}
			<RoomItem
				{room}
				selected={room.id === matrixStore.currentRoomId}
				onclick={() => matrixStore.selectRoom(room.id)}
			/>
		{:else}
			<div class="flex flex-col items-center justify-center p-8 text-base-content/50">
				{#if search}
					<Search class="mb-2 h-8 w-8" />
					<p>No rooms match "{search}"</p>
				{:else}
					<MessageCircle class="mb-2 h-8 w-8" />
					<p>No {showDMs ? 'direct messages' : 'rooms'} yet</p>
				{/if}
			</div>
		{/each}
	</div>

	<!-- New Room Button -->
	<div class="border-t border-base-300 p-3">
		<button class="btn btn-ghost btn-sm w-full justify-start" onclick={onCreateRoom}>
			<Plus class="h-4 w-4" />
			{showDMs ? 'Neuen Chat starten' : 'Raum erstellen'}
		</button>
	</div>
</div>
