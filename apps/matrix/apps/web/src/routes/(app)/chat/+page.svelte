<script lang="ts">
	import { matrixStore, type SimpleMessage } from '$lib/matrix';
	import {
		RoomList,
		RoomHeader,
		Timeline,
		MessageInput,
		DropZoneOverlay,
	} from '$lib/components/chat';
	import CreateRoomDialog from '$lib/components/chat/CreateRoomDialog.svelte';
	import RoomSettingsPanel from '$lib/components/chat/RoomSettingsPanel.svelte';
	import SearchDialog from '$lib/components/chat/SearchDialog.svelte';
	import ForwardMessageDialog from '$lib/components/chat/ForwardMessageDialog.svelte';
	import { CallView, IncomingCallDialog } from '$lib/components/call';
	import { ChatCircle, Plus, Gear, ShieldWarning } from '@mana/shared-icons';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Call state
	let activeCall = $derived(matrixStore.activeCall);
	let incomingCall = $derived(matrixStore.incomingCall);

	let showCreateRoom = $state(false);
	let showRoomSettings = $state(false);
	let showSearch = $state(false);
	let showForward = $state(false);

	// Drag & Drop state
	let isDragging = $state(false);
	let dragCounter = $state(0);

	// Reply/Edit/Forward state
	let replyTo = $state<SimpleMessage | null>(null);
	let editMessage = $state<SimpleMessage | null>(null);
	let forwardMessage = $state<SimpleMessage | null>(null);

	// Check if mobile/desktop
	let isMobile = $state(browser ? window.innerWidth < 1024 : false);

	// Update on resize
	if (browser) {
		window.addEventListener('resize', () => {
			isMobile = window.innerWidth < 1024;
		});

		// Keyboard shortcuts
		window.addEventListener('keydown', (e) => {
			// Cmd/Ctrl + N = New chat
			if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !e.shiftKey) {
				e.preventDefault();
				showCreateRoom = true;
			}
		});
	}

	// Handle last room restore - only on desktop
	onMount(() => {
		if (browser && !isMobile && matrixStore.isReady) {
			const lastRoomId = localStorage.getItem('matrix_last_room');
			if (lastRoomId) {
				const roomExists = matrixStore.rooms.some((r) => r.id === lastRoomId);
				if (roomExists) {
					matrixStore.selectRoom(lastRoomId);
				}
			}
		}
	});

	// Also watch for sync state changes to restore room on desktop
	$effect(() => {
		if (browser && !isMobile && matrixStore.isReady && !matrixStore.currentRoomId) {
			const lastRoomId = localStorage.getItem('matrix_last_room');
			if (lastRoomId) {
				const roomExists = matrixStore.rooms.some((r) => r.id === lastRoomId);
				if (roomExists) {
					matrixStore.selectRoom(lastRoomId);
				}
			}
		}
	});

	function handleSelectRoom(roomId: string) {
		if (isMobile) {
			// On mobile, navigate to the room page
			goto('/chat/' + encodeURIComponent(roomId));
		} else {
			// On desktop, just select the room (stay on same page)
			matrixStore.selectRoom(roomId);
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
		if (isMobile) {
			goto('/chat/' + encodeURIComponent(roomId));
		} else {
			matrixStore.selectRoom(roomId);
		}
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

	// Drag & Drop handlers
	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		dragCounter++;
		if (e.dataTransfer?.types.includes('Files')) {
			isDragging = true;
		}
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		dragCounter--;
		if (dragCounter === 0) {
			isDragging = false;
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		dragCounter = 0;

		const files = e.dataTransfer?.files;
		if (!files?.length || !matrixStore.currentRoom) return;

		// Upload all dropped files sequentially
		for (const file of files) {
			await matrixStore.sendFile(file);
		}
	}
</script>

{#if isMobile}
	<!-- Mobile: Full-screen room list -->
	<div class="flex flex-col h-full bg-background safe-area-bottom">
		<!-- Compact Mobile Header -->
		<div class="border-b border-border px-4 py-2.5 bg-surface-elevated safe-area-top">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<h1 class="text-lg font-bold text-foreground">Manalink</h1>
					<span class="flex items-center gap-1 text-xs text-muted-foreground">
						<span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
						{matrixStore.syncState === 'SYNCING' ? 'Verbunden' : matrixStore.syncState}
					</span>
					{#if matrixStore.totalUnreadCount > 0}
						<span
							class="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] font-medium"
						>
							{matrixStore.totalUnreadCount}
						</span>
					{/if}
				</div>
				<div class="flex items-center gap-0.5">
					<a
						href="/settings"
						class="p-2 rounded-lg hover:bg-surface-hover transition-colors"
						title="Einstellungen"
					>
						<Gear class="h-5 w-5" />
					</a>
					<button
						class="p-2 rounded-lg hover:bg-surface-hover transition-colors"
						title="Neuer Chat"
						onclick={() => (showCreateRoom = true)}
					>
						<Plus class="h-5 w-5" />
					</button>
				</div>
			</div>
		</div>

		{#if !matrixStore.cryptoReady}
			<div
				class="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs"
			>
				<ShieldWarning class="h-3.5 w-3.5 shrink-0" />
				<span>Verschlüsselung nicht verfügbar</span>
			</div>
		{/if}

		<!-- Room List -->
		<div class="flex-1 min-h-0 overflow-hidden">
			<RoomList onCreateRoom={() => (showCreateRoom = true)} onSelectRoom={handleSelectRoom} />
		</div>
	</div>
{:else}
	<!-- Desktop: Side-by-side layout -->
	<div class="chat-layout flex h-full min-h-0 overflow-hidden bg-background">
		<!-- Sidebar -->
		<aside class="flex flex-col border-r border-border bg-surface-elevated w-80">
			<!-- User Info / Status Bar -->
			<div class="border-b border-border px-4 py-3">
				<div class="flex items-center justify-between">
					<p class="truncate text-sm font-medium">{matrixStore.userId}</p>
					<div class="flex items-center gap-1">
						<a
							href="/settings"
							class="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
							title="Einstellungen"
						>
							<Gear class="h-4 w-4" />
						</a>
						<button
							class="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
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

			{#if !matrixStore.cryptoReady}
				<div
					class="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs"
				>
					<ShieldWarning class="h-3.5 w-3.5 shrink-0" />
					<span>Verschlüsselung nicht verfügbar</span>
				</div>
			{/if}

			<!-- Room List -->
			<div class="flex-1 min-h-0 overflow-hidden">
				<RoomList onCreateRoom={() => (showCreateRoom = true)} onSelectRoom={handleSelectRoom} />
			</div>
		</aside>

		<!-- Main Chat Area -->
		<main
			class="flex flex-1 min-h-0 flex-col overflow-hidden bg-background relative"
			ondragenter={handleDragEnter}
			ondragleave={handleDragLeave}
			ondragover={handleDragOver}
			ondrop={handleDrop}
		>
			<!-- Drop Zone Overlay -->
			<DropZoneOverlay visible={isDragging && !!matrixStore.currentRoom} />

			{#if matrixStore.currentRoom}
				<!-- Room Header -->
				<RoomHeader
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
	</div>
{/if}

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
