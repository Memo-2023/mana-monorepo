<script lang="ts">
	import type { Album } from '$lib/modules/photos/types';
	import { Folder } from '@manacore/shared-icons';

	interface Props {
		album: Album;
		onClick: () => void;
	}

	let { album, onClick }: Props = $props();
</script>

<button class="album-card" onclick={onClick} type="button">
	{#if album.coverUrl}
		<img src={album.coverUrl} alt={album.name} class="album-cover" />
	{:else}
		<div class="album-placeholder">
			<Folder size={20} />
		</div>
	{/if}
	<div class="album-overlay">
		<h3 class="album-name">{album.name}</h3>
		{#if album.description}
			<p class="album-description">{album.description}</p>
		{/if}
		<span class="album-count">{album.itemCount ?? 0} Fotos</span>
	</div>
</button>

<style>
	.album-card {
		position: relative;
		aspect-ratio: 4/3;
		overflow: hidden;
		border-radius: 0.75rem;
		background-color: var(--color-muted, #f1f5f9);
		cursor: pointer;
		border: none;
		padding: 0;
		transition:
			transform 200ms ease,
			box-shadow 200ms ease;
		width: 100%;
	}

	.album-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
	}

	.album-cover {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.album-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-muted-foreground, #64748b);
		background: linear-gradient(
			135deg,
			var(--color-muted, #f1f5f9) 0%,
			var(--color-accent, #e2e8f0) 100%
		);
	}

	.album-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 60%);
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		padding: 1rem;
		color: white;
		text-align: left;
	}

	.album-name {
		font-size: 1.125rem;
		font-weight: 600;
		margin-bottom: 0.25rem;
	}
	.album-description {
		font-size: 0.875rem;
		opacity: 0.8;
		margin-bottom: 0.25rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.album-count {
		font-size: 0.75rem;
		opacity: 0.7;
	}
</style>
