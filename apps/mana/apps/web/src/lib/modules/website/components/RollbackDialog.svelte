<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { sitesStore } from '../stores/sites.svelte';
	import { fetchSnapshotHistory, PublishError, type SnapshotHistoryEntry } from '../publish';

	interface Props {
		siteId: string;
		onClose: () => void;
	}

	let { siteId, onClose }: Props = $props();

	let entries = $state<SnapshotHistoryEntry[] | null>(null);
	let loadError = $state<string | null>(null);
	let loading = $state(false);
	let rollingBackId = $state<string | null>(null);
	let actionError = $state<string | null>(null);

	async function load() {
		loading = true;
		loadError = null;
		try {
			const token = await authStore.getValidToken();
			if (!token) throw new Error('Nicht angemeldet');
			entries = await fetchSnapshotHistory(siteId, token);
		} catch (err) {
			loadError =
				err instanceof PublishError
					? err.message
					: err instanceof Error
						? err.message
						: String(err);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		siteId;
		void load();
	});

	async function onRollback(snapshotId: string) {
		if (!confirm('Diese Version als aktuell veröffentlicht setzen?')) return;
		rollingBackId = snapshotId;
		actionError = null;
		try {
			await sitesStore.rollback(siteId, snapshotId);
			await load();
		} catch (err) {
			actionError =
				err instanceof PublishError
					? err.message
					: err instanceof Error
						? err.message
						: String(err);
		} finally {
			rollingBackId = null;
		}
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString('de-DE');
	}
</script>

<div
	class="wb-modal__backdrop"
	onclick={onClose}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	role="button"
	tabindex="-1"
	aria-label="Schließen"
></div>

<div class="wb-modal" role="dialog" aria-modal="true" aria-labelledby="wb-rollback-title">
	<header class="wb-modal__head">
		<div>
			<h3 id="wb-rollback-title">Version-History</h3>
			<p>Wähle eine ältere veröffentlichte Version, um sie wieder live zu stellen.</p>
		</div>
		<button class="wb-modal__close" onclick={onClose} aria-label="Schließen">×</button>
	</header>

	<div class="wb-modal__body">
		{#if loadError}
			<p class="wb-error">{loadError}</p>
		{:else if entries === null}
			<p class="wb-empty">Lade…</p>
		{:else if entries.length === 0}
			<p class="wb-empty">Noch keine veröffentlichten Versionen.</p>
		{:else}
			{#if actionError}
				<p class="wb-error">{actionError}</p>
			{/if}
			<ul class="wb-list">
				{#each entries as entry (entry.id)}
					<li class="wb-row" class:wb-row--current={entry.isCurrent}>
						<div class="wb-row__meta">
							<span class="wb-row__time">{formatDate(entry.publishedAt)}</span>
							<span class="wb-row__id">{entry.id.slice(0, 8)}</span>
						</div>
						<div class="wb-row__actions">
							{#if entry.isCurrent}
								<span class="wb-pill wb-pill--current">Aktuell live</span>
							{:else}
								<button
									class="wb-btn wb-btn--primary"
									onclick={() => onRollback(entry.id)}
									disabled={rollingBackId === entry.id || loading}
								>
									{rollingBackId === entry.id ? 'Stelle wieder her…' : 'Wiederherstellen'}
								</button>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style>
	.wb-modal__backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		z-index: 40;
		border: none;
	}
	.wb-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: min(92vw, 32rem);
		max-height: 80vh;
		background: rgb(15, 18, 24);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		z-index: 50;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.wb-modal__head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}
	.wb-modal__head h3 {
		margin: 0;
		font-size: 1rem;
	}
	.wb-modal__head p {
		margin: 0.2rem 0 0;
		font-size: 0.8125rem;
		opacity: 0.6;
	}
	.wb-modal__close {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: inherit;
		padding: 0.1rem 0.5rem;
		font-size: 1.1rem;
		border-radius: 0.375rem;
		cursor: pointer;
	}
	.wb-modal__body {
		padding: 1rem 1.25rem 1.25rem;
		overflow-y: auto;
	}
	.wb-empty {
		margin: 1rem 0;
		text-align: center;
		opacity: 0.5;
		font-style: italic;
		font-size: 0.875rem;
	}
	.wb-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.wb-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.65rem 0.85rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 0.5rem;
	}
	.wb-row--current {
		background: rgba(16, 185, 129, 0.06);
		border-color: rgba(16, 185, 129, 0.2);
	}
	.wb-row__meta {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.wb-row__time {
		font-size: 0.875rem;
	}
	.wb-row__id {
		font-size: 0.7rem;
		opacity: 0.5;
		font-family: ui-monospace, monospace;
	}
	.wb-row__actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.wb-btn {
		padding: 0.375rem 0.75rem;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
	}
	.wb-btn--primary {
		background: rgba(99, 102, 241, 0.9);
		color: white;
	}
	.wb-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.wb-pill {
		font-size: 0.7rem;
		padding: 0.12rem 0.5rem;
		border-radius: 9999px;
	}
	.wb-pill--current {
		background: rgba(16, 185, 129, 0.2);
		color: rgb(110, 231, 183);
	}
	.wb-error {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		background: rgba(248, 113, 113, 0.1);
		border: 1px solid rgba(248, 113, 113, 0.3);
		border-radius: 0.375rem;
		color: rgb(248, 113, 113);
		font-size: 0.8125rem;
	}
</style>
