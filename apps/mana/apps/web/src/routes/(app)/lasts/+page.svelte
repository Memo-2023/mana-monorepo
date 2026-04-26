<script lang="ts">
	import ListView from '$lib/modules/lasts/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Lasts - Mana</title>
</svelte:head>

<RoutePage appId="lasts">
	<ListView navigate={() => {}} goBack={() => history.back()} params={{}} />
</RoutePage>
