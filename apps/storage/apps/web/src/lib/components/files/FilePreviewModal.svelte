<script lang="ts">
	import {
		X,
		DownloadSimple,
		PencilSimple,
		ShareNetwork,
		Heart,
		Trash,
		ClockCounterClockwise,
		File,
		FileImage,
		FileText,
		FileVideo,
		FileAudio,
		FileZip,
		Play,
		Pause,
	} from '@manacore/shared-icons';
	import type { StorageFile } from '$lib/api/client';
	import { authStore } from '$lib/stores/auth.svelte';
	import FileVersionsModal from './FileVersionsModal.svelte';
	import { audioPlayerStore, getAudioFiles } from '$lib/stores/audio-player.svelte';
	import { browser } from '$app/environment';

	interface Props {
		open: boolean;
		file: StorageFile | null;
		/** All files in the current folder (for building audio queue) */
		allFiles?: StorageFile[];
		onClose: () => void;
		onAction: (action: string, file: StorageFile) => void;
	}

	let { open, file, allFiles = [], onClose, onAction }: Props = $props();

	let showVersions = $state(false);

	let isImage = $derived(file?.mimeType.startsWith('image/') ?? false);
	let isAudio = $derived(file?.mimeType.startsWith('audio/') ?? false);
	let isVideo = $derived(file?.mimeType.startsWith('video/') ?? false);
	let isPdf = $derived(file?.mimeType === 'application/pdf');
	let isTextOrCode = $derived(
		file?.mimeType.startsWith('text/') ||
			file?.mimeType.includes('javascript') ||
			file?.mimeType.includes('json') ||
			file?.mimeType.includes('xml') ||
			file?.mimeType.includes('yaml') ||
			file?.mimeType.includes('markdown') ||
			false
	);
	let isMarkdown = $derived(
		file?.name.endsWith('.md') || file?.mimeType.includes('markdown') || false
	);

	let imageUrl = $derived(
		isImage && file ? `http://localhost:3016/api/v1/files/${file.id}/download` : null
	);

	/** Presigned URL for video/PDF preview */
	let presignedUrl = $state<string | null>(null);
	let textContent = $state<string | null>(null);
	let textLoading = $state(false);

	// Fetch presigned URL for video/PDF when file changes
	$effect(() => {
		presignedUrl = null;
		textContent = null;

		if (!file || !browser) return;

		if (isVideo || isPdf) {
			fetchPresignedUrl(file.id);
		} else if (isTextOrCode) {
			fetchTextContent(file.id);
		}
	});

	async function fetchPresignedUrl(fileId: string) {
		try {
			const token = await authStore.getAccessToken();
			const res = await fetch(`http://localhost:3016/api/v1/files/${fileId}/download?url=true`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const data = await res.json();
				presignedUrl = data.url;
			}
		} catch (e) {
			console.warn('Failed to get presigned URL:', e);
		}
	}

	async function fetchTextContent(fileId: string) {
		textLoading = true;
		try {
			const token = await authStore.getAccessToken();
			const res = await fetch(`http://localhost:3016/api/v1/files/${fileId}/download`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const text = await res.text();
				// Limit preview to ~50KB to avoid performance issues
				textContent = text.length > 50000 ? text.slice(0, 50000) + '\n\n… (gekürzt)' : text;
			}
		} catch (e) {
			console.warn('Failed to fetch text content:', e);
		} finally {
			textLoading = false;
		}
	}

	/** Check if this file is currently playing in the global player */
	let isCurrentlyPlaying = $derived(
		audioPlayerStore.currentFile?.id === file?.id && audioPlayerStore.isPlaying
	);

	function handlePlayAudio() {
		if (!file) return;

		// If this file is already playing, toggle play/pause
		if (audioPlayerStore.currentFile?.id === file.id) {
			audioPlayerStore.togglePlay();
			return;
		}

		// Build queue from all audio files in the folder
		const audioFiles = getAudioFiles(allFiles);
		const currentIndex = audioFiles.findIndex((f) => f.id === file!.id);
		const audioFile = { id: file.id, name: file.name, mimeType: file.mimeType, size: file.size };

		if (audioFiles.length > 0 && currentIndex >= 0) {
			audioPlayerStore.playFile(audioFile, audioFiles, currentIndex);
		} else {
			audioPlayerStore.playFile(audioFile);
		}
	}

	function getFileIcon(mimeType: string) {
		if (mimeType.startsWith('image/')) return FileImage;
		if (mimeType.startsWith('video/')) return FileVideo;
		if (mimeType.startsWith('audio/')) return FileAudio;
		if (mimeType.startsWith('text/')) return FileText;
		if (mimeType.includes('zip') || mimeType.includes('archive')) return FileZip;
		return File;
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	/** Simple markdown to HTML renderer (no external dependency) */
	function renderMarkdown(md: string): string {
		let html = md
			// Escape HTML
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			// Code blocks (``` ... ```)
			.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
			// Inline code
			.replace(/`([^`]+)`/g, '<code>$1</code>')
			// Headers
			.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
			.replace(/^### (.+)$/gm, '<h3>$1</h3>')
			.replace(/^## (.+)$/gm, '<h2>$1</h2>')
			.replace(/^# (.+)$/gm, '<h1>$1</h1>')
			// Bold & italic
			.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.+?)\*/g, '<em>$1</em>')
			// Links
			.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
			// Unordered lists
			.replace(/^[*-] (.+)$/gm, '<li>$1</li>')
			// Horizontal rules
			.replace(/^---$/gm, '<hr>')
			// Paragraphs (double newlines)
			.replace(/\n\n/g, '</p><p>');

		// Wrap loose <li> in <ul>
		html = html.replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');

		return `<p>${html}</p>`;
	}

	function handleAction(action: string) {
		if (file) {
			onAction(action, file);
		}
	}
</script>

{#if open && file}
	{@const Icon = getFileIcon(file.mimeType)}
	<div
		class="modal-overlay"
		onclick={onClose}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="preview-modal-title"
		tabindex="-1"
	>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2 id="preview-modal-title">{file.name}</h2>
				<button class="close-button" onclick={onClose} aria-label="Schließen">
					<X size={20} />
				</button>
			</div>

			<div class="modal-body">
				<div class="preview-area">
					{#if isImage && imageUrl}
						<img src={imageUrl} alt={file.name} class="image-preview" />
					{:else if isVideo}
						{#if presignedUrl}
							<!-- svelte-ignore a11y_media_has_caption -->
							<video src={presignedUrl} controls class="video-preview" preload="metadata">
								Dein Browser unterstützt kein Video.
							</video>
						{:else}
							<div class="no-preview">
								<FileVideo size={48} />
								<p>Video wird geladen…</p>
							</div>
						{/if}
					{:else if isAudio}
						<div class="audio-preview">
							<button
								class="audio-play-btn"
								onclick={handlePlayAudio}
								aria-label={isCurrentlyPlaying ? 'Pause' : 'Abspielen'}
							>
								<div class="audio-play-icon">
									{#if isCurrentlyPlaying}
										<Pause size={32} weight="fill" />
									{:else}
										<Play size={32} weight="fill" />
									{/if}
								</div>
							</button>
							<p class="audio-label">{isCurrentlyPlaying ? 'Wird abgespielt' : 'Abspielen'}</p>
						</div>
					{:else if isPdf}
						{#if presignedUrl}
							<iframe src={presignedUrl} class="pdf-preview" title="PDF Vorschau: {file.name}"
							></iframe>
						{:else}
							<div class="no-preview">
								<Icon size={48} />
								<p>PDF wird geladen…</p>
							</div>
						{/if}
					{:else if isTextOrCode}
						{#if textLoading}
							<div class="no-preview">
								<Icon size={48} />
								<p>Inhalt wird geladen…</p>
							</div>
						{:else if textContent !== null}
							{#if isMarkdown}
								<div class="text-preview markdown-preview">
									{@html renderMarkdown(textContent)}
								</div>
							{:else}
								<pre class="text-preview"><code>{textContent}</code></pre>
							{/if}
						{:else}
							<div class="no-preview">
								<Icon size={64} />
								<p>Vorschau nicht verfügbar</p>
							</div>
						{/if}
					{:else}
						<div class="no-preview">
							<Icon size={64} />
						</div>
					{/if}
				</div>

				<div class="file-details">
					<div class="detail-row">
						<span class="detail-label">Name</span>
						<span class="detail-value">{file.name}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Typ</span>
						<span class="detail-value">{file.mimeType}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Größe</span>
						<span class="detail-value">{formatFileSize(file.size)}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Erstellt</span>
						<span class="detail-value">{formatDate(file.createdAt)}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Geändert</span>
						<span class="detail-value">{formatDate(file.updatedAt)}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Favorit</span>
						<span class="detail-value">{file.isFavorite ? 'Ja' : 'Nein'}</span>
					</div>
				</div>
			</div>

			<div class="modal-actions">
				<button
					class="action-btn"
					onclick={() => handleAction('download')}
					aria-label="Herunterladen"
				>
					<DownloadSimple size={18} />
					<span>Herunterladen</span>
				</button>
				<button class="action-btn" onclick={() => handleAction('rename')} aria-label="Umbenennen">
					<PencilSimple size={18} />
					<span>Umbenennen</span>
				</button>
				<button class="action-btn" onclick={() => handleAction('share')} aria-label="Teilen">
					<ShareNetwork size={18} />
					<span>Teilen</span>
				</button>
				<button class="action-btn" onclick={() => (showVersions = true)} aria-label="Versionen">
					<ClockCounterClockwise size={18} />
					<span>Versionen</span>
				</button>
				<button
					class="action-btn"
					class:favorited={file.isFavorite}
					onclick={() => handleAction('favorite')}
					aria-label={file.isFavorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
				>
					<Heart size={18} fill={file.isFavorite ? 'currentColor' : 'none'} />
					<span>{file.isFavorite ? 'Favorit entfernen' : 'Favorit'}</span>
				</button>
				<button
					class="action-btn danger"
					onclick={() => handleAction('delete')}
					aria-label="Löschen"
				>
					<Trash size={18} />
					<span>Löschen</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<FileVersionsModal open={showVersions} {file} onClose={() => (showVersions = false)} />

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(4px);
	}

	.modal-content {
		background: rgb(var(--color-surface-elevated));
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-xl);
		width: 100%;
		max-width: 700px;
		max-height: 90vh;
		margin: 1rem;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid rgb(var(--color-border));
		flex-shrink: 0;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: rgb(var(--color-text-primary));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
		padding-right: 1rem;
	}

	.close-button {
		padding: 0.25rem;
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: rgb(var(--color-text-secondary));
		cursor: pointer;
		flex-shrink: 0;
	}

	.close-button:hover {
		background: rgb(var(--color-surface));
		color: rgb(var(--color-text-primary));
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
		min-height: 0;
	}

	.preview-area {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		margin-bottom: 1.5rem;
		background: rgb(var(--color-surface));
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.image-preview {
		max-width: 100%;
		max-height: 400px;
		object-fit: contain;
	}

	.video-preview {
		width: 100%;
		max-height: 400px;
		border-radius: var(--radius-md);
		background: #000;
	}

	.pdf-preview {
		width: 100%;
		height: 500px;
		border: none;
		border-radius: var(--radius-md);
	}

	.text-preview {
		width: 100%;
		max-height: 400px;
		overflow: auto;
		padding: 1rem;
		margin: 0;
		font-size: 0.8125rem;
		line-height: 1.6;
		color: rgb(var(--color-text-primary));
		background: rgb(var(--color-surface));
		border-radius: var(--radius-md);
		text-align: left;
		white-space: pre-wrap;
		word-break: break-word;
		font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
		tab-size: 4;
	}

	.text-preview code {
		font-family: inherit;
		font-size: inherit;
	}

	.markdown-preview {
		font-family: inherit;
		white-space: normal;
	}

	.markdown-preview :global(h1) {
		font-size: 1.375rem;
		font-weight: 700;
		margin: 0 0 0.5rem;
	}

	.markdown-preview :global(h2) {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 1rem 0 0.375rem;
	}

	.markdown-preview :global(h3) {
		font-size: 1rem;
		font-weight: 600;
		margin: 0.75rem 0 0.25rem;
	}

	.markdown-preview :global(code) {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 0.8em;
		padding: 0.125rem 0.375rem;
		background: rgb(var(--color-border) / 0.5);
		border-radius: var(--radius-sm);
	}

	.markdown-preview :global(pre) {
		background: rgb(var(--color-surface-elevated));
		padding: 0.75rem;
		border-radius: var(--radius-md);
		overflow-x: auto;
		margin: 0.5rem 0;
	}

	.markdown-preview :global(pre code) {
		padding: 0;
		background: none;
	}

	.markdown-preview :global(ul) {
		padding-left: 1.25rem;
		margin: 0.375rem 0;
	}

	.markdown-preview :global(li) {
		margin: 0.125rem 0;
	}

	.markdown-preview :global(hr) {
		border: none;
		border-top: 1px solid rgb(var(--color-border));
		margin: 0.75rem 0;
	}

	.markdown-preview :global(a) {
		color: rgb(var(--color-primary));
		text-decoration: underline;
	}

	.markdown-preview :global(strong) {
		font-weight: 600;
	}

	.audio-preview {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 2rem;
	}

	.audio-play-btn {
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0;
	}

	.audio-play-icon {
		width: 4.5rem;
		height: 4.5rem;
		border-radius: 50%;
		background: rgb(var(--color-primary));
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 200ms ease;
		box-shadow: 0 4px 20px rgb(var(--color-primary) / 0.3);
	}

	.audio-play-btn:hover .audio-play-icon {
		transform: scale(1.08);
		box-shadow: 0 6px 28px rgb(var(--color-primary) / 0.4);
	}

	.audio-label {
		margin: 0;
		font-size: 0.8125rem;
		font-weight: 500;
		color: rgb(var(--color-text-secondary));
	}

	.no-preview {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 2rem;
		color: rgb(var(--color-text-secondary));
	}

	.no-preview p {
		margin: 0;
		font-size: 0.875rem;
	}

	.file-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.375rem 0;
		border-bottom: 1px solid rgb(var(--color-border));
	}

	.detail-row:last-child {
		border-bottom: none;
	}

	.detail-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: rgb(var(--color-text-secondary));
	}

	.detail-value {
		font-size: 0.875rem;
		color: rgb(var(--color-text-primary));
		text-align: right;
		word-break: break-all;
		max-width: 60%;
	}

	.modal-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 1rem 1.5rem;
		border-top: 1px solid rgb(var(--color-border));
		flex-shrink: 0;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
		font-weight: 500;
		color: rgb(var(--color-text-primary));
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.action-btn:hover {
		background: rgb(var(--color-surface-elevated));
		border-color: rgb(var(--color-text-secondary));
	}

	.action-btn.favorited {
		color: rgb(var(--color-warning));
	}

	.action-btn.danger {
		color: rgb(var(--color-error));
	}

	.action-btn.danger:hover {
		background: rgb(var(--color-error));
		border-color: rgb(var(--color-error));
		color: white;
	}

	@media (max-width: 640px) {
		.modal-content {
			max-width: 100%;
			max-height: 100vh;
			margin: 0;
			border-radius: 0;
		}

		.modal-actions {
			justify-content: center;
		}

		.action-btn span {
			display: none;
		}

		.action-btn {
			padding: 0.625rem;
		}
	}
</style>
