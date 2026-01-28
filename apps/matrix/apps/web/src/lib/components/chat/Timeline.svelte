<script lang="ts">
	import { matrixStore, type SimpleMessage } from '$lib/matrix';
	import Message from './Message.svelte';
	import TypingIndicator from './TypingIndicator.svelte';
	import { onMount, tick } from 'svelte';
	import { Loader2, ArrowDown } from 'lucide-svelte';

	interface Props {
		onReply?: (message: SimpleMessage) => void;
		onEdit?: (message: SimpleMessage) => void;
	}

	let { onReply, onEdit }: Props = $props();

	let container: HTMLDivElement;
	let showScrollButton = $state(false);
	let loadingMore = $state(false);
	let prevMessageCount = $state(0);

	// Auto-scroll to bottom on new messages (if already at bottom)
	$effect(() => {
		const messageCount = matrixStore.messages.length;
		if (messageCount > prevMessageCount && container) {
			const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
			if (isAtBottom) {
				tick().then(() => {
					container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
				});
			}
		}
		prevMessageCount = messageCount;
	});

	function handleScroll() {
		if (!container) return;

		// Show scroll button if not at bottom
		const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
		showScrollButton = distanceFromBottom > 200;

		// Load more when scrolled to top
		if (container.scrollTop < 100 && !loadingMore) {
			loadMore();
		}
	}

	async function loadMore() {
		if (loadingMore) return;

		loadingMore = true;
		const prevScrollHeight = container.scrollHeight;

		await matrixStore.loadMoreMessages(50);

		// Maintain scroll position after loading
		tick().then(() => {
			const newScrollHeight = container.scrollHeight;
			container.scrollTop = newScrollHeight - prevScrollHeight;
		});

		loadingMore = false;
	}

	function scrollToBottom() {
		container?.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
	}

	onMount(() => {
		// Scroll to bottom on mount
		if (container) {
			container.scrollTop = container.scrollHeight;
		}
	});
</script>

<div class="relative flex-1 overflow-hidden">
	<div
		bind:this={container}
		onscroll={handleScroll}
		class="chat-scrollbar h-full overflow-y-auto p-4"
	>
		<!-- Loading indicator at top -->
		{#if loadingMore}
			<div class="flex justify-center py-4">
				<Loader2 class="h-6 w-6 animate-spin text-base-content/50" />
			</div>
		{/if}

		<!-- Messages -->
		<div class="space-y-1">
			{#each matrixStore.messages as message, index (message.id)}
				{@const prevMessage = matrixStore.messages[index - 1]}
				{@const showAvatar = !prevMessage || prevMessage.sender !== message.sender}
				{@const showTimestamp =
					!prevMessage || message.timestamp - prevMessage.timestamp > 5 * 60 * 1000}
				<Message {message} {showAvatar} {showTimestamp} {onReply} {onEdit} />
			{:else}
				<div class="flex h-full flex-col items-center justify-center text-base-content/50">
					<p>No messages yet</p>
					<p class="text-sm">Start the conversation!</p>
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
