<script lang="ts">
	/**
	 * Memoro AudioPlayer
	 * Wrapper around shared AudioPlayer with Memoro's custom icons
	 */
	import { AudioPlayer } from '@manacore/shared-ui';
	import Icon from '$lib/components/Icon.svelte';

	let { src, duration }: { src: string; duration?: number } = $props();
</script>

<AudioPlayer {src} {duration}>
	{#snippet playIcon()}
		<Icon name="play" size={24} />
	{/snippet}
	{#snippet pauseIcon()}
		<Icon name="pause" size={24} />
	{/snippet}
	{#snippet skipBackIcon()}
		<Icon name="skip-back" size={24} class="text-theme" />
	{/snippet}
	{#snippet skipForwardIcon()}
		<Icon name="skip-forward" size={24} class="text-theme" />
	{/snippet}
</AudioPlayer>
