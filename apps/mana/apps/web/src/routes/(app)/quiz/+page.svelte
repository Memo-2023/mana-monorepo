<script lang="ts">
	import ListView from '$lib/modules/quiz/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Quiz - Mana</title>
</svelte:head>

<RoutePage appId="quiz">
	<ListView navigate={() => {}} goBack={() => history.back()} params={{}} />
</RoutePage>
