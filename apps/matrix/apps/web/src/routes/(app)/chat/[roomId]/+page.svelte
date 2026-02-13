<script lang="ts">
	import { page } from '$app/stores';
	import { matrixStore, type SimpleMessage } from '$lib/matrix';
	import { RoomHeader, Timeline, MessageInput } from '$lib/components/chat';
	import RoomSettingsPanel from '$lib/components/chat/RoomSettingsPanel.svelte';
	import SearchDialog from '$lib/components/chat/SearchDialog.svelte';
	import ForwardMessageDialog from '$lib/components/chat/ForwardMessageDialog.svelte';
	import { CallView, IncomingCallDialog } from '$lib/components/call';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	// Call state
	let activeCall = $derived(matrixStore.activeCall);
	let incomingCall = $derived(matrixStore.incomingCall);

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
			const wasMobile = isMobile;
			isMobile = window.innerWidth < 1024;

			// If we switched from mobile to desktop, redirect to /chat
			if (wasMobile && !isMobile) {
				goto('/chat');
			}
		});
	}

	// On mount: Select the room and handle desktop redirect
	onMount(() => {
		const roomId = $page.params.roomId;
		if (roomId) {
			const decodedRoomId = decodeURIComponent(roomId);

			// On desktop, redirect to /chat and select the room there
			if (!isMobile) {
				matrixStore.selectRoom(decodedRoomId);
				goto('/chat');
				return;
			}

			// On mobile, select the room and stay on this page
			matrixStore.selectRoom(decodedRoomId);
		}
	});

	// Handle URL changes (e.g., navigating between rooms)
	$effect(() => {
		const roomId = $page.params.roomId;
		if (roomId && isMobile) {
			const decodedRoomId = decodeURIComponent(roomId);
			if (matrixStore.currentRoomId !== decodedRoomId) {
				matrixStore.selectRoom(decodedRoomId);
			}
		}
	});

	function handleBack() {
		goto('/chat');
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

<!-- Full-screen chat view for mobile -->
<div class="flex flex-col h-full bg-background safe-area-top">
	{#if matrixStore.currentRoom}
		<!-- Room Header with back button -->
		<RoomHeader
			showBackButton={true}
			onBackClick={handleBack}
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
		<!-- Loading state -->
		<div class="flex flex-1 items-center justify-center">
			<div class="text-center">
				<div
					class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"
				></div>
				<p class="text-muted-foreground">Lade Raum...</p>
			</div>
		</div>
	{/if}
</div>

<!-- Room Settings Panel -->
<RoomSettingsPanel open={showRoomSettings} onClose={() => (showRoomSettings = false)} />

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
