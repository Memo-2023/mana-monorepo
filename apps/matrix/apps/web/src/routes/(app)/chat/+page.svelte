<script lang="ts">
	import { matrixStore, type SimpleMessage } from '$lib/matrix';
	import { RoomList, RoomHeader, Timeline, MessageInput } from '$lib/components/chat';
	import CreateRoomDialog from '$lib/components/chat/CreateRoomDialog.svelte';
	import RoomSettingsPanel from '$lib/components/chat/RoomSettingsPanel.svelte';
	import SearchDialog from '$lib/components/chat/SearchDialog.svelte';
	import ForwardMessageDialog from '$lib/components/chat/ForwardMessageDialog.svelte';
	import { CallView, IncomingCallDialog } from '$lib/components/call';
	import { ChatCircle, Plus, Gear, List } from '@manacore/shared-icons';
	import { browser } from '$app/environment';

	// Call state
	let activeCall = $derived(matrixStore.activeCall);
	let incomingCall = $derived(matrixStore.incomingCall);

	// Start with sidebar closed on mobile
	let sidebarOpen = $state(browser ? window.innerWidth >= 1024 : true);
	let showCreateRoom = $state(false);
	let showRoomSettings = $state(false);
	let showSearch = $state(false);
	let showForward = $state(false);

	// Reply/Edit/Forward state
	let replyTo = $state<SimpleMessage | null>(null);
	let editMessage = $state<SimpleMessage | null>(null);
	let forwardMessage = $state<SimpleMessage | null>(null);

	// Check if mobile
	let isMobile = $state(browser ? window.innerWidth < 1024 : false);

	// Update on resize
	if (browser) {
		window.addEventListener('resize', () => {
			isMobile = window.innerWidth < 1024;
			// Auto-close sidebar on resize to mobile
			if (isMobile && sidebarOpen) {
				sidebarOpen = false;
			}
		});

		// Keyboard shortcuts
		window.addEventListener('keydown', (e) => {
			// Cmd/Ctrl + K = Search
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				showSearch = true;
			}
			// Cmd/Ctrl + N = New chat
			if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !e.shiftKey) {
				e.preventDefault();
				showCreateRoom = true;
			}
		});
	}

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	function selectRoomAndCloseSidebar(roomId: string) {
		matrixStore.selectRoom(roomId);
		if (isMobile) {
			sidebarOpen = false;
		}
	}

	function handleReply(message: SimpleMessage) {
		editMessage = null;
		replyTo = message;
	}

	function handleEdit(message: SimpleMessage) {
		replyTo = null;
		editMessage = message;
	}

	function handleForward(message: SimpleMessage) {
		forwardMessage = message;
		showForward = true;
	}

	function handleRoomCreated(roomId: string) {
		matrixStore.selectRoom(roomId);
	}

	// Call handlers
	async function handleVoiceCall() {
		if (matrixStore.currentRoom) {
			await matrixStore.placeVoiceCall(matrixStore.currentRoom.roomId);
		}
	}

	async function handleVideoCall() {
		if (matrixStore.currentRoom) {
			await matrixStore.placeVideoCall(matrixStore.currentRoom.roomId);
		}
	}

	function handleCallHangup() {
		// Call ended - UI will update automatically
	}

	function handleCallAnswer() {
		// Call answered - UI will update automatically
	}

	function handleCallReject() {
		// Call rejected - UI will update automatically
	}
</script>

<div class="chat-layout flex h-full min-h-0 overflow-hidden bg-background relative">
	<!-- Mobile Sidebar Backdrop -->
	{#if sidebarOpen && isMobile}
		<button
			class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
			onclick={() => (sidebarOpen = false)}
			aria-label="Sidebar schließen"
		></button>
	{/if}

	<!-- Sidebar -->
	<aside
		class="flex flex-col border-r border-black/10 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl transition-all duration-300 ease-in-out
		       fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
		       w-[85vw] max-w-[320px] lg:w-80 lg:max-w-none
		       {sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}"
	>
		<!-- User Info / Status Bar -->
		<div class="border-b border-black/10 dark:border-white/10 px-4 py-3">
			<div class="flex items-center justify-between">
				<p class="truncate text-sm font-medium">{matrixStore.userId}</p>
				<div class="flex items-center gap-1">
					<a
						href="/settings"
						class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
						title="Einstellungen"
					>
						<Gear class="h-4 w-4" />
					</a>
					<button
						class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
						title="Neuer Chat"
						onclick={() => (showCreateRoom = true)}
					>
						<Plus class="h-4 w-4" />
					</button>
				</div>
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
			<RoomList
				onCreateRoom={() => (showCreateRoom = true)}
				onSelectRoom={selectRoomAndCloseSidebar}
			/>
		</div>
	</aside>

	<!-- Main Chat Area -->
	<main class="flex flex-1 min-h-0 flex-col overflow-hidden bg-background">
		{#if matrixStore.currentRoom}
			<!-- Room Header -->
			<RoomHeader
				onMenuClick={toggleSidebar}
				onInfoClick={() => (showRoomSettings = true)}
				onSearchClick={() => (showSearch = true)}
				onVoiceCall={handleVoiceCall}
				onVideoCall={handleVideoCall}
			/>

			<!-- Timeline -->
			<Timeline onReply={handleReply} onEdit={handleEdit} onForward={handleForward} />

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
					<h2 class="text-xl font-semibold text-foreground">Willkommen bei Manalink</h2>
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

	<!-- FAB to open sidebar (mobile/tablet only, when sidebar is closed) -->
	{#if !sidebarOpen}
		<button
			onclick={toggleSidebar}
			class="fixed bottom-24 left-4 z-[100] lg:hidden flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
			aria-label="Chats anzeigen"
		>
			<List class="h-6 w-6" weight="bold" />
			{#if matrixStore.totalUnreadCount > 0}
				<span
					class="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold shadow-md"
				>
					{matrixStore.totalUnreadCount > 99 ? '99+' : matrixStore.totalUnreadCount}
				</span>
			{/if}
		</button>
	{/if}
</div>

<!-- Create Room Dialog -->
<CreateRoomDialog
	open={showCreateRoom}
	onClose={() => (showCreateRoom = false)}
	onCreated={handleRoomCreated}
/>

<!-- Search Dialog -->
<SearchDialog open={showSearch} onClose={() => (showSearch = false)} />

<!-- Active Call View -->
{#if activeCall}
	<CallView call={activeCall} onHangup={handleCallHangup} />
{/if}

<!-- Incoming Call Dialog -->
{#if incomingCall && !activeCall}
	<IncomingCallDialog call={incomingCall} onAnswer={handleCallAnswer} onReject={handleCallReject} />
{/if}

<!-- Forward Message Dialog -->
<ForwardMessageDialog
	open={showForward}
	message={forwardMessage}
	onClose={() => {
		showForward = false;
		forwardMessage = null;
	}}
/>
