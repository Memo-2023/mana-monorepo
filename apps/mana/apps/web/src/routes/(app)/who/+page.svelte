<script lang="ts">
	import { goto } from '$app/navigation';
	import ListView from '$lib/modules/who/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Who? — Mana</title>
</svelte:head>

<RoutePage appId="who">
	<ListView navigate={(view) => goto(`/who/${view}`)} goBack={() => history.back()} params={{}} />
</RoutePage>
