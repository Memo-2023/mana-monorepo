<script lang="ts">
	import ListView from '$lib/modules/places/ListView.svelte';
</script>

<svelte:head>
	<title>Places - Mana</title>
</svelte:head>

<ListView navigate={() => {}} goBack={() => history.back()} params={{}} />
