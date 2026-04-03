<!--
  LinkedItems — Shows cross-module links for a record.
  Displays linked items as clickable pills with app color and cached title.
-->
<script lang="ts">
	import {
		useLinksForRecord,
		type ManaRecordRef,
		type LocalManaLink,
	} from '@manacore/shared-links';
	import { getAppEntry } from '$lib/components/workbench/app-registry';
	import { ArrowSquareOut } from '@manacore/shared-icons';

	interface Props {
		recordRef: ManaRecordRef;
	}

	let { recordRef }: Props = $props();

	const linksQuery = useLinksForRecord(recordRef);
	let links = $derived(linksQuery.value ?? []);
</script>

{#if links.length > 0}
	<div class="section">
		<span class="section-label">Verknüpfungen</span>
		<div class="links-list">
			{#each links as link (link.id)}
				{@const appEntry = getAppEntry(link.targetApp)}
				{@const color = link.cachedTarget?.color ?? appEntry?.color ?? '#6B7280'}
				<div class="link-item">
					<span class="link-dot" style="background: {color}"></span>
					<div class="link-content">
						<span class="link-title">{link.cachedTarget?.title ?? link.targetId}</span>
						{#if link.cachedTarget?.subtitle}
							<span class="link-subtitle">{link.cachedTarget.subtitle}</span>
						{/if}
					</div>
					<span class="link-app">{link.cachedTarget?.appName ?? link.targetApp}</span>
				</div>
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
		transition: background 0.15s;
	}
	.link-item:hover {
		background: rgba(0, 0, 0, 0.04);
	}
	:global(.dark) .link-item {
		background: rgba(255, 255, 255, 0.02);
		border-color: rgba(255, 255, 255, 0.04);
	}
	:global(.dark) .link-item:hover {
		background: rgba(255, 255, 255, 0.05);
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
