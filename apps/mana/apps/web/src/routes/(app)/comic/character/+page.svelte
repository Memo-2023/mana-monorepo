<script lang="ts">
	import { RoutePage } from '$lib/components/shell';
	import CharactersView from '$lib/modules/comic/views/CharactersView.svelte';
</script>

<svelte:head>
	<title>Comic-Characters · Mana</title>
</svelte:head>

<RoutePage appId="comic" backHref="/comic">
	<div class="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
		<CharactersView />
	</div>
</RoutePage>
