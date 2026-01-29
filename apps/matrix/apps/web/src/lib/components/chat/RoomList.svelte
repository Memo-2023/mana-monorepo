<script lang="ts">
	import { matrixStore } from '$lib/matrix';
	import RoomItem from './RoomItem.svelte';
	import { MagnifyingGlass, Plus, Users, ChatCircle } from '@manacore/shared-icons';

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
			<MagnifyingGlass
				class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
			/>
			<input
				type="text"
				bind:value={search}
				placeholder="Chats durchsuchen..."
				class="w-full rounded-xl bg-white/70 dark:bg-white/10 backdrop-blur-xl
				       border border-black/10 dark:border-white/20 px-4 py-2.5 pl-10
				       text-sm font-medium text-foreground focus:ring-2 focus:ring-primary focus:outline-none
				       placeholder:text-muted-foreground shadow-sm"
			/>
		</div>
	</div>

	<!-- Tabs -->
	<div class="flex mx-3 mb-2 p-1 rounded-xl bg-black/5 dark:bg-white/5">
		<button
			class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-200
			       {showDMs
				? 'bg-white dark:bg-white/20 shadow-sm text-foreground'
				: 'text-muted-foreground hover:text-foreground'}"
			onclick={() => (showDMs = true)}
		>
			<ChatCircle class="h-4 w-4" weight={showDMs ? 'fill' : 'regular'} />
			Direkt
			{#if matrixStore.directRooms.length > 0}
				<span class="px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-xs">
					{matrixStore.directRooms.length}
				</span>
			{/if}
		</button>
		<button
			class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-200
			       {!showDMs
				? 'bg-white dark:bg-white/20 shadow-sm text-foreground'
				: 'text-muted-foreground hover:text-foreground'}"
			onclick={() => (showDMs = false)}
		>
			<Users class="h-4 w-4" weight={!showDMs ? 'fill' : 'regular'} />
			Räume
			{#if matrixStore.groupRooms.length > 0}
				<span class="px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-xs">
					{matrixStore.groupRooms.length}
				</span>
			{/if}
		</button>
	</div>

	<!-- Room List -->
	<div class="chat-scrollbar flex-1 overflow-y-auto px-3">
		{#each filteredRooms as room (room.id)}
			<RoomItem
				{room}
				selected={room.id === matrixStore.currentRoomId}
				onclick={() => matrixStore.selectRoom(room.id)}
			/>
		{:else}
			<div class="flex flex-col items-center justify-center p-8 text-muted-foreground">
				{#if search}
					<MagnifyingGlass class="mb-2 h-8 w-8 opacity-50" />
					<p class="text-sm">Keine Ergebnisse für "{search}"</p>
				{:else}
					<ChatCircle class="mb-2 h-8 w-8 opacity-50" />
					<p class="text-sm">Noch keine {showDMs ? 'Direktnachrichten' : 'Räume'}</p>
				{/if}
			</div>
		{/each}
	</div>

	<!-- New Room Button -->
	<div class="border-t border-black/10 dark:border-white/10 p-3">
		<button
			class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
			       bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium
			       shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
			onclick={onCreateRoom}
		>
			<Plus class="h-4 w-4" />
			{showDMs ? 'Neuen Chat starten' : 'Raum erstellen'}
		</button>
	</div>
</div>
