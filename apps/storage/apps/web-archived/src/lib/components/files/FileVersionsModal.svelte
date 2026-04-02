<script lang="ts">
	import { X, UploadSimple, ClockCounterClockwise } from '@manacore/shared-icons';
	import { filesApi, type StorageFile, type FileVersion } from '$lib/api/client';

	interface Props {
		open: boolean;
		file: StorageFile | null;
		onClose: () => void;
	}

	let { open, file, onClose }: Props = $props();

	let versions = $state<FileVersion[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let uploading = $state(false);
	let comment = $state('');
	let fileInput = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (open && file) {
			loadVersions();
		} else {
			versions = [];
			error = null;
			comment = '';
		}
	});

	async function loadVersions() {
		if (!file) return;
		loading = true;
		error = null;
		try {
			const response = await filesApi.getVersions(file.id);
			if (response.error) {
				error = response.error;
			} else {
				versions = response.data ?? [];
			}
		} catch {
			error = 'Fehler beim Laden der Versionen';
		} finally {
			loading = false;
		}
	}

	function triggerFileSelect() {
		fileInput?.click();
	}

	async function handleFileSelected(e: Event) {
		const input = e.target as HTMLInputElement;
		const selectedFile = input.files?.[0];
		if (!selectedFile || !file) return;

		uploading = true;
		error = null;
		try {
			const response = await filesApi.uploadVersion(
				file.id,
				selectedFile,
				comment.trim() || undefined
			);
			if (response.error) {
				error = response.error;
			} else {
				comment = '';
				await loadVersions();
			}
		} catch {
			error = 'Fehler beim Hochladen der Version';
		} finally {
			uploading = false;
			input.value = '';
		}
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
</script>

{#if open && file}
	<div
		class="modal-overlay"
		onclick={onClose}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="versions-modal-title"
		tabindex="-1"
	>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2 id="versions-modal-title">Versionen - {file.name}</h2>
				<button class="close-button" onclick={onClose} aria-label="Schliessen">
					<X size={20} />
				</button>
			</div>

			<div class="modal-body">
				<!-- Upload new version -->
				<div class="upload-section">
					<div class="comment-input">
						<label for="version-comment">Kommentar (optional)</label>
						<input
							type="text"
							id="version-comment"
							bind:value={comment}
							placeholder="Beschreibung der Aenderungen..."
							disabled={uploading}
						/>
					</div>
					<input
						type="file"
						bind:this={fileInput}
						onchange={handleFileSelected}
						class="hidden-input"
					/>
					<button
						class="upload-btn"
						onclick={triggerFileSelect}
						disabled={uploading}
						aria-label="Neue Version hochladen"
					>
						<UploadSimple size={18} />
						<span>{uploading ? 'Wird hochgeladen...' : 'Neue Version hochladen'}</span>
					</button>
				</div>

				{#if error}
					<div class="error-message">{error}</div>
				{/if}

				<!-- Version list -->
				{#if loading}
					<div class="loading-state">
						<p>Versionen werden geladen...</p>
					</div>
				{:else if versions.length === 0}
					<div class="empty-state">
						<ClockCounterClockwise size={48} />
						<p>Keine Versionen vorhanden</p>
					</div>
				{:else}
					<ul class="version-list">
						{#each versions as version (version.id)}
							<li class="version-item">
								<div class="version-header">
									<span class="version-number">Version {version.versionNumber}</span>
									<span class="version-size">{formatFileSize(version.size)}</span>
								</div>
								<div class="version-meta">
									<span class="version-date">{formatDate(version.createdAt)}</span>
								</div>
								{#if version.comment}
									<p class="version-comment">{version.comment}</p>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	</div>
{/if}

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
		max-width: 520px;
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

	.upload-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid rgb(var(--color-border));
	}

	.comment-input label {
		display: block;
		margin-bottom: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: rgb(var(--color-text-secondary));
	}

	.comment-input input {
		width: 100%;
		padding: 0.625rem 0.75rem;
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		color: rgb(var(--color-text-primary));
	}

	.comment-input input:focus {
		outline: none;
		border-color: rgb(var(--color-primary));
		box-shadow: 0 0 0 3px rgba(var(--color-primary), 0.1);
	}

	.comment-input input:disabled {
		opacity: 0.5;
	}

	.hidden-input {
		display: none;
	}

	.upload-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		background: rgb(var(--color-primary));
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 500;
		color: white;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.upload-btn:hover:not(:disabled) {
		opacity: 0.9;
	}

	.upload-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.error-message {
		padding: 0.75rem;
		margin-bottom: 1rem;
		background: rgba(var(--color-error), 0.1);
		border: 1px solid rgba(var(--color-error), 0.3);
		border-radius: var(--radius-md);
		color: rgb(var(--color-error));
		font-size: 0.875rem;
	}

	.loading-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 2rem;
		color: rgb(var(--color-text-secondary));
	}

	.loading-state p,
	.empty-state p {
		margin: 0;
		font-size: 0.875rem;
	}

	.version-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.version-item {
		padding: 0.75rem;
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-md);
	}

	.version-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.25rem;
	}

	.version-number {
		font-size: 0.875rem;
		font-weight: 600;
		color: rgb(var(--color-text-primary));
	}

	.version-size {
		font-size: 0.8125rem;
		color: rgb(var(--color-text-secondary));
	}

	.version-meta {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.version-date {
		font-size: 0.8125rem;
		color: rgb(var(--color-text-secondary));
	}

	.version-comment {
		margin: 0.5rem 0 0;
		padding: 0.5rem;
		background: rgb(var(--color-surface-elevated));
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		color: rgb(var(--color-text-secondary));
		font-style: italic;
	}

	@media (max-width: 640px) {
		.modal-content {
			max-width: 100%;
			max-height: 100vh;
			margin: 0;
			border-radius: 0;
		}
	}
</style>
