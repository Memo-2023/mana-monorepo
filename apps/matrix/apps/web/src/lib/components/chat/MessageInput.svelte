<script lang="ts">
	import { matrixStore, type SimpleMessage } from '$lib/matrix';
	import {
		PaperPlaneTilt,
		Paperclip,
		Smiley,
		X,
		Image,
		File as FileIcon,
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
	let showAttachMenu = $state(false);

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
		const filename = `voice-${Date.now()}.webm`;
		const file = new File([blob], filename, { type: 'audio/webm' });

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

<div class="p-3 pb-4 lg:pb-20">
	<!-- Reply/Edit Preview -->
	{#if replyTo || editMessage}
		<div
			class="mb-2 flex items-center gap-2 rounded-xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 px-3 py-2"
		>
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
		<div
			class="mb-2 flex items-center gap-3 rounded-xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 px-3 py-2"
		>
			<CircleNotch class="h-4 w-4 animate-spin text-primary" />
			<div class="flex-1">
				<div class="h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
					<div
						class="h-full bg-primary transition-all duration-300"
						style="width: {uploadProgress}%"
					></div>
				</div>
			</div>
			<span class="text-xs text-muted-foreground">{uploadProgress}%</span>
		</div>
	{/if}

	<!-- Recording Indicator -->
	{#if isRecording}
		<div
			class="mb-2 flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2"
		>
			<div class="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"></div>
			<p class="flex-1 text-sm font-medium text-red-700 dark:text-red-400">Aufnahme...</p>
			<span class="text-sm font-mono text-red-600 dark:text-red-400"
				>{formatDuration(recordingDuration)}</span
			>
			<button
				class="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
				onclick={cancelRecording}
				title="Abbrechen"
			>
				<X class="h-4 w-4 text-red-500" />
			</button>
		</div>
	{/if}

	<!-- Input Area -->
	<div
		class="flex items-end gap-2 rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-black/5 dark:border-white/10 p-2 shadow-lg"
	>
		<!-- Attachment button with custom dropdown -->
		<div class="relative">
			<button
				class="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
				title="Datei anhängen"
				disabled={uploading}
				onclick={() => (showAttachMenu = !showAttachMenu)}
			>
				<Paperclip class="h-5 w-5 text-muted-foreground" />
			</button>

			{#if showAttachMenu}
				<!-- Backdrop -->
				<button
					class="fixed inset-0 z-40"
					onclick={() => (showAttachMenu = false)}
					aria-label="Menü schließen"
				></button>
				<!-- Dropdown menu -->
				<div
					class="absolute bottom-full left-0 mb-2 z-50 w-44 rounded-xl bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 p-1.5 shadow-xl"
				>
					<button
						onclick={() => {
							openFilePicker();
							showAttachMenu = false;
						}}
						class="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-sm"
					>
						<Image class="h-4 w-4" />
						Bild oder Video
					</button>
					<button
						onclick={() => {
							openFilePicker();
							showAttachMenu = false;
						}}
						class="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-sm"
					>
						<FileIcon class="h-4 w-4" />
						Datei
					</button>
				</div>
			{/if}
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
		<div class="flex-1">
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
				class="w-full resize-none bg-transparent px-2 py-2.5 text-sm text-foreground
				       focus:outline-none placeholder:text-muted-foreground"
				style="max-height: 150px; min-height: 40px;"
				disabled={uploading}
			></textarea>
		</div>

		<!-- Voice/Send button -->
		{#if isRecording}
			<button
				class="flex-shrink-0 p-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors"
				onclick={stopRecording}
				title="Aufnahme beenden und senden"
			>
				<Stop class="h-5 w-5" weight="fill" />
			</button>
		{:else if message.trim()}
			<button
				class="flex-shrink-0 p-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white transition-colors
				       disabled:opacity-50 disabled:cursor-not-allowed"
				onclick={handleSend}
				disabled={uploading}
				title={editMessage ? 'Speichern' : 'Senden'}
			>
				<PaperPlaneTilt class="h-5 w-5" weight="bold" />
			</button>
		{:else}
			<button
				class="flex-shrink-0 p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-primary transition-colors
				       disabled:opacity-50 disabled:cursor-not-allowed"
				onclick={startRecording}
				disabled={uploading}
				title="Sprachnotiz aufnehmen"
			>
				<Microphone class="h-5 w-5" weight="bold" />
			</button>
		{/if}
	</div>

	<!-- Hint -->
	<p class="text-[10px] text-muted-foreground/60 text-center mt-1.5">
		{#if editMessage}
			Enter = Speichern · Escape = Abbrechen
		{:else}
			Enter = Senden · Shift+Enter = Neue Zeile
		{/if}
	</p>
</div>
