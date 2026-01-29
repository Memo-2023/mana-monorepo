<script lang="ts">
	import { matrixStore, type SimpleMessage } from '$lib/matrix';
	import {
		PaperPlaneTilt,
		Paperclip,
		Smiley,
		X,
		Image,
		File,
		CircleNotch,
	} from '@manacore/shared-icons';

	interface Props {
		replyTo?: SimpleMessage | null;
		editMessage?: SimpleMessage | null;
		onCancelReply?: () => void;
		onCancelEdit?: () => void;
	}

	let { replyTo = null, editMessage = null, onCancelReply, onCancelEdit }: Props = $props();

	let message = $state('');
	let textarea: HTMLTextAreaElement;
	let fileInput: HTMLInputElement;
	let typingTimeout: ReturnType<typeof setTimeout>;
	let isTyping = $state(false);
	let uploading = $state(false);
	let uploadProgress = $state(0);

	// Set message content when editing
	$effect(() => {
		if (editMessage) {
			message = editMessage.body;
			textarea?.focus();
		}
	});

	async function handleSend() {
		const trimmed = message.trim();
		if (!trimmed) return;

		let success = false;

		if (editMessage) {
			// Edit existing message
			success = await matrixStore.editMessage(editMessage.id, trimmed);
			if (success) {
				onCancelEdit?.();
			}
		} else if (replyTo) {
			// Reply to message
			success = await matrixStore.replyToMessage(replyTo.id, trimmed);
			if (success) {
				onCancelReply?.();
			}
		} else {
			// Normal message
			success = await matrixStore.sendMessage(trimmed);
		}

		if (success) {
			message = '';
			stopTyping();
			adjustTextareaHeight();
		}
	}

	function handleInput() {
		adjustTextareaHeight();

		// Send typing indicator
		if (!isTyping && !editMessage) {
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
		// Cancel on Escape
		if (e.key === 'Escape') {
			if (editMessage) {
				onCancelEdit?.();
				message = '';
			} else if (replyTo) {
				onCancelReply?.();
			}
		}
	}

	function adjustTextareaHeight() {
		if (!textarea) return;
		textarea.style.height = 'auto';
		textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
	}

	function openFilePicker() {
		fileInput?.click();
	}

	async function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploading = true;
		uploadProgress = 0;

		const success = await matrixStore.sendFile(file, (progress) => {
			uploadProgress = progress;
		});

		uploading = false;
		uploadProgress = 0;
		input.value = ''; // Reset input

		if (!success) {
			// Show error toast or notification
			console.error('Failed to upload file');
		}
	}
</script>

<div class="border-t border-base-300 bg-base-100">
	<!-- Reply/Edit Preview -->
	{#if replyTo || editMessage}
		<div class="flex items-center gap-2 border-b border-base-300 bg-base-200/50 px-4 py-2">
			<div class="flex-1">
				{#if editMessage}
					<p class="text-xs text-base-content/60">Nachricht bearbeiten</p>
					<p class="truncate text-sm">{editMessage.body}</p>
				{:else if replyTo}
					<p class="text-xs text-base-content/60">
						Antwort auf <span class="font-medium">{replyTo.senderName}</span>
					</p>
					<p class="truncate text-sm">{replyTo.body}</p>
				{/if}
			</div>
			<button
				class="btn btn-ghost btn-xs"
				onclick={() => {
					if (editMessage) {
						onCancelEdit?.();
						message = '';
					} else {
						onCancelReply?.();
					}
				}}
			>
				<X class="h-4 w-4" />
			</button>
		</div>
	{/if}

	<!-- Upload Progress -->
	{#if uploading}
		<div class="flex items-center gap-3 px-4 py-2">
			<CircleNotch class="h-5 w-5 animate-spin text-primary" />
			<div class="flex-1">
				<div class="h-2 overflow-hidden rounded-full bg-base-300">
					<div
						class="h-full bg-primary transition-all duration-300"
						style="width: {uploadProgress}%"
					></div>
				</div>
			</div>
			<span class="text-sm text-base-content/60">{uploadProgress}%</span>
		</div>
	{/if}

	<!-- Input Area -->
	<div class="p-4">
		<div class="flex items-end gap-2">
			<!-- Attachment button -->
			<div class="dropdown dropdown-top">
				<button
					tabindex="0"
					class="btn btn-ghost btn-sm"
					title="Datei anhängen"
					disabled={uploading}
				>
					<Paperclip class="h-5 w-5" />
				</button>
				<ul
					tabindex="0"
					class="dropdown-content menu rounded-box z-50 w-48 bg-base-100 p-2 shadow-lg"
				>
					<li>
						<button onclick={openFilePicker}>
							<Image class="h-4 w-4" />
							Bild oder Video
						</button>
					</li>
					<li>
						<button onclick={openFilePicker}>
							<File class="h-4 w-4" />
							Datei
						</button>
					</li>
				</ul>
			</div>

			<!-- Hidden file input -->
			<input
				bind:this={fileInput}
				type="file"
				class="hidden"
				accept="*/*"
				onchange={handleFileSelect}
			/>

			<!-- Text input -->
			<div class="relative flex-1">
				<textarea
					bind:this={textarea}
					bind:value={message}
					oninput={handleInput}
					onkeydown={handleKeydown}
					onblur={stopTyping}
					placeholder={editMessage
						? 'Nachricht bearbeiten...'
						: replyTo
							? 'Antwort schreiben...'
							: 'Nachricht schreiben...'}
					rows="1"
					class="textarea textarea-bordered w-full resize-none pr-10"
					style="max-height: 200px; min-height: 48px;"
					disabled={uploading}
				></textarea>

				<!-- Emoji button (inside textarea) -->
				<button
					class="absolute bottom-2 right-2 text-base-content/50 hover:text-base-content"
					title="Emoji hinzufügen"
					disabled
				>
					<Smiley class="h-5 w-5" />
				</button>
			</div>

			<!-- Send button -->
			<button
				class="btn btn-primary"
				onclick={handleSend}
				disabled={!message.trim() || uploading}
				title={editMessage ? 'Speichern' : 'Senden'}
			>
				<PaperPlaneTilt class="h-5 w-5" />
			</button>
		</div>

		<!-- Hint -->
		<p class="mt-1 text-xs text-base-content/40">
			{#if editMessage}
				Enter zum Speichern, Escape zum Abbrechen
			{:else}
				Enter zum Senden, Shift+Enter für neue Zeile
			{/if}
		</p>
	</div>
</div>
