<script lang="ts">
	import type { LocalManaLink } from '../types.js';
	import { getManaApp } from '@mana/shared-branding';
	import type { AppIconId } from '@mana/shared-branding';
	import { resolveDeepLink } from '../deep-links.js';

	interface Props {
		link: LocalManaLink;
		onRemove?: (pairId: string) => void;
		onclick?: (link: LocalManaLink) => void;
	}

	let { link, onRemove, onclick }: Props = $props();

	let targetApp = $derived(getManaApp(link.targetApp as AppIconId));
	let displayTitle = $derived(
		link.cachedTarget?.title ?? `${link.targetApp}/${link.targetId.slice(0, 8)}`
	);
	let displayColor = $derived(link.cachedTarget?.color ?? targetApp?.color ?? '#6b7280');
	let displayAppName = $derived(link.cachedTarget?.appName ?? targetApp?.name ?? link.targetApp);
	let deepLinkUrl = $derived(resolveDeepLink(link.targetApp, link.targetCollection, link.targetId));
</script>

<span class="manalink-badge" role="group">
	{#if onclick}
		<button
			class="manalink-main"
			onclick={() => onclick(link)}
			title="{displayAppName}: {displayTitle}"
		>
			<span class="manalink-dot" style:background-color={displayColor}></span>
			<span class="manalink-title">{displayTitle}</span>
			{#if link.cachedTarget?.subtitle}
				<span class="manalink-subtitle">{link.cachedTarget.subtitle}</span>
			{/if}
		</button>
	{:else}
		<a
			class="manalink-main"
			href={deepLinkUrl}
			target="_blank"
			rel="noopener"
			title="{displayAppName}: {displayTitle}"
		>
			<span class="manalink-dot" style:background-color={displayColor}></span>
			<span class="manalink-title">{displayTitle}</span>
			{#if link.cachedTarget?.subtitle}
				<span class="manalink-subtitle">{link.cachedTarget.subtitle}</span>
			{/if}
		</a>
	{/if}
	{#if onRemove}
		<button class="manalink-remove" onclick={() => onRemove?.(link.pairId)} title="Link entfernen">
			<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
				<path
					d="M3 3l6 6M9 3l-6 6"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
				/>
			</svg>
		</button>
	{/if}
</span>

<style>
	.manalink-badge {
		display: inline-flex;
		align-items: center;
		border-radius: 9999px;
		background: var(--color-surface, #f3f4f6);
		border: 1px solid var(--color-border, #e5e7eb);
		font-size: 0.75rem;
		line-height: 1;
		transition: all 0.15s ease;
		max-width: 220px;
	}

	.manalink-badge:hover {
		background: var(--color-surface-hover, #e5e7eb);
		border-color: var(--color-border-hover, #d1d5db);
	}

	.manalink-main {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		border: none;
		background: transparent;
		text-decoration: none;
		color: inherit;
		cursor: pointer;
		font-size: inherit;
		line-height: inherit;
		overflow: hidden;
	}

	.manalink-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.manalink-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--color-text, #374151);
	}

	.manalink-subtitle {
		color: var(--color-text-muted, #9ca3af);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.manalink-remove {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		border: none;
		background: transparent;
		color: var(--color-text-muted, #9ca3af);
		cursor: pointer;
		padding: 0;
		flex-shrink: 0;
	}

	.manalink-remove:hover {
		background: var(--color-danger, #ef4444);
		color: white;
	}
</style>
