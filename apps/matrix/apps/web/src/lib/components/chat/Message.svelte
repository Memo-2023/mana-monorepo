<script lang="ts">
	import type { SimpleMessage } from '$lib/matrix';
	import { matrixStore } from '$lib/matrix';
	import { format, isToday, isYesterday, isValid } from 'date-fns';
	import { de } from 'date-fns/locale';
	import {
		ArrowBendUpLeft,
		PencilSimple,
		Trash,
		DotsThree,
		DownloadSimple,
		File as FileIcon,
		Play,
		Pause,
		Image as ImageIcon,
		Lock,
		Warning,
		Smiley,
	} from '@manacore/shared-icons';

	interface Props {
		message: SimpleMessage;
		showAvatar?: boolean;
		showTimestamp?: boolean;
		showEncryptionBadge?: boolean;
		onReply?: (message: SimpleMessage) => void;
		onEdit?: (message: SimpleMessage) => void;
	}

	let {
		message,
		showAvatar = true,
		showTimestamp = false,
		showEncryptionBadge = false,
		onReply,
		onEdit,
	}: Props = $props();

	// Check if message is a decryption error (body starts with "Unable to decrypt:")
	let isDecryptionError = $derived(
		message.body.startsWith('Unable to decrypt:') || message.body.includes('** Unable to decrypt')
	);

	let showActions = $state(false);
	let showEmojiPicker = $state(false);
	let imageLoading = $state(true);
	let imageError = $state(false);

	// Quick reaction emojis
	const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

	async function handleReaction(emoji: string) {
		showEmojiPicker = false;
		await matrixStore.reactToMessage(message.id, emoji);
	}

	// Audio player state
	let audioElement: HTMLAudioElement | null = $state(null);
	let isPlaying = $state(false);
	let audioProgress = $state(0);
	let audioDuration = $state(0);

	function toggleAudio() {
		if (!audioElement) return;
		if (isPlaying) {
			audioElement.pause();
		} else {
			audioElement.play();
		}
	}

	function handleAudioTimeUpdate() {
		if (!audioElement) return;
		audioProgress = audioElement.currentTime;
	}

	function handleAudioLoadedMetadata() {
		if (!audioElement) return;
		audioDuration = audioElement.duration;
	}

	function handleAudioEnded() {
		isPlaying = false;
		audioProgress = 0;
	}

	function seekAudio(e: MouseEvent) {
		if (!audioElement || !audioDuration) return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const percent = (e.clientX - rect.left) / rect.width;
		audioElement.currentTime = percent * audioDuration;
	}

	function formatAudioTime(seconds: number): string {
		if (!seconds || isNaN(seconds)) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	let formattedTime = $derived(() => {
		const date = new Date(message.timestamp);
		if (!isValid(date)) return '--:--';
		return format(date, 'HH:mm');
	});

	let formattedDate = $derived(() => {
		const date = new Date(message.timestamp);
		if (!isValid(date)) return '';
		if (isToday(date)) return 'Heute';
		if (isYesterday(date)) return 'Gestern';
		return format(date, 'EEEE, d. MMMM', { locale: de });
	});

	let initials = $derived(
		message.senderName
			.split(' ')
			.map((w) => w[0])
			.join('')
			.substring(0, 2)
			.toUpperCase()
	);

	// Get media URL for display
	let mediaUrl = $derived(
		message.media?.mxcUrl ? matrixStore.getMediaUrl(message.media.mxcUrl) : null
	);

	let thumbnailUrl = $derived(
		message.media?.thumbnailUrl
			? matrixStore.getMediaUrl(message.media.thumbnailUrl)
			: message.media?.mxcUrl
				? matrixStore.getMediaUrl(message.media.mxcUrl, 400, 400)
				: null
	);

	// Format file size
	function formatFileSize(bytes?: number): string {
		if (!bytes) return '';
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	// Handle message deletion
	async function handleDelete() {
		if (confirm('Nachricht wirklich löschen?')) {
			await matrixStore.deleteMessage(message.id);
		}
	}
</script>

<!-- Date separator -->
{#if showTimestamp}
	<div class="my-4 flex items-center gap-4">
		<div class="h-px flex-1 bg-border"></div>
		<span class="text-xs text-muted-foreground">{formattedDate()}</span>
		<div class="h-px flex-1 bg-border"></div>
	</div>
{/if}

<!-- Message -->
<div
	class="group flex gap-3 mb-4 animate-fade-in {message.isOwn ? 'flex-row-reverse' : 'flex-row'}"
	class:opacity-50={message.redacted}
	role="article"
	onmouseenter={() => (showActions = true)}
	onmouseleave={() => (showActions = false)}
>
	<!-- Avatar -->
	{#if showAvatar}
		<div
			class="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-md
				   {message.isOwn
				? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
				: 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'}"
		>
			<span class="text-xs font-semibold">{initials}</span>
		</div>
	{:else}
		<div class="w-9 flex-shrink-0"></div>
	{/if}

	<!-- Message Content -->
	<div class="flex flex-col {message.isOwn ? 'items-end' : 'items-start'} max-w-[75%] relative">
		<!-- Sender name (for others only) -->
		{#if showAvatar && !message.isOwn}
			<span class="text-xs text-muted-foreground mb-1 px-1">{message.senderName}</span>
		{/if}

		<!-- Reply preview -->
		{#if message.replyTo && message.replyToBody}
			<div
				class="mb-1 flex items-center gap-2 rounded-lg glass-card px-3 py-1.5 text-sm max-w-full"
			>
				<ArrowBendUpLeft class="h-3 w-3 flex-shrink-0 text-muted-foreground" />
				<span class="truncate text-muted-foreground text-xs">{message.replyToBody}</span>
			</div>
		{/if}

		<!-- Message Bubble -->
		<div
			class="relative px-4 py-3 shadow-md
				   {message.isOwn
				? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl rounded-tr-md'
				: 'bg-white dark:bg-white/10 text-foreground border border-black/5 dark:border-white/10 rounded-2xl rounded-tl-md'}"
		>
			{#if message.redacted}
				<p class="italic text-white/70">Nachricht wurde gelöscht</p>
			{:else if isDecryptionError}
				<!-- Decryption error -->
				<div class="flex items-center gap-2 text-amber-200">
					<Warning class="h-4 w-4 flex-shrink-0" />
					<span class="text-sm"> Kann nicht entschlüsselt werden </span>
				</div>
			{:else if message.type === 'm.image' && thumbnailUrl}
				<!-- Image message -->
				<div class="relative">
					{#if imageLoading}
						<div class="flex h-48 w-full items-center justify-center rounded-lg bg-black/10">
							<ImageIcon class="h-8 w-8 animate-pulse text-white/50" />
						</div>
					{/if}
					{#if imageError}
						<div class="flex h-32 w-full items-center justify-center rounded-lg bg-black/10">
							<p class="text-sm text-white/70">Bild konnte nicht geladen werden</p>
						</div>
					{:else}
						<img
							src={thumbnailUrl}
							alt={message.body}
							class="max-h-80 max-w-xs cursor-pointer rounded-lg object-contain"
							class:hidden={imageLoading}
							onload={() => (imageLoading = false)}
							onerror={() => {
								imageLoading = false;
								imageError = true;
							}}
							onclick={() => mediaUrl && window.open(mediaUrl, '_blank')}
						/>
					{/if}
				</div>
			{:else if message.type === 'm.video' && thumbnailUrl}
				<!-- Video message -->
				<div class="relative">
					<div class="group/video relative">
						<img src={thumbnailUrl} alt={message.body} class="rounded-lg max-w-xs" />
						<div
							class="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover/video:opacity-100 rounded-lg"
						>
							<Play class="h-12 w-12 text-white" />
						</div>
					</div>
					{#if message.media?.duration}
						<span
							class="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white"
						>
							{Math.floor(message.media.duration / 60)}:{(message.media.duration % 60)
								.toString()
								.padStart(2, '0')}
						</span>
					{/if}
				</div>
			{:else if message.type === 'm.audio'}
				<!-- Audio message (voice note) -->
				<div
					class="flex items-center gap-3 rounded-lg {message.isOwn
						? 'bg-white/20'
						: 'bg-black/5 dark:bg-white/5'} p-3 min-w-[220px]"
				>
					<!-- Hidden audio element -->
					{#if mediaUrl}
						<audio
							bind:this={audioElement}
							src={mediaUrl}
							onplay={() => (isPlaying = true)}
							onpause={() => (isPlaying = false)}
							ontimeupdate={handleAudioTimeUpdate}
							onloadedmetadata={handleAudioLoadedMetadata}
							onended={handleAudioEnded}
						></audio>
					{/if}

					<!-- Play/Pause button -->
					<button
						class="flex-shrink-0 rounded-full {message.isOwn
							? 'bg-white/20 hover:bg-white/30'
							: 'bg-primary/10 hover:bg-primary/20'} p-2.5 transition-colors"
						onclick={toggleAudio}
					>
						{#if isPlaying}
							<Pause
								class="h-5 w-5 {message.isOwn ? 'text-white' : 'text-primary'}"
								weight="fill"
							/>
						{:else}
							<Play class="h-5 w-5 {message.isOwn ? 'text-white' : 'text-primary'}" weight="fill" />
						{/if}
					</button>

					<!-- Waveform/Progress -->
					<div class="flex-1 flex flex-col gap-1">
						<!-- Progress bar -->
						<button
							class="relative h-1.5 w-full rounded-full {message.isOwn
								? 'bg-white/20'
								: 'bg-black/10 dark:bg-white/10'} overflow-hidden cursor-pointer"
							onclick={seekAudio}
						>
							<div
								class="absolute inset-y-0 left-0 {message.isOwn
									? 'bg-white'
									: 'bg-primary'} rounded-full transition-all"
								style="width: {audioDuration > 0 ? (audioProgress / audioDuration) * 100 : 0}%"
							></div>
						</button>
						<!-- Duration -->
						<div
							class="flex justify-between text-xs {message.isOwn
								? 'text-white/70'
								: 'text-muted-foreground'}"
						>
							<span>{formatAudioTime(audioProgress)}</span>
							<span>{formatAudioTime(audioDuration || message.media?.duration || 0)}</span>
						</div>
					</div>
				</div>
			{:else if message.type === 'm.file'}
				<!-- File message -->
				<a
					href={mediaUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center gap-3 rounded-lg {message.isOwn
						? 'bg-white/20 hover:bg-white/30'
						: 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'} p-3 transition-colors"
				>
					<div class="rounded-lg {message.isOwn ? 'bg-white/20' : 'bg-primary/10'} p-2">
						<FileIcon class="h-5 w-5 {message.isOwn ? 'text-white' : 'text-primary'}" />
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate font-medium text-sm">{message.media?.filename || message.body}</p>
						<p class="text-xs {message.isOwn ? 'text-white/70' : 'text-muted-foreground'}">
							{formatFileSize(message.media?.size)}
							{#if message.media?.mimetype}
								• {message.media.mimetype.split('/')[1]?.toUpperCase()}
							{/if}
						</p>
					</div>
					<DownloadSimple
						class="h-4 w-4 flex-shrink-0 {message.isOwn
							? 'text-white/70'
							: 'text-muted-foreground'}"
					/>
				</a>
			{:else if message.type === 'm.emote'}
				<p class="italic {message.isOwn ? 'text-white/80' : 'text-muted-foreground'}">
					* {message.senderName}
					{message.body}
				</p>
			{:else if message.type === 'm.notice'}
				<p class="text-sm {message.isOwn ? 'text-white/80' : 'text-muted-foreground'}">
					{message.body}
				</p>
			{:else}
				<p class="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{message.body}</p>
			{/if}

			{#if message.edited}
				<span class="text-xs {message.isOwn ? 'text-white/60' : 'text-muted-foreground'} mt-1 block"
					>(bearbeitet)</span
				>
			{/if}

			{#if showEncryptionBadge}
				<Lock class="absolute -bottom-1 -right-1 h-3 w-3 text-green-500" />
			{/if}
		</div>

		<!-- Reactions display -->
		{#if message.reactions && message.reactions.length > 0}
			<div class="flex flex-wrap gap-1 mt-1.5 {message.isOwn ? 'justify-end' : 'justify-start'}">
				{#each message.reactions as reaction}
					<button
						class="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors
							   {reaction.includesMe
							? 'bg-primary/20 border border-primary/40 text-primary'
							: 'bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/20'}"
						title={reaction.users.join(', ')}
						onclick={() => handleReaction(reaction.key)}
					>
						<span>{reaction.key}</span>
						<span class="font-medium">{reaction.count}</span>
					</button>
				{/each}
			</div>
		{/if}

		<!-- Time (shown on hover) -->
		<div
			class="flex items-center gap-2 mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity"
		>
			<span class="text-xs text-muted-foreground">{formattedTime()}</span>
		</div>

		<!-- Message actions (hover) -->
		{#if showActions && !message.redacted}
			<div
				class="absolute {message.isOwn
					? '-left-28'
					: '-right-28'} top-0 flex items-center gap-1 rounded-xl glass p-1.5 shadow-lg"
			>
				<!-- Emoji reaction button -->
				<div class="relative">
					<button
						class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
						title="Reaktion"
						onclick={() => (showEmojiPicker = !showEmojiPicker)}
					>
						<Smiley class="h-4 w-4 text-muted-foreground" />
					</button>
					{#if showEmojiPicker}
						<!-- Emoji picker backdrop -->
						<button
							class="fixed inset-0 z-40"
							onclick={() => (showEmojiPicker = false)}
							aria-label="Schließen"
						></button>
						<!-- Emoji picker dropdown -->
						<div
							class="absolute {message.isOwn
								? 'right-0'
								: 'left-0'} bottom-full mb-2 z-50 flex gap-1 rounded-xl bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 p-2 shadow-xl"
						>
							{#each quickEmojis as emoji}
								<button
									class="text-xl hover:scale-125 transition-transform p-1"
									onclick={() => handleReaction(emoji)}
								>
									{emoji}
								</button>
							{/each}
						</div>
					{/if}
				</div>
				<button
					class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
					title="Antworten"
					onclick={() => onReply?.(message)}
				>
					<ArrowBendUpLeft class="h-4 w-4 text-muted-foreground" />
				</button>
				{#if message.isOwn && message.type === 'm.text'}
					<button
						class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
						title="Bearbeiten"
						onclick={() => onEdit?.(message)}
					>
						<PencilSimple class="h-4 w-4 text-muted-foreground" />
					</button>
				{/if}
				{#if message.isOwn}
					<button
						class="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
						title="Löschen"
						onclick={handleDelete}
					>
						<Trash class="h-4 w-4 text-red-500" />
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>
