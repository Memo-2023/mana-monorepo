<script lang="ts">
	import { goto } from '$app/navigation';
	import ListView from '$lib/modules/who/ListView.svelte';
</script>

<svelte:head>
	<title>Who? — Mana</title>
</svelte:head>

<ListView navigate={(view) => goto(`/who/${view}`)} goBack={() => history.back()} params={{}} />
