<script lang="ts">
	interface Props {
		commitHash?: string;
		buildTime?: string;
	}

	let { commitHash = 'unknown', buildTime = '' }: Props = $props();

	let formattedTime = $derived.by(() => {
		if (!buildTime) return '';
		try {
			const d = new Date(buildTime);
			return d.toLocaleString('de-DE', {
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
			});
		} catch {
			return buildTime;
		}
	});

	let expanded = $state(false);
</script>

<button
	class="dev-badge"
	class:expanded
	onclick={() => (expanded = !expanded)}
	title="Build: {commitHash} | {buildTime}"
>
	{#if expanded}
		<span class="dev-badge-detail">{commitHash} &middot; {formattedTime}</span>
	{:else}
		<span class="dev-badge-hash">{commitHash}</span>
	{/if}
</button>

<style>
	.dev-badge {
		position: fixed;
		bottom: 8px;
		right: 8px;
		z-index: 9999;
		font-family: ui-monospace, monospace;
		font-size: 10px;
		line-height: 1;
		padding: 3px 6px;
		border-radius: 4px;
		border: none;
		background: rgba(0, 0, 0, 0.4);
		color: rgba(255, 255, 255, 0.7);
		cursor: pointer;
		pointer-events: auto;
		opacity: 0.5;
		transition: opacity 150ms ease;
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
	}

	.dev-badge:hover {
		opacity: 1;
	}

	.dev-badge.expanded {
		opacity: 0.85;
	}

	.dev-badge-hash {
		letter-spacing: 0.5px;
	}

	.dev-badge-detail {
		white-space: nowrap;
	}
</style>
