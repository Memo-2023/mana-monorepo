<script lang="ts">
	import { matrixStore } from '$lib/matrix';
	import { Send, Paperclip, Smile } from 'lucide-svelte';

	let message = $state('');
	let textarea: HTMLTextAreaElement;
	let typingTimeout: ReturnType<typeof setTimeout>;
	let isTyping = $state(false);

	async function handleSend() {
		const trimmed = message.trim();
		if (!trimmed) return;

		const sent = await matrixStore.sendMessage(trimmed);
		if (sent) {
			message = '';
			stopTyping();
			adjustTextareaHeight();
		}
	}

	function handleInput() {
		adjustTextareaHeight();

		// Send typing indicator
		if (!isTyping) {
			isTyping = true;
			matrixStore.sendTyping(true);
		}

		// Reset typing timeout
		clearTimeout(typingTimeout);
		typingTimeout = setTimeout(stopTyping, 3000);
	}

	function stopTyping() {
		if (isTyping) {
			isTyping = false;
			matrixStore.sendTyping(false);
		}
		clearTimeout(typingTimeout);
	}

	function handleKeydown(e: KeyboardEvent) {
		// Send on Enter (without Shift)
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	function adjustTextareaHeight() {
		if (!textarea) return;
		textarea.style.height = 'auto';
		textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
	}
</script>

<div class="border-t border-base-300 bg-base-100 p-4">
	<div class="flex items-end gap-2">
		<!-- Attachment button -->
		<button class="btn btn-ghost btn-sm" title="Attach file" disabled>
			<Paperclip class="h-5 w-5" />
		</button>

		<!-- Text input -->
		<div class="relative flex-1">
			<textarea
				bind:this={textarea}
				bind:value={message}
				oninput={handleInput}
				onkeydown={handleKeydown}
				onblur={stopTyping}
				placeholder="Write a message..."
				rows="1"
				class="textarea textarea-bordered w-full resize-none pr-10"
				style="max-height: 200px; min-height: 48px;"
			></textarea>

			<!-- Emoji button (inside textarea) -->
			<button
				class="absolute bottom-2 right-2 text-base-content/50 hover:text-base-content"
				title="Add emoji"
				disabled
			>
				<Smile class="h-5 w-5" />
			</button>
		</div>

		<!-- Send button -->
		<button
			class="btn btn-primary"
			onclick={handleSend}
			disabled={!message.trim()}
			title="Send message"
		>
			<Send class="h-5 w-5" />
		</button>
	</div>

	<!-- Hint -->
	<p class="mt-1 text-xs text-base-content/40">
		Press Enter to send, Shift+Enter for new line
	</p>
</div>
