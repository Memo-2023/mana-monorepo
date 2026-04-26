<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { sitesStore } from '../stores/sites.svelte';
	import { PublishError } from '../publish';
	import RollbackDialog from './RollbackDialog.svelte';
	import type { Website } from '../types';

	interface Props {
		site: Website;
	}

	let { site }: Props = $props();

	let publishing = $state(false);
	let unpublishing = $state(false);
	let lastError = $state<string | null>(null);
	let showHistory = $state(false);

	const hasDraftAhead = $derived.by(() => {
		if (!site.publishedVersion) return site.draftUpdatedAt !== null;
		// Sheet-optimization: exact comparison not possible (publishedVersion
		// is a UUID, not a timestamp), so we compare draftUpdatedAt against
		// site.updatedAt set by the publish flow. If draft is stale vs. the
		// last mutation, show "up to date".
		return (
			site.draftUpdatedAt !== null &&
			site.updatedAt !== null &&
			site.draftUpdatedAt > site.updatedAt
		);
	});

	async function onPublish() {
		publishing = true;
		lastError = null;
		try {
			const result = await sitesStore.publishSite(site.id);
			console.info('[website] published', result);
		} catch (err) {
			if (err instanceof PublishError) {
				lastError = err.message;
			} else {
				lastError = err instanceof Error ? err.message : String(err);
			}
		} finally {
			publishing = false;
		}
	}

	async function onUnpublish() {
		if (!confirm($_('website.publish_bar.confirm_unpublish'))) return;
		unpublishing = true;
		lastError = null;
		try {
			await sitesStore.unpublishSite(site.id);
		} catch (err) {
			lastError = err instanceof Error ? err.message : String(err);
		} finally {
			unpublishing = false;
		}
	}

	const publicUrl = $derived(`/s/${site.slug}`);
</script>

<div class="wb-publishbar">
	<div class="wb-publishbar__status">
		{#if site.publishedVersion}
			<span class="wb-pill wb-pill--green">{$_('website.publish_bar.badge_live')}</span>
			<a class="wb-publishbar__link" href={publicUrl} target="_blank" rel="noopener">
				{publicUrl} ↗
			</a>
			{#if hasDraftAhead}
				<span class="wb-pill wb-pill--amber">{$_('website.publish_bar.badge_dirty')}</span>
			{/if}
		{:else}
			<span class="wb-pill wb-pill--gray">{$_('website.publish_bar.badge_draft')}</span>
			<span class="wb-publishbar__hint">{$_('website.publish_bar.hint_unpublished')}</span>
		{/if}
	</div>

	<div class="wb-publishbar__actions">
		{#if site.publishedVersion}
			<button
				class="wb-btn wb-btn--ghost"
				onclick={() => (showHistory = true)}
				title={$_('website.publish_bar.action_versions_title')}
			>
				{$_('website.publish_bar.action_versions')}
			</button>
			<button
				class="wb-btn wb-btn--ghost"
				onclick={onUnpublish}
				disabled={unpublishing || publishing}
			>
				{unpublishing
					? $_('website.publish_bar.action_unpublishing')
					: $_('website.publish_bar.action_unpublish')}
			</button>
			<button
				class="wb-btn wb-btn--primary"
				onclick={onPublish}
				disabled={publishing || !hasDraftAhead}
			>
				{publishing
					? $_('website.publish_bar.action_publishing')
					: $_('website.publish_bar.action_publish_changes')}
			</button>
		{:else}
			<button class="wb-btn wb-btn--primary" onclick={onPublish} disabled={publishing}>
				{publishing
					? $_('website.publish_bar.action_publishing')
					: $_('website.publish_bar.action_publish')}
			</button>
		{/if}
	</div>

	{#if lastError}
		<p class="wb-publishbar__error" role="alert">{lastError}</p>
	{/if}
</div>

{#if showHistory}
	<RollbackDialog siteId={site.id} onClose={() => (showHistory = false)} />
{/if}

<style>
	.wb-publishbar {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.04);
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		flex-wrap: wrap;
	}
	.wb-publishbar__status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1 1 auto;
		min-width: 0;
	}
	.wb-publishbar__actions {
		display: flex;
		gap: 0.5rem;
	}
	.wb-publishbar__link {
		color: inherit;
		opacity: 0.7;
		font-size: 0.8125rem;
		text-decoration: none;
		font-family: ui-monospace, monospace;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.wb-publishbar__link:hover {
		opacity: 1;
		color: rgb(129, 140, 248);
	}
	.wb-publishbar__hint {
		font-size: 0.8125rem;
		opacity: 0.5;
	}
	.wb-publishbar__error {
		flex-basis: 100%;
		margin: 0;
		padding: 0.5rem 0.75rem;
		background: rgba(248, 113, 113, 0.1);
		border: 1px solid rgba(248, 113, 113, 0.3);
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		color: rgb(248, 113, 113);
	}
	.wb-pill {
		font-size: 0.7rem;
		padding: 0.15rem 0.5rem;
		border-radius: 9999px;
		font-weight: 500;
	}
	.wb-pill--green {
		background: rgba(16, 185, 129, 0.18);
		color: rgb(110, 231, 183);
	}
	.wb-pill--amber {
		background: rgba(245, 158, 11, 0.18);
		color: rgb(252, 211, 77);
	}
	.wb-pill--gray {
		background: rgba(255, 255, 255, 0.08);
		opacity: 0.7;
	}
	.wb-btn {
		padding: 0.4rem 0.85rem;
		border-radius: 0.375rem;
		border: none;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
	}
	.wb-btn--ghost {
		background: transparent;
		color: inherit;
		border: 1px solid rgba(255, 255, 255, 0.12);
	}
	.wb-btn--ghost:hover:not(:disabled) {
		background: rgba(248, 113, 113, 0.1);
		border-color: rgba(248, 113, 113, 0.4);
		color: rgb(248, 113, 113);
	}
	.wb-btn--primary {
		background: rgba(99, 102, 241, 0.9);
		color: white;
	}
	.wb-btn--primary:hover:not(:disabled) {
		background: rgba(99, 102, 241, 1);
	}
	.wb-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
