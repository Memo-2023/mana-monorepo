<script lang="ts">
	import ListView from '$lib/modules/firsts/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Firsts - Mana</title>
</svelte:head>

<RoutePage appId="firsts">
	<ListView navigate={() => {}} goBack={() => history.back()} params={{}} />
</RoutePage>
