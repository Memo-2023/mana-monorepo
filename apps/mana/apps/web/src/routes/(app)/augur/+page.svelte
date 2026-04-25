<script lang="ts">
	import ListView from '$lib/modules/augur/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Augur - Mana</title>
</svelte:head>

<RoutePage appId="augur">
	<ListView navigate={() => {}} goBack={() => history.back()} params={{}} />
</RoutePage>
