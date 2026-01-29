<script lang="ts">
	import { matrixStore, type SimpleMessage } from '$lib/matrix';
	import { RoomList, RoomHeader, Timeline, MessageInput } from '$lib/components/chat';
	import CreateRoomDialog from '$lib/components/chat/CreateRoomDialog.svelte';
	import RoomSettingsPanel from '$lib/components/chat/RoomSettingsPanel.svelte';
	import { ChatCircle, Plus } from '@manacore/shared-icons';

	let sidebarOpen = $state(true);
	let showCreateRoom = $state(false);
	let showRoomSettings = $state(false);

	// Reply/Edit state
	let replyTo = $state<SimpleMessage | null>(null);
	let editMessage = $state<SimpleMessage | null>(null);

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	function handleReply(message: SimpleMessage) {
		editMessage = null;
		replyTo = message;
	}

	function handleEdit(message: SimpleMessage) {
		replyTo = null;
		editMessage = message;
	}

	function handleRoomCreated(roomId: string) {
		matrixStore.selectRoom(roomId);
	}
</script>

<div class="chat-layout flex h-full min-h-0 overflow-hidden bg-background">
	<!-- Sidebar -->
	<aside
		class="flex w-80 flex-shrink-0 flex-col border-r border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm transition-all duration-300 ease-in-out"
		class:hidden={!sidebarOpen}
		class:lg:flex={true}
	>
		<!-- User Info / Status Bar -->
		<div class="border-b border-black/10 dark:border-white/10 px-4 py-3">
			<div class="flex items-center justify-between">
				<p class="truncate text-sm font-medium">{matrixStore.userId}</p>
				<button
					class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
					title="Neuer Chat"
					onclick={() => (showCreateRoom = true)}
				>
					<Plus class="h-4 w-4" />
				</button>
			</div>
			<p class="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
				<span class="h-2 w-2 rounded-full bg-green-500"></span>
				{matrixStore.syncState === 'SYNCING' ? 'Verbunden' : matrixStore.syncState}
				{#if matrixStore.totalUnreadCount > 0}
					<span
						class="ml-auto px-1.5 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-medium"
					>
						{matrixStore.totalUnreadCount}
					</span>
				{/if}
			</p>
		</div>

		<!-- Room List -->
		<div class="flex-1 min-h-0 overflow-hidden">
			<RoomList onCreateRoom={() => (showCreateRoom = true)} />
		</div>
	</aside>

	<!-- Main Chat Area -->
	<main class="flex flex-1 min-h-0 flex-col overflow-hidden bg-background">
		{#if matrixStore.currentRoom}
			<!-- Room Header -->
			<RoomHeader onMenuClick={toggleSidebar} onInfoClick={() => (showRoomSettings = true)} />

			<!-- Timeline -->
			<Timeline onReply={handleReply} onEdit={handleEdit} />

			<!-- Message Input -->
			<MessageInput
				{replyTo}
				{editMessage}
				onCancelReply={() => (replyTo = null)}
				onCancelEdit={() => (editMessage = null)}
			/>
		{:else}
			<!-- No Room Selected -->
			<div
				class="flex flex-1 flex-col items-center justify-center gap-4 p-8 pb-24 text-muted-foreground"
			>
				<div class="p-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20">
					<ChatCircle class="h-12 w-12 text-violet-500" />
				</div>
				<div class="text-center">
					<h2 class="text-xl font-semibold text-foreground">Willkommen bei Mana Matrix</h2>
					<p class="mt-2 max-w-sm">
						Wähle eine Unterhaltung aus der Seitenleiste oder starte einen neuen Chat
					</p>
				</div>

				<button
					class="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
					onclick={() => (showCreateRoom = true)}
				>
					<Plus class="h-4 w-4" />
					Neuer Chat
				</button>

				<!-- Stats -->
				<div class="mt-8 flex gap-8 text-center">
					<div class="glass-card rounded-xl px-6 py-4">
						<p class="text-3xl font-bold text-foreground">{matrixStore.rooms.length}</p>
						<p class="text-sm text-muted-foreground">Räume</p>
					</div>
					<div class="glass-card rounded-xl px-6 py-4">
						<p class="text-3xl font-bold text-foreground">{matrixStore.totalUnreadCount}</p>
						<p class="text-sm text-muted-foreground">Ungelesen</p>
					</div>
				</div>
			</div>
		{/if}
	</main>

	<!-- Room Settings Panel -->
	<RoomSettingsPanel open={showRoomSettings} onClose={() => (showRoomSettings = false)} />
</div>

<!-- Create Room Dialog -->
<CreateRoomDialog
	open={showCreateRoom}
	onClose={() => (showCreateRoom = false)}
	onCreated={handleRoomCreated}
/>
