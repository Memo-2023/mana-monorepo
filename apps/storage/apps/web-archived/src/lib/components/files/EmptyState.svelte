<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Which illustration to show */
		type: 'files' | 'trash' | 'favorites' | 'search' | 'folder' | 'shared';
		title: string;
		description: string;
		actions?: Snippet;
	}

	let { type, title, description, actions }: Props = $props();
</script>

<div class="empty-state">
	<div class="illustration">
		{#if type === 'files' || type === 'folder'}
			<!-- Cloud folder illustration -->
			<svg
				width="120"
				height="120"
				viewBox="0 0 120 120"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<circle cx="60" cy="60" r="50" fill="rgb(var(--color-primary) / 0.06)" />
				<rect
					x="30"
					y="42"
					width="60"
					height="40"
					rx="4"
					fill="rgb(var(--color-primary) / 0.15)"
					stroke="rgb(var(--color-primary) / 0.3)"
					stroke-width="1.5"
				/>
				<path
					d="M30 46C30 43.7909 31.7909 42 34 42H48L53 36H86C88.2091 36 90 37.7909 90 40V42H30Z"
					fill="rgb(var(--color-primary) / 0.25)"
					stroke="rgb(var(--color-primary) / 0.3)"
					stroke-width="1.5"
				/>
				<path
					d="M52 60L56 56L60 60"
					stroke="rgb(var(--color-primary) / 0.5)"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<line
					x1="56"
					y1="56"
					x2="56"
					y2="72"
					stroke="rgb(var(--color-primary) / 0.5)"
					stroke-width="2"
					stroke-linecap="round"
				/>
				<path
					d="M64 60L68 56L72 60"
					stroke="rgb(var(--color-primary) / 0.3)"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<line
					x1="68"
					y1="56"
					x2="68"
					y2="68"
					stroke="rgb(var(--color-primary) / 0.3)"
					stroke-width="2"
					stroke-linecap="round"
				/>
			</svg>
		{:else if type === 'trash'}
			<!-- Empty trash illustration -->
			<svg
				width="120"
				height="120"
				viewBox="0 0 120 120"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<circle cx="60" cy="60" r="50" fill="rgb(var(--color-text-secondary) / 0.05)" />
				<rect
					x="40"
					y="44"
					width="40"
					height="42"
					rx="3"
					fill="rgb(var(--color-text-secondary) / 0.08)"
					stroke="rgb(var(--color-text-secondary) / 0.2)"
					stroke-width="1.5"
				/>
				<rect
					x="36"
					y="38"
					width="48"
					height="6"
					rx="2"
					fill="rgb(var(--color-text-secondary) / 0.12)"
					stroke="rgb(var(--color-text-secondary) / 0.2)"
					stroke-width="1.5"
				/>
				<line
					x1="50"
					y1="52"
					x2="50"
					y2="78"
					stroke="rgb(var(--color-text-secondary) / 0.15)"
					stroke-width="1.5"
					stroke-linecap="round"
				/>
				<line
					x1="60"
					y1="52"
					x2="60"
					y2="78"
					stroke="rgb(var(--color-text-secondary) / 0.15)"
					stroke-width="1.5"
					stroke-linecap="round"
				/>
				<line
					x1="70"
					y1="52"
					x2="70"
					y2="78"
					stroke="rgb(var(--color-text-secondary) / 0.15)"
					stroke-width="1.5"
					stroke-linecap="round"
				/>
				<path
					d="M52 38V34C52 32.8954 52.8954 32 54 32H66C67.1046 32 68 32.8954 68 34V38"
					stroke="rgb(var(--color-text-secondary) / 0.2)"
					stroke-width="1.5"
				/>
				<circle
					cx="60"
					cy="62"
					r="8"
					fill="rgb(var(--color-success) / 0.1)"
					stroke="rgb(var(--color-success) / 0.3)"
					stroke-width="1.5"
				/>
				<path
					d="M56 62L59 65L65 59"
					stroke="rgb(var(--color-success) / 0.5)"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		{:else if type === 'favorites'}
			<!-- No favorites illustration -->
			<svg
				width="120"
				height="120"
				viewBox="0 0 120 120"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<circle cx="60" cy="60" r="50" fill="rgb(var(--color-warning) / 0.05)" />
				<path
					d="M60 40L65.5 51.2L78 53L69 61.8L71 74L60 68.2L49 74L51 61.8L42 53L54.5 51.2L60 40Z"
					fill="rgb(var(--color-warning) / 0.1)"
					stroke="rgb(var(--color-warning) / 0.3)"
					stroke-width="1.5"
					stroke-linejoin="round"
				/>
				<circle cx="60" cy="57" r="4" fill="rgb(var(--color-warning) / 0.15)" />
				<path
					d="M60 45L63 51"
					stroke="rgb(var(--color-warning) / 0.2)"
					stroke-width="1"
					stroke-linecap="round"
				/>
				<path
					d="M60 45L57 51"
					stroke="rgb(var(--color-warning) / 0.2)"
					stroke-width="1"
					stroke-linecap="round"
				/>
			</svg>
		{:else if type === 'search'}
			<!-- No results illustration -->
			<svg
				width="120"
				height="120"
				viewBox="0 0 120 120"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<circle cx="60" cy="60" r="50" fill="rgb(var(--color-primary) / 0.05)" />
				<circle
					cx="54"
					cy="54"
					r="16"
					fill="rgb(var(--color-primary) / 0.06)"
					stroke="rgb(var(--color-primary) / 0.25)"
					stroke-width="2"
				/>
				<line
					x1="65"
					y1="65"
					x2="78"
					y2="78"
					stroke="rgb(var(--color-primary) / 0.25)"
					stroke-width="3"
					stroke-linecap="round"
				/>
				<path
					d="M48 54H60"
					stroke="rgb(var(--color-primary) / 0.15)"
					stroke-width="1.5"
					stroke-linecap="round"
				/>
				<path
					d="M54 48V60"
					stroke="rgb(var(--color-primary) / 0.15)"
					stroke-width="1.5"
					stroke-linecap="round"
				/>
			</svg>
		{:else if type === 'shared'}
			<!-- No shares illustration -->
			<svg
				width="120"
				height="120"
				viewBox="0 0 120 120"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<circle cx="60" cy="60" r="50" fill="rgb(var(--color-primary) / 0.05)" />
				<circle
					cx="44"
					cy="52"
					r="6"
					fill="rgb(var(--color-primary) / 0.1)"
					stroke="rgb(var(--color-primary) / 0.25)"
					stroke-width="1.5"
				/>
				<circle
					cx="76"
					cy="42"
					r="6"
					fill="rgb(var(--color-primary) / 0.1)"
					stroke="rgb(var(--color-primary) / 0.25)"
					stroke-width="1.5"
				/>
				<circle
					cx="76"
					cy="68"
					r="6"
					fill="rgb(var(--color-primary) / 0.1)"
					stroke="rgb(var(--color-primary) / 0.25)"
					stroke-width="1.5"
				/>
				<line
					x1="50"
					y1="50"
					x2="70"
					y2="44"
					stroke="rgb(var(--color-primary) / 0.2)"
					stroke-width="1.5"
					stroke-dasharray="3 3"
				/>
				<line
					x1="50"
					y1="55"
					x2="70"
					y2="65"
					stroke="rgb(var(--color-primary) / 0.2)"
					stroke-width="1.5"
					stroke-dasharray="3 3"
				/>
			</svg>
		{/if}
	</div>

	<h2 class="empty-title">{title}</h2>
	<p class="empty-description">{description}</p>

	{#if actions}
		<div class="empty-actions">
			{@render actions()}
		</div>
	{/if}
</div>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 2rem;
		text-align: center;
	}

	.illustration {
		margin-bottom: 1rem;
	}

	.empty-title {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
		font-weight: 600;
		color: rgb(var(--color-text-primary));
	}

	.empty-description {
		margin: 0 0 1.5rem;
		font-size: 0.875rem;
		color: rgb(var(--color-text-secondary));
		max-width: 320px;
		line-height: 1.5;
	}

	.empty-actions {
		display: flex;
		gap: 0.75rem;
	}
</style>
