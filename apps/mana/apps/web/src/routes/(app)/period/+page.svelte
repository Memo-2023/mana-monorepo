<script lang="ts">
	import ListView from '$lib/modules/period/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Period - Mana</title>
</svelte:head>

<RoutePage appId="period">
	<ListView navigate={() => {}} goBack={() => history.back()} params={{}} />
</RoutePage>
