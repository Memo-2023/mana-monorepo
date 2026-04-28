<script lang="ts">
	import KontextView from '$lib/modules/kontext/KontextView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Web-Context - Mana</title>
</svelte:head>

<RoutePage appId="kontext">
	<KontextView />
</RoutePage>
