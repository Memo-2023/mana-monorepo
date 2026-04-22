<script lang="ts">
	import ListView from '$lib/modules/mail/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Mail - Mana</title>
</svelte:head>

<RoutePage appId="mail">
	<ListView />
</RoutePage>
