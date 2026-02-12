<script lang="ts">
	import { matrixStore, type SimpleMessage } from '$lib/matrix';
	import Message from './Message.svelte';
	import TypingIndicator from './TypingIndicator.svelte';
	import { tick } from 'svelte';
	import { CircleNotch, ArrowDown } from '@manacore/shared-icons';

	interface Props {
		onReply?: (message: SimpleMessage) => void;
		onEdit?: (message: SimpleMessage) => void;
		onForward?: (message: SimpleMessage) => void;
	}

	let { onReply, onEdit, onForward }: Props = $props();

	// Check if current room is encrypted
	let isRoomEncrypted = $derived(matrixStore.currentSimpleRoom?.isEncrypted ?? false);

	let container: HTMLDivElement;
	let showScrollButton = $state(false);
	let loadingMore = $state(false);
	let prevMessageCount = $state(0);
	let hasInitiallyScrolled = $state(false);
	let currentRoomId = $state<string | null>(null);
	// Track if user manually scrolled up (to read history)
	let userScrolledUp = $state(false);

	// Reset state when room changes
	$effect(() => {
		const roomId = matrixStore.currentRoomId;
		if (roomId !== currentRoomId) {
			currentRoomId = roomId;
			hasInitiallyScrolled = false;
			prevMessageCount = 0;
			loadingMore = false;
			showScrollButton = false;
			userScrolledUp = false;
		}
	});

	// Initial scroll to bottom when messages first load, and auto-scroll on new messages
	$effect(() => {
		const messageCount = matrixStore.messages.length;

		// Initial scroll when messages first appear for this room
		if (messageCount > 0 && !hasInitiallyScrolled && container) {
			tick().then(() => {
				if (container) {
					container.scrollTop = container.scrollHeight;
					hasInitiallyScrolled = true;
					prevMessageCount = messageCount;
				}
			});
			return;
		}

		// Auto-scroll on new messages (only if user hasn't manually scrolled up)
		if (messageCount > prevMessageCount && container && hasInitiallyScrolled) {
			if (!userScrolledUp) {
				// Use double tick to ensure DOM has rendered the new message
				tick().then(() => {
					tick().then(() => {
						if (container) {
							container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
						}
					});
				});
			}
		}
		prevMessageCount = messageCount;
	});

	function handleScroll() {
		if (!container) return;

		// Calculate distance from bottom
		const distanceFromBottom =
			container.scrollHeight - container.scrollTop - container.clientHeight;

		// Track if user manually scrolled up (more than 150px from bottom)
		// Reset when they scroll back to bottom (within 50px)
		if (distanceFromBottom > 150) {
			userScrolledUp = true;
		} else if (distanceFromBottom < 50) {
			userScrolledUp = false;
		}

		// Show scroll button if not at bottom
		showScrollButton = distanceFromBottom > 200;

		// Load more when scrolled to top (only after initial scroll and with messages present)
		if (
			container.scrollTop < 100 &&
			!loadingMore &&
			hasInitiallyScrolled &&
			matrixStore.messages.length > 0
		) {
			loadMore();
		}
	}

	async function loadMore() {
		if (loadingMore) return;

		loadingMore = true;
		const prevScrollHeight = container.scrollHeight;

		await matrixStore.loadMoreMessages(50);

		// Maintain scroll position after loading
		await tick();
		if (container) {
			const newScrollHeight = container.scrollHeight;
			container.scrollTop = newScrollHeight - prevScrollHeight;
		}

		loadingMore = false;
	}

	function scrollToBottom() {
		userScrolledUp = false;
		container?.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
	}
</script>

<div class="relative flex-1 min-h-0 overflow-hidden">
	<div
		bind:this={container}
		onscroll={handleScroll}
		class="chat-scrollbar h-full overflow-y-auto p-4"
	>
		<!-- Loading indicator at top -->
		{#if loadingMore}
			<div class="flex justify-center py-4">
				<CircleNotch class="h-6 w-6 animate-spin text-base-content/50" />
			</div>
		{/if}

		<!-- Messages -->
		<div class="space-y-0">
			{#each matrixStore.messages as message, index (message.id)}
				{@const prevMessage = matrixStore.messages[index - 1]}
				{@const nextMessage = matrixStore.messages[index + 1]}
				{@const isSameSender = Boolean(prevMessage && prevMessage.sender === message.sender)}
				{@const isNextSameSender = Boolean(nextMessage && nextMessage.sender === message.sender)}
				{@const prevDate = prevMessage ? new Date(prevMessage.timestamp).toDateString() : null}
				{@const currentDate = new Date(message.timestamp).toDateString()}
				{@const nextDate = nextMessage ? new Date(nextMessage.timestamp).toDateString() : null}
				{@const showDateSeparator = Boolean(prevMessage && prevDate !== currentDate)}
				{@const showAvatar = !isSameSender || showDateSeparator}
				{@const isLastInGroup = !isNextSameSender || Boolean(nextDate && nextDate !== currentDate)}
				<Message
					{message}
					{showAvatar}
					showTimestamp={showDateSeparator}
					{isSameSender}
					{isLastInGroup}
					showEncryptionBadge={isRoomEncrypted}
					{onReply}
					{onEdit}
					{onForward}
				/>
			{:else}
				<div class="flex h-full flex-col items-center justify-center text-base-content/50">
					<p>Noch keine Nachrichten</p>
					<p class="text-sm">Starte die Konversation!</p>
				</div>
			{/each}
		</div>

		<!-- Typing Indicator -->
		{#if matrixStore.currentRoomTyping.length > 0}
			<TypingIndicator users={matrixStore.currentRoomTyping} />
		{/if}
	</div>

	<!-- Scroll to bottom button -->
	{#if showScrollButton}
		<button
			onclick={scrollToBottom}
			class="absolute bottom-4 right-4 btn btn-circle btn-sm shadow-lg"
		>
			<ArrowDown class="h-4 w-4" />
		</button>
	{/if}
</div>
