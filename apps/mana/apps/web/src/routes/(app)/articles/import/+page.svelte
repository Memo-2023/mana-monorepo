<script lang="ts">
	import BulkImportForm from '$lib/modules/articles/components/BulkImportForm.svelte';
	import JobsList from '$lib/modules/articles/components/JobsList.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Artikel-Import — Mana</title>
</svelte:head>

<RoutePage appId="articles" backHref="/articles">
	<BulkImportForm />
	<JobsList />
</RoutePage>
