<script lang="ts">
	import AddUrlForm from '$lib/modules/articles/components/AddUrlForm.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Artikel speichern — Mana</title>
</svelte:head>

<RoutePage appId="articles" backHref="/articles">
	<AddUrlForm />
</RoutePage>
