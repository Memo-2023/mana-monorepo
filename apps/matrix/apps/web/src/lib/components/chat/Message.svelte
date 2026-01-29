<script lang="ts">
	import type { SimpleMessage } from '$lib/matrix';
	import { matrixStore } from '$lib/matrix';
	import { format, isToday, isYesterday } from 'date-fns';
	import { de } from 'date-fns/locale';
	import {
		Reply,
		Pencil,
		Trash2,
		MoreHorizontal,
		Download,
		FileIcon,
		Play,
		Image as ImageIcon,
	} from 'lucide-svelte';

	interface Props {
		message: SimpleMessage;
		showAvatar?: boolean;
		showTimestamp?: boolean;
		onReply?: (message: SimpleMessage) => void;
		onEdit?: (message: SimpleMessage) => void;
	}

	let { message, showAvatar = true, showTimestamp = false, onReply, onEdit }: Props = $props();

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
		<div class="h-px flex-1 bg-base-300"></div>
		<span class="text-xs text-base-content/50">{formattedDate()}</span>
		<div class="h-px flex-1 bg-base-300"></div>
	</div>
{/if}

<!-- Message -->
<div
	class="group relative flex gap-3 rounded-lg px-2 py-1 hover:bg-base-200/50"
	class:mt-2={showAvatar}
	class:opacity-50={message.redacted}
	role="article"
	onmouseenter={() => (showActions = true)}
	onmouseleave={() => (showActions = false)}
>
	<!-- Avatar Column -->
	<div class="w-10 flex-shrink-0">
		{#if showAvatar && !message.isOwn}
			<div class="avatar placeholder">
				<div class="w-10 rounded-full bg-neutral text-neutral-content">
					<span class="text-xs">{initials}</span>
				</div>
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
				<span class="text-xs text-base-content/40">{formattedTime}</span>
				{#if message.edited}
					<span class="text-xs text-base-content/40">(bearbeitet)</span>
				{/if}
			</div>
		{/if}

		<!-- Reply preview -->
		{#if message.replyTo && message.replyToBody}
			<div
				class="mb-1 flex items-center gap-2 rounded border-l-2 border-primary/50 bg-base-200 px-2 py-1 text-sm"
			>
				<Reply class="h-3 w-3 flex-shrink-0 text-base-content/50" />
				<span class="truncate text-base-content/60">{message.replyToBody}</span>
			</div>
		{/if}

		<!-- Message body -->
		<div class="relative">
			{#if message.redacted}
				<p class="italic text-base-content/50">Nachricht wurde gelöscht</p>
			{:else if message.type === 'm.image' && thumbnailUrl}
				<!-- Image message -->
				<div class="relative max-w-sm">
					{#if imageLoading}
						<div class="flex h-48 w-full items-center justify-center rounded-lg bg-base-200">
							<ImageIcon class="h-8 w-8 animate-pulse text-base-content/30" />
						</div>
					{/if}
					{#if imageError}
						<div class="flex h-32 w-full items-center justify-center rounded-lg bg-base-200">
							<p class="text-sm text-base-content/50">Bild konnte nicht geladen werden</p>
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
					class="flex items-center gap-3 rounded-lg border border-base-300 bg-base-200 p-3 transition-colors hover:bg-base-300"
				>
					<div class="rounded-lg bg-primary/10 p-2">
						<FileIcon class="h-6 w-6 text-primary" />
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate font-medium">{message.media?.filename || message.body}</p>
						<p class="text-sm text-base-content/60">
							{formatFileSize(message.media?.size)}
							{#if message.media?.mimetype}
								• {message.media.mimetype.split('/')[1]?.toUpperCase()}
							{/if}
						</p>
					</div>
					<Download class="h-5 w-5 flex-shrink-0 text-base-content/50" />
				</a>
			{:else if message.type === 'm.emote'}
				<p class="italic text-base-content/80">* {message.senderName} {message.body}</p>
			{:else if message.type === 'm.notice'}
				<p class="text-sm text-base-content/60">{message.body}</p>
			{:else}
				<p class="whitespace-pre-wrap break-words">{message.body}</p>
			{/if}

			<!-- Hover timestamp for grouped messages -->
			{#if !showAvatar}
				<span class="absolute -left-12 top-0 hidden text-xs text-base-content/40 group-hover:inline">
					{formattedTime}
				</span>
			{/if}
		</div>
	</div>

	<!-- Message actions (hover) -->
	{#if showActions && !message.redacted}
		<div class="absolute -top-2 right-2 flex items-center gap-1 rounded-lg border border-base-300 bg-base-100 p-1 shadow-sm">
			<button
				class="btn btn-ghost btn-xs"
				title="Antworten"
				onclick={() => onReply?.(message)}
			>
				<Reply class="h-4 w-4" />
			</button>
			{#if message.isOwn && message.type === 'm.text'}
				<button
					class="btn btn-ghost btn-xs"
					title="Bearbeiten"
					onclick={() => onEdit?.(message)}
				>
					<Pencil class="h-4 w-4" />
				</button>
			{/if}
			{#if message.isOwn}
				<button class="btn btn-ghost btn-xs text-error" title="Löschen" onclick={handleDelete}>
					<Trash2 class="h-4 w-4" />
				</button>
			{/if}
		</div>
	{/if}
</div>
