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
		Microphone,
		Stop,
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

	// Voice recording state
	let isRecording = $state(false);
	let recordingDuration = $state(0);
	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];
	let recordingInterval: ReturnType<typeof setInterval> | null = null;

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

	// Voice recording functions
	async function startRecording() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
			audioChunks = [];

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunks.push(event.data);
				}
			};

			mediaRecorder.onstop = async () => {
				// Stop all tracks
				stream.getTracks().forEach((track) => track.stop());

				// Create blob and send
				const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
				await sendVoiceMessage(audioBlob);
			};

			mediaRecorder.start(100); // Collect data every 100ms
			isRecording = true;
			recordingDuration = 0;

			// Start duration counter
			recordingInterval = setInterval(() => {
				recordingDuration++;
			}, 1000);
		} catch (err) {
			console.error('Failed to start recording:', err);
		}
	}

	function stopRecording() {
		if (mediaRecorder && isRecording) {
			mediaRecorder.stop();
			isRecording = false;

			if (recordingInterval) {
				clearInterval(recordingInterval);
				recordingInterval = null;
			}
		}
	}

	function cancelRecording() {
		if (mediaRecorder && isRecording) {
			// Stop without sending
			mediaRecorder.ondataavailable = null;
			mediaRecorder.onstop = () => {
				// Just clean up, don't send
			};
			mediaRecorder.stop();
			isRecording = false;

			if (recordingInterval) {
				clearInterval(recordingInterval);
				recordingInterval = null;
			}
		}
	}

	async function sendVoiceMessage(blob: Blob) {
		uploading = true;
		uploadProgress = 0;

		// Create a File from the Blob
		const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });

		const success = await matrixStore.sendFile(file, (progress) => {
			uploadProgress = progress;
		});

		uploading = false;
		uploadProgress = 0;

		if (!success) {
			console.error('Failed to send voice message');
		}
	}

	function formatDuration(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}
</script>

<div class="p-4">
	<!-- Reply/Edit Preview -->
	{#if replyTo || editMessage}
		<div class="mb-3 flex items-center gap-2 rounded-xl glass-card px-4 py-2">
			<div class="flex-1">
				{#if editMessage}
					<p class="text-xs text-muted-foreground">Nachricht bearbeiten</p>
					<p class="truncate text-sm">{editMessage.body}</p>
				{:else if replyTo}
					<p class="text-xs text-muted-foreground">
						Antwort auf <span class="font-medium">{replyTo.senderName}</span>
					</p>
					<p class="truncate text-sm">{replyTo.body}</p>
				{/if}
			</div>
			<button
				class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
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
		<div class="mb-3 flex items-center gap-3 rounded-xl glass-card px-4 py-3">
			<CircleNotch class="h-5 w-5 animate-spin text-primary" />
			<div class="flex-1">
				<div class="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
					<div
						class="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
						style="width: {uploadProgress}%"
					></div>
				</div>
			</div>
			<span class="text-sm text-muted-foreground">{uploadProgress}%</span>
		</div>
	{/if}

	<!-- Recording Indicator -->
	{#if isRecording}
		<div class="mb-3 flex items-center gap-3 rounded-xl glass-card px-4 py-3">
			<div class="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
			<div class="flex-1">
				<p class="text-sm font-medium">Aufnahme läuft...</p>
			</div>
			<span class="text-sm font-mono text-muted-foreground"
				>{formatDuration(recordingDuration)}</span
			>
			<button
				class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
				onclick={cancelRecording}
				title="Abbrechen"
			>
				<X class="h-4 w-4" />
			</button>
		</div>
	{/if}

	<!-- Input Area - Glassmorphic Pill -->
	<div class="flex flex-col gap-2 rounded-2xl glass p-2 shadow-lg">
		<!-- Input Row -->
		<div class="flex items-end gap-3">
			<!-- Attachment button -->
			<div class="dropdown dropdown-top">
				<button
					tabindex="0"
					class="p-2.5 rounded-xl glass-button shadow-sm"
					title="Datei anhängen"
					disabled={uploading}
				>
					<Paperclip class="h-5 w-5 text-muted-foreground" />
				</button>
				<ul tabindex="0" class="dropdown-content z-50 w-48 rounded-xl glass p-2 shadow-xl mb-2">
					<li>
						<button
							onclick={openFilePicker}
							class="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
						>
							<Image class="h-4 w-4" />
							Bild oder Video
						</button>
					</li>
					<li>
						<button
							onclick={openFilePicker}
							class="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
						>
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
			<div class="flex-1 relative">
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
					class="w-full resize-none rounded-xl border-0 bg-transparent
					       px-4 py-3 text-sm text-foreground
					       focus:outline-none focus:ring-0
					       disabled:opacity-50 disabled:cursor-not-allowed
					       placeholder:text-muted-foreground"
					style="max-height: 200px; min-height: 48px;"
					disabled={uploading}
				></textarea>
			</div>

			<!-- Voice/Send button -->
			{#if isRecording}
				<button
					class="flex-shrink-0 p-3 rounded-xl glass-button shadow-md text-red-500"
					onclick={stopRecording}
					title="Aufnahme beenden und senden"
				>
					<Stop class="h-5 w-5" weight="fill" />
				</button>
			{:else if message.trim()}
				<button
					class="flex-shrink-0 p-3 rounded-xl glass-button shadow-md text-primary
					       disabled:opacity-50 disabled:cursor-not-allowed"
					onclick={handleSend}
					disabled={uploading}
					title={editMessage ? 'Speichern' : 'Senden'}
				>
					<PaperPlaneTilt class="h-5 w-5" weight="bold" />
				</button>
			{:else}
				<button
					class="flex-shrink-0 p-3 rounded-xl glass-button shadow-md text-primary
					       disabled:opacity-50 disabled:cursor-not-allowed"
					onclick={startRecording}
					disabled={uploading}
					title="Sprachnotiz aufnehmen"
				>
					<Microphone class="h-5 w-5" weight="bold" />
				</button>
			{/if}
		</div>
	</div>

	<!-- Hint -->
	<p class="text-xs text-muted-foreground text-center mt-2 opacity-70">
		{#if editMessage}
			Enter zum Speichern, Escape zum Abbrechen
		{:else}
			Enter zum Senden, Shift+Enter für neue Zeile
		{/if}
	</p>
</div>
