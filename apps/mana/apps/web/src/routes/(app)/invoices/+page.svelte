<script lang="ts">
	import ListView from '$lib/modules/invoices/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Rechnungen - Mana</title>
</svelte:head>

<RoutePage appId="invoices">
	<ListView />
</RoutePage>
