<!--
  LinkedItems — Shows cross-module links for a record.
  Clicking a link opens the target item's DetailView as a cross-detail overlay.
-->
<script lang="ts">
	import {
		useLinksForRecord,
		type ManaRecordRef,
		type LocalManaLink,
	} from '@mana/shared-links';
	import { getApp } from '$lib/app-registry';
	import type { ViewProps } from '$lib/app-registry';

	interface Props {
		recordRef: ManaRecordRef;
		navigate: ViewProps['navigate'];
	}

	let { recordRef, navigate }: Props = $props();

	const linksQuery = useLinksForRecord(recordRef);
	let links = $derived(linksQuery.value ?? []);

	function openLink(link: LocalManaLink) {
		navigate('cross-detail', {
			_targetApp: link.targetApp,
			_targetId: link.targetId,
		});
	}
</script>

{#if links.length > 0}
	<div class="section">
		<span class="section-label">Verknüpfungen</span>
		<div class="links-list">
			{#each links as link (link.id)}
				{@const appEntry = getApp(link.targetApp)}
				{@const color = link.cachedTarget?.color ?? appEntry?.color ?? '#6B7280'}
				<button class="link-item" onclick={() => openLink(link)}>
					<span class="link-dot" style="background: {color}"></span>
					<div class="link-content">
						<span class="link-title">{link.cachedTarget?.title ?? link.targetId}</span>
						{#if link.cachedTarget?.subtitle}
							<span class="link-subtitle">{link.cachedTarget.subtitle}</span>
						{/if}
					</div>
					<span class="link-app">{link.cachedTarget?.appName ?? link.targetApp}</span>
				</button>
			{/each}
		</div>
	</div>
{/if}

<style>
	.section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #9ca3af;
	}
	.links-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.link-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		background: rgba(0, 0, 0, 0.02);
		border: 1px solid rgba(0, 0, 0, 0.04);
		cursor: pointer;
		text-align: left;
		transition: background 0.15s;
	}
	.link-item:hover {
		background: rgba(0, 0, 0, 0.05);
	}
	:global(.dark) .link-item {
		background: rgba(255, 255, 255, 0.02);
		border-color: rgba(255, 255, 255, 0.04);
	}
	:global(.dark) .link-item:hover {
		background: rgba(255, 255, 255, 0.06);
	}
	.link-dot {
		width: 8px;
		height: 8px;
		border-radius: 9999px;
		flex-shrink: 0;
	}
	.link-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
	}
	.link-title {
		font-size: 0.8125rem;
		color: #374151;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	:global(.dark) .link-title {
		color: #e5e7eb;
	}
	.link-subtitle {
		font-size: 0.6875rem;
		color: #9ca3af;
	}
	.link-app {
		font-size: 0.625rem;
		color: #b0afa8;
		flex-shrink: 0;
	}
</style>
