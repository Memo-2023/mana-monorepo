<script lang="ts">
	import ListView from '$lib/modules/automations/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Automations - Mana</title>
</svelte:head>

<RoutePage appId="automations">
	<ListView navigate={() => {}} goBack={() => history.back()} params={{}} />
</RoutePage>
