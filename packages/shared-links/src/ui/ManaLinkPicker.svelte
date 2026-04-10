<script lang="ts">
	/**
	 * ManaLinkPicker - Modal to search and create cross-app links
	 *
	 * Searches across all app databases (todo tasks, calendar events,
	 * contacts, storage files, etc.) and creates bidirectional links.
	 */

	import { MANA_APPS, getManaApp } from '@mana/shared-branding';
	import type { AppIconId } from '@mana/shared-branding';
	import { linkMutations } from '../mutations.svelte.js';
	import { buildCachedData } from '../resolvers.js';
	import type { ManaRecordRef } from '../types.js';

	interface SearchResult {
		app: string;
		collection: string;
		id: string;
		title: string;
		subtitle?: string;
		color?: string;
	}

	interface Props {
		/** The record we're creating a link FROM. */
		sourceRef: ManaRecordRef;
		/** Cached display data for the source record. */
		sourceTitle: string;
		/** Whether the picker is open. */
		open: boolean;
		/** Called when the picker should close. */
		onClose: () => void;
		/** Optional: called after a link is created. */
		onLinkCreated?: () => void;
		/** Search function provided by the consuming app (searches across IndexedDBs). */
		onSearch: (query: string) => Promise<SearchResult[]>;
	}

	let { sourceRef, sourceTitle, open, onClose, onLinkCreated, onSearch }: Props = $props();

	let query = $state('');
	let results = $state<SearchResult[]>([]);
	let searching = $state(false);
	let creating = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout> | undefined;

	function handleInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		query = value;

		clearTimeout(searchTimeout);
		if (value.trim().length < 2) {
			results = [];
			return;
		}

		searching = true;
		searchTimeout = setTimeout(async () => {
			try {
				results = await onSearch(value.trim());
			} catch {
				results = [];
			}
			searching = false;
		}, 300);
	}

	async function handleSelect(result: SearchResult) {
		creating = true;
		try {
			await linkMutations.createLink({
				sourceApp: sourceRef.app,
				sourceCollection: sourceRef.collection,
				sourceId: sourceRef.id,
				targetApp: result.app,
				targetCollection: result.collection,
				targetId: result.id,
				cachedSource: buildCachedData(sourceRef.app, sourceTitle),
				cachedTarget: buildCachedData(result.app, result.title, result.subtitle),
			});
			onLinkCreated?.();
			onClose();
		} finally {
			creating = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}

	function getAppColor(appId: string): string {
		return getManaApp(appId as AppIconId)?.color ?? '#6b7280';
	}

	function getAppName(appId: string): string {
		return getManaApp(appId as AppIconId)?.name ?? appId;
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_interactive_supports_focus -->
	<div
		class="manalinkpicker-overlay"
		role="dialog"
		aria-modal="true"
		aria-label="Verknüpfung erstellen"
		onkeydown={handleKeydown}
	>
		<div class="manalinkpicker-backdrop" onclick={onClose} role="presentation" tabindex="-1"></div>
		<div class="manalinkpicker-modal">
			<div class="manalinkpicker-header">
				<h3>Verknüpfung erstellen</h3>
				<button class="manalinkpicker-close" onclick={onClose}>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path
							d="M4 4l8 8M12 4l-8 8"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
						/>
					</svg>
				</button>
			</div>

			<div class="manalinkpicker-search">
				<input
					type="text"
					placeholder="Suche nach Tasks, Events, Kontakten, Dateien..."
					value={query}
					oninput={handleInput}
					autofocus
				/>
			</div>

			<div class="manalinkpicker-results">
				{#if searching}
					<div class="manalinkpicker-status">Suche...</div>
				{:else if query.length >= 2 && results.length === 0}
					<div class="manalinkpicker-status">Keine Ergebnisse</div>
				{:else}
					{#each results as result (result.id)}
						<button
							class="manalinkpicker-result"
							onclick={() => handleSelect(result)}
							disabled={creating}
						>
							<span
								class="manalinkpicker-dot"
								style:background-color={result.color ?? getAppColor(result.app)}
							></span>
							<div class="manalinkpicker-info">
								<span class="manalinkpicker-title">{result.title}</span>
								{#if result.subtitle}
									<span class="manalinkpicker-subtitle">{result.subtitle}</span>
								{/if}
							</div>
							<span class="manalinkpicker-app">{getAppName(result.app)}</span>
						</button>
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.manalinkpicker-overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 15vh;
	}

	.manalinkpicker-backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(2px);
	}

	.manalinkpicker-modal {
		position: relative;
		width: 100%;
		max-width: 480px;
		max-height: 60vh;
		background: var(--color-background, #fff);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.75rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.manalinkpicker-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border, #e5e7eb);
	}

	.manalinkpicker-header h3 {
		font-size: 0.875rem;
		font-weight: 600;
		margin: 0;
	}

	.manalinkpicker-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border: none;
		background: transparent;
		border-radius: 0.25rem;
		cursor: pointer;
		color: var(--color-text-muted, #9ca3af);
	}

	.manalinkpicker-close:hover {
		background: var(--color-surface-hover, #f3f4f6);
	}

	.manalinkpicker-search {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border, #e5e7eb);
	}

	.manalinkpicker-search input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.5rem;
		font-size: 0.875rem;
		background: var(--color-surface, #f9fafb);
		color: var(--color-text, #111827);
		outline: none;
	}

	.manalinkpicker-search input:focus {
		border-color: var(--color-primary, #6366f1);
		box-shadow: 0 0 0 2px var(--color-primary-ring, rgba(99, 102, 241, 0.2));
	}

	.manalinkpicker-results {
		overflow-y: auto;
		max-height: 40vh;
		padding: 0.5rem;
	}

	.manalinkpicker-status {
		text-align: center;
		padding: 1.5rem;
		font-size: 0.875rem;
		color: var(--color-text-muted, #9ca3af);
	}

	.manalinkpicker-result {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		width: 100%;
		padding: 0.5rem 0.625rem;
		border: none;
		background: transparent;
		border-radius: 0.5rem;
		cursor: pointer;
		text-align: left;
		font-size: 0.875rem;
	}

	.manalinkpicker-result:hover {
		background: var(--color-surface-hover, #f3f4f6);
	}

	.manalinkpicker-result:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.manalinkpicker-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.manalinkpicker-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.manalinkpicker-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-weight: 500;
	}

	.manalinkpicker-subtitle {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.75rem;
		color: var(--color-text-muted, #9ca3af);
	}

	.manalinkpicker-app {
		flex-shrink: 0;
		font-size: 0.75rem;
		color: var(--color-text-muted, #9ca3af);
	}
</style>
