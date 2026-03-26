<script lang="ts">
	import { X, Link, Copy, Check } from '@manacore/shared-icons';
	import { sharesApi } from '$lib/api/client';
	import type { Share } from '$lib/api/client';
	import { toastStore } from '@manacore/shared-ui';

	interface Props {
		open: boolean;
		fileId?: string | null;
		folderId?: string | null;
		fileName?: string;
		onClose: () => void;
	}

	let { open, fileId = null, folderId = null, fileName = '', onClose }: Props = $props();

	let accessLevel = $state<'view' | 'edit' | 'download'>('view');
	let password = $state('');
	let maxDownloads = $state<number | undefined>(undefined);
	let expiresInDays = $state<number | undefined>(undefined);
	let creating = $state(false);
	let createdShare = $state<Share | null>(null);
	let copied = $state(false);

	let shareUrl = $derived(
		createdShare ? `${window.location.origin}/public/share/${createdShare.shareToken}` : ''
	);

	function reset() {
		accessLevel = 'view';
		password = '';
		maxDownloads = undefined;
		expiresInDays = undefined;
		creating = false;
		createdShare = null;
		copied = false;
	}

	function handleClose() {
		reset();
		onClose();
	}

	async function handleCreate() {
		creating = true;
		try {
			const result = await sharesApi.create({
				fileId: fileId || undefined,
				folderId: folderId || undefined,
				accessLevel,
				password: password || undefined,
				maxDownloads: maxDownloads || undefined,
				expiresAt: expiresInDays
					? new Date(Date.now() + expiresInDays * 86400000).toISOString()
					: undefined,
			});
			if (result.data) {
				createdShare = result.data;
			} else {
				toastStore.error(result.error || 'Fehler beim Erstellen des Links');
			}
		} catch {
			toastStore.error('Fehler beim Erstellen des Links');
		} finally {
			creating = false;
		}
	}

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			copied = true;
			toastStore.success('Link kopiert');
			setTimeout(() => (copied = false), 2000);
		} catch {
			toastStore.error('Kopieren fehlgeschlagen');
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') handleClose();
	}
</script>

{#if open}
	<div
		class="modal-overlay"
		onclick={handleClose}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-label="Teilen"
		tabindex="-1"
	>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>
					<Link size={18} />
					{createdShare ? 'Link erstellt' : 'Teilen'}
				</h2>
				<button class="close-btn" onclick={handleClose} aria-label="Schließen">
					<X size={20} />
				</button>
			</div>

			{#if createdShare}
				<!-- Success: show link -->
				<div class="modal-body">
					<p class="share-info">
						Link für <strong>{fileName}</strong> wurde erstellt.
					</p>
					<div class="link-row">
						<input type="text" readonly value={shareUrl} class="link-input" />
						<button class="copy-btn" onclick={handleCopy} aria-label="Link kopieren">
							{#if copied}
								<Check size={18} />
							{:else}
								<Copy size={18} />
							{/if}
						</button>
					</div>
					<div class="share-details">
						<span class="detail"
							>Zugriff: {accessLevel === 'view'
								? 'Ansehen'
								: accessLevel === 'download'
									? 'Herunterladen'
									: 'Bearbeiten'}</span
						>
						{#if createdShare.expiresAt}
							<span class="detail"
								>Läuft ab: {new Date(createdShare.expiresAt).toLocaleDateString('de-DE')}</span
							>
						{/if}
						{#if createdShare.maxDownloads}
							<span class="detail">Max. Downloads: {createdShare.maxDownloads}</span>
						{/if}
						{#if password}
							<span class="detail">Passwortgeschützt</span>
						{/if}
					</div>
				</div>
				<div class="modal-actions">
					<button class="btn primary" onclick={handleClose}>Fertig</button>
				</div>
			{:else}
				<!-- Form: create share -->
				<div class="modal-body">
					<p class="share-info">
						Erstelle einen Link zum Teilen von <strong>{fileName}</strong>.
					</p>

					<div class="form-group">
						<label for="access-level">Zugriff</label>
						<select id="access-level" bind:value={accessLevel}>
							<option value="view">Nur ansehen</option>
							<option value="download">Herunterladen erlaubt</option>
							<option value="edit">Bearbeiten erlaubt</option>
						</select>
					</div>

					<div class="form-group">
						<label for="expires">Gültigkeit</label>
						<select id="expires" bind:value={expiresInDays}>
							<option value={undefined}>Kein Ablaufdatum</option>
							<option value={1}>1 Tag</option>
							<option value={7}>7 Tage</option>
							<option value={30}>30 Tage</option>
							<option value={90}>90 Tage</option>
						</select>
					</div>

					<div class="form-group">
						<label for="max-downloads">Max. Downloads</label>
						<input
							id="max-downloads"
							type="number"
							min="1"
							placeholder="Unbegrenzt"
							bind:value={maxDownloads}
						/>
					</div>

					<div class="form-group">
						<label for="password">Passwort (optional)</label>
						<input
							id="password"
							type="password"
							placeholder="Kein Passwort"
							bind:value={password}
						/>
					</div>
				</div>

				<div class="modal-actions">
					<button class="btn secondary" onclick={handleClose}>Abbrechen</button>
					<button class="btn primary" onclick={handleCreate} disabled={creating}>
						{creating ? 'Erstelle...' : 'Link erstellen'}
					</button>
				</div>
			{/if}
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
		max-width: 440px;
		margin: 1rem;
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid rgb(var(--color-border));
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: rgb(var(--color-text-primary));
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.close-btn {
		padding: 0.25rem;
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: rgb(var(--color-text-secondary));
		cursor: pointer;
	}

	.close-btn:hover {
		background: rgb(var(--color-surface));
		color: rgb(var(--color-text-primary));
	}

	.modal-body {
		padding: 1.25rem;
	}

	.share-info {
		margin: 0 0 1rem;
		font-size: 0.875rem;
		color: rgb(var(--color-text-secondary));
		line-height: 1.5;
	}

	.share-info strong {
		color: rgb(var(--color-text-primary));
	}

	.link-row {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.link-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
		color: rgb(var(--color-text-primary));
		font-family: monospace;
	}

	.copy-btn {
		padding: 0.5rem 0.75rem;
		background: rgb(var(--color-primary));
		border: none;
		border-radius: var(--radius-md);
		color: white;
		cursor: pointer;
		transition: opacity 150ms ease;
	}

	.copy-btn:hover {
		opacity: 0.9;
	}

	.share-details {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.detail {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		background: rgb(var(--color-surface));
		border-radius: var(--radius-sm);
		color: rgb(var(--color-text-secondary));
	}

	.form-group {
		margin-bottom: 0.875rem;
	}

	.form-group label {
		display: block;
		font-size: 0.8125rem;
		font-weight: 500;
		color: rgb(var(--color-text-secondary));
		margin-bottom: 0.375rem;
	}

	.form-group select,
	.form-group input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		color: rgb(var(--color-text-primary));
	}

	.form-group select:focus,
	.form-group input:focus {
		outline: none;
		border-color: rgb(var(--color-primary));
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		border-top: 1px solid rgb(var(--color-border));
	}

	.btn {
		padding: 0.5rem 1rem;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.btn.secondary {
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-border));
		color: rgb(var(--color-text-primary));
	}

	.btn.primary {
		background: rgb(var(--color-primary));
		border: 1px solid rgb(var(--color-primary));
		color: white;
	}

	.btn.primary:hover {
		opacity: 0.9;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
