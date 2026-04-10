<script lang="ts">
	import ListView from '$lib/modules/journal/ListView.svelte';
</script>

<svelte:head>
	<title>Journal - Mana</title>
</svelte:head>

<ListView navigate={() => {}} goBack={() => history.back()} params={{}} />
