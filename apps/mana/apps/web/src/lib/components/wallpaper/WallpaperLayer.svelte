<script lang="ts">
	import type { WallpaperConfig } from '@mana/shared-theme';
	import { PREDEFINED_WALLPAPERS } from '$lib/config/wallpapers';
	import { fade } from 'svelte/transition';

	interface Props {
		config: WallpaperConfig;
	}

	let { config }: Props = $props();

	let bgStyle = $derived.by(() => {
		const s = config.source;
		switch (s.type) {
			case 'none':
				return '';
			case 'predefined': {
				const wp = PREDEFINED_WALLPAPERS.find((w) => w.id === s.id);
				if (!wp) return '';
				return `background-image: url(${wp.url}); background-size: cover; background-position: center;`;
			}
			case 'generated': {
				const p = s.params;
				if (p.type === 'solid') {
					return `background-color: ${p.color};`;
				}
				const angle = p.angle ?? 180;
				const stops = p.colors.join(', ');
				return `background: linear-gradient(${angle}deg, ${stops});`;
			}
			case 'upload':
				return `background-image: url(${s.url}); background-size: cover; background-position: center;`;
			default:
				return '';
		}
	});

	let overlayStyle = $derived.by(() => {
		const o = config.overlay;
		if (!o) return '';
		const parts: string[] = [];
		if (o.opacity && o.opacity > 0) {
			parts.push(`background: hsl(var(--color-background) / ${o.opacity})`);
		}
		if (o.blur && o.blur > 0) {
			parts.push(`backdrop-filter: blur(${o.blur}px)`);
		}
		return parts.join('; ');
	});

	let isActive = $derived(config.source.type !== 'none' && bgStyle !== '');

	// Preload image for uploaded/predefined wallpapers so transitions are smooth
	$effect(() => {
		const s = config.source;
		let url: string | null = null;
		if (s.type === 'upload') url = s.url;
		if (s.type === 'predefined') {
			const wp = PREDEFINED_WALLPAPERS.find((w) => w.id === s.id);
			if (wp) url = wp.url;
		}
		if (url) {
			const img = new Image();
			img.src = url;
		}
	});
</script>

{#if isActive}
	<!--
	  Use a keyed block so Svelte re-creates the div when the source changes,
	  enabling a fade transition between different wallpapers.
	  The key is a fingerprint of the source.
	-->
	{#key bgStyle}
		<div class="wallpaper-layer" style={bgStyle} transition:fade={{ duration: 400 }}>
			{#if overlayStyle}
				<div class="wallpaper-overlay" style={overlayStyle}></div>
			{/if}
		</div>
	{/key}
{/if}

<style>
	.wallpaper-layer {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
	}

	.wallpaper-overlay {
		position: absolute;
		inset: 0;
		transition:
			background 0.3s ease,
			backdrop-filter 0.3s ease;
	}

	@media (prefers-reduced-motion: reduce) {
		.wallpaper-layer {
			transition: none;
		}
		.wallpaper-overlay {
			transition: none;
		}
	}
</style>
