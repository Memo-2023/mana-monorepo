<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<svelte:head>
	<title>Mana Matrix</title>
	<meta name="description" content="Self-hosted Matrix chat client" />
</svelte:head>

{@render children()}
