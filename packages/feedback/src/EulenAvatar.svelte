<!--
  EulenAvatar — wraps the deterministic SVG avatar generator with sane
  defaults for sizing and an optional name+tier-badge layout. Renders
  inline SVG (no img-load, no flicker) — given the same display_hash
  the same avatar appears everywhere.
-->
<script lang="ts">
	import { generateAvatarSvg } from './avatar';

	interface Props {
		displayHash: string | null | undefined;
		size?: number;
		title?: string;
	}

	let { displayHash, size = 32, title }: Props = $props();

	// Pre-compute once; same hash → same SVG, no need to re-derive on
	// every reactive read.
	let svg = $derived(displayHash ? generateAvatarSvg(displayHash) : null);
</script>

{#if svg}
	<span
		class="eulen-avatar"
		style:width="{size}px"
		style:height="{size}px"
		{title}
		aria-label={title ?? 'Avatar'}
	>
		{@html svg}
	</span>
{:else}
	<span class="eulen-avatar fallback" style:width="{size}px" style:height="{size}px"></span>
{/if}

<style>
	.eulen-avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		border-radius: 25%;
		overflow: hidden;
		line-height: 0;
		box-shadow: inset 0 0 0 1px hsl(0 0% 0% / 0.08);
	}

	.eulen-avatar :global(svg) {
		width: 100%;
		height: 100%;
		display: block;
	}

	.eulen-avatar.fallback {
		background: hsl(var(--color-muted) / 0.5);
	}
</style>
