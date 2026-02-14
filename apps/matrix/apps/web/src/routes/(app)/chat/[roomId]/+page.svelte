<script lang="ts">
	import { page } from '$app/stores';
	import { matrixStore, type SimpleMessage } from '$lib/matrix';
	import { RoomHeader, Timeline, MessageInput, DropZoneOverlay } from '$lib/components/chat';
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

	// Swipe-back gesture state
	let touchStartX = 0;
	let touchStartY = 0;
	let isSwiping = $state(false);
	let swipeProgress = $state(0);
	const SWIPE_THRESHOLD = 100; // px to trigger back navigation
	const EDGE_ZONE = 30; // px from left edge to start swipe

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
		// Use history.back() if we came from the chat list, otherwise goto
		if (browser && window.history.length > 1) {
			window.history.back();
		} else {
			goto('/chat');
		}
	}

	// Touch event handlers for swipe-back gesture
	function handleTouchStart(e: TouchEvent) {
		const touch = e.touches[0];
		// Only start swipe if touch begins in the left edge zone
		if (touch.clientX <= EDGE_ZONE) {
			touchStartX = touch.clientX;
			touchStartY = touch.clientY;
			isSwiping = true;
			swipeProgress = 0;
		}
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isSwiping) return;

		const touch = e.touches[0];
		const deltaX = touch.clientX - touchStartX;
		const deltaY = Math.abs(touch.clientY - touchStartY);

		// Cancel if vertical movement is greater than horizontal (scrolling)
		if (deltaY > Math.abs(deltaX)) {
			isSwiping = false;
			swipeProgress = 0;
			return;
		}

		// Only track right swipe
		if (deltaX > 0) {
			swipeProgress = Math.min(deltaX / SWIPE_THRESHOLD, 1);
			// Prevent default to avoid scroll interference
			if (deltaX > 10) {
				e.preventDefault();
			}
		}
	}

	function handleTouchEnd() {
		if (!isSwiping) return;

		// Navigate back if swipe threshold reached
		if (swipeProgress >= 1) {
			handleBack();
		}

		// Reset state
		isSwiping = false;
		swipeProgress = 0;
	}

	function handleTouchCancel() {
		isSwiping = false;
		swipeProgress = 0;
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

<!-- Full-screen chat view for mobile -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="flex flex-col h-full bg-background safe-area-top relative"
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
	ontouchcancel={handleTouchCancel}
	ondragenter={handleDragEnter}
	ondragleave={handleDragLeave}
	ondragover={handleDragOver}
	ondrop={handleDrop}
>
	<!-- Drop Zone Overlay -->
	<DropZoneOverlay visible={isDragging && !!matrixStore.currentRoom} />

	<!-- Swipe-back visual indicator -->
	{#if isSwiping && swipeProgress > 0}
		<div
			class="absolute inset-y-0 left-0 w-1 bg-primary/50 z-50 transition-all"
			style="transform: scaleX({swipeProgress * 3}); transform-origin: left;"
		></div>
		<div
			class="absolute top-1/2 left-2 -translate-y-1/2 z-50 transition-all"
			style="opacity: {swipeProgress}; transform: translateY(-50%) translateX({swipeProgress *
				20}px);"
		>
			<div
				class="w-10 h-10 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center"
			>
				<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
			</div>
		</div>
	{/if}
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
