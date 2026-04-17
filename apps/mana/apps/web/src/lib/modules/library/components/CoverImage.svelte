<script lang="ts">
	import { KIND_LABELS } from '../constants';
	import type { LibraryKind } from '../types';

	let {
		url,
		kind,
		alt = '',
		size = 'md',
	}: {
		url: string | null;
		kind: LibraryKind;
		alt?: string;
		size?: 'sm' | 'md' | 'lg';
	} = $props();

	let errored = $state(false);
</script>

<div class="cover size-{size}" aria-label={alt || KIND_LABELS[kind].de}>
	{#if url && !errored}
		<img src={url} {alt} onerror={() => (errored = true)} loading="lazy" />
	{:else}
		<span class="placeholder">{KIND_LABELS[kind].emoji}</span>
	{/if}
</div>

<style>
	.cover {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #a855f7, #d946ef);
		border-radius: 0.5rem;
		overflow: hidden;
		aspect-ratio: 2 / 3;
	}
	.cover.size-sm {
		width: 40px;
	}
	.cover.size-md {
		width: 100%;
		max-width: 140px;
	}
	.cover.size-lg {
		width: 200px;
	}
	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.placeholder {
		font-size: 2.5rem;
		color: white;
		filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.2));
	}
	.cover.size-sm .placeholder {
		font-size: 1.2rem;
	}
	.cover.size-lg .placeholder {
		font-size: 4rem;
	}
</style>
