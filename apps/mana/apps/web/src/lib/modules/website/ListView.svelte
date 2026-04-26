<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { formatDate } from '$lib/i18n/format';
	import { useAllSites } from './queries';

	const sites = useAllSites();

	function formatRelative(iso: string): string {
		const now = Date.now();
		const then = new Date(iso).getTime();
		const diffMin = Math.floor((now - then) / 60_000);
		if (diffMin < 1) return $_('website.list_view.relative_just_now');
		if (diffMin < 60) return $_('website.list_view.relative_minutes', { values: { n: diffMin } });
		const diffH = Math.floor(diffMin / 60);
		if (diffH < 24) return $_('website.list_view.relative_hours', { values: { n: diffH } });
		const diffD = Math.floor(diffH / 24);
		if (diffD < 30) return $_('website.list_view.relative_days', { values: { n: diffD } });
		return formatDate(new Date(iso));
	}
</script>

<div class="wb-list">
	<header class="wb-list__header">
		<div>
			<h2>{$_('website.list_view.heading')}</h2>
			<p class="wb-list__hint">
				{$_('website.list_view.hint_prefix')} <code>mana.how</code>.
			</p>
		</div>
		<a class="wb-list__new" href="/website/new">{$_('website.list_view.action_new')}</a>
	</header>

	{#if sites.value.length === 0}
		<div class="wb-list__empty">
			<p>{$_('website.list_view.empty_text')}</p>
			<a class="wb-list__new" href="/website/new">{$_('website.list_view.action_new')}</a>
		</div>
	{:else}
		<div class="wb-list__grid">
			{#each sites.value as site (site.id)}
				<a class="wb-card" href="/website/{site.id}">
					<div class="wb-card__body">
						<h3>{site.name}</h3>
						<p class="wb-card__slug">/s/{site.slug}</p>
					</div>
					<div class="wb-card__meta">
						<span
							class="wb-pill"
							class:wb-pill--green={site.publishedVersion}
							class:wb-pill--amber={!site.publishedVersion}
						>
							{site.publishedVersion
								? $_('website.list_view.status_published')
								: $_('website.list_view.status_draft')}
						</span>
						<span class="wb-card__time">{formatRelative(site.updatedAt)}</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.wb-list {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.wb-list__header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}
	.wb-list__header h2 {
		margin: 0;
		font-size: 1.25rem;
	}
	.wb-list__hint {
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
		opacity: 0.6;
	}
	.wb-list__hint code {
		background: rgba(255, 255, 255, 0.06);
		padding: 0.1rem 0.3rem;
		border-radius: 0.25rem;
	}
	.wb-list__new {
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		background: rgba(99, 102, 241, 0.9);
		color: white;
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
	}
	.wb-list__empty {
		padding: 3rem 1.5rem;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		border: 1px dashed rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
	}
	.wb-list__empty p {
		margin: 0;
		opacity: 0.7;
	}
	.wb-list__grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
		gap: 1rem;
	}
	.wb-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.75rem;
		text-decoration: none;
		color: inherit;
		min-height: 8rem;
		transition:
			background 0.15s ease,
			border-color 0.15s ease;
	}
	.wb-card:hover {
		background: rgba(255, 255, 255, 0.07);
		border-color: rgba(99, 102, 241, 0.4);
	}
	.wb-card h3 {
		margin: 0;
		font-size: 1rem;
	}
	.wb-card__slug {
		margin: 0.25rem 0 0;
		font-size: 0.8125rem;
		opacity: 0.55;
		font-family: ui-monospace, monospace;
	}
	.wb-card__meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: auto;
	}
	.wb-card__time {
		font-size: 0.75rem;
		opacity: 0.5;
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
</style>
