<script lang="ts">
	import type { SimpleMessage } from '$lib/matrix';
	import { matrixStore } from '$lib/matrix';
	import { format, isToday, isYesterday } from 'date-fns';
	import { de } from 'date-fns/locale';
	import {
		ArrowBendUpLeft,
		PencilSimple,
		Trash,
		DotsThree,
		DownloadSimple,
		File as FileIcon,
		Play,
		Image as ImageIcon,
		Lock,
		Warning,
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
	let imageLoading = $state(true);
	let imageError = $state(false);

	let formattedTime = $derived(format(message.timestamp, 'HH:mm'));

	let formattedDate = $derived(() => {
		const date = new Date(message.timestamp);
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
	class="group relative flex gap-3 rounded-lg px-2 py-1 hover:bg-surface-hover"
	class:mt-2={showAvatar}
	class:opacity-50={message.redacted}
	role="article"
	onmouseenter={() => (showActions = true)}
	onmouseleave={() => (showActions = false)}
>
	<!-- Avatar Column -->
	<div class="w-10 flex-shrink-0">
		{#if showAvatar && !message.isOwn}
			<div
				class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
			>
				<span class="text-xs">{initials}</span>
			</div>
		{/if}
	</div>

	<!-- Content -->
	<div class="min-w-0 flex-1">
		{#if showAvatar}
			<div class="mb-0.5 flex items-baseline gap-2">
				<span class="font-medium" class:text-primary={message.isOwn}>
					{message.isOwn ? 'Du' : message.senderName}
				</span>
				<span class="text-xs text-muted-foreground">{formattedTime}</span>
				{#if message.edited}
					<span class="text-xs text-muted-foreground">(bearbeitet)</span>
				{/if}
				{#if showEncryptionBadge}
					<span title="Verschlüsselt"><Lock class="h-3 w-3 text-success" /></span>
				{/if}
			</div>
		{/if}

		<!-- Reply preview -->
		{#if message.replyTo && message.replyToBody}
			<div
				class="mb-1 flex items-center gap-2 rounded border-l-2 border-primary/50 bg-muted px-2 py-1 text-sm"
			>
				<ArrowBendUpLeft class="h-3 w-3 flex-shrink-0 text-muted-foreground" />
				<span class="truncate text-muted-foreground">{message.replyToBody}</span>
			</div>
		{/if}

		<!-- Message body -->
		<div class="relative">
			{#if message.redacted}
				<p class="italic text-muted-foreground">Nachricht wurde gelöscht</p>
			{:else if isDecryptionError}
				<!-- Decryption error -->
				<div class="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-warning">
					<Warning class="h-4 w-4 flex-shrink-0" />
					<span class="text-sm">
						Nachricht kann nicht entschlüsselt werden. Möglicherweise fehlen Schlüssel.
					</span>
				</div>
			{:else if message.type === 'm.image' && thumbnailUrl}
				<!-- Image message -->
				<div class="relative max-w-sm">
					{#if imageLoading}
						<div class="flex h-48 w-full items-center justify-center rounded-lg bg-muted">
							<ImageIcon class="h-8 w-8 animate-pulse text-muted-foreground" />
						</div>
					{/if}
					{#if imageError}
						<div class="flex h-32 w-full items-center justify-center rounded-lg bg-muted">
							<p class="text-sm text-muted-foreground">Bild konnte nicht geladen werden</p>
						</div>
					{:else}
						<img
							src={thumbnailUrl}
							alt={message.body}
							class="max-h-80 cursor-pointer rounded-lg object-contain"
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
				<div class="relative max-w-sm">
					<div class="group/video relative">
						<img src={thumbnailUrl} alt={message.body} class="rounded-lg" />
						<div
							class="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover/video:opacity-100"
						>
							<Play class="h-12 w-12 text-white" />
						</div>
					</div>
					{#if message.media?.duration}
						<span class="absolute bottom-2 right-2 rounded bg-black/60 px-1 text-xs text-white">
							{Math.floor(message.media.duration / 60)}:{(message.media.duration % 60)
								.toString()
								.padStart(2, '0')}
						</span>
					{/if}
				</div>
			{:else if message.type === 'm.file' || message.type === 'm.audio'}
				<!-- File/Audio message -->
				<a
					href={mediaUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center gap-3 rounded-lg border border-border bg-muted p-3 transition-colors hover:bg-surface-hover"
				>
					<div class="rounded-lg bg-primary/10 p-2">
						<FileIcon class="h-6 w-6 text-primary" />
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate font-medium">{message.media?.filename || message.body}</p>
						<p class="text-sm text-muted-foreground">
							{formatFileSize(message.media?.size)}
							{#if message.media?.mimetype}
								• {message.media.mimetype.split('/')[1]?.toUpperCase()}
							{/if}
						</p>
					</div>
					<DownloadSimple class="h-5 w-5 flex-shrink-0 text-muted-foreground" />
				</a>
			{:else if message.type === 'm.emote'}
				<p class="italic text-muted-foreground">* {message.senderName} {message.body}</p>
			{:else if message.type === 'm.notice'}
				<p class="text-sm text-muted-foreground">{message.body}</p>
			{:else}
				<p class="whitespace-pre-wrap break-words">{message.body}</p>
			{/if}

			<!-- Hover timestamp for grouped messages -->
			{#if !showAvatar}
				<span
					class="absolute -left-12 top-0 hidden text-xs text-muted-foreground group-hover:inline"
				>
					{formattedTime}
				</span>
			{/if}
		</div>
	</div>

	<!-- Message actions (hover) -->
	{#if showActions && !message.redacted}
		<div
			class="absolute -top-2 right-2 flex items-center gap-1 rounded-lg border border-border bg-surface p-1 shadow-sm"
		>
			<button class="btn-ghost rounded p-1" title="Antworten" onclick={() => onReply?.(message)}>
				<ArrowBendUpLeft class="h-4 w-4" />
			</button>
			{#if message.isOwn && message.type === 'm.text'}
				<button class="btn-ghost rounded p-1" title="Bearbeiten" onclick={() => onEdit?.(message)}>
					<PencilSimple class="h-4 w-4" />
				</button>
			{/if}
			{#if message.isOwn}
				<button class="btn-ghost rounded p-1 text-error" title="Löschen" onclick={handleDelete}>
					<Trash class="h-4 w-4" />
				</button>
			{/if}
		</div>
	{/if}
</div>
