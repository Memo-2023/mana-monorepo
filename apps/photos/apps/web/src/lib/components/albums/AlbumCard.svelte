<script lang="ts">
	import type { Album } from '@photos/shared';

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
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="48"
				height="48"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
			>
				<path
					d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
				/>
			</svg>
		</div>
	{/if}
	<div class="album-overlay">
		<h3 class="album-name">{album.name}</h3>
		{#if album.description}
			<p class="album-description">{album.description}</p>
		{/if}
		<span class="album-count">{album.itemCount ?? 0} photos</span>
	</div>
</button>

<style>
	.album-card {
		position: relative;
		aspect-ratio: 4/3;
		overflow: hidden;
		border-radius: var(--radius-lg);
		background-color: var(--color-muted);
		cursor: pointer;
		border: none;
		padding: 0;
		transition:
			transform 200ms ease,
			box-shadow 200ms ease;
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
		color: var(--color-muted-foreground);
		background: linear-gradient(135deg, var(--color-muted) 0%, var(--color-accent) 100%);
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
