<script lang="ts">
	import { matrixStore, type SimpleMessage, type RoomMember } from '$lib/matrix';
	import { userSettings } from '$lib/stores/userSettings.svelte';
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
		User,
	} from '@mana/shared-icons';

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

	// @mention autocomplete state
	let showMentionPicker = $state(false);
	let mentionQuery = $state('');
	let mentionStartPos = $state(0);
	let mentionResults = $state<RoomMember[]>([]);
	let selectedMentionIndex = $state(0);

	// Emoji picker state
	let showEmojiPicker = $state(false);
	const MAX_RECENT_EMOJIS = 16; // 2 rows of 8

	// Recent emojis from user settings (synced across apps)
	let recentEmojis = $derived(userSettings.globalSettings?.recentEmojis ?? []);

	// Add emoji to recent list (saves to mana-auth)
	function addToRecentEmojis(emoji: string) {
		const current = userSettings.globalSettings?.recentEmojis ?? [];
		// Remove if already exists, then add to front
		const filtered = current.filter((e) => e !== emoji);
		const updated = [emoji, ...filtered].slice(0, MAX_RECENT_EMOJIS);
		// Update server (optimistic update handled by store)
		userSettings.updateGlobal({ recentEmojis: updated });
	}

	const commonEmojis = [
		// Smileys
		'😀',
		'😃',
		'😄',
		'😁',
		'😅',
		'😂',
		'🤣',
		'😊',
		'😇',
		'🙂',
		'😉',
		'😌',
		'😍',
		'🥰',
		'😘',
		'😗',
		'😙',
		'😚',
		'😋',
		'😛',
		'😜',
		'🤪',
		'😝',
		'🤗',
		'🤭',
		'🤫',
		'🤔',
		'🤐',
		'🤨',
		'😐',
		'😑',
		'😶',
		'😏',
		'😒',
		'🙄',
		'😬',
		'😮',
		'🤯',
		'😳',
		'🥺',
		'😢',
		'😭',
		'😤',
		'😠',
		'😡',
		'🤬',
		'😈',
		'👿',
		// Gestures
		'👍',
		'👎',
		'👌',
		'🤌',
		'✌️',
		'🤞',
		'🤟',
		'🤘',
		'🤙',
		'👋',
		'🖐️',
		'✋',
		'👏',
		'🙌',
		'👐',
		'🤲',
		'🙏',
		'💪',
		'🦾',
		'❤️',
		'🧡',
		'💛',
		'💚',
		'💙',
		// Objects & Symbols
		'🔥',
		'✨',
		'💫',
		'⭐',
		'🌟',
		'💯',
		'💢',
		'💥',
		'💦',
		'💨',
		'🎉',
		'🎊',
		'🎁',
		'🏆',
		'🥇',
		'🎯',
		'💡',
		'📌',
		'📍',
		'✅',
		'❌',
		'⚠️',
		'❗',
		'❓',
	];

	function insertEmoji(emoji: string) {
		const cursorPos = textarea?.selectionStart ?? message.length;
		const before = message.slice(0, cursorPos);
		const after = message.slice(cursorPos);
		message = before + emoji + after;

		// Add to recent emojis
		addToRecentEmojis(emoji);

		// Close picker and focus textarea
		showEmojiPicker = false;
		setTimeout(() => {
			textarea?.focus();
			const newPos = cursorPos + emoji.length;
			textarea?.setSelectionRange(newPos, newPos);
		}, 0);
	}

	function handleEmojiClick() {
		// Try to open native emoji picker (works on some browsers/OS)
		if ('showPicker' in HTMLInputElement.prototype) {
			// This is for date/color inputs, won't work for emoji but we try
		}

		// Check if we're on mobile - keyboard usually has emoji button
		const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
		if (isMobile) {
			// On mobile, just focus the textarea - user can use keyboard emoji button
			textarea?.focus();
			return;
		}

		// Desktop fallback: show our emoji picker
		showEmojiPicker = !showEmojiPicker;
	}

	// Set message content when editing
	$effect(() => {
		if (editMessage) {
			message = editMessage.body;
			textarea?.focus();
		}
	});

	// Auto-focus input when room changes or component mounts
	$effect(() => {
		const roomId = matrixStore.currentRoomId;
		if (roomId && textarea) {
			// Small delay to ensure DOM is ready
			setTimeout(() => textarea?.focus(), 50);
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

		// Check for @mention trigger
		checkForMention();
	}

	function checkForMention() {
		if (!textarea) return;

		const cursorPos = textarea.selectionStart;
		const textBeforeCursor = message.slice(0, cursorPos);

		// Find the last @ before cursor
		const lastAtIndex = textBeforeCursor.lastIndexOf('@');

		if (lastAtIndex !== -1) {
			// Check if there's a space before @ (or it's at the start)
			const charBefore = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
			if (charBefore === ' ' || charBefore === '\n' || lastAtIndex === 0) {
				const query = textBeforeCursor.slice(lastAtIndex + 1);
				// No space in the query = still typing the mention
				if (!query.includes(' ') && query.length <= 50) {
					mentionStartPos = lastAtIndex;
					mentionQuery = query;
					showMentionPicker = true;
					updateMentionResults(query);
					return;
				}
			}
		}

		// Close mention picker if conditions not met
		showMentionPicker = false;
		mentionQuery = '';
	}

	function updateMentionResults(query: string) {
		const members = matrixStore.getRoomMembers();
		const lowerQuery = query.toLowerCase();

		// Filter members by display name or user ID
		mentionResults = members
			.filter(
				(m) =>
					m.membership === 'join' &&
					(m.displayName.toLowerCase().includes(lowerQuery) ||
						m.userId.toLowerCase().includes(lowerQuery))
			)
			.slice(0, 6); // Limit to 6 results

		selectedMentionIndex = 0;
	}

	function insertMention(member: RoomMember) {
		const beforeMention = message.slice(0, mentionStartPos);
		const afterMention = message.slice(textarea.selectionStart);

		// Insert pill format: @displayName (the actual Matrix pill is sent as formatted HTML)
		const mentionText = `@${member.displayName} `;
		message = beforeMention + mentionText + afterMention;

		// Close picker
		showMentionPicker = false;
		mentionQuery = '';

		// Focus and set cursor position
		setTimeout(() => {
			textarea.focus();
			const newPos = mentionStartPos + mentionText.length;
			textarea.setSelectionRange(newPos, newPos);
		}, 0);
	}

	function stopTyping() {
		if (isTyping) {
			isTyping = false;
			matrixStore.sendTyping(false);
		}
		clearTimeout(typingTimeout);
	}

	function handleKeydown(e: KeyboardEvent) {
		// Handle mention picker navigation
		if (showMentionPicker && mentionResults.length > 0) {
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				selectedMentionIndex = (selectedMentionIndex + 1) % mentionResults.length;
				return;
			}
			if (e.key === 'ArrowUp') {
				e.preventDefault();
				selectedMentionIndex =
					selectedMentionIndex === 0 ? mentionResults.length - 1 : selectedMentionIndex - 1;
				return;
			}
			if (e.key === 'Enter' || e.key === 'Tab') {
				e.preventDefault();
				insertMention(mentionResults[selectedMentionIndex]);
				return;
			}
			if (e.key === 'Escape') {
				e.preventDefault();
				showMentionPicker = false;
				return;
			}
		}

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

<div class="p-3 pb-4 safe-area-bottom">
	<!-- Reply/Edit Preview -->
	{#if replyTo || editMessage}
		<div class="mb-2 flex items-center gap-2 rounded-xl bg-surface border border-border px-3 py-2">
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
				class="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
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
		<div class="mb-2 flex items-center gap-3 rounded-xl bg-surface border border-border px-3 py-2">
			<CircleNotch class="h-4 w-4 animate-spin text-primary" />
			<div class="flex-1">
				<div class="h-1.5 overflow-hidden rounded-full bg-muted">
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

	<!-- @Mention Picker -->
	{#if showMentionPicker && mentionResults.length > 0}
		<div class="mb-2 rounded-xl bg-surface-elevated border border-border shadow-xl overflow-hidden">
			<div class="px-3 py-1.5 text-xs text-muted-foreground border-b border-border">
				Erwähne jemanden
			</div>
			{#each mentionResults as member, i}
				<button
					class="flex items-center gap-3 w-full px-3 py-2 transition-colors text-left
					       {i === selectedMentionIndex
						? 'bg-violet-500/10 dark:bg-violet-500/20'
						: 'hover:bg-surface-hover'}"
					onclick={() => insertMention(member)}
				>
					<!-- Avatar -->
					{#if member.avatarUrl}
						<img
							src={member.avatarUrl}
							alt={member.displayName}
							class="w-8 h-8 rounded-full object-cover"
						/>
					{:else}
						<div
							class="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"
						>
							<User class="w-4 h-4 text-white" />
						</div>
					{/if}
					<!-- Name and ID -->
					<div class="flex-1 min-w-0">
						<p class="font-medium text-sm truncate">{member.displayName}</p>
						<p class="text-xs text-muted-foreground truncate">{member.userId}</p>
					</div>
				</button>
			{/each}
		</div>
	{/if}

	<!-- Input Area - WhatsApp style -->
	<div class="flex items-end gap-2">
		<!-- Attachment button (left, outside input) -->
		<div class="relative flex-shrink-0">
			<button
				class="p-2.5 rounded-full hover:bg-surface-hover transition-colors"
				title="Datei anhängen"
				disabled={uploading}
				onclick={() => (showAttachMenu = !showAttachMenu)}
			>
				<Paperclip size={22} class="text-muted-foreground" />
			</button>

			{#if showAttachMenu}
				<!-- Backdrop -->
				<button
					class="fixed inset-0 z-40 lg:bg-transparent bg-black/40"
					onclick={() => (showAttachMenu = false)}
					aria-label="Menü schließen"
				></button>
				<!-- Desktop: Dropdown above button -->
				<div
					class="hidden lg:block absolute bottom-full left-0 mb-2 z-50 w-44 rounded-xl bg-surface-elevated border border-border p-1.5 shadow-xl"
				>
					<button
						onclick={() => {
							openFilePicker();
							showAttachMenu = false;
						}}
						class="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors text-sm"
					>
						<Image class="h-4 w-4" />
						Bild oder Video
					</button>
					<button
						onclick={() => {
							openFilePicker();
							showAttachMenu = false;
						}}
						class="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors text-sm"
					>
						<FileIcon class="h-4 w-4" />
						Datei
					</button>
				</div>
				<!-- Mobile: Bottom sheet -->
				<div
					class="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-elevated border-t border-border rounded-t-2xl safe-area-bottom animate-slide-up"
				>
					<div class="p-2">
						<button
							onclick={() => {
								openFilePicker();
								showAttachMenu = false;
							}}
							class="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl active:bg-surface-hover transition-colors"
						>
							<Image class="h-5 w-5 text-muted-foreground" />
							<span class="text-sm font-medium">Bild oder Video</span>
						</button>
						<button
							onclick={() => {
								openFilePicker();
								showAttachMenu = false;
							}}
							class="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl active:bg-surface-hover transition-colors"
						>
							<FileIcon class="h-5 w-5 text-muted-foreground" />
							<span class="text-sm font-medium">Datei</span>
						</button>
					</div>
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

		<!-- Text input with emoji button inside -->
		<div
			class="relative flex-1 flex items-end rounded-full bg-surface border border-border px-4 py-1"
		>
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
				class="flex-1 resize-none bg-transparent py-2.5 text-sm text-foreground
				       focus:outline-none placeholder:text-muted-foreground"
				style="max-height: 150px; min-height: 40px;"
				disabled={uploading}
			></textarea>
			<!-- Emoji button inside input -->
			<button
				class="flex-shrink-0 p-1.5 rounded-full hover:bg-surface-hover transition-colors mb-1"
				title="Emoji"
				onclick={handleEmojiClick}
			>
				<Smiley size={22} class="text-muted-foreground" />
			</button>

			<!-- Emoji Picker -->
			{#if showEmojiPicker}
				<!-- Backdrop -->
				<button
					class="fixed inset-0 z-40 lg:bg-transparent bg-black/40"
					onclick={() => (showEmojiPicker = false)}
					aria-label="Emoji-Picker schließen"
				></button>
				<!-- Desktop: Popup above input -->
				<div
					class="hidden lg:block absolute bottom-full right-0 mb-2 z-50 w-72 max-h-80 overflow-y-auto rounded-xl bg-surface-elevated border border-border p-2 shadow-xl"
				>
					{#if recentEmojis.length > 0}
						<div class="mb-2">
							<p class="text-[10px] text-muted-foreground uppercase font-medium px-1 mb-1">
								Häufig benutzt
							</p>
							<div class="grid grid-cols-8 gap-1">
								{#each recentEmojis as emoji}
									<button
										class="p-1.5 text-xl hover:bg-surface-hover rounded-lg transition-colors"
										onclick={() => insertEmoji(emoji)}
									>
										{emoji}
									</button>
								{/each}
							</div>
						</div>
						<div class="border-t border-border my-2"></div>
					{/if}
					<div class="grid grid-cols-8 gap-1">
						{#each commonEmojis as emoji}
							<button
								class="p-1.5 text-xl hover:bg-surface-hover rounded-lg transition-colors"
								onclick={() => insertEmoji(emoji)}
							>
								{emoji}
							</button>
						{/each}
					</div>
				</div>
				<!-- Mobile: Bottom sheet -->
				<div
					class="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-elevated border-t border-border rounded-t-2xl safe-area-bottom animate-slide-up"
				>
					<div class="p-3 max-h-[50vh] overflow-y-auto">
						{#if recentEmojis.length > 0}
							<div class="mb-3">
								<p class="text-[10px] text-muted-foreground uppercase font-medium px-1 mb-1">
									Häufig benutzt
								</p>
								<div class="grid grid-cols-8 gap-1">
									{#each recentEmojis as emoji}
										<button
											class="p-2 text-2xl active:scale-90 rounded-lg transition-transform"
											onclick={() => insertEmoji(emoji)}
										>
											{emoji}
										</button>
									{/each}
								</div>
							</div>
							<div class="border-t border-border my-2"></div>
						{/if}
						<div class="grid grid-cols-8 gap-1">
							{#each commonEmojis as emoji}
								<button
									class="p-2 text-2xl active:scale-90 rounded-lg transition-transform"
									onclick={() => insertEmoji(emoji)}
								>
									{emoji}
								</button>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Voice/Send button (right, outside input) -->
		{#if isRecording}
			<button
				class="flex-shrink-0 p-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
				onclick={stopRecording}
				title="Aufnahme beenden und senden"
			>
				<Stop size={22} weight="fill" />
			</button>
		{:else if message.trim()}
			<button
				class="flex-shrink-0 p-2.5 rounded-full bg-primary hover:bg-primary/90 text-white transition-colors
				       disabled:opacity-50 disabled:cursor-not-allowed"
				onclick={handleSend}
				disabled={uploading}
				title={editMessage ? 'Speichern' : 'Senden'}
			>
				<PaperPlaneTilt size={22} weight="fill" />
			</button>
		{:else}
			<button
				class="flex-shrink-0 p-2.5 rounded-full hover:bg-surface-hover text-muted-foreground hover:text-primary transition-colors
				       disabled:opacity-50 disabled:cursor-not-allowed"
				onclick={startRecording}
				disabled={uploading}
				title="Sprachnotiz aufnehmen"
			>
				<Microphone size={22} weight="bold" />
			</button>
		{/if}
	</div>

	<!-- Hint (desktop only) -->
	<p class="hidden lg:block text-[10px] text-muted-foreground/60 text-center mt-1.5">
		{#if editMessage}
			Enter = Speichern · Escape = Abbrechen
		{:else}
			Enter = Senden · Shift+Enter = Neue Zeile
		{/if}
	</p>
</div>
